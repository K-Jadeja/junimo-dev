const KEY = 'sushi.companion.preferences.v1';
const defaults = { mode: 'everyday', memory: true, initiative: false, notes: '' };
export function mountCompanionSettings({ store, onChange, onError }) {
  let settings = { ...defaults };
  try { settings = { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { onError('Your companion preferences could not be read. Check Memory before continuing.'); }
  const dialog = document.createElement('dialog');
  dialog.className = 'chat-history-dialog memory-dialog';
  dialog.setAttribute('aria-labelledby', 'memory-title');
  dialog.innerHTML = `<div class="chat-history-dialog-header"><strong id="memory-title">Memory &amp; personality</strong><button type="button" data-close>Close</button></div>
    <p class="setting-note">Saved on this browser and this site. Relevant excerpts are recalled from your chats; recall can miss details. Delete a chat in History to remove it from future recall.</p>
    <label for="companion-mode">Conversation style</label><select id="companion-mode"><option value="everyday">Warm everyday companion</option><option value="character">Your custom character</option></select>
    <label class="check-setting"><input type="checkbox" id="remember-chats"> Recall other saved chats</label>
    <p class="setting-note">Turning this off limits recall to the current chat and your notes below.</p>
    <label class="check-setting"><input type="checkbox" id="take-initiative"> Occasional gentle follow-ups</label>
    <p class="setting-note">Requires Gemma 4. One follow-up after a pause, only while this tab is visible. Never while you type or speak. No notifications or background activity.</p>
    <label for="memory-notes">Things you want me to remember</label><textarea id="memory-notes" rows="5" maxlength="2000" placeholder="Your name, preferences, ongoing plans…"></textarea>
    <p class="setting-note">You control these notes. To forget a detail, remove it here and delete chats that contain it. Deleting one chat does not erase mentions in other chats.</p>
    <p data-memory-count></p><p data-memory-save role="status"></p>
    <div class="chat-history-actions"><button type="button" data-export>Export chats &amp; notes</button><button type="button" class="primary" data-save>Save preferences</button></div>`;
  document.body.append(dialog);
  const button = document.createElement('button');
  button.type = 'button'; button.textContent = 'Memory'; button.className = 'chat-history-control';
  document.getElementById('chat-controls').append(button);
  const field = id => dialog.querySelector(`#${id}`);
  button.addEventListener('click', () => {
    field('companion-mode').value = settings.mode;
    field('remember-chats').checked = settings.memory;
    field('take-initiative').checked = settings.initiative;
    field('memory-notes').value = settings.notes;
    const sessions = store.list();
    dialog.querySelector('[data-memory-count]').textContent = `${sessions.length} saved chats · ${sessions.reduce((n, session) => n + session.messages.length, 0)} messages. Full transcripts stay saved as conversations grow.`;
    dialog.querySelector('[data-memory-save]').textContent = '';
    dialog.showModal();
  });
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-save]').addEventListener('click', () => {
    const next = { mode: field('companion-mode').value, memory: field('remember-chats').checked, initiative: field('take-initiative').checked, notes: field('memory-notes').value.trim() };
    try { localStorage.setItem(KEY, JSON.stringify(next)); }
    catch { dialog.querySelector('[data-memory-save]').textContent = 'Preferences could not be saved. Export your chats and free browser storage, then retry.'; return; }
    settings = next; onChange(next); dialog.close();
  });
  dialog.querySelector('[data-export]').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), settings, sessions: store.list() }, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'sushi-conversations.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  return { get value() { return settings; } };
}
