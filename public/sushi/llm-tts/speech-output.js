// One synthesizer, at most two sentences ahead, and no stale audio after Stop.
import { importedModelsOnly } from './model-cache.mjs';
export class SpeechOutput {
  constructor({ onStatus = () => {}, onSpeech = () => {}, onLevel = () => {}, onIdle = () => {}, onError = () => {}, onFirstChunk = () => {} } = {}) {
    Object.assign(this, { onStatus, onSpeech, onLevel, onIdle, onError, onFirstChunk });
    this.worker = null;
    this.context = null;
    this.node = null;
    this.queue = [];
    this.playing = new Set();
    this.epoch = 0;
    this.serial = 0;
    this.active = null;
    this.ready = false;
    this.voice = null;
    this.pending = null;
    this.audioPromise = null;
    this.cancelTimer = null;
  }

  async unlock() {
    if (!this.context) this.context = new AudioContext({ sampleRate: 24000 });
    if (this.context.state === 'suspended') await this.context.resume();
    if (!this.audioPromise) {
      this.audioPromise = this.context.audioWorklet.addModule(new URL('./conversation-audio-worklet.js', import.meta.url)).then(() => {
        this.node = new AudioWorkletNode(this.context, 'conversation-audio');
        this.node.connect(this.context.destination);
        this.node.port.onmessage = ({ data }) => {
          if (data.epoch !== this.epoch) return;
          if (data.type === 'level') this.onLevel(data.level);
          if (data.type === 'started') this.onSpeech(data.text);
          if (data.type === 'ended') {
            this.playing.delete(data.id);
            this.onLevel(0);
            this.pump();
            if (!this.busy) this.onIdle();
          }
        };
      }).catch(error => { this.audioPromise = null; throw error; });
    }
    await this.audioPromise;
  }

  request(message, expected) {
    if (this.pending) return Promise.reject(new Error('Speech setup is already running.'));
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => this.fail(new Error('Speech setup timed out. Check your connection and try again.')), 180000);
      this.pending = { expected, resolve, reject, timer };
      this.worker.postMessage(message);
    });
  }

  async load(voice = 'alba') {
    if (!this.worker) {
      const worker = new Worker(new URL('../tts/worker.js', import.meta.url), { type: 'module' });
      this.worker = worker;
      worker.onmessage = ({ data }) => { if (this.worker === worker) this.handle(data); };
      worker.onerror = event => { if (this.worker === worker) this.fail(new Error(event.message || 'Speech worker failed to start.')); };
    }
    if (!this.ready) {
      await this.request({ type: 'load', config: { baseUrl: 'https://idle-intelligence.github.io/tts-web', cacheOnly: importedModelsOnly() } }, 'loaded');
      this.ready = true;
    }
    if (this.voice !== voice) {
      if (this.busy) throw new Error('Wait for speech to stop before changing voice.');
      await this.request({ type: 'load_voice', name: voice }, 'voice_loaded');
      this.voice = voice;
    }
  }

  enqueue(text) {
    const clean = String(text).replace(/\p{Extended_Pictographic}|\uFE0F/gu, '').replace(/[*#`]/g, '').trim();
    if (!clean) return;
    if (!this.ready || !this.voice || !this.node) throw new Error('Voice is not ready. Start the conversation again.');
    this.queue.push({ id: ++this.serial, epoch: this.epoch, text: clean });
    this.pump();
  }

  get busy() { return !!this.active || this.queue.length > 0 || this.playing.size > 0; }

  pump() {
    if (this.active || this.playing.size >= 2 || !this.queue.length) return;
    const item = this.queue.shift();
    item.startedAt = performance.now();
    item.samples = 0;
    item.timer = setTimeout(() => this.fail(new Error('Speech generation stalled. Please reload the voice.')), 90000);
    this.active = item;
    this.playing.add(item.id);
    this.node.port.postMessage({ type: 'sentence', ...item });
    this.worker.postMessage({ type: 'generate', id: item.id, text: item.text, temperature: 0.7 });
  }

  handle(data) {
    if (data.type === 'status') this.onStatus(data.text, data.progress);
    if (data.type === this.pending?.expected) {
      const pending = this.pending;
      this.pending = null;
      clearTimeout(pending.timer);
      if (data.type === 'loaded' && data.sampleRate !== 24000) {
        this.fail(new Error(`Unsupported speech sample rate: ${data.sampleRate}`));
        pending.reject(new Error('The speech runtime returned an unexpected sample rate.'));
      } else pending.resolve(data);
      return;
    }
    if (data.type === 'error') { this.fail(new Error(data.message)); return; }
    const active = this.active;
    if (!active || data.id !== active.id) return;
    if (data.type === 'chunk' && active.epoch === this.epoch) {
      const samples = data.data instanceof Float32Array ? data.data : new Float32Array(data.data);
      if (samples.some(value => !Number.isFinite(value))) { this.fail(new Error('The speech model returned invalid audio.')); return; }
      if (!active.samples && samples.length) this.onFirstChunk(performance.now() - active.startedAt);
      active.samples += samples.length;
      const elapsed = (performance.now() - active.startedAt) / 1000;
      const rate = elapsed > 0 ? active.samples / 24000 / elapsed : 1;
      // Slow CPUs need more runway to avoid choppy playback. End-of-sentence
      // always releases the buffer; this is a ceiling, not a fixed delay.
      const prebuffer = Math.round(24000 * Math.max(.3, Math.min(2, (1.08 - rate) * 6)));
      this.node.port.postMessage({ type: 'buffer', id: active.id, epoch: active.epoch, prebuffer });
      this.node.port.postMessage({ type: 'chunk', id: active.id, epoch: active.epoch, samples }, [samples.buffer]);
    }
    if (data.type === 'done' || data.type === 'cancelled') {
      clearTimeout(active.timer);
      clearTimeout(this.cancelTimer);
      if (data.type === 'done' && active.epoch === this.epoch && active.samples === 0) { this.fail(new Error('The speech model returned no audio.')); return; }
      if (active.epoch === this.epoch) this.node.port.postMessage({ type: 'finish', id: active.id, epoch: active.epoch });
      this.active = null;
      this.pump();
      if (!this.busy) this.onIdle();
    }
  }

  stop() {
    if (this.active) clearTimeout(this.active.timer);
    this.epoch++;
    this.queue = [];
    this.playing.clear();
    this.node?.port.postMessage({ type: 'clear', epoch: this.epoch });
    this.onLevel(0);
    // Keep ownership until the worker acknowledges cancellation. Late chunks
    // retain the old epoch, including a late gen_start from before Stop.
    clearTimeout(this.cancelTimer);
    if (this.active) {
      this.worker?.postMessage({ type: 'cancel', id: this.active.id });
      this.cancelTimer = setTimeout(() => this.fail(new Error('The speech worker stopped responding. Start conversation to reload it.')), 10000);
    }
  }

  fail(error) {
    const pending = this.pending;
    this.pending = null;
    if (pending) { clearTimeout(pending.timer); pending.reject(error); }
    this.stop();
    clearTimeout(this.cancelTimer);
    this.worker?.terminate();
    this.worker = null;
    this.active = null;
    this.ready = false;
    this.voice = null;
    this.onError(error);
  }

  destroy() {
    const pending = this.pending;
    this.pending = null;
    if (pending) { clearTimeout(pending.timer); pending.reject(new DOMException('Session ended', 'AbortError')); }
    this.stop();
    clearTimeout(this.cancelTimer);
    this.worker?.terminate();
    this.worker = null;
    this.active = null;
    this.node?.disconnect();
    this.context?.close().catch(() => {});
    this.context = null;
    this.node = null;
    this.audioPromise = null;
    this.ready = false;
    this.voice = null;
  }
}
