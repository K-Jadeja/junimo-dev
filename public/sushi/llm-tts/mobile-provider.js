import { AsyncQueue, ModelCancelledError } from '../llm/model-provider.js';
import { mobilePrompt } from './conversation-core.mjs';
import { cachedLanguageModel, importedModelsOnly } from './model-cache.mjs';

export class MobileProvider {
  constructor(hooks = {}) { this.hooks = hooks; this.engine = null; }
  async load() {
    const { Wllama, LoggerWithoutDebug } = await import('https://idle-intelligence.github.io/llm-web/pkg/wllama/index.js');
    this.engine = new Wllama({
      'single-thread/wllama.wasm': 'https://idle-intelligence.github.io/llm-web/pkg/wllama/single-thread/wllama.wasm',
      'multi-thread/wllama.wasm': 'https://idle-intelligence.github.io/llm-web/pkg/wllama/multi-thread/wllama.wasm',
    }, { suppressNativeLog: true, logger: LoggerWithoutDebug });
    const config = {
      n_ctx: 4096, n_batch: 128, n_threads: Math.min(2, navigator.hardwareConcurrency || 2),
      progressCallback: ({ loaded, total }) => this.hooks.onProgress?.({ progress: total ? loaded / total : 0, text: 'Loading compact SmolLM2' }),
    };
    const cached = await cachedLanguageModel();
    if (cached) {
      this.hooks.onProgress?.({ progress: 1, text: 'Loading saved SmolLM2 — no model download' });
      await this.engine.loadModel([cached], config);
    } else {
      if (importedModelsOnly()) throw new Error('The imported language model is missing. Import your model backup again; automatic downloads are disabled.');
      await this.engine.loadModelFromHF('bartowski/SmolLM2-360M-Instruct-GGUF', 'SmolLM2-360M-Instruct-Q4_K_M.gguf', config);
    }
  }
  async *generate(messages, { signal, maxTokens = 160, temperature = .7 } = {}) {
    const queue = new AsyncQueue();
    let previous = '';
    const completion = this.engine.createCompletion(mobilePrompt(messages), {
      // Wllama compares the complete token prefix and removes mismatched KV
      // entries itself. Keep this cache across turns, persona edits and resets;
      // the next full prompt remains the authority for conversation contents.
      useCache: true,
      nPredict: maxTokens, sampling: { temp: temperature, top_k: 40, top_p: .9 },
      onNewToken: (token, piece, currentText, { abortSignal }) => {
        if (signal?.aborted) { abortSignal(); queue.end(new ModelCancelledError()); return; }
        const clean = currentText.replace(/<\|im_end\|>.*$/s, '');
        const delta = clean.slice(previous.length);
        previous = clean;
        if (delta) queue.push(delta);
        if (currentText.includes('<|im_end|>')) abortSignal();
      },
    }).then(() => queue.end(signal?.aborted ? new ModelCancelledError() : null), error => queue.end(error));
    try {
      while (true) {
        const next = await queue.next();
        if (next.done) break;
        if (signal?.aborted) throw new ModelCancelledError();
        yield next.value;
      }
    } finally { await completion; }
  }
  async reset() { /* The next completion reconciles its exact token prefix. */ }
  async dispose() { await this.engine?.exit(); this.engine = null; }
}
