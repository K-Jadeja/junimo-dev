import { cosine, memoryChunks, validVectors } from './semantic-core.mjs';

// One small CPU worker; no chat text or vectors ever leave this browser.
const MODEL = 'Xenova/all-MiniLM-L6-v2';
const REVISION = '751bff37182d3f1213fa05d7196b954e230abad9';
let extractor, database, scope, records;
const cancelled = new Set();
let serial = Promise.resolve();
const report = text => self.postMessage({ type: 'status', text });

async function openDatabase(name) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(`sushi-memory-vectors-${name}`, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('vectors', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function readRecords() {
  return new Promise((resolve, reject) => {
    const request = database.transaction('vectors').objectStore('vectors').getAll();
    request.onsuccess = () => resolve(new Map(request.result.map(record => [record.id, record])));
    request.onerror = () => reject(request.error);
  });
}
async function persist(changes, removed = []) {
  await new Promise((resolve, reject) => {
    const transaction = database.transaction('vectors', 'readwrite'); const store = transaction.objectStore('vectors');
    for (const record of changes) store.put(record);
    for (const id of removed) store.delete(id);
    transaction.oncomplete = resolve; transaction.onerror = () => reject(transaction.error); transaction.onabort = () => reject(transaction.error || new Error('Memory index could not be saved.'));
  });
}
async function load(name, model = true) {
  if (scope && scope !== name) throw new Error('Memory scope changed inside a running worker.');
  if (!database) { scope = name; database = await openDatabase(name); records = await readRecords(); }
  if (!model || extractor) return;
  report('Preparing meaning-based memory search (~23 MB model on first use)…');
  const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2/dist/transformers.min.js');
  env.allowLocalModels = false;
  env.backends.onnx.wasm.numThreads = 1;
  // Cache API owns the weights. Avoid also storing them in the HTTP cache.
  const fetchOriginal = self.fetch.bind(self);
  self.fetch = (url, options = {}) => fetchOriginal(url, String(url).startsWith('https://huggingface.co/') ? { ...options, cache: 'no-store' } : options);
  extractor = await pipeline('feature-extraction', MODEL, { revision: REVISION, dtype: 'q8', device: 'wasm' });
}
function check(id) { if (cancelled.has(id)) throw new DOMException('Stopped', 'AbortError'); }
async function digest(text) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(REVISION + ':sentences-v2:' + text))), byte => byte.toString(16).padStart(2, '0')).join('');
}
async function embed(text) {
  const result = await extractor(text, { pooling: 'mean', normalize: true });
  const vector = Array.from(result.data);
  if (vector.length !== 384 || vector.some(value => !Number.isFinite(value))) throw new Error('Memory search returned an invalid vector.');
  return vector;
}
async function synchronize(documents, id) {
  const allowed = new Set(documents.map(document => document.id));
  const removed = [...records.keys()].filter(key => !allowed.has(key));
  if (removed.length) { await persist([], removed); for (const key of removed) records.delete(key); }
  let indexed = 0;
  for (const document of documents) {
    check(id);
    const hash = await digest(document.text);
    const saved = records.get(document.id);
    if (saved?.hash === hash && validVectors(saved.vectors)) continue;
    const vectors = [];
    for (const chunk of memoryChunks(document.text)) { check(id); vectors.push(await embed(chunk)); }
    const record = { id: document.id, hash, vectors };
    await persist([record]); records.set(record.id, record);
    if (++indexed % 10 === 0) report(`Organizing saved memories · ${indexed} updated`);
  }
}
async function run(message) {
  const { id, type } = message;
  try {
    await load(message.scope, type !== 'forget'); check(id);
    if (type === 'forget') { const keys = [...records.keys()]; await persist([], keys); records.clear(); self.postMessage({ id, result: true }); return; }
    await synchronize(message.documents, id); check(id);
    if (type === 'prepare') { self.postMessage({ id, result: records.size }); return; }
    const query = await embed(message.query); check(id);
    const scores = message.documents.map(document => [document.id, Math.max(...records.get(document.id).vectors.map(vector => cosine(query, vector)))]);
    self.postMessage({ id, result: scores });
  } catch (error) { self.postMessage({ id, error: error.message }); }
  finally { cancelled.delete(id); }
}
self.onmessage = ({ data }) => {
  if (data.type === 'cancel') { cancelled.add(data.id); return; }
  serial = serial.then(() => run(data));
};
