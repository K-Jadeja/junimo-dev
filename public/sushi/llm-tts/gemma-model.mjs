export const GEMMA_MODEL_URL = 'https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/b3ca0d2f076785a8f4b2219ddbd2bdb99954eae1/gemma-4-E2B-it-web.litertlm';
const MODEL_FILE = 'gemma-4-e2b-web-b3ca0d2f.litertlm';
async function validatedFile(directory) {
  const file = await optionalFile(directory, MODEL_FILE);
  const receipt = await optionalFile(directory, MODEL_FILE + '.json');
  let metadata;
  try { metadata = receipt && JSON.parse(await receipt.text()); } catch { /* Interrupted metadata is not a completed model. */ }
  return { file, valid: !!(file && metadata?.url === GEMMA_MODEL_URL && metadata.size === file.size && file.size > 1000000) };
}
export async function inspectGemmaCache() {
  try {
    const directory = await (await navigator.storage.getDirectory()).getDirectoryHandle('sushi-models');
    const { file, valid } = await validatedFile(directory);
    return { state: valid ? 'ready' : file ? 'incomplete' : 'missing', size: file?.size || 0 };
  } catch (error) { if (error.name === 'NotFoundError') return { state: 'missing', size: 0 }; throw error; }
}
async function optionalFile(directory, name) {
  try { return await (await directory.getFileHandle(name)).getFile(); }
  catch (error) { if (error.name === 'NotFoundError') return null; throw error; }
}
export async function loadGemmaFile(onProgress = () => {}) {
  return navigator.locks.request('sushi-gemma-model-download', () => readOrDownload(onProgress));
}
async function readOrDownload(onProgress) {
  const directory = await (await navigator.storage.getDirectory()).getDirectoryHandle('sushi-models', { create: true });
  const { file: existing, valid } = await validatedFile(directory);
  if (existing) {
    if (valid) {
      onProgress({ progress: 1, text: 'Loading saved Gemma — no model download' });
      return existing;
    }
    // Only this pinned, incomplete model artifact is replaceable; never chats.
    onProgress({ progress: 0, text: 'Repairing an incomplete Gemma download' });
  }
  const response = await fetch(GEMMA_MODEL_URL, { cache: 'no-store', signal: AbortSignal.timeout(30 * 60 * 1000) });
  if (!response.ok || !response.body) throw new Error(`Gemma download failed (${response.status}). Retry to download it again.`);
  const expected = Number(response.headers.get('Content-Length'));
  const estimate = await navigator.storage.estimate();
  if (expected && estimate.quota - estimate.usage < expected * 1.1) {
    await response.body.cancel();
    throw new Error('There is not enough browser storage for Gemma. Free some space or choose the compact model.');
  }
  const writer = await (await directory.getFileHandle(MODEL_FILE, { create: true })).createWritable();
  const reader = response.body.getReader();
  let loaded = 0;
  let reportAt = 0;
  let buffered = []; let bufferedSize = 0;
  const started = performance.now();
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      buffered.push(value); bufferedSize += value.byteLength; loaded += value.byteLength;
      // Small network chunks otherwise cause thousands of serialized disk IPCs.
      if (bufferedSize >= 4 * 1024 ** 2) { await writer.write(new Blob(buffered)); buffered = []; bufferedSize = 0; }
      if (performance.now() - reportAt > 150) {
        reportAt = performance.now();
        const seconds = (performance.now() - started) / 1000;
        const remaining = expected && seconds > 10 ? ` · about ${Math.max(1, Math.ceil((expected - loaded) / (loaded / seconds) / 60))} min left` : '';
        onProgress({ progress: expected ? loaded / expected : 0, loaded, total: expected, text: `Downloading Gemma · ${(loaded / 1024 ** 3).toFixed(2)} GB${remaining}` });
      }
    }
    if (loaded < 1000000 || (expected && loaded !== expected)) throw new Error('Gemma download was interrupted; the incomplete file will not be used.');
    if (bufferedSize) await writer.write(new Blob(buffered));
    await writer.close();
  } catch (error) {
    await reader.cancel().catch(() => {});
    await writer.abort().catch(() => {});
    if (error.name === 'QuotaExceededError') throw new Error('Browser storage ran out during the Gemma download. Free at least 3 GB on the drive holding your browser profile, then retry. Your existing chats and compact model are unchanged.');
    throw error;
  }
  finally { reader.releaseLock(); }
  const metadataWriter = await (await directory.getFileHandle(MODEL_FILE + '.json', { create: true })).createWritable();
  await metadataWriter.write(JSON.stringify({ url: GEMMA_MODEL_URL, size: loaded }));
  await metadataWriter.close();
  const file = await (await directory.getFileHandle(MODEL_FILE)).getFile();
  if (file.size !== loaded) throw new Error('Gemma did not save completely. Retry before starting a conversation.');
  return file;
}
