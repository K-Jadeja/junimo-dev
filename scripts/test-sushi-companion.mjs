import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createChatStore } from '../public/sushi/llm/chat-history.js';
import { recentContext, retrieveMemories, canInitiate, companionPrompt, recallSources } from '../public/sushi/llm-tts/companion-memory.mjs';
import { CompanionGemma } from '../public/sushi/llm-tts/gemma-provider.mjs';
import { loadGemmaFile, inspectGemmaCache } from '../public/sushi/llm-tts/gemma-model.mjs';
import { cosine, memoryChunks, validVectors } from '../public/sushi/llm-tts/semantic-core.mjs';
import { memoryDocuments, SemanticMemory } from '../public/sushi/llm-tts/semantic-memory.js';

test('semantic paraphrase retrieves original user evidence and its pronoun correction together', () => {
  const sessions = [{ id: 'past', createdAt: 1, messages: [...pair('I adopted a rescue greyhound called Orbit.', 1), ...pair('Small correction: his name is Comet, not Orbit.', 2), ...pair('I baked banana bread.', 3)] }];
  const query = 'Any thoughts on helping my four-legged roommate settle in?';
  const scores = [['past:0', .52], ['past:1', .12], ['past:2', .18], ['deleted:0', .99]];
  const result = retrieveMemories({ sessions, query, semanticScores: scores });
  assert.equal(result.length, 2);
  assert.match(result[0].excerpt, /greyhound/); assert.match(result[1].excerpt, /Comet/);
  const short = retrieveMemories({ sessions, query, semanticScores: scores, budget: result[0].excerpt.length + 1 });
  assert.equal(short.length, 0, 'do not supply an obsolete name when its correction does not fit');
  assert.deepEqual(memoryDocuments(sessions).map(item => item.id), ['past:0', 'past:1', 'past:2']);
  assert.ok(memoryDocuments(sessions).every(item => !item.text.includes('Understood')));
  assert.deepEqual(retrieveMemories({ sessions: [], query, semanticScores: scores }), []);
});
test('an assistant suggestion alone does not become a recalled user fact', () => {
  const sessions = [{ id: 'x', messages: [{ role: 'user', content: 'Hello' }, { role: 'assistant', content: 'Maybe you live in Kyoto and own a greyhound.' }] }];
  assert.deepEqual(retrieveMemories({ sessions, query: 'Which city do I live in?' }), []);
});
test('semantic vectors reject corruption and overlapping chunks preserve late details', () => {
  assert.equal(cosine([2, 0], [1, 0]), 1); assert.equal(cosine([1, 0], [0, 2]), 0);
  assert.throws(() => cosine([1], [1, 2]), /dimensions/); assert.throws(() => cosine([NaN], [1]), /invalid/);
  assert.equal(validVectors([Array(384).fill(.2)]), true); assert.equal(validVectors([[1, 2]]), false);
  assert.equal(validVectors([Array(384).fill(NaN)]), false);
  const text = 'x'.repeat(600) + 'My dog is Comet.' + 'y'.repeat(1200);
  const chunks = memoryChunks(text);
  assert.ok(chunks.some(chunk => chunk.includes('My dog is Comet.')));
  assert.ok(chunks.some(chunk => chunk.endsWith(text.slice(-40))));
  const mixed = memoryChunks('I adopted a rescue greyhound called Orbit. I live in Pune and I like being called Niko.');
  assert.ok(mixed.includes('I adopted a rescue greyhound called Orbit.'));
  assert.throws(() => memoryChunks(text, 80), /overlap/);
});
test('repeated questions cannot crowd out the actual memory evidence', () => {
  const query = 'Any thoughts on helping my four-legged roommate settle in?';
  const sessions = [{ id: 'x', messages: [...pair(query), ...pair('My greyhound is called Comet.')] }];
  const result = retrieveMemories({ sessions, query, semanticScores: [['x:0', 1], ['x:1', .199]] });
  assert.equal(result.length, 1); assert.match(result[0].user, /Comet/);
  assert.deepEqual(retrieveMemories({ sessions, query: 'quantum physics', semanticScores: [['x:0', .1], ['x:1', .12]] }), []);
});
test('memory search cancellation and worker failure reject pending work cleanly', async () => {
  const previous = globalThis.Worker; let worker;
  globalThis.Worker = class { constructor() { worker = { messages: [], postMessage(message) { this.messages.push(message); }, terminate() { this.terminated = true; } }; return worker; } };
  try {
    const memory = new SemanticMemory('evaluation'); const abort = new AbortController();
    const request = memory.rank([], 'question', abort.signal); abort.abort();
    await assert.rejects(request, /Stopped/); assert.equal(memory.pending.size, 0);
    assert.equal(worker.messages.at(-1).type, 'cancel');
    const next = memory.prepare([]); worker.onerror({ message: 'WASM failed' });
    await assert.rejects(next, /WASM failed/); assert.equal(memory.worker, null); assert.equal(worker.terminated, true);
    const retry = memory.prepare([]); worker.onmessage({ data: { id: worker.messages[0].id, result: 3 } });
    assert.equal(await retry, 3); assert.equal(memory.pending.size, 0); memory.destroy();
  } finally { globalThis.Worker = previous; }
});

function storage() {
  const data = new Map(); let fail = false;
  const result = { getItem: key => data.get(key) || null, setItem(key, value) { if (fail) throw new Error('quota'); data.set(key, value); }, removeItem: key => data.delete(key), fail: () => { fail = true; } };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: result });
  return result;
}
const pair = (content, at = 1) => [{ role: 'user', content, at }, { role: 'assistant', content: 'Understood.', at }];
test('600-turn chat survives save/reload and other demos cannot evict protected sessions', () => {
  storage();
  const store = createChatStore('llm-tts', { retainAll: true });
  const messages = Array.from({ length: 600 }, (_, i) => pair(`Message ${i}`, i + 1)).flat();
  store.save(messages);
  assert.deepEqual(createChatStore('llm-tts', { retainAll: true }).loadActive().messages, messages);
  const other = createChatStore('llm');
  for (let i = 0; i < 30; i++) { other.startNew(); other.save(pair(`other ${i}`)); }
  assert.equal(store.loadActive().messages.length, 1200);
});
test('quota failure preserves the previous transcript and reports an unsaved turn', () => {
  const disk = storage(); const store = createChatStore('llm-tts', { retainAll: true });
  store.save(pair('Keep this')); disk.fail();
  assert.equal(store.save([...pair('Keep this'), ...pair('New')]), null);
  assert.match(store.storageError, /could not be saved/);
  assert.equal(store.loadActive().messages.length, 2);
});
test('recall finds an old fact across 600 turns; corrections retain source dates and order', () => {
  const session = { id: 'one', createdAt: 1, messages: [...pair('My dog is called Mango.', 1), ...Array.from({ length: 600 }, (_, i) => pair(`We discussed number ${i}`, i + 10)).flat(), ...pair('Correction: my dog is called Pepper now.', 800)] };
  const memories = retrieveMemories({ sessions: [session], query: 'What is my dog called?', now: 1000, budget: 1000 });
  assert.equal(memories.length, 2);
  assert.match(memories[0].excerpt, /Mango/); assert.match(memories[1].excerpt, /Pepper/);
  assert.match(memories[1].excerpt, /1970-01-01/);
  assert.match(companionPrompt(), /recent corrections/);
});
test('deleted sessions no longer retrieve; absent facts do not create memories', () => {
  storage(); const store = createChatStore('llm-tts', { retainAll: true });
  const session = store.save(pair('The project codename is Firefly.'));
  assert.equal(retrieveMemories({ sessions: store.list(), query: 'project codename' }).length, 1);
  store.remove(session.id);
  assert.deepEqual(retrieveMemories({ sessions: store.list(), query: 'project codename' }), []);
  assert.deepEqual(retrieveMemories({ sessions: [{ id: 'x', messages: pair('Blue skies.') }], query: 'What is my birthday?' }), []);
  assert.deepEqual(retrieveMemories({ sessions: [{ id: 'x', createdAt: Date.now(), messages: pair('I work on a browser avatar.', Date.now()) }], query: 'What is my birthday?' }), []);
  assert.deepEqual(retrieveMemories({ sessions: [{ id: 'x', createdAt: Date.now(), messages: pair('What is two plus two? Answer briefly.') }], query: 'What browser project am I building? Answer briefly from what I told you.' }), []);
});
test('recent context includes initiative without fabricating a user turn', () => {
  const messages = [...pair('Hello'), { role: 'assistant', content: 'A small thought.', initiative: true }];
  assert.deepEqual(recentContext(messages), [{ role: 'user', content: 'Hello' }, { role: 'assistant', content: 'Understood.\n\nA small thought.' }]);
  assert.deepEqual(recentContext(messages, 2), []);
});
test('initiative never interrupts, follows another initiative, or fires while away/typing', () => {
  const state = { enabled: true, capable: true, hidden: false, busy: false, draft: '', elapsed: 46000, lastMessage: { role: 'assistant', content: 'That sounds exciting.' } };
  assert.equal(canInitiate(state), true);
  for (const change of [{ enabled: false }, { capable: false }, { hidden: true }, { busy: true }, { draft: 'typing' }, { elapsed: 44000 }, { lastMessage: { ...state.lastMessage, initiative: true } }, { lastMessage: { role: 'assistant', content: 'How did it go?' } }]) assert.equal(canInitiate({ ...state, ...change }), false);
});
test('proactive turns cannot pull a different topic from saved chats', () => {
  const sessions = [{ id: 'old', messages: pair('I am taking a break on the balcony.') }, { id: 'current', messages: pair('My new game is a bakery run by a moth.') }];
  assert.deepEqual(recallSources(sessions, { initiative: true, activeId: 'current', crossChat: true }), []);
  assert.equal(recallSources(sessions, { activeId: 'current', crossChat: false })[0].id, 'current');
  assert.equal(recallSources(sessions).length, 2);
});
function fakeGemma() {
  const configs = []; const chats = [];
  const engine = { async createConversation(config) {
    configs.push(config);
    const chat = { deleted: false, cancelled: false, inputs: [], async *sendMessageStreaming(text) { this.inputs.push(text); yield { channels: { thought: 'private reasoning' } }; yield { content: [{ type: 'text', text: 'Hello.' }] }; }, cancel() { this.cancelled = true; }, async delete() { this.deleted = true; } };
    chats.push(chat); return chat;
  }, async delete() {} };
  const provider = new CompanionGemma({}, { library: { Engine: { create: async () => engine } }, loadFile: async () => new Blob(['fake']) });
  return { provider, configs, chats };
}
const prompt = [{ role: 'system', content: 'Speak naturally.' }, { role: 'user', content: 'Hi' }];
async function collect(stream) { let text = ''; for await (const chunk of stream) text += chunk; return text; }
test('Gemma keeps KV conversation on a matching next turn and never emits thought channels', async () => {
  const { provider, configs, chats } = fakeGemma();
  assert.equal(await collect(provider.generate(prompt, { memoryContext: 'Name: Ada' })), 'Hello.');
  await provider.reset();
  await collect(provider.generate([...prompt, { role: 'assistant', content: 'Hello.' }, { role: 'user', content: 'Continue' }]));
  assert.equal(configs.length, 1); assert.equal(chats[0].inputs.length, 2);
  assert.equal(configs[0].preface.extra_context.enable_thinking, false);
  provider.invalidate();
  await collect(provider.generate(prompt)); assert.equal(configs.length, 2); assert.equal(chats[0].deleted, true);
});
test('abort discards partially generated KV state; next turn recreates safely', async () => {
  const { provider, chats, configs } = fakeGemma(); const controller = new AbortController();
  const stream = provider.generate(prompt, { signal: controller.signal });
  assert.equal((await stream.next()).value, 'Hello.'); controller.abort();
  await assert.rejects(stream.next(), /cancel/i);
  assert.equal(chats[0].deleted, true); assert.equal(chats[0].cancelled, true);
  await collect(provider.generate(prompt)); assert.equal(configs.length, 2);
});
test('large or non-Latin context rotates on whole rounds without modifying stored messages', async () => {
  const { provider, configs } = fakeGemma();
  const messages = [prompt[0], ...pair('中'.repeat(4000)), ...pair('Recent fact'), prompt[1]];
  const snapshot = JSON.stringify(messages);
  await collect(provider.generate(messages));
  assert.equal(JSON.stringify(messages), snapshot);
  assert.equal(configs[0].preface.messages.length, 3);
  assert.match(configs[0].preface.messages[1].content, /Recent fact/);
});
test('profile questions recall original personal statements across sessions', () => {
  const result = retrieveMemories({ sessions: [{ id: 'old', createdAt: 1, messages: pair('I work on the Firefly project.', 1) }], query: 'What do you remember about me?' });
  assert.match(result[0].excerpt, /Firefly/);
});
test('legacy avatar sessions are protected before their first upgraded save', () => {
  const disk = storage();
  disk.setItem('sushi.chat.sessions.v1', JSON.stringify([{ id: 'legacy', scope: 'llm-tts', createdAt: 1, messages: pair('Keep my old chat') }]));
  const other = createChatStore('llm');
  for (let i = 0; i < 30; i++) { other.startNew(); other.save(pair(`Other ${i}`)); }
  assert.equal(createChatStore('llm-tts', { retainAll: true }).list().length, 1);
});
test('Gemma streams one model copy, reuses a completed file, and rejects truncated downloads', async () => {
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const originalFetch = globalThis.fetch;
  const files = new Map(); let requests = 0; let writes = 0; let truncated = false;
  const directory = { async getDirectoryHandle() { return directory; }, async getFileHandle(name, { create } = {}) {
    if (!files.has(name)) { if (!create) throw Object.assign(new Error('missing'), { name: 'NotFoundError' }); files.set(name, new Blob([])); }
    return { async getFile() { return files.get(name); }, async createWritable() {
      const parts = []; return { async write(part) { writes++; parts.push(part); }, async close() { files.set(name, new Blob(parts)); }, async abort() {} };
    } };
  } };
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { locks: { request: (_, callback) => callback() }, storage: { getDirectory: async () => directory, estimate: async () => ({ quota: 1e9, usage: 0 }) } } });
  globalThis.fetch = async (_, options) => { requests++; assert.equal(options.cache, 'no-store'); return new Response(new Uint8Array(truncated ? 1000 : 2 * 1024 ** 2), { headers: { 'Content-Length': String(2 * 1024 ** 2) } }); };
  try {
    assert.equal((await inspectGemmaCache()).state, 'missing'); assert.equal(requests, 0);
    assert.equal((await loadGemmaFile()).size, 2 * 1024 ** 2);
    assert.equal((await inspectGemmaCache()).state, 'ready');
    assert.equal((await loadGemmaFile()).size, 2 * 1024 ** 2);
    assert.equal(requests, 1); assert.equal(writes, 2); // Model + receipt, no second model cache.
    files.clear(); truncated = true;
    await assert.rejects(loadGemmaFile(), /interrupted/);
    assert.equal([...files.keys()].some(name => name.endsWith('.json')), false);
    truncated = false; await loadGemmaFile(); assert.equal(requests, 3);
    const receipt = [...files.keys()].find(name => name.endsWith('.json'));
    files.set(receipt, new Blob(['corrupt receipt']));
    assert.equal((await inspectGemmaCache()).state, 'incomplete');
    await loadGemmaFile(); assert.equal(requests, 4);
  } finally { Object.defineProperty(globalThis, 'navigator', originalNavigator); globalThis.fetch = originalFetch; }
});
