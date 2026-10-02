import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createChatStore } from '../public/sushi/llm/chat-history.js';
import { recentContext, retrieveMemories, canInitiate, companionPrompt } from '../public/sushi/llm-tts/companion-memory.mjs';
import { CompanionGemma } from '../public/sushi/llm-tts/gemma-provider.mjs';

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
});
test('recent context includes initiative without fabricating a user turn', () => {
  const messages = [...pair('Hello'), { role: 'assistant', content: 'A small thought.', initiative: true }];
  assert.deepEqual(recentContext(messages), [{ role: 'user', content: 'Hello' }, { role: 'assistant', content: 'Understood.\n\nA small thought.' }]);
  assert.deepEqual(recentContext(messages, 2), []);
});
test('initiative never interrupts, follows another initiative, or fires while away/typing', () => {
  const state = { enabled: true, hidden: false, busy: false, draft: '', elapsed: 46000, lastMessage: { role: 'assistant', content: 'That sounds exciting.' } };
  assert.equal(canInitiate(state), true);
  for (const change of [{ enabled: false }, { hidden: true }, { busy: true }, { draft: 'typing' }, { elapsed: 44000 }, { lastMessage: { ...state.lastMessage, initiative: true } }, { lastMessage: { role: 'assistant', content: 'How did it go?' } }]) assert.equal(canInitiate({ ...state, ...change }), false);
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
