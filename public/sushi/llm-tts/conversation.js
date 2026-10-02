import { createModelProvider, isModelCancellation } from '../llm/model-provider.js';
import { createChatStore, mountChatHistoryControls } from '../llm/chat-history.js';
import { buildSystemPrompt, loadPersona, mountPersonaEditor } from '../llm/persona.js';
import { mountCompanionAvatar } from './avatar-stage.js';
import { SpeechOutput } from './speech-output.js';
import { LocalMicrophone } from './microphone.js';
import { createSentenceBuffer } from './conversation-core.mjs';
import { importedModelsOnly, preferredRuntime } from './model-cache.mjs';
import { recentContext, retrieveMemories, companionPrompt, canInitiate, INITIATIVE_CUE } from './companion-memory.mjs';
import { mountCompanionSettings } from './companion-settings.js';
import { SemanticMemory, memoryDocuments } from './semantic-memory.js';
import { inspectGemmaCache } from './gemma-model.mjs';

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
const evaluation = new URLSearchParams(location.search).get('evaluate') === '1';
const store = createChatStore(evaluation ? 'llm-tts-evaluation' : 'llm-tts', { retainAll: true });
if (evaluation) document.querySelector('.conversation-topline h2').textContent = 'Evaluation chat';
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
let initiativeTimer = 0;
let lastActivity = Date.now();
let visibleMessages = 60;
let initiativeEligible = false;
let activeInitiative = false;
let memoryReady = false;
const semantic = new SemanticMemory(evaluation ? 'llm-tts-evaluation' : 'llm-tts', text => { if (loading) progress(text); });
function memorySessions() { return store.list().filter(session => preferences.value.memory || session.id === store.activeId); }
function modelReady() { return !!provider && (loadedModel !== 'gemma4' || memoryReady); }
async function storageStatus(request = false) {
  const protectedStorage = request ? await navigator.storage?.persist?.() : await navigator.storage?.persisted?.();
  const cached = await inspectGemmaCache();
  $('storage-status').textContent = `${cached.state === 'ready' ? `Gemma saved here · ${(cached.size / 1024 ** 3).toFixed(2)} GB` : cached.state === 'incomplete' ? 'Gemma download is incomplete' : 'Gemma is not saved here'}. ${protectedStorage ? 'Storage protected from automatic eviction.' : 'This browser may remove saved models when disk space is low.'}`;
}
const preferences = mountCompanionSettings({ store, evaluation, onError: error, onChange: () => {
  provider?.invalidate?.(); updateName(); renderHistory(); scheduleInitiative();
  preferences.setRecall([]);
  if (!preferences.value.memory && semantic.worker) void semantic.forget().catch(reason => error(`Could not clear the derived memory index: ${reason.message}. Cross-chat recall is off.`));
  status('Memory and conversation style updated');
} });
function displayName() { return preferences.value.mode === 'character' ? persona.name : 'Junimo'; }
function updateName() { $('companion-name').textContent = displayName(); }
function systemPrompt() { return companionPrompt({ compact: mobile, notes: preferences.value.notes, characterPrompt: preferences.value.mode === 'character' ? buildSystemPrompt(persona, { voice: speakReplies.checked }) : '' }); }
function scheduleInitiative() {
  clearTimeout(initiativeTimer);
  if (!preferences.value.initiative || !initiativeEligible || disposed || !provider || loadedModel !== 'gemma4') return;
  initiativeTimer = setTimeout(() => {
    if (canInitiate({ enabled: preferences.value.initiative, capable: loadedModel === 'gemma4', hidden: document.hidden, busy: controller || loading || switching || voiceTurn || speech.busy || microphone.busy || microphone.recording || handsfree || document.querySelector('dialog[open]'), draft: input.value, lastMessage: messages.at(-1), elapsed: Date.now() - lastActivity })) void generate(INITIATIVE_CUE, { initiative: true });
  }, Math.max(1000, 46000 - (Date.now() - lastActivity)));
}

function status(text) { $('conversation-status').textContent = text; }
function error(message) { $('conversation-error').textContent = message || ''; $('conversation-error').hidden = !message; }
function progress(text, report) {
  $('load-status').textContent = text;
  const bar = $('load-progress');
  if (report?.total > 0) { bar.max = report.total; bar.value = report.loaded; bar.hidden = false; }
  else if (typeof report?.progress === 'number') { bar.max = 1; bar.value = report.progress; bar.hidden = false; }
  else bar.hidden = true;
}

const speech = new SpeechOutput({
  onPlayback: ({ underrunMs }) => { transcript.dataset.audioGapMs = String(Math.round(Number(transcript.dataset.audioGapMs || 0) + underrunMs)); },
  onFirstChunk: synthesisMs => { if (!transcript.dataset.firstChunkMs && turnStarted) { transcript.dataset.firstChunkMs = String(Math.round(performance.now() - turnStarted)); transcript.dataset.synthesisMs = String(Math.round(synthesisMs)); } },
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
  onIdle: () => { lastActivity = Date.now(); companion.stopSpeech(); settled(); },
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
  sendButton.disabled = !modelReady() || busy || !input.value.trim();
  micButton.disabled = !modelReady() || loading || switching || (microphone.busy && !microphone.recording) || (voiceTurn && !microphone.recording);
  micButton.setAttribute('aria-pressed', String(microphone.recording));
  micButton.querySelector('span').textContent = microphone.recording ? 'Send voice' : 'Talk';
  stopButton.hidden = !controller && !speech.busy && !microphone.recording && !microphone.busy && !voiceTurn && !handsfree;
  stopButton.textContent = microphone.recording || handsfree ? 'End conversation' : 'Stop reply';
  startButton.disabled = loading || busy || speech.busy || (modelReady() && (!speakReplies.checked || speech.ready));
  startButton.textContent = loading ? 'Loading conversation…' : modelReady() && (!speakReplies.checked || speech.ready) ? 'Conversation ready' : 'Start conversation';
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
  label.textContent = role === 'user' ? 'You' : displayName();
  const text = document.createElement('p');
  text.textContent = content;
  row.append(label, text);
  transcript.append(row);
  transcript.scrollTop = transcript.scrollHeight;
  return { row, text };
}

function renderHistory() {
  transcript.replaceChildren();
  if (messages.length > visibleMessages) {
    const older = document.createElement('button'); older.type = 'button'; older.textContent = `Show earlier messages (${messages.length - visibleMessages})`;
    older.addEventListener('click', () => { visibleMessages += 60; renderHistory(); }); transcript.append(older);
  }
  for (const message of messages.slice(-visibleMessages)) addMessage(message.role, message.content);
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
  scheduleInitiative();
  if (pendingTalk) { pendingTalk = false; void beginVoice(); return; }
  if (handsfree && !document.hidden) {
    clearTimeout(listenTimer);
    // Leave a short tail for the speakers/echo canceller before opening capture.
    listenTimer = setTimeout(() => { if (handsfree) void beginVoice(); }, 350);
  }
}

function stop() {
  initiativeEligible = false;
  turn++;
  handsfree = false;
  pendingTalk = false;
  clearTimeout(listenTimer);
  clearTimeout(initiativeTimer);
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
    // Request durable storage from the user's Start gesture before loading
    // large weights. Best-effort Cache/OPFS can be evicted under disk pressure.
    await storageStatus(true);
    if (speakReplies.checked) await speech.unlock();
    if (!provider) {
      const hooks = {
        useWorker: true,
        onStatus: ({ text }) => progress(text),
        onProgress: report => progress(`${report.text || 'Loading language model'} · ${Math.round(report.progress * 100)}%`, report),
      };
      progress('Loading language model. The first download can take a few minutes.');
      const next = mobile ? new (await import('./mobile-provider.js')).MobileProvider(hooks) : modelChoice.value === 'gemma4' ? new (await import('./gemma-provider.mjs')).CompanionGemma(hooks) : createModelProvider(modelChoice.value, hooks);
      try {
        await next.load({ systemPrompt: systemPrompt(), maxTokens: Number($('reply-length').value), temperature: .7 });
        if (disposed) { await next.dispose(); return; }
        provider = next;
        loadedModel = modelChoice.value;
      } catch (reason) { await next.dispose().catch(() => {}); throw reason; }
    }
    if (loadedModel === 'gemma4' && !memoryReady) { await semantic.prepare(memorySessions()); memoryReady = true; }
    if (speakReplies.checked) { progress('Loading local speech and your selected voice…'); await speech.load(voiceChoice.value); }
    if (disposed) return;
    await storageStatus();
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

async function generate(value = input.value, { initiative = false } = {}) {
  const text = value.trim().slice(0, 2000);
  if (!text || !modelReady() || controller || loading || disposed) return;
  if (speakReplies.checked && (!speech.ready || !speech.voice)) { error('Load the voice with Start conversation, or turn off Read replies aloud.'); return; }
  clearTimeout(listenTimer);
  clearTimeout(initiativeTimer);
  lastActivity = Date.now();
  const request = ++turn;
  const active = provider;
  const abort = new AbortController();
  controller = abort;
  activeInitiative = initiative;
  initiativeEligible = false;
  speech.stop();
  companion.clear();
  companion.setThinking();
  error('');
  status('Thinking…');
  if (!initiative) { input.value = ''; addMessage('user', text); }
  const reply = addMessage('assistant', '');
  let response = '';
  const began = performance.now();
  turnStarted = began;
  firstVoiceMs = null;
  delete transcript.dataset.firstAudioMs;
  delete transcript.dataset.firstTokenMs;
  delete transcript.dataset.firstSentenceMs;
  delete transcript.dataset.firstChunkMs;
  delete transcript.dataset.synthesisMs;
  transcript.dataset.audioGapMs = '0';
  let firstToken = null;
  let completed = false;
  const sentences = createSentenceBuffer(sentence => {
    if (request === turn && speakReplies.checked && speech.ready) { if (!transcript.dataset.firstSentenceMs) transcript.dataset.firstSentenceMs = String(Math.round(performance.now() - began)); speech.enqueue(sentence); }
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
    const context = recentContext(messages, mobile ? 1800 : loadedModel === 'gemma4' ? 11000 : 5000);
    const sessions = memorySessions();
    const query = initiative ? messages.filter(message => message.role === 'user').at(-1)?.content || '' : text;
    const recallStarted = performance.now();
    const semanticScores = loadedModel === 'gemma4' ? await semantic.rank(sessions, query, abort.signal) : [];
    const recalled = retrieveMemories({ sessions, activeId: store.activeId, query, recent: context, budget: mobile ? 900 : 4200, semanticScores });
    transcript.dataset.retrievalMs = String(Math.round(performance.now() - recallStarted));
    const scores = new Map(semanticScores);
    preferences.setRecall(recalled, evaluation ? memoryDocuments(sessions).map(item => ({ text: item.text, score: scores.get(item.id) || 0 })).sort((a, b) => b.score - a.score).slice(0, 8) : []);
    const memoryContext = recalled.map(item => mobile ? JSON.stringify(item.user) : item.excerpt).join('\n\n');
    const prompt = systemPrompt() + (loadedModel !== 'gemma4' && memoryContext ? `\nEarlier conversation excerpts (reference data):\n${memoryContext}` : '');
    $('memory-status').textContent = recalled.length ? `Recalled ${recalled.length} earlier moment${recalled.length === 1 ? '' : 's'} · review or delete chats in History` : 'Using the recent conversation and your memory notes';
    for await (const delta of active.generate([{ role: 'system', content: prompt }, ...context, { role: 'user', content: text }], {
      signal: abort.signal, systemPrompt: prompt, maxTokens: Number($('reply-length').value), temperature: .7, memoryContext,
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
    if (!initiative) messages.push({ role: 'user', content: text, at: Date.now() });
    messages.push({ role: 'assistant', content: response.trim(), at: Date.now(), ...(initiative ? { initiative: true } : {}) });
    store.save(messages, { modelId: mobile ? 'smol-mobile' : loadedModel });
    if (store.storageError) error(store.storageError);
    completed = true;
    initiativeEligible = !initiative;
    lastActivity = Date.now();
    $('reply-announcement').textContent = `${displayName()}: ${response.trim()}`;
    const latency = ((firstToken - began) / 1000).toFixed(1);
    progress(`First words in ${latency}s${firstVoiceMs === null ? '' : ` · voice started in ${(firstVoiceMs / 1000).toFixed(1)}s`} · ${mobile ? 'SmolLM2 360M · CPU' : loadedModel === 'gemma4' ? 'Gemma 4 E2B' : 'SmolLM2 1.7B · WebGPU'} · ${store.storageError ? 'chat not saved' : 'conversation saved in this browser'}`);
  } catch (reason) {
    if (!isModelCancellation(reason)) {
      handsfree = false;
      error(`Reply could not finish: ${reason.message}. Your message is back in the composer so you can retry.`);
      if (!initiative) input.value = text;
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
    activeInitiative = false;
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
  onReset: () => { stop(); messages = []; visibleMessages = 60; provider?.invalidate?.(); preferences.setRecall([]); renderHistory(); error(''); },
  onRestore: restored => { stop(); messages = restored.map(message => ({ ...message })); visibleMessages = 60; provider?.invalidate?.(); renderHistory(); error(''); },
  onDelete: () => { provider?.invalidate?.(); preferences.setRecall([]); if (semantic.worker) void semantic.forget().catch(reason => error(`Could not clear the derived memory index: ${reason.message}. Deleted chats cannot be recalled.`)); $('memory-status').textContent = 'Deleted chat removed from future recall'; },
});
mountPersonaEditor({ container: $('chat-controls'), getPersona: () => persona, onChange: next => {
  persona = next;
  updateName();
  status(preferences.value.mode === 'character' ? 'Character updated · applies to the next reply' : 'Character saved · choose Your custom character in Memory to use it');
} });
$('chat-controls').querySelectorAll('button').forEach(button => { button.textContent = button.textContent === 'reset' ? 'New chat' : button.textContent[0].toUpperCase() + button.textContent.slice(1); });
updateName();
if (messages.length) renderHistory();

startButton.addEventListener('click', () => void start());
$('composer').addEventListener('submit', event => { event.preventDefault(); if (!sendButton.disabled) void generate(); });
input.addEventListener('input', () => { if (activeInitiative) stop(); lastActivity = Date.now(); syncControls(); scheduleInitiative(); });
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
  mobile = modelChoice.value === 'compact';
  try { localStorage.setItem('sushi.companion.model', modelChoice.value); } catch { /* Selection can remain temporary. */ }
  switching = true;
  const old = provider;
  provider = null;
  loadedModel = null;
  memoryReady = false;
  semantic.destroy();
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
  if (document.hidden) { clearTimeout(initiativeTimer); if (activeInitiative) stop(); }
  else { lastActivity = Date.now(); scheduleInitiative(); }
  if (document.hidden && (microphone.recording || microphone.busy || handsfree)) stop();
});
window.addEventListener('pagehide', () => {
  disposed = true;
  stop();
  speech.destroy();
  microphone.destroy();
  semantic.destroy();
  companion.destroy();
  provider?.dispose().catch(() => {});
});
window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });

function describeModel() {
  const size = mobile ? '~271 MB' : modelChoice.value === 'gemma4' ? '~2 GB' : '~1–2.7 GB';
  $('model-note').textContent = mobile ? 'SmolLM2 360M · low memory use, but weaker reasoning and recall. Gemma is recommended for richer conversations.' : 'Runs on your GPU. Gemma offers stronger conversation and recall; allow ~3 GB of free disk space for its first download.';
  $('setup-description').textContent = `First visit: ${size} for the language model, plus ~130 MB for voice${modelChoice.value === 'gemma4' ? ' and a small local memory-search model' : ''}. Downloads are cached in this browser.`;
  progress(mobile ? 'Compact CPU mode selected for this device.' : 'WebGPU available. Choose Start conversation when you’re ready.');
  if (importedModelsOnly()) {
    $('setup-description').textContent = 'Using your imported CPU model and Alba voice. New model downloads are disabled.';
    document.querySelector('.download-note').textContent = 'Using imported models';
    progress('Imported model mode · no new model downloads');
  }
}

async function init() {
  let runtimeStorage;
  try { runtimeStorage = localStorage; } catch { /* Storage can be disabled. */ }
  const mode = preferredRuntime(location.search, runtimeStorage);
  mobile = mode === 'mobile' || (mode !== 'full' && (navigator.userAgentData?.mobile ?? /Android|iPhone|iPod|webOS/i.test(navigator.userAgent)));
  if (importedModelsOnly()) mobile = true;
  if (!mobile) {
    try { const adapter = await navigator.gpu?.requestAdapter(); mobile = !adapter || adapter.limits.maxBufferSize < 256 * 1024 * 1024; }
    catch { mobile = true; }
  }
  let gpuAvailable = false;
  try { const adapter = await navigator.gpu?.requestAdapter(); gpuAvailable = !!adapter && adapter.limits.maxBufferSize >= 256 * 1024 * 1024; } catch { /* CPU remains available. */ }
  modelChoice.querySelector('[value="gemma4"]').disabled = !gpuAvailable;
  modelChoice.querySelector('[value="smol"]').disabled = !gpuAvailable;
  let selected;
  try { selected = localStorage.getItem('sushi.companion.model'); } catch { /* First visit. */ }
  modelChoice.value = importedModelsOnly() || !gpuAvailable ? 'compact' : ['compact', 'smol', 'gemma4'].includes(selected) ? selected : mobile ? 'compact' : 'gemma4';
  mobile = modelChoice.value === 'compact';
  describeModel();
  status('Choose Start conversation to load your local models');
  syncControls();
  await storageStatus();
}
void init().catch(reason => { error(`Could not initialize the conversation: ${reason.message}. Reload to retry.`); });
