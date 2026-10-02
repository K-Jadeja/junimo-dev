import { inventory, pack, unpack, restore, IMPORT_PREFERENCE } from './model-cache.mjs';
const $ = id => document.getElementById(id);
let entries = [];
let downloadURL;
const mb = size => `${(size / 1024 / 1024).toFixed(1)} MB`;
const progress = message => { $('status').textContent = message; };
$('origin').textContent = location.origin;
async function refresh() {
  entries = await inventory();
  $('inventory').replaceChildren(...entries.map(entry => {
    const li = document.createElement('li'); li.textContent = `${entry.label} — ${mb(entry.blob.size)}`; return li;
  }));
  $('total').textContent = entries.length ? `${entries.length} files · ${mb(entries.reduce((sum, entry) => sum + entry.blob.size, 0))} cached on this site.` : 'No supported models saved on this site yet.';
  $('export').disabled = !entries.length;
}
async function run(action) {
  for (const id of ['export', 'import', 'refresh']) $(id).disabled = true;
  $('error').hidden = true;
  $('continue').hidden = true;
  try { await action(); }
  catch (error) { $('error').textContent = error.message; $('error').hidden = false; progress('Transfer not completed. Your source files have been preserved.'); }
  finally { $('import').disabled = $('refresh').disabled = false; $('export').disabled = !entries.length; }
}
$('refresh').addEventListener('click', () => run(async () => { await refresh(); progress('Saved model list updated.'); }));
$('export').addEventListener('click', () => run(async () => {
  const backup = await pack(entries, progress);
  if (downloadURL) URL.revokeObjectURL(downloadURL);
  downloadURL = URL.createObjectURL(backup);
  $('save-backup').href = downloadURL; $('save-backup').hidden = false;
  progress(`Backup prepared: ${mb(backup.size)}. Choose Save prepared backup, then import the saved file on the destination site.`);
}));
$('import').addEventListener('click', () => $('file').click());
$('file').addEventListener('change', () => {
  const file = $('file').files[0]; if (!file) return;
  void run(async () => {
    const verified = await unpack(file, progress);
    const count = await restore(verified, progress);
    await refresh();
    localStorage.setItem(IMPORT_PREFERENCE, 'true');
    const complete = entries.some(entry => entry.label === 'SmolLM2 360M (CPU)') && ['Pocket TTS', 'Voice tokenizer', 'Voice: alba', 'Whisper Tiny'].every(label => entries.some(entry => entry.label === label));
    if (complete) {
      $('continue').hidden = false;
      progress(`Ready: ${count} files copied locally and all ${entries.length} files verified. Compact CPU conversation, Alba voice and hearing are cached. No model download is needed.`);
    } else progress(`${count} files copied. New model downloads are disabled. The complete CPU conversation, Alba voice and hearing set is not available yet. Export the missing files from their original site.`);
  }).finally(() => { $('file').value = ''; });
});
void run(async () => { await refresh(); progress('Ready to save or import a model backup.'); });
window.addEventListener('pagehide', () => { if (downloadURL) URL.revokeObjectURL(downloadURL); });
