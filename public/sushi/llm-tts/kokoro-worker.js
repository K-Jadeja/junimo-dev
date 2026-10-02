// Explicit local WebGPU voice. Never substitutes a cloud or CPU provider.
const MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX';
const REVISION = '1939ad2a8e416c0acfeecc08a694d14ef25f2231';
let tts, voice;
let operations = Promise.resolve();
const cancelled = new Set();
const post = (type, data = {}, transfer = []) => self.postMessage({ type, ...data }, transfer);
const originalFetch = self.fetch.bind(self);
self.fetch = (input, options = {}) => {
  if (typeof input === 'string' && input.startsWith(`https://huggingface.co/${MODEL}/resolve/`)) {
    return originalFetch(input.replace('/resolve/main/', `/resolve/${REVISION}/`), { ...options, cache: 'no-store' });
  }
  return originalFetch(input, options);
};
function validate(audio) {
  if (audio.sampling_rate !== 24000 || !(audio.audio instanceof Float32Array) || !audio.audio.length || audio.audio.some(value => !Number.isFinite(value))) throw new Error('Kokoro returned invalid audio.');
  return audio.audio;
}
async function handle(message) {
  const { type, id } = message;
  try {
    if (type === 'load') {
      if (message.config?.cacheOnly) throw new Error('Imported-model mode does not include Kokoro. Select Alba.');
      const { KokoroTTS } = await import('https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js');
      tts = await KokoroTTS.from_pretrained(MODEL, { device: 'webgpu', dtype: 'fp32', progress_callback: report => {
        post('status', { text: report.status === 'progress' ? `Loading GPU voice · ${Math.round(report.progress)}%` : 'Preparing local GPU voice…', progress: report.total > 0 ? { loaded: report.loaded, total: report.total } : undefined });
      } });
      post('loaded', { sampleRate: 24000 });
    } else if (type === 'load_voice') {
      if (!tts) throw new Error('Load Kokoro before selecting a voice.');
      voice = message.name.replace('kokoro:', '');
      if (!tts.voices[voice]) throw new Error('Unknown Kokoro voice.');
      post('status', { text: 'Warming your GPU voice for faster replies…' });
      validate(await tts.generate('Hello.', { voice })); // Compile kernels without playing a greeting.
      post('voice_loaded', { name: message.name });
    } else if (type === 'generate') {
      if (!tts || !voice) throw new Error('The GPU voice is not ready.');
      if (cancelled.has(id)) { post('cancelled', { id }); return; }
      post('gen_start', { id });
      const audio = await tts.generate(message.text, { voice });
      // ONNX inference is not synchronously interruptible. Acknowledge only
      // when it settles, and never hand stale PCM to the playback worklet.
      if (cancelled.has(id)) { post('cancelled', { id }); return; }
      const samples = validate(audio);
      post('chunk', { id, data: samples }, [samples.buffer]);
      post('done', { id });
    }
  } catch (error) { post(cancelled.has(id) ? 'cancelled' : 'error', { id, message: error.message }); }
  finally { cancelled.delete(id); }
}
self.onmessage = ({ data }) => {
  if (data.type === 'cancel') { cancelled.add(data.id); return; }
  operations = operations.then(() => handle(data));
  return operations;
};
