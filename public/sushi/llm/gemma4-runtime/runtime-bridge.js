import { createGenerationStreamTracker } from './generation-stream.js';

const TEMPLATE = Object.freeze({
  user: { pre: '<|turn>user\n', post: '<turn|>\n' },
  model: { pre: '<|turn>model\n', post: '<turn|>\n' },
  system: { pre: '<|turn>user\n', post: '<turn|>\n' },
});

const parentWindow = window.parent;
let chat = null;
let service = null;
let activeGeneration = null;

function send(message) {
  parentWindow.postMessage(message, location.origin);
}

function sendError(id, error) {
  send({
    type: 'error',
    id,
    message: error instanceof Error ? error.message : String(error),
  });
}

function setPersona(systemPrompt) {
  service.setPersona({
    name: 'Sushi local roleplay',
    instructions: systemPrompt ? [{ role: 'system', text: systemPrompt }] : [],
    promptTemplate: TEMPLATE,
  });
}

function setHistory(messages) {
  const history = messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => service.applyTemplate({
      role: message.role === 'assistant' ? 'model' : 'user',
      text: message.content,
    }));
  service.history.next(history);
}

function subscribeProgress() {
  service.loadingProgress$.subscribe((progress) => {
    if (!progress) return;
    send({
      type: 'progress',
      progress: progress.progress,
      loadedBytes: progress.downloadedBytes,
      totalBytes: progress.totalBytes,
      text: 'Loading Gemma 4 E2B...',
    });
  });
}

async function initialize() {
  await customElements.whenDefined('llm-chat');
  chat = document.querySelector('llm-chat');
  if (!chat?.llmService) throw new Error('Gemma LlmService was not exposed by the runtime.');
  service = chat.llmService;
  subscribeProgress();
  send({ type: 'ready' });
}

async function handleLoad(message) {
  setPersona(message.systemPrompt || '');
  await service.setOptions({
    baseOptions: { modelAssetPath: message.modelUrl },
    numResponses: 1,
    topK: 40,
    temperature: Number(message.temperature) || 0.8,
    maxTokens: Number(message.maxTokens) || 1024,
    forceF32: false,
  });
  service.clearHistory();
  send({ type: 'loaded', id: message.id });
}

function subscribeGeneration(id) {
  const initialModelCount = service.history.value
    ?.filter((message) => message.role === 'model')
    .length || 0;
  const tracker = createGenerationStreamTracker(initialModelCount);
  const subscription = service.history.subscribe((history) => {
    if (!activeGeneration || activeGeneration.id !== id) return;
    const update = tracker.observe(history);
    if (update.delta) send({ type: 'token', id, text: update.delta });
    if (update.done) send({ type: 'done', id });
  });
  return {
    get text() { return tracker.text; },
    get completed() { return tracker.completed; },
    unsubscribe: () => subscription.unsubscribe(),
  };
}

async function handleGenerate(message) {
  if (activeGeneration) throw new Error('Gemma is already generating.');
  const messages = Array.isArray(message.messages) ? message.messages : [];
  const userMessage = [...messages].reverse().find((entry) => entry.role === 'user');
  if (!userMessage?.content) throw new Error('Gemma generation requires a user message.');

  const system = messages.find((entry) => entry.role === 'system');
  setPersona(system?.content || '');
  setHistory(messages.filter((entry) => entry !== userMessage));

  activeGeneration = { id: message.id, cancelled: false };
  const stream = subscribeGeneration(message.id);
  try {
    await service.generateResponse(userMessage.content);
    if (!stream.completed) send({ type: 'done', id: message.id });
  } finally {
    stream.unsubscribe();
    activeGeneration = null;
  }
}

window.addEventListener('message', async (event) => {
  if (event.source !== parentWindow || event.origin !== location.origin || !event.data?.type) return;
  const message = event.data;
  try {
    if (message.type === 'load') await handleLoad(message);
    else if (message.type === 'generate') await handleGenerate(message);
    else if (message.type === 'cancel') {
      if (activeGeneration?.id === message.id) {
        activeGeneration.cancelled = true;
        service.cancelProcessing();
        send({ type: 'cancelled', id: message.id });
      }
    } else if (message.type === 'reset') {
      service.cancelProcessing();
      service.clearHistory();
      send({ type: 'reset', id: message.id });
    } else if (message.type === 'dispose') {
      service.cancelProcessing();
      service.llmInference?.close?.();
      send({ type: 'disposed', id: message.id });
    }
  } catch (error) {
    sendError(message.id, error);
  }
});

initialize().catch((error) => {
  console.error('[gemma-runtime] initialization failed:', error);
  sendError('runtime', error);
});
