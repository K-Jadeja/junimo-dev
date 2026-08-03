import {
  MODEL_IDS,
  getModelDefinition,
} from './model-registry.js';

const GEMMA_LOAD_TIMEOUT_MS = 900000;

export class ModelCancelledError extends Error {
  constructor(message = 'Model generation cancelled') {
    super(message);
    this.name = 'ModelCancelledError';
  }
}

export function isModelCancellation(error) {
  return error instanceof ModelCancelledError
    || error?.name === 'AbortError'
    || /cancel/i.test(error?.message || '');
}

function throwIfAborted(signal) {
  if (signal?.aborted) throw new ModelCancelledError();
}

function emitStatus(hooks, text, state = 'loading') {
  hooks.onStatus?.({ text, state });
}

function emitProgress(hooks, report) {
  hooks.onProgress?.(report);
}

export class SmolProvider {
  constructor(hooks = {}) {
    this.hooks = hooks;
    this.engine = null;
    this.selectedModel = null;
    this.cancelRequested = false;
  }

  async load() {
    if (this.engine) {
      emitStatus(this.hooks, 'SmolLM2 ready', 'ready');
      return;
    }

    emitStatus(this.hooks, 'Loading SmolLM2 runtime...', 'loading');
    const { CreateMLCEngine } = await import('https://esm.run/@mlc-ai/web-llm');

    this.selectedModel = 'SmolLM2-1.7B-Instruct-q4f32_1-MLC';
    try {
      const adapter = await navigator.gpu?.requestAdapter?.();
      if (adapter?.features.has('shader-f16')) {
        this.selectedModel = 'SmolLM2-1.7B-Instruct-q4f16_1-MLC';
      }
    } catch (_) {
      // WebLLM will surface the actual device error below.
    }

    emitStatus(this.hooks, `Loading ${this.selectedModel}...`, 'loading');
    this.engine = await CreateMLCEngine(this.selectedModel, {
      initProgressCallback: (report) => {
        emitProgress(this.hooks, {
          progress: Number(report.progress) || 0,
          text: report.text || '',
          modelId: MODEL_IDS.SMOL,
        });
      },
    });
    emitStatus(this.hooks, 'SmolLM2 ready', 'ready');
  }

  async *generate(messages, { signal, maxTokens = 512, temperature = 0.7 } = {}) {
    await this.load();
    throwIfAborted(signal);
    this.cancelRequested = false;

    const chunks = await this.engine.chat.completions.create({
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: true,
    });

    for await (const chunk of chunks) {
      if (this.cancelRequested) throw new ModelCancelledError();
      throwIfAborted(signal);
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) yield delta;
    }
  }

  async cancel() {
    this.cancelRequested = true;
    try {
      await this.engine?.resetChat?.();
    } catch (error) {
      console.warn('[smol-provider] reset after cancellation failed:', error);
    }
  }

  async reset() {
    this.cancelRequested = false;
    await this.engine?.resetChat?.();
  }

  async dispose() {
    this.cancelRequested = true;
    try {
      if (typeof this.engine?.unload === 'function') {
        await this.engine.unload();
      } else {
        await this.engine?.resetChat?.();
      }
    } finally {
      this.engine = null;
    }
  }
}

export class AsyncQueue {
  constructor() {
    this.values = [];
    this.waiters = [];
    this.closed = false;
    this.error = null;
  }

  push(value) {
    if (this.closed) return;
    const waiter = this.waiters.shift();
    if (waiter) waiter.resolve({ value, done: false });
    else this.values.push(value);
  }

  end(error = null) {
    if (this.closed) return;
    this.closed = true;
    this.error = error;
    if (error) this.values = [];
    for (const waiter of this.waiters.splice(0)) {
      if (error) waiter.reject(error);
      else waiter.resolve({ value: undefined, done: true });
    }
  }

  next() {
    if (this.values.length) {
      return Promise.resolve({ value: this.values.shift(), done: false });
    }
    if (this.closed) {
      return this.error
        ? Promise.reject(this.error)
        : Promise.resolve({ value: undefined, done: true });
    }
    return new Promise((resolve, reject) => this.waiters.push({ resolve, reject }));
  }
}

export class Gemma4Provider {
  constructor(hooks = {}) {
    this.hooks = hooks;
    this.frame = null;
    this.readyPromise = null;
    this.readyResolve = null;
    this.readyReject = null;
    this.pending = new Map();
    this.active = null;
    this.requestId = 0;
    this.loaded = false;
    this.runtimeUrl = getModelDefinition(MODEL_IDS.GEMMA4).runtimeUrl;
    this.targetOrigin = new URL(this.runtimeUrl, location.href).origin;
    this.onMessage = this.onMessage.bind(this);
    window.addEventListener('message', this.onMessage);
  }

  async ensureFrame() {
    if (this.frame && this.readyPromise) {
      return this.readyPromise;
    }

    this.readyPromise = new Promise((resolve, reject) => {
      this.readyResolve = resolve;
      this.readyReject = reject;
    });
    this.frame = document.createElement('iframe');
    this.frame.title = 'Gemma runtime';
    this.frame.setAttribute('aria-hidden', 'true');
    this.frame.tabIndex = -1;
    this.frame.style.cssText = 'position:fixed;width:1px;height:1px;left:-10px;top:-10px;border:0;opacity:0;pointer-events:none;';
    this.frame.src = this.runtimeUrl;
    document.body.appendChild(this.frame);

    const timeout = window.setTimeout(() => {
      this.readyReject?.(new Error('Gemma runtime did not initialize within 30 seconds.'));
      this.readyReject = null;
    }, 30000);
    this.readyPromise.then(
      () => window.clearTimeout(timeout),
      () => window.clearTimeout(timeout),
    );
    return this.readyPromise;
  }

  onMessage(event) {
    if (!this.frame || event.source !== this.frame.contentWindow || event.origin !== this.targetOrigin) return;
    const data = event.data || {};

    if (data.type === 'ready') {
      this.readyResolve?.();
      this.readyResolve = null;
      return;
    }

    if (data.type === 'error' && data.id === 'runtime') {
      this.readyReject?.(new Error(data.message || 'Gemma runtime failed to initialize.'));
      this.readyResolve = null;
      this.readyReject = null;
      return;
    }

    if (data.type === 'progress') {
      emitProgress(this.hooks, {
        progress: Number(data.progress) || 0,
        text: data.text || '',
        loadedBytes: data.loadedBytes,
        totalBytes: data.totalBytes,
        modelId: MODEL_IDS.GEMMA4,
      });
      return;
    }

    if (data.type === 'token' || data.type === 'done' || data.type === 'cancelled') {
      if (this.active && data.id === this.active.id) {
        if (data.type === 'token' && data.text) this.active.queue.push(data.text);
        else if (data.type === 'cancelled') this.active.queue.end(new ModelCancelledError());
        else if (data.type === 'done') this.active.queue.end();
      }
      return;
    }

    const pending = this.pending.get(data.id);
    if (!pending) return;
    this.pending.delete(data.id);
    if (data.type === 'error') pending.reject(new Error(data.message || 'Gemma runtime error'));
    else pending.resolve(data);
  }

  post(message) {
    if (!this.frame?.contentWindow) throw new Error('Gemma runtime frame is unavailable.');
    this.frame.contentWindow.postMessage(message, this.targetOrigin);
  }

  request(type, payload = {}, timeoutMs = 300000) {
    const id = `gemma-${++this.requestId}`;
    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Gemma ${type} request timed out.`));
      }, timeoutMs);
      this.pending.set(id, {
        resolve: (value) => {
          window.clearTimeout(timeout);
          resolve(value);
        },
        reject: (error) => {
          window.clearTimeout(timeout);
          reject(error);
        },
      });
      this.post({ type, id, ...payload });
    });
  }

  async load({ systemPrompt, maxTokens = 1024, temperature = 0.8 } = {}) {
    await this.ensureFrame();
    if (this.loaded) {
      emitStatus(this.hooks, 'Gemma 4 E2B ready', 'ready');
      return;
    }
    emitStatus(this.hooks, 'Loading Gemma 4 E2B...', 'loading');
    const model = getModelDefinition(MODEL_IDS.GEMMA4);
    await this.request('load', {
      modelUrl: model.modelUrl,
      systemPrompt: systemPrompt || '',
      maxTokens,
      temperature,
    }, GEMMA_LOAD_TIMEOUT_MS);
    this.loaded = true;
    emitStatus(this.hooks, 'Gemma 4 E2B ready', 'ready');
  }

  async *generate(messages, { signal, systemPrompt, maxTokens = 512, temperature = 0.8 } = {}) {
    throwIfAborted(signal);
    await this.load({ systemPrompt, maxTokens: Math.max(maxTokens, 1024), temperature });
    throwIfAborted(signal);

    const queue = new AsyncQueue();
    const id = `gemma-generation-${++this.requestId}`;
    this.active = { id, queue };
    const abort = () => {
      this.cancel().catch((error) => console.warn('[gemma-provider] cancellation failed:', error));
      queue.end(new ModelCancelledError());
    };
    signal?.addEventListener('abort', abort, { once: true });

    try {
      this.post({ type: 'generate', id, messages, maxTokens, temperature });
      while (true) {
        const next = await queue.next();
        if (next.done) return;
        yield next.value;
      }
    } finally {
      signal?.removeEventListener('abort', abort);
      if (this.active?.id === id) {
        this.active = null;
      }
    }
  }

  async cancel() {
    if (!this.active) return;
    try {
      this.post({ type: 'cancel', id: this.active.id });
    } finally {
      this.active.queue.end(new ModelCancelledError());
    }
  }

  async reset() {
    await this.cancel();
    await this.ensureFrame();
    await this.request('reset');
  }

  async dispose() {
    await this.cancel();
    if (this.frame) {
      try {
        await this.request('dispose', {}, 10000);
      } catch (error) {
        console.warn('[gemma-provider] dispose request failed:', error);
      }
      this.frame.remove();
    }
    this.frame = null;
    this.readyPromise = null;
    this.loaded = false;
    for (const pending of this.pending.values()) {
      pending.reject(new Error('Gemma runtime disposed.'));
    }
    this.pending.clear();
  }

  async disposeRuntime() {
    window.removeEventListener('message', this.onMessage);
    await this.dispose();
  }
}

export function createModelProvider(modelId, hooks = {}) {
  if (modelId === MODEL_IDS.GEMMA4) return new Gemma4Provider(hooks);
  return new SmolProvider(hooks);
}
