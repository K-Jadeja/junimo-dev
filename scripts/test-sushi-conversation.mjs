import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { test } from 'node:test';
import { createSentenceBuffer, conversationContext, mobilePrompt, VoiceActivity } from '../public/sushi/llm-tts/conversation-core.mjs';
import { SpeechOutput } from '../public/sushi/llm-tts/speech-output.js';
import { SmolProvider } from '../public/sushi/llm/model-provider.js';
import { createChatStore } from '../public/sushi/llm/chat-history.js';
import { LocalMicrophone } from '../public/sushi/llm-tts/microphone.js';
import { MobileProvider } from '../public/sushi/llm-tts/mobile-provider.js';

test('sentences stream before completion; final fragments are neither lost nor repeated', () => {
  const spoken = [];
  const buffer = createSentenceBuffer(text => spoken.push(text), 20);
  buffer.push('Hello.');
  assert.deepEqual(spoken, []);
  buffer.push(' How are you?\nA longer sentence that needs splitting');
  buffer.finish();
  assert.equal(spoken.join(' '), 'Hello. How are you? A longer sentence that needs splitting');
  assert.ok(spoken.every(sentence => sentence.length <= 21));
});

test('mobile prompt carries prior turns, bounded by complete pairs', () => {
  const history = [{ role: 'user', content: 'My name is Ada' }, { role: 'assistant', content: 'Hello Ada' }, { role: 'user', content: 'Where are we?' }, { role: 'assistant', content: 'At home.' }];
  assert.equal(conversationContext(history, 25).length, 2);
  const prompt = mobilePrompt([{ role: 'system', content: 'Be helpful' }, ...conversationContext(history), { role: 'user', content: 'What is my name?' }]);
  assert.match(prompt, /My name is Ada/);
  assert.match(prompt, /assistant\nHello Ada/);
  assert.ok(prompt.endsWith('<|im_start|>assistant\n'));
});

test('hands-free silence does not send hallucinated input; pauses and duration end turns', () => {
  const silent = new VoiceActivity();
  assert.equal(silent.push(0, 12000), 'empty');
  const speech = new VoiceActivity();
  assert.equal(speech.push(.05, 400), 'listen');
  assert.equal(speech.push(0, 1200), 'listen');
  assert.equal(speech.push(0, 100), 'send');
  assert.equal(new VoiceActivity().push(.1, 30000), 'send');
});

function fakeSpeech() {
  const output = new SpeechOutput();
  const worker = [];
  const audio = [];
  output.worker = { postMessage: data => worker.push(data), terminate() {} };
  output.node = { port: { postMessage: data => audio.push(data) }, disconnect() {} };
  output.ready = true;
  output.voice = 'alba';
  return { output, worker, audio };
}

test('Stop ignores late gen_start/chunks/done and waits for old generation before starting the new turn', () => {
  const { output, worker, audio } = fakeSpeech();
  output.enqueue('Old reply.');
  const oldId = output.active.id;
  output.stop();
  output.enqueue('New reply.');
  output.handle({ type: 'gen_start', id: oldId });
  output.handle({ type: 'chunk', id: oldId, data: new Float32Array([.4]) });
  assert.equal(audio.filter(event => event.type === 'chunk').length, 0);
  assert.equal(worker.filter(event => event.type === 'generate').length, 1);
  output.handle({ type: 'cancelled', id: oldId });
  assert.equal(worker.filter(event => event.type === 'generate').length, 2);
  const id = output.active.id;
  output.handle({ type: 'done', id: oldId });
  assert.equal(output.active.id, id);
  output.handle({ type: 'chunk', id, data: new Float32Array([.2]) });
  assert.equal(audio.at(-1).epoch, output.epoch);
  output.destroy();
});

test('speech lookahead is bounded to two sentences and voice changes cannot overlap synthesis', async () => {
  const { output, worker } = fakeSpeech();
  output.enqueue('One.'); output.enqueue('Two.'); output.enqueue('Three.');
  output.handle({ type: 'chunk', id: output.active.id, data: new Float32Array([.1]) });
  output.handle({ type: 'done', id: output.active.id });
  output.handle({ type: 'chunk', id: output.active.id, data: new Float32Array([.1]) });
  output.handle({ type: 'done', id: output.active.id });
  assert.equal(worker.filter(event => event.type === 'generate').length, 2);
  await assert.rejects(output.load('marius'), /Stop|Wait/);
  output.playing.delete(1);
  output.pump();
  assert.equal(worker.filter(event => event.type === 'generate').length, 3);
  output.destroy();
});

async function worklet(file, processorName) {
  let Processor;
  const events = [];
  const context = vm.createContext({ Float32Array, Math, sampleRate: 24000,
    AudioWorkletProcessor: class { constructor() { this.port = { postMessage: data => events.push(data) }; } },
    registerProcessor(name, value) { assert.equal(name, processorName); Processor = value; },
  });
  vm.runInContext(await readFile(new URL(`../public/sushi/llm-tts/${file}`, import.meta.url), 'utf8'), context);
  const instance = new Processor();
  return { instance, events, send: data => instance.port.onmessage({ data }) };
}

test('playback caption/mouth events follow audible samples; clear drops every old sentence', async () => {
  const { instance, events, send } = await worklet('conversation-audio-worklet.js', 'conversation-audio');
  send({ type: 'sentence', id: 1, epoch: 0, text: 'Hello' });
  send({ type: 'chunk', id: 1, epoch: 0, samples: new Float32Array(7200).fill(.2) });
  const out = new Float32Array(128);
  instance.process([], [[out]]);
  assert.ok(out.every(value => value > .19));
  assert.equal(events[0].type, 'started');
  assert.equal(events[0].text, 'Hello');
  send({ type: 'clear', epoch: 1 });
  send({ type: 'chunk', id: 1, epoch: 0, samples: new Float32Array(7200).fill(.5) });
  instance.process([], [[out]]);
  assert.ok(out.every(value => value === 0));
});

test('short finished sentence plays without waiting for prebuffer; end follows actual drain', async () => {
  const { instance, events, send } = await worklet('conversation-audio-worklet.js', 'conversation-audio');
  send({ type: 'sentence', id: 1, epoch: 0, text: 'Hi' });
  send({ type: 'chunk', id: 1, epoch: 0, samples: new Float32Array(20).fill(.1) });
  const out = new Float32Array(128);
  instance.process([], [[out]]);
  assert.equal(events.length, 0);
  send({ type: 'finish', id: 1, epoch: 0 });
  instance.process([], [[out]]);
  assert.equal(events[0].type, 'started');
  assert.equal(events[1].type, 'ended');
  assert.equal(out[21], 0);
});

test('microphone flush includes the final partial audio frame before acknowledging', async () => {
  const { instance, events, send } = await worklet('microphone-worklet.js', 'companion-microphone');
  instance.process([[new Float32Array(128).fill(.3)]]);
  assert.equal(events.length, 0);
  send({ type: 'flush' });
  assert.ok(events[0].samples.length > 0);
  assert.equal(events[1].type, 'flushed');
  assert.equal(instance.process([]), false);
});

test('Smol abort interrupts inference rather than resetting a running engine', async () => {
  const provider = new SmolProvider();
  let interrupts = 0;
  let resets = 0;
  provider.engine = { interruptGenerate() { interrupts++; }, resetChat() { resets++; }, chat: { completions: { async *create() {
    yield { choices: [{ delta: { content: 'Hello' } }] };
    yield { choices: [{ delta: { content: 'late' } }] };
  } } } };
  const controller = new AbortController();
  const iterator = provider.generate([], { signal: controller.signal });
  assert.equal((await iterator.next()).value, 'Hello');
  controller.abort();
  await assert.rejects(iterator.next(), /cancel/i);
  assert.equal(interrupts, 1);
  assert.equal(resets, 0);
});

test('TTS worker cooperatively cancels between WASM steps, tagging all output with its request', async () => {
  const events = [];
  let steps = 0;
  const context = vm.createContext({ console, URL, Float32Array, Uint32Array, setTimeout, self: { postMessage: data => events.push(data) } });
  const source = await readFile(new URL('../public/sushi/tts/worker.js', import.meta.url), 'utf8');
  vm.runInContext(source.replaceAll('import.meta.url', JSON.stringify('https://sushi.junimo.dev/tts/worker.js')) + `\nmodel = { prepare_text: text => [text, 1], start_generation() {}, generation_step() { return new Float32Array([.1]); } }; tokenizer = { encode: () => new Uint32Array([1]) };`, context);
  const original = context.self.postMessage;
  context.self.postMessage = data => { original(data); if (data.type === 'chunk' && ++steps === 2) void context.self.onmessage({ data: { type: 'cancel', id: 7 } }); };
  await context.self.onmessage({ data: { type: 'generate', id: 7, text: 'Hello', temperature: .7 } });
  assert.equal(steps, 2);
  assert.equal(events.at(-1).type, 'cancelled');
  assert.ok(events.every(event => event.id === 7));
});

test('quota failures never report a saved chat by successfully writing an empty history', () => {
  const previous = globalThis.localStorage;
  const saved = new Map();
  globalThis.localStorage = { getItem: key => saved.get(key) || null, setItem(key, value) {
    if (key === 'sushi.chat.sessions.v1' && value !== '[]') throw new Error('Quota exceeded');
    saved.set(key, value);
  }, removeItem: key => saved.delete(key) };
  try {
    const store = createChatStore('llm-tts');
    store.save([{ role: 'user', content: 'Hello' }, { role: 'assistant', content: 'Hi' }]);
    assert.match(store.storageError, /could not be saved/);
    assert.equal(saved.get('sushi.chat.sessions.v1'), undefined);
  } finally { if (previous === undefined) delete globalThis.localStorage; else globalThis.localStorage = previous; }
});

test('microphone releases the physical track when audio-worklet initialization fails', async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const oldContext = globalThis.AudioContext;
  let stopped = 0;
  let closed = 0;
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { mediaDevices: { getUserMedia: async () => ({ getTracks: () => [{ stop() { stopped++; } }] }) } } });
  globalThis.AudioContext = class {
    constructor() { this.audioWorklet = { addModule: async () => { throw new Error('worklet unavailable'); } }; }
    async resume() {}
    async close() { closed++; }
  };
  try {
    const mic = new LocalMicrophone();
    mic.ready = true;
    await assert.rejects(mic.start(), /worklet unavailable/);
    assert.equal(stopped, 1);
    assert.equal(closed, 1);
    assert.equal(mic.busy, false);
    assert.equal(mic.stream, null);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'navigator', descriptor); else delete globalThis.navigator;
    if (oldContext === undefined) delete globalThis.AudioContext; else globalThis.AudioContext = oldContext;
  }
});

test('late microphone permission after End conversation immediately releases the track', async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  let grant;
  let stopped = 0;
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { mediaDevices: { getUserMedia: () => new Promise(resolve => { grant = resolve; }) } } });
  try {
    const mic = new LocalMicrophone();
    const starting = mic.start();
    mic.cancel();
    grant({ getTracks: () => [{ stop() { stopped++; } }] });
    await starting;
    assert.equal(stopped, 1);
    assert.equal(mic.recording, false);
    assert.equal(mic.client, null);
  } finally { if (descriptor) Object.defineProperty(globalThis, 'navigator', descriptor); else delete globalThis.navigator; }
});

test('idle audio telemetry drops from 46 messages per two seconds to zero', async () => {
  const current = await worklet('conversation-audio-worklet.js', 'conversation-audio');
  const legacy = await worklet('../tts/audio-worklet.js', 'streaming-audio');
  for (let frame = 0; frame < 375; frame++) {
    current.instance.process([], [[new Float32Array(128)]]);
    legacy.instance.process([], [[new Float32Array(128)]]);
  }
  assert.equal(legacy.events.filter(event => event.type === 'level').length, 46);
  assert.equal(current.events.filter(event => event.type === 'level').length, 0);
});

test('mobile reuses validated prompt prefixes without discarding the cache after each reply', async () => {
  const provider = new MobileProvider();
  let resets = 0;
  const seen = [];
  provider.engine = { async kvClear() { resets++; }, async createCompletion(prompt, options) {
    seen.push({ prompt, useCache: options.useCache });
    options.onNewToken(1, 'Hi', 'Hi', { abortSignal() {} });
  } };
  const first = [{ role: 'system', content: 'Be helpful' }, { role: 'user', content: 'Hello' }];
  for await (const delta of provider.generate(first)) assert.equal(delta, 'Hi');
  await provider.reset();
  const second = [...first, { role: 'assistant', content: 'Hi' }, { role: 'user', content: 'Remember me?' }];
  for await (const delta of provider.generate(second)) assert.equal(delta, 'Hi');
  assert.equal(resets, 0);
  assert.ok(seen.every(call => call.useCache));
  assert.match(seen[1].prompt, /Remember me/);
});

test('empty speech output is a visible failure, never a successful playback', () => {
  const { output } = fakeSpeech();
  let reason;
  output.onError = error => { reason = error; };
  output.enqueue('Hello');
  output.handle({ type: 'done', id: output.active.id });
  assert.match(reason.message, /no audio/);
  assert.equal(output.ready, false);
  assert.equal(output.busy, false);
  output.destroy();
});

test('legacy speech requests remain FIFO while the worker yields for cancellation', async () => {
  const events = [];
  const context = vm.createContext({ console, URL, Float32Array, Uint32Array, setTimeout, self: { postMessage: data => events.push(data) } });
  const source = await readFile(new URL('../public/sushi/tts/worker.js', import.meta.url), 'utf8');
  vm.runInContext(source.replaceAll('import.meta.url', JSON.stringify('https://sushi.junimo.dev/tts/worker.js')) + `\nlet steps = 0; model = { prepare_text: text => [text, 1], start_generation() { steps = 0; }, generation_step() { return steps++ < 2 ? new Float32Array([.1]) : null; } }; tokenizer = { encode: () => new Uint32Array([1]) };`, context);
  const first = context.self.onmessage({ data: { type: 'generate', text: 'One' } });
  const second = context.self.onmessage({ data: { type: 'generate', text: 'Two' } });
  await Promise.all([first, second]);
  assert.deepEqual(events.map(event => event.type), ['gen_start', 'chunk', 'chunk', 'done', 'gen_start', 'chunk', 'chunk', 'done']);
});

test('End conversation terminates in-flight Whisper and releases busy state', async () => {
  const microphone = new LocalMicrophone();
  let rejectTranscription;
  let terminated = false;
  microphone.ready = true;
  microphone.chunks = [new Float32Array(4000).fill(.2)];
  microphone.client = {
    transcribe: () => new Promise((resolve, reject) => { rejectTranscription = reject; }),
    destroy() { terminated = true; rejectTranscription(new DOMException('Transcription session ended', 'AbortError')); },
  };
  const finishing = microphone.finish();
  assert.equal(microphone.busy, true);
  microphone.cancel();
  await assert.rejects(finishing, { name: 'AbortError' });
  assert.equal(terminated, true);
  assert.equal(microphone.busy, false);
  assert.equal(microphone.ready, false);
  assert.equal(microphone.client, null);
});
