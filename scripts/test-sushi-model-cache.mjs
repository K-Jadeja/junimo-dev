import assert from 'node:assert/strict';
import { test } from 'node:test';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { pack, unpack, restore, hashes, modelName, MODEL_URL, CACHE_FILES, preferredRuntime } from '../public/sushi/llm-tts/model-cache.mjs';

const cacheEntry = bytes => ({ kind: 'cache', ...CACHE_FILES[0], blob: new Blob([bytes]) });
test('an explicit compact choice survives a normal URL visit without selecting a new GPU download', () => {
  const data = new Map();
  const storage = { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) };
  assert.equal(preferredRuntime('?mode=mobile', storage), 'mobile');
  assert.equal(preferredRuntime('', storage), 'mobile');
  assert.equal(preferredRuntime('?mode=invalid', storage), 'mobile');
  assert.equal(preferredRuntime('?mode=full', storage), 'full');
  assert.equal(preferredRuntime('?mode=mobile', undefined), 'mobile');
});
test('model backup round trip retains bytes, cache identity and chunk hashes', async () => {
  const original = cacheEntry(new Uint8Array(8 * 1024 * 1024 + 5).fill(17));
  const [entry] = await unpack(await pack([original]));
  assert.equal(entry.url, original.url);
  assert.equal(entry.hashes.length, 2);
  assert.deepEqual(await entry.blob.arrayBuffer(), await original.blob.arrayBuffer());
});
test('corrupt, truncated and trailing data fail verification before restoration', async () => {
  const file = await pack([cacheEntry('known bytes')]);
  await assert.rejects(unpack(new Blob([file.slice(0, -1), 'X'])), /checksum/);
  await assert.rejects(unpack(file.slice(0, -1)), /entry/);
  await assert.rejects(unpack(new Blob([file, 'X'])), /length/);
});
test('unknown destinations, duplicate entries and incomplete metadata are rejected', async () => {
  await assert.rejects(unpack(await pack([{ ...cacheEntry('x'), url: 'https://other.example/' }])), /entry/);
  await assert.rejects(unpack(await pack([cacheEntry('x'), cacheEntry('x')])), /entry/);
  await assert.rejects(unpack(await pack([{ kind: 'opfs', name: await modelName(), label: 'Model', blob: new Blob(['x']) }])), /metadata/);
});
test('Wllama backup retains exact URL-derived filenames and validates original size', async () => {
  const name = await modelName();
  const entries = [{ kind: 'opfs', name, label: 'Model', blob: new Blob(['gguf']) }, { kind: 'opfs', name: '__metadata__' + name, label: 'Metadata', blob: new Blob([JSON.stringify({ originalURL: MODEL_URL, originalSize: 4, etag: 'example' })]) }];
  assert.equal((await unpack(await pack(entries))).length, 2);
  entries[1].blob = new Blob([JSON.stringify({ originalURL: MODEL_URL, originalSize: 5 })]);
  await assert.rejects(unpack(await pack(entries)), /does not match/);
});
test('restoration is verified, idempotent and preserves conflicting existing models', async () => {
  const storage = new Map(); let writes = 0;
  const original = globalThis.caches;
  globalThis.caches = { open: async () => ({ match: async url => storage.get(url)?.clone(), put: async (url, response) => { writes++; storage.set(url, response); } }) };
  try {
    const entries = await unpack(await pack([cacheEntry('model')]));
    assert.equal(await restore(entries), 1);
    assert.equal(await restore(entries), 0);
    assert.equal(writes, 1);
    storage.set(entries[0].url, new Response('other'));
    await assert.rejects(restore(entries), /preserved/);
    assert.equal(await storage.get(entries[0].url).text(), 'other');
  } finally { globalThis.caches = original; }
});
test('disk write failure is fatal and never reports successful import', async () => {
  const original = globalThis.caches;
  globalThis.caches = { open: async () => ({ match: async () => undefined, put: async () => { throw new Error('Quota exceeded'); } }) };
  try { await assert.rejects(restore(await unpack(await pack([cacheEntry('model')]))), /Quota/); }
  finally { globalThis.caches = original; }
});
test('speech and hearing cache-only misses never call fetch', async () => {
  for (const [path, call] of [
    ['../public/sushi/tts/worker.js', "cacheOnly = true; cachedFetch('https://model.example/', 'Downloading model')"],
    ['../public/sushi/stt/stt-mobile/worker.js', "fetchModel('https://model.example/', true)"],
  ]) {
    const code = await readFile(new URL(path, import.meta.url), 'utf8');
    let fetches = 0;
    const context = vm.createContext({ URL, self: { location: { href: 'https://sushi.junimo.dev/stt/worker.js' } }, caches: { open: async () => ({ match: async () => undefined }) }, fetch: () => { fetches++; throw new Error('Unexpected network request'); } });
    vm.runInContext(code.replaceAll('import.meta.url', "'https://sushi.junimo.dev/tts/worker.js'"), context);
    await assert.rejects(vm.runInContext(call, context), /downloads are disabled/);
    assert.equal(fetches, 0);
  }
});
test('SHA-256 detects same-length model corruption', async () => {
  assert.notDeepEqual(await hashes(new Blob(['aaaa'])), await hashes(new Blob(['aaab'])));
});
