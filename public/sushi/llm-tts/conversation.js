import { createModelProvider, isModelCancellation } from '../llm/model-provider.js';
import { getPreferredModel, rememberModel } from '../llm/model-registry.js';
import { createChatStore, mountChatHistoryControls } from '../llm/chat-history.js';
import { buildSystemPrompt, loadPersona, mountPersonaEditor } from '../llm/persona.js';
import { mountCompanionAvatar } from './avatar-stage.js';
import { SpeechOutput } from './speech-output.js';
import { LocalMicrophone } from './microphone.js';
import { createSentenceBuffer, conversationContext } from './conversation-core.mjs';
import { importedModelsOnly } from './model-cache.mjs';

const $ = id => document.getElementById(id);
const input = $('message');
const transcript = $('transcript');
const startButton = $('start-button');
const sendButton = $('send-button');
const micButton = $('mic-button');
const stopButton = $('stop-button');
const modelChoice = $('model-choice');
const voiceChoice = $('voice-choice');
const speakReplies = $('speak-replies');
const companion = mountCompanionAvatar(document.querySelector('[data-companion-stage]'));
const store = createChatStore('llm-tts', { maxMessages: 100 });
let messages = store.loadActive()?.messages || [];
let persona = loadPersona();
let provider = null;
let loadedModel = null;
let controller = null;
let loading = false;
let voiceTurn = false;
let handsfree = false;
let pendingTalk = false;
let switching = false;
let mobile = false;
let disposed = false;
let turn = 0;
let renderFrame = 0;
let listenTimer = 0;
let turnStarted = 0;
let firstVoiceMs = null;

function status(text) { $('conversation-status').textContent = text; }
function error(message) { $('conversation-error').textContent = message || ''; $('conversation-error').hidden = !message; }
function progress(text, report) {
  $('load-status').textContent = text;
  const bar = $('load-progress');
  if (report?.total > 0) { bar.max = report.total; bar.value = report.loaded; bar.hidden = false; }
  else if (typeof report?.progress === 'number') { bar.max = 1; bar.value = report.progress; bar.hidden = false; }
}

const speech = new SpeechOutput({
  onStatus: (text, report) => { if (loading) progress(text, report); },
  onSpeech: text => {
    if (firstVoiceMs === null && turnStarted) {
      firstVoiceMs = performance.now() - turnStarted;
      transcript.dataset.firstAudioMs = String(Math.round(firstVoiceMs));
      $('load-status').textContent += ` · voice started in ${(firstVoiceMs / 1000).toFixed(1)}s`;
    }
    companion.beginSpeech(text); status('Speaking · you can interrupt at any time'); syncControls();
  },
  onLevel: level => companion.setAudioLevel(level),
  onIdle: () => { companion.stopSpeech(); settled(); },
  onError: reason => {
    handsfree = false;
    companion.stopSpeech();
    error(`Voice stopped: ${reason.message} Your text reply stays visible. Use Start conversation to retry the voice.`);
    syncControls();
  },
});

const microphone = new LocalMicrophone({
  onStatus: text => { status(text); syncControls(); },
  onEnd: empty => { void finishVoice(empty); },
});

function syncControls() {
  const busy = loading || switching || !!controller || voiceTurn || microphone.busy || microphone.recording;
  sendButton.disabled = !provider || busy || !input.value.trim();
  micButton.disabled = !provider || loading || switching || (microphone.busy && !microphone.recording) || (voiceTurn && !microphone.recording);
  micButton.setAttribute('aria-pressed', String(microphone.recording));
  micButton.querySelector('span').textContent = microphone.recording ? 'Send voice' : 'Talk';
  stopButton.hidden = !controller && !speech.busy && !microphone.recording && !microphone.busy && !handsfree;
  stopButton.textContent = microphone.recording || handsfree ? 'End conversation' : 'Stop reply';
  startButton.disabled = loading || busy || speech.busy || (provider && (!speakReplies.checked || speech.ready));
  startButton.textContent = loading ? 'Loading conversation…' : provider && (!speakReplies.checked || speech.ready) ? 'Conversation ready' : 'Start conversation';
  modelChoice.disabled = busy || speech.busy;
  voiceChoice.disabled = busy || speech.busy;
  speakReplies.disabled = loading;
  if (importedModelsOnly()) { modelChoice.disabled = true; voiceChoice.disabled = true; }
  for (const button of $('chat-controls').querySelectorAll('button')) button.disabled = busy || speech.busy || handsfree;
}

function addMessage(role, content, { interrupted = false } = {}) {
  $('empty-chat')?.remove();
  const row = document.createElement('article');
  row.className = `message ${role}${interrupted ? ' interrupted' : ''}`;
  const label = document.createElement('span');
  label.className = 'message-label';
  label.textContent = role === 'user' ? 'You' : persona.name;
  const text = document.createElement('p');
  text.textContent = content;
  row.append(label, text);
  transcript.append(row);
  transcript.scrollTop = transcript.scrollHeight;
  return { row, text };
}

function renderHistory() {
  transcript.replaceChildren();
  for (const message of messages) addMessage(message.role, message.content);
  if (!messages.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-chat';
    empty.id = 'empty-chat';
    const title = document.createElement('h3');
    title.textContent = 'A fresh conversation.';
    const description = document.createElement('p');
    description.textContent = 'Say hello, or use Talk to speak with your companion.';
    empty.append(title, description);
    transcript.append(empty);
  }
}

function settled() {
  syncControls();
  if (!controller && speech.busy && document.querySelector('[data-companion-stage]').dataset.mode !== 'speaking') status('Preparing voice…');
  if (controller || speech.busy || microphone.recording || microphone.busy || voiceTurn || disposed) return;
  companion.clear();
  if (provider) { companion.setModelStatus('Ready', 'ready'); status('Ready for you'); }
  if (pendingTalk) { pendingTalk = false; void beginVoice(); return; }
  if (handsfree && !document.hidden) {
    clearTimeout(listenTimer);
    // Leave a short tail for the speakers/echo canceller before opening capture.
    listenTimer = setTimeout(() => { if (handsfree) void beginVoice(); }, 350);
  }
}

function stop() {
  turn++;
  handsfree = false;
  pendingTalk = false;
  clearTimeout(listenTimer);
  microphone.cancel();
  controller?.abort();
  speech.stop();
  companion.clear();
  status('Stopped · ready when you are');
  syncControls();
}

async function start() {
  if (loading || controller || disposed) return;
  loading = true;
  error('');
  syncControls();
  companion.setModelStatus('Loading conversation', 'loading');
  try {
    if (speakReplies.checked) await speech.unlock();
    if (!provider) {
      const hooks = {
        useWorker: true,
        onStatus: ({ text }) => progress(text),
        onProgress: report => progress(`${report.text || 'Loading language model'} · ${Math.round(report.progress * 100)}%`, report),
      };
      progress('Loading language model. The first download can take a few minutes.');
      const next = mobile ? new (await import('./mobile-provider.js')).MobileProvider(hooks) : createModelProvider(modelChoice.value, hooks);
      try {
        await next.load({ systemPrompt: buildSystemPrompt(persona, { voice: true }), maxTokens: Number($('reply-length').value), temperature: .7 });
        if (disposed) { await next.dispose(); return; }
        provider = next;
        loadedModel = modelChoice.value;
      } catch (reason) { await next.dispose().catch(() => {}); throw reason; }
    }
    if (speakReplies.checked) { progress('Loading local speech and your selected voice…'); await speech.load(voiceChoice.value); }
    if (disposed) return;
    companion.setModelStatus('Ready', 'ready');
    $('setup-title').textContent = 'You’re all set.';
    progress('Models are ready. Type a message or choose Talk.');
    status('Ready for you');
    input.focus({ preventScroll: true });
  } catch (reason) {
    if (disposed) return;
    error(`Could not finish setup: ${reason.message}. You can retry Start conversation${provider ? ', or turn off Read replies aloud to use text' : ''}.`);
    progress('Setup paused. Successfully loaded models are kept for your retry.');
    companion.clear();
    companion.setModelStatus('Setup needs attention', 'error');
  } finally { loading = false; $('load-progress').hidden = true; syncControls(); }
}

async function generate(value = input.value) {
  const text = value.trim().slice(0, 2000);
  if (!text || !provider || controller || loading || disposed) return;
  if (speakReplies.checked && (!speech.ready || !speech.voice)) { error('Load the voice with Start conversation, or turn off Read replies aloud.'); return; }
  clearTimeout(listenTimer);
  const request = ++turn;
  const active = provider;
  const abort = new AbortController();
  controller = abort;
  speech.stop();
  companion.clear();
  companion.setThinking();
  error('');
  status('Thinking…');
  input.value = '';
  addMessage('user', text);
  const reply = addMessage('assistant', '');
  let response = '';
  const began = performance.now();
  turnStarted = began;
  firstVoiceMs = null;
  delete transcript.dataset.firstAudioMs;
  delete transcript.dataset.firstTokenMs;
  let firstToken = null;
  let completed = false;
  const sentences = createSentenceBuffer(sentence => {
    if (request === turn && speakReplies.checked && speech.ready) speech.enqueue(sentence);
  });
  const updateReply = () => {
    renderFrame = 0;
    const following = transcript.scrollHeight - transcript.scrollTop - transcript.clientHeight < 90;
    reply.text.textContent = response;
    if (following) transcript.scrollTop = transcript.scrollHeight;
  };
  syncControls();
  try {
    if (speakReplies.checked) await speech.unlock();
    const prompt = buildSystemPrompt(persona, { voice: speakReplies.checked });
    const context = conversationContext(messages, mobile ? 2200 : 6000);
    for await (const delta of active.generate([{ role: 'system', content: prompt }, ...context, { role: 'user', content: text }], {
      signal: abort.signal, systemPrompt: prompt, maxTokens: Number($('reply-length').value), temperature: .7,
    })) {
      if (abort.signal.aborted || request !== turn) break;
      if (firstToken === null) { firstToken = performance.now(); transcript.dataset.firstTokenMs = String(Math.round(firstToken - began)); }
      response += delta;
      if (!renderFrame) renderFrame = requestAnimationFrame(updateReply);
      sentences.push(delta);
    }
    if (abort.signal.aborted || request !== turn) return;
    if (!response.trim()) throw new Error('The local model returned an empty reply');
    sentences.finish();
    messages.push({ role: 'user', content: text }, { role: 'assistant', content: response.trim() });
    messages = messages.slice(-100);
    store.save(messages, { modelId: mobile ? 'smol-mobile' : loadedModel });
    if (store.storageError) error(store.storageError);
    completed = true;
    $('reply-announcement').textContent = `${persona.name}: ${response.trim()}`;
    const latency = ((firstToken - began) / 1000).toFixed(1);
    progress(`First words in ${latency}s${firstVoiceMs === null ? '' : ` · voice started in ${(firstVoiceMs / 1000).toFixed(1)}s`} · ${mobile ? 'SmolLM2 360M · CPU' : loadedModel === 'gemma4' ? 'Gemma 4 E2B' : 'SmolLM2 1.7B · WebGPU'} · ${store.storageError ? 'chat not saved' : 'conversation saved in this browser'}`);
  } catch (reason) {
    if (!isModelCancellation(reason)) {
      handsfree = false;
      error(`Reply could not finish: ${reason.message}. Your message is back in the composer so you can retry.`);
      input.value = text;
    }
  } finally {
    if (renderFrame) { cancelAnimationFrame(renderFrame); renderFrame = 0; }
    updateReply();
    if (!completed) {
      speech.stop();
      reply.row.classList.add('interrupted');
      if (!response) reply.text.textContent = 'Reply stopped.';
    }
    try { await active.reset(); }
    catch (reason) {
      handsfree = false;
      provider = null;
      loadedModel = null;
      await active.dispose().catch(() => {});
      error(`The model could not reset safely: ${reason.message}. Use Start conversation to reload it.`);
    }
    controller = null;
    settled();
  }
}

async function beginVoice() {
  if (!provider || voiceTurn || microphone.busy || microphone.recording || disposed) return;
  if (controller) {
    // Stop the current reply first; avoid resetting a model while it decodes.
    stop();
    pendingTalk = true;
    status('Stopping the reply · opening your microphone next');
    return;
  }
  speech.stop();
  if (input.value.trim()) { handsfree = false; error('Send or clear your typed message before starting the microphone.'); return; }
  handsfree = $('mic-mode').value === 'handsfree';
  error('');
  status('Opening microphone…');
  voiceTurn = true;
  syncControls();
  try {
    if (speakReplies.checked) await speech.unlock();
    await microphone.start({ handsfree });
    if (microphone.recording) companion.setListening();
  } catch (reason) {
    handsfree = false;
    if (isModelCancellation(reason) || disposed) { status('Microphone off'); return; }
    const message = reason.name === 'NotAllowedError' ? 'Microphone permission was declined. Allow it in your browser’s site controls to use Talk; typing is always available.' : `Microphone could not start: ${reason.message}. Try Talk again.`;
    error(message);
    status('Microphone off');
  } finally { voiceTurn = false; syncControls(); }
}

async function finishVoice(empty = false) {
  if (voiceTurn || disposed) return;
  voiceTurn = true;
  const request = turn;
  syncControls();
  try {
    const text = await microphone.finish();
    if (request !== turn || disposed) return;
    if (empty || !text) {
      handsfree = false;
      status('No speech detected · choose Talk to try again');
      companion.clear();
    } else {
      voiceTurn = false;
      await generate(text);
    }
  } catch (reason) {
    handsfree = false;
    if (request !== turn || isModelCancellation(reason) || disposed) return;
    error(`Could not transcribe this recording: ${reason.message}. Choose Talk to try again.`);
    companion.clear();
    status('Microphone off');
  } finally { voiceTurn = false; syncControls(); }
}

mountChatHistoryControls({ container: $('chat-controls'), store, getMessages: () => messages, getModelId: () => loadedModel || modelChoice.value,
  onReset: () => { stop(); messages = []; renderHistory(); error(''); },
  onRestore: restored => { stop(); messages = restored.map(message => ({ ...message })); renderHistory(); error(''); },
});
mountPersonaEditor({ container: $('chat-controls'), getPersona: () => persona, onChange: next => {
  persona = next;
  $('companion-name').textContent = persona.name;
  status('Character updated · applies to the next reply');
} });
$('chat-controls').querySelectorAll('button').forEach(button => { button.textContent = button.textContent === 'reset' ? 'New chat' : button.textContent[0].toUpperCase() + button.textContent.slice(1); });
$('companion-name').textContent = persona.name;
if (messages.length) renderHistory();

startButton.addEventListener('click', () => void start());
$('composer').addEventListener('submit', event => { event.preventDefault(); if (!sendButton.disabled) void generate(); });
input.addEventListener('input', syncControls);
input.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    if (!sendButton.disabled) void generate();
  }
});
stopButton.addEventListener('click', stop);
micButton.addEventListener('click', () => { if (microphone.recording) void finishVoice(); else void beginVoice(); });
document.querySelectorAll('[data-prompt]').forEach(button => button.addEventListener('click', () => { input.value = button.dataset.prompt; input.focus(); syncControls(); }));
speakReplies.addEventListener('change', () => { if (!speakReplies.checked) { speech.stop(); companion.clear(); } syncControls(); });
$('mic-mode').addEventListener('change', () => { if ($('mic-mode').value !== 'handsfree') { handsfree = false; clearTimeout(listenTimer); } });
voiceChoice.addEventListener('change', async () => {
  if (!speech.ready) return;
  loading = true;
  syncControls();
  try { await speech.load(voiceChoice.value); progress(`Voice changed to ${voiceChoice.selectedOptions[0].textContent}.`); }
  catch (reason) { error(`Could not change voice: ${reason.message}. Use Start conversation to retry.`); }
  finally { loading = false; syncControls(); }
});
modelChoice.addEventListener('change', async () => {
  rememberModel(modelChoice.value);
  switching = true;
  const old = provider;
  provider = null;
  loadedModel = null;
  syncControls();
  try { await old?.dispose(); }
  catch (reason) { error(`Could not release the previous model: ${reason.message}. Reload the page before loading another.`); return; }
  finally { switching = false; syncControls(); }
  describeModel();
  companion.clear();
  status('Model selected · choose Start conversation');
  syncControls();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && (microphone.recording || microphone.busy || handsfree)) stop();
});
window.addEventListener('pagehide', () => {
  disposed = true;
  stop();
  speech.destroy();
  microphone.destroy();
  companion.destroy();
  provider?.dispose().catch(() => {});
});
window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });

function describeModel() {
  const size = mobile ? '~271 MB' : modelChoice.value === 'gemma4' ? '~2.6 GB' : '~1–2.7 GB';
  $('model-note').textContent = mobile ? 'SmolLM2 360M · CPU mode. Lower memory use; replies may take longer.' : 'Runs on your GPU. The larger model uses more memory.';
  $('setup-description').textContent = `First visit: ${size} for the language model, plus ~130 MB for voice. Downloads are cached in this browser.`;
  progress(mobile ? 'Compact CPU mode selected for this device.' : 'WebGPU available. Choose Start conversation when you’re ready.');
  if (importedModelsOnly()) {
    $('setup-description').textContent = 'Using your imported CPU model and Alba voice. New model downloads are disabled.';
    document.querySelector('.download-note').textContent = 'Using imported models';
    progress('Imported model mode · no new model downloads');
  }
}

async function init() {
  const mode = new URLSearchParams(location.search).get('mode');
  mobile = mode === 'mobile' || (mode !== 'full' && (navigator.userAgentData?.mobile ?? /Android|iPhone|iPod|webOS/i.test(navigator.userAgent)));
  if (importedModelsOnly()) mobile = true;
  if (!mobile) {
    try { const adapter = await navigator.gpu?.requestAdapter(); mobile = !adapter || adapter.limits.maxBufferSize < 256 * 1024 * 1024; }
    catch { mobile = true; }
  }
  modelChoice.querySelector('[value="gemma4"]').disabled = mobile;
  modelChoice.value = getPreferredModel({ mobile });
  describeModel();
  status('Choose Start conversation to load your local models');
  syncControls();
}
void init().catch(reason => { error(`Could not initialize the conversation: ${reason.message}. Reload to retry.`); });
