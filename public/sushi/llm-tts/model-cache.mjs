// Model-only backup. No network reads, account data, chats or audio recordings.
export const IMPORT_PREFERENCE = 'sushi.avatar.importedCompact';
export const MODEL_URL = 'https://huggingface.co/bartowski/SmolLM2-360M-Instruct-GGUF/resolve/main/SmolLM2-360M-Instruct-Q4_K_M.gguf';
const TTS = 'https://huggingface.co/idle-intelligence/pocket-tts-gguf/resolve/main/';
const VOICE = 'https://huggingface.co/kyutai/pocket-tts-without-voice-cloning/resolve/main/';
export const CACHE_FILES = [
  { cache: 'tts-model-v3', url: TTS + 'pocket-tts-q8_0.gguf', label: 'Pocket TTS' },
  { cache: 'tts-model-v3', url: TTS + 'tokenizer.model', label: 'Voice tokenizer' },
  ...['alba', 'azelma', 'cosette', 'eponine', 'fantine', 'javert', 'jean', 'marius'].map(name => ({ cache: 'tts-model-v3', url: VOICE + `embeddings_v2/${name}.safetensors`, label: `Voice: ${name}` })),
  { cache: 'whisper-model-v1', url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny-q5_1.bin', label: 'Whisper Tiny' },
];
export function importedModelsOnly() {
  try { return localStorage.getItem(IMPORT_PREFERENCE) === 'true'; } catch { return false; }
}
const MAGIC = new TextEncoder().encode('SUSHICACHE1\n');
const CHUNK = 8 * 1024 * 1024;
const hex = buffer => Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('');
export async function modelName() { return `${hex(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(MODEL_URL)))}_${MODEL_URL.split('/').pop()}`; }
export async function hashes(blob) {
  const result = [];
  for (let offset = 0; offset < blob.size; offset += CHUNK) result.push(hex(await crypto.subtle.digest('SHA-256', await blob.slice(offset, offset + CHUNK).arrayBuffer())));
  return result;
}
async function maybeFile(directory, name) {
  try { return await (await directory.getFileHandle(name)).getFile(); }
  catch (error) { if (error.name === 'NotFoundError') return null; throw error; }
}
export async function cachedLanguageModel() {
  try {
    const directory = await (await navigator.storage.getDirectory()).getDirectoryHandle('cache');
    const name = await modelName();
    const blob = await maybeFile(directory, name);
    const meta = await maybeFile(directory, '__metadata__' + name);
    if (!blob || !meta) return null;
    const metadata = JSON.parse(await meta.text());
    if (blob.size !== metadata.originalSize || metadata.originalURL !== MODEL_URL) throw new Error('The cached language model is incomplete. Restore a complete model backup.');
    return blob;
  } catch (error) { if (error.name === 'NotFoundError') return null; throw error; }
}
export async function inventory() {
  const entries = [];
  const blob = await cachedLanguageModel();
  if (blob) {
    const directory = await (await navigator.storage.getDirectory()).getDirectoryHandle('cache');
    const name = await modelName();
    entries.push({ kind: 'opfs', name, label: 'SmolLM2 360M (CPU)', blob });
    entries.push({ kind: 'opfs', name: '__metadata__' + name, label: 'Language model metadata', blob: await maybeFile(directory, '__metadata__' + name) });
  }
  const names = await caches.keys();
  for (const item of CACHE_FILES) {
    if (!names.includes(item.cache)) continue;
    const response = await (await caches.open(item.cache)).match(item.url);
    if (response) entries.push({ kind: 'cache', ...item, blob: await response.blob() });
  }
  return entries;
}
export async function pack(entries, progress = () => {}) {
  if (!entries.length) throw new Error('No supported models are cached on this site.');
  const manifest = [];
  for (const { blob, ...entry } of entries) {
    progress(`Checking ${entry.label}…`);
    manifest.push({ ...entry, size: blob.size, hashes: await hashes(blob) });
  }
  const json = new TextEncoder().encode(JSON.stringify({ version: 1, entries: manifest }));
  const length = new Uint8Array(4); new DataView(length.buffer).setUint32(0, json.length, true);
  return new Blob([MAGIC, length, json, ...entries.map(entry => entry.blob)], { type: 'application/octet-stream' });
}
export async function unpack(file, progress = () => {}) {
  const prefix = new Uint8Array(await file.slice(0, MAGIC.length + 4).arrayBuffer());
  if (prefix.length !== MAGIC.length + 4 || !MAGIC.every((byte, i) => byte === prefix[i])) throw new Error('Choose a Sushi model backup (.sushicache).');
  const length = new DataView(prefix.buffer).getUint32(MAGIC.length, true);
  if (length > 128 * 1024 || length < 1) throw new Error('Invalid backup manifest.');
  let offset = MAGIC.length + 4 + length;
  const manifest = JSON.parse(await file.slice(MAGIC.length + 4, offset).text());
  if (manifest.version !== 1 || !Array.isArray(manifest.entries) || !manifest.entries.length || manifest.entries.length > 20) throw new Error('Unsupported backup format.');
  const name = await modelName();
  const seen = new Set();
  const entries = [];
  for (const entry of manifest.entries) {
    const allowed = entry.kind === 'opfs' ? [name, '__metadata__' + name].includes(entry.name) : entry.kind === 'cache' && CACHE_FILES.some(item => item.cache === entry.cache && item.url === entry.url);
    const key = entry.kind === 'opfs' ? entry.name : entry.cache + entry.url;
    if (!allowed || seen.has(key) || !Number.isSafeInteger(entry.size) || entry.size < 1 || entry.size > 1024 ** 3 || offset + entry.size > file.size) throw new Error('Invalid or unsupported model entry.');
    seen.add(key);
    const blob = file.slice(offset, offset + entry.size); offset += entry.size;
    progress(`Verifying ${entry.label}…`);
    if (JSON.stringify(await hashes(blob)) !== JSON.stringify(entry.hashes)) throw new Error(`Backup checksum failed: ${entry.label}. No models have been imported.`);
    entries.push({ ...entry, blob });
  }
  if (offset !== file.size) throw new Error('Backup length does not match its manifest.');
  const model = entries.find(entry => entry.name === name);
  const metadata = entries.find(entry => entry.name === '__metadata__' + name);
  if (!!model !== !!metadata) throw new Error('Language model or its metadata is missing.');
  if (model) {
    const meta = JSON.parse(await metadata.blob.text());
    if (meta.originalSize !== model.size || meta.originalURL !== MODEL_URL) throw new Error('Language model metadata does not match the backup.');
  }
  return entries;
}
export async function restore(entries, progress = () => {}) {
  // Inspect every existing destination first; preserve conflicting files.
  const directory = entries.some(entry => entry.kind === 'opfs') ? await (await navigator.storage.getDirectory()).getDirectoryHandle('cache', { create: true }) : null;
  const pending = [];
  for (const entry of entries) {
    const cache = entry.kind === 'cache' ? await caches.open(entry.cache) : null;
    const existing = cache ? await (await cache.match(entry.url))?.blob() : await maybeFile(directory, entry.name);
    if (existing) {
      if (existing.size !== entry.size || JSON.stringify(await hashes(existing)) !== JSON.stringify(entry.hashes)) throw new Error(`A different cached file already exists for ${entry.label}. It has been preserved.`);
    } else pending.push({ entry, cache });
  }
  // Metadata commits last so an interrupted model write cannot appear complete.
  pending.sort((a, b) => Number(a.entry.name?.startsWith('__metadata__') || false) - Number(b.entry.name?.startsWith('__metadata__') || false));
  for (const { entry, cache } of pending) {
    progress(`Saving ${entry.label}…`);
    if (cache) await cache.put(entry.url, new Response(entry.blob, { headers: { 'Content-Type': 'application/octet-stream', 'Content-Length': String(entry.size) } }));
    else {
      const writer = await (await directory.getFileHandle(entry.name, { create: true })).createWritable();
      try { await writer.write(entry.blob); await writer.close(); }
      catch (error) { await writer.abort().catch(() => {}); throw error; }
    }
    const saved = cache ? await (await cache.match(entry.url)).blob() : await maybeFile(directory, entry.name);
    if (!saved || saved.size !== entry.size || JSON.stringify(await hashes(saved)) !== JSON.stringify(entry.hashes)) throw new Error(`Saved model verification failed: ${entry.label}. Import is incomplete.`);
  }
  return pending.length;
}
