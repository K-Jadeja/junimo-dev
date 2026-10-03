// Keep a File reference, never a second weight copy in browser storage.
export const GEMMA_FILE_BYTES = 2008432640;
const KEY = 'sushi.gemma.use-local-file';
let selected;

export function prefersLocalGemma() {
  try { return localStorage.getItem(KEY) === '1'; } catch { return !!selected; }
}
export function connectLocalGemma(file) {
  if (!file || !/^gemma-4-E2B-it-web(?: \(\d+\))?\.litertlm$/i.test(file.name) || file.size !== GEMMA_FILE_BYTES) {
    throw new Error('Choose the complete Gemma 4 E2B web model (gemma-4-E2B-it-web.litertlm, 2.01 GB). Other model variants are not compatible.');
  }
  // Store only the preference. Serializing the File into IndexedDB would copy
  // the weights and reintroduce the storage problem this option addresses.
  localStorage.setItem(KEY, '1');
  selected = file;
}
export function useBrowserGemma() {
  localStorage.removeItem(KEY);
  selected = undefined;
}
export function localGemmaStatus() {
  return selected ? { state: 'local-ready', size: selected.size } : prefersLocalGemma() ? { state: 'local-needed', size: 0 } : null;
}
export function getLocalGemma() {
  if (selected) return selected;
  if (prefersLocalGemma()) throw new Error('Choose your saved Gemma file again. It stays on disk; no model download has started.');
  return null;
}
