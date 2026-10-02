import { WhisperClient, WHISPER_TINY_Q5_1_URL } from '../stt/stt-mobile/whisper-client.js';
import { VoiceActivity } from './conversation-core.mjs';

export class LocalMicrophone {
  constructor({ onStatus = () => {}, onEnd = () => {} } = {}) {
    Object.assign(this, { onStatus, onEnd });
    this.client = null;
    this.ready = false;
    this.recording = false;
    this.busy = false;
    this.version = 0;
    this.context = null;
    this.stream = null;
    this.node = null;
    this.chunks = [];
  }
  async load() {
    if (this.ready) return;
    if (!crossOriginIsolated) throw new Error('Local microphone transcription needs browser isolation. Reload this page on sushi.junimo.dev.');
    this.client = new WhisperClient(new URL('../stt/stt-mobile/worker.js', import.meta.url));
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; this.client?.destroy(); }, 120000);
    try {
      await this.client.load(WHISPER_TINY_Q5_1_URL, progress => this.onStatus(`Loading local hearing · ${Math.round(progress * 100)}%`));
      this.ready = true;
    } catch (error) {
      this.client?.destroy(); this.client = null;
      if (timedOut) throw new Error('Loading local hearing timed out. Check your connection and choose Talk to retry.');
      throw error;
    }
    finally { clearTimeout(timer); }
  }
  async start({ handsfree = false } = {}) {
    if (this.busy || this.recording) return;
    const version = ++this.version;
    this.busy = true;
    try {
      // Ask first, so a denied permission never starts an unnecessary download.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      if (version !== this.version) { stream.getTracks().forEach(track => track.stop()); return; }
      this.stream = stream;
      await this.load();
      if (version !== this.version) return;
      this.context = new AudioContext();
      await this.context.resume();
      await this.context.audioWorklet.addModule(new URL('./microphone-worklet.js', import.meta.url));
      if (version !== this.version) return;
      this.node = new AudioWorkletNode(this.context, 'companion-microphone');
      const detector = new VoiceActivity();
      this.chunks = [];
      this.recording = true;
      this.node.port.onmessage = ({ data }) => {
        if (data.type === 'flushed') { this.flushResolve?.(); return; }
        if (!data.samples || version !== this.version) return;
        this.chunks.push(data.samples);
        if (!this.recording) return;
        const state = detector.push(data.rms, data.samples.length / 16);
        if ((handsfree && state !== 'listen') || detector.elapsed >= 30000) {
          this.recording = false;
          this.onEnd(state === 'empty');
        }
      };
      this.context.createMediaStreamSource(stream).connect(this.node);
      this.node.connect(this.context.destination);
      this.onStatus(handsfree ? 'Listening · pause to send' : 'Listening · tap Send voice when you finish');
    } catch (error) { this.release(); throw error; }
    finally { this.busy = false; }
  }
  async finish() {
    const version = this.version;
    this.recording = false;
    this.busy = true;
    try {
      if (this.node) {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => { this.flushResolve = null; reject(new Error('Microphone did not finish capturing. Please try again.')); }, 2000);
          this.flushResolve = () => { clearTimeout(timeout); this.flushResolve = null; resolve(); };
          this.node.port.postMessage({ type: 'flush' });
        });
      }
      this.release();
      if (version !== this.version) return '';
      const length = this.chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      if (length < 3200) return '';
      const pcm = new Float32Array(length);
      let offset = 0;
      for (const chunk of this.chunks) { pcm.set(chunk, offset); offset += chunk.length; }
      this.chunks = [];
      let energy = 0;
      for (const sample of pcm) energy += sample * sample;
      if (Math.sqrt(energy / pcm.length) < .004) return '';
      this.onStatus('Listening finished · transcribing on your device…');
      const text = await this.client.transcribe(pcm, { lang: 'en', threads: Math.min(2, navigator.hardwareConcurrency || 2) });
      return version === this.version ? text.replace(/\[(?:BLANK_AUDIO|SILENCE)\]/gi, '').trim() : '';
    } finally { this.release(); this.chunks = []; this.busy = false; }
  }
  release() {
    this.node?.disconnect();
    this.node = null;
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = null;
    this.context?.close().catch(() => {});
    this.context = null;
  }
  cancel() {
    this.version++;
    this.recording = false;
    this.release();
    this.chunks = [];
    this.flushResolve?.();
    if (this.busy && this.client) {
      // Synchronous WASM cannot observe cancellation while transcribing.
      // Termination rejects the pending promise and immediately frees its CPU.
      this.client.destroy();
      this.client = null;
      this.ready = false;
    }
  }
  destroy() {
    this.cancel();
    this.client?.destroy();
    this.client = null;
    this.ready = false;
  }
}
