const STORAGE_KEY = 'sushi.chat.sessions.v1';
const ACTIVE_KEY_PREFIX = 'sushi.chat.active.v1.';
const MAX_SESSIONS = 24;
const MODEL_LABELS = Object.freeze({
  smol: 'SmolLM2',
  gemma4: 'Gemma 4 E2B',
});

function getStorage() {
  try {
    return globalThis.localStorage || null;
  } catch (_) {
    return null;
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function normalizeMessages(messages, maxMessages) {
  return (Array.isArray(messages) ? messages : [])
    .filter((message) => message?.role === 'user' || message?.role === 'assistant')
    .map((message) => ({
      role: message.role,
      content: String(message.content || '').trim().slice(0, 8000),
    }))
    .filter((message) => message.content)
    .slice(-maxMessages);
}

function titleFor(messages) {
  const firstUser = messages.find((message) => message.role === 'user');
  if (!firstUser) return 'new chat';
  const title = firstUser.content.replace(/\s+/g, ' ').trim();
  return title.length > 56 ? `${title.slice(0, 55).trimEnd()}…` : title;
}

function readSessions(storage) {
  if (!storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((session) => session?.scope && Array.isArray(session.messages));
  } catch (_) {
    return [];
  }
}

function dateLabel(timestamp) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(timestamp));
  } catch (_) {
    return '';
  }
}

function modelLabel(modelId) {
  return MODEL_LABELS[modelId] || modelId || 'local model';
}

export function createChatStore(scope, { maxMessages = 12 } = {}) {
  if (!scope) throw new Error('Chat history scope is required.');

  const storage = getStorage();
  const activeKey = `${ACTIVE_KEY_PREFIX}${scope}`;
  let activeId = storage?.getItem(activeKey) || null;
  let storageError = '';

  function writeSessions(sessions) {
    if (!storage) {
      storageError = 'Browser storage is unavailable; chats will not survive a reload.';
      return false;
    }

    const ordered = sessions
      .filter((session) => session?.messages?.length)
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    for (let limit = Math.min(MAX_SESSIONS, ordered.length); limit >= 0; limit -= 1) {
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(ordered.slice(0, limit)));
        storageError = '';
        return true;
      } catch (_) {
        // Retry with fewer old sessions if the browser quota is already tight.
      }
    }

    storageError = 'Browser storage is full; this chat could not be saved.';
    return false;
  }

  function setActive(id) {
    activeId = id || null;
    try {
      if (activeId) storage?.setItem(activeKey, activeId);
      else storage?.removeItem(activeKey);
    } catch (_) {
      storageError = 'Browser storage is unavailable; the active chat cannot be restored.';
    }
  }

  function list() {
    return readSessions(storage)
      .filter((session) => session.scope === scope)
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .map(clone);
  }

  function loadActive() {
    if (!activeId) return null;
    return list().find((session) => session.id === activeId) || null;
  }

  function save(messages, { modelId = 'smol' } = {}) {
    const cleanMessages = normalizeMessages(messages, maxMessages);
    if (!cleanMessages.length) return null;

    const sessions = readSessions(storage);
    const now = Date.now();
    let session = sessions.find((candidate) => candidate.id === activeId && candidate.scope === scope);
    if (!session) {
      session = {
        id: makeId(),
        scope,
        createdAt: now,
      };
      activeId = session.id;
    }

    session.updatedAt = now;
    session.modelId = modelId;
    session.title = titleFor(cleanMessages);
    session.messages = cleanMessages;
    writeSessions([...sessions.filter((candidate) => candidate.id !== session.id), session]);
    setActive(session.id);
    return clone(session);
  }

  function startNew({ modelId = 'smol' } = {}) {
    const id = makeId();
    setActive(id);
    return { id, scope, modelId, messages: [] };
  }

  function restore(id) {
    const session = list().find((candidate) => candidate.id === id);
    if (!session) return null;
    setActive(session.id);
    return session;
  }

  function remove(id) {
    const sessions = readSessions(storage);
    const wasActive = activeId === id;
    const remaining = sessions.filter((session) => session.id !== id);
    writeSessions(remaining);
    if (wasActive) setActive(null);
    return wasActive;
  }

  return {
    list,
    loadActive,
    save,
    startNew,
    restore,
    remove,
    get activeId() { return activeId; },
    get storageError() { return storageError; },
  };
}

function createButton(text, className) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = text;
  return button;
}

function renderTranscript(container, messages) {
  container.replaceChildren();
  for (const message of messages) {
    const row = document.createElement('div');
    row.className = `chat-history-message ${message.role}`;
    const label = document.createElement('span');
    label.className = 'chat-history-message-role';
    label.textContent = message.role === 'user' ? 'you' : 'llm';
    const content = document.createElement('p');
    content.textContent = message.content;
    row.append(label, content);
    container.appendChild(row);
  }
}

export function mountChatHistoryControls({
  container,
  store,
  getMessages,
  getModelId,
  onRestore,
  onReset,
  resetButton = null,
} = {}) {
  if (!container || !store || typeof getMessages !== 'function') {
    throw new Error('Chat history controls require a container, store, and message reader.');
  }

  const historyButton = createButton('history', 'chat-history-control');
  historyButton.title = 'Open saved chats';
  const clearButton = resetButton || createButton('reset', 'chat-history-control');
  clearButton.classList.add('chat-history-control');
  clearButton.title = 'Start a new chat';
  if (!resetButton) container.append(clearButton);
  container.append(historyButton);

  const dialog = document.createElement('dialog');
  dialog.className = 'chat-history-dialog';
  dialog.setAttribute('aria-labelledby', 'chat-history-title');

  const header = document.createElement('div');
  header.className = 'chat-history-dialog-header';
  const title = document.createElement('strong');
  title.id = 'chat-history-title';
  title.textContent = 'history';
  const closeButton = createButton('close', 'chat-history-control');
  closeButton.addEventListener('click', () => dialog.close());
  header.append(title, closeButton);

  const note = document.createElement('p');
  note.className = 'chat-history-note';
  note.textContent = 'saved only in this browser';

  const listContainer = document.createElement('div');
  listContainer.className = 'chat-history-list';
  const detail = document.createElement('section');
  detail.className = 'chat-history-detail';
  detail.hidden = true;
  dialog.append(header, note, listContainer, detail);
  document.body.appendChild(dialog);

  let selected = null;

  function renderList() {
    listContainer.replaceChildren();
    const sessions = store.list();
    if (!sessions.length) {
      const empty = document.createElement('p');
      empty.className = 'chat-history-empty';
      empty.textContent = 'no saved chats yet';
      listContainer.appendChild(empty);
      detail.hidden = true;
      return;
    }

    for (const session of sessions) {
      const item = createButton('', 'chat-history-session');
      const itemTitle = document.createElement('span');
      itemTitle.className = 'chat-history-session-title';
      itemTitle.textContent = session.title || 'untitled chat';
      const meta = document.createElement('span');
      meta.className = 'chat-history-session-meta';
      meta.textContent = `${modelLabel(session.modelId)} · ${dateLabel(session.updatedAt)} · ${Math.ceil(session.messages.length / 2)} turns`;
      item.append(itemTitle, meta);
      item.addEventListener('click', () => showDetail(session));
      listContainer.appendChild(item);
    }
  }

  function showDetail(session) {
    selected = session;
    detail.hidden = false;
    detail.replaceChildren();

    const detailTitle = document.createElement('strong');
    detailTitle.className = 'chat-history-detail-title';
    detailTitle.textContent = session.title || 'untitled chat';
    const detailMeta = document.createElement('p');
    detailMeta.className = 'chat-history-session-meta';
    detailMeta.textContent = `${modelLabel(session.modelId)} · ${dateLabel(session.updatedAt)}`;
    const transcript = document.createElement('div');
    transcript.className = 'chat-history-transcript';
    renderTranscript(transcript, session.messages);
    const actions = document.createElement('div');
    actions.className = 'chat-history-actions';
    const restoreButton = createButton('restore', 'chat-history-control');
    const deleteButton = createButton('delete', 'chat-history-control');
    restoreButton.addEventListener('click', async () => {
      const restored = store.restore(session.id);
      if (!restored) return;
      await onRestore?.(restored.messages, restored);
      dialog.close();
    });
    deleteButton.addEventListener('click', async () => {
      const wasActive = store.remove(session.id);
      selected = null;
      if (wasActive) {
        store.startNew({ modelId: getModelId?.() || 'smol' });
        await onReset?.();
      }
      renderList();
    });
    actions.append(restoreButton, deleteButton);
    detail.append(detailTitle, detailMeta, transcript, actions);
  }

  historyButton.addEventListener('click', () => {
    store.save(getMessages(), { modelId: getModelId?.() || 'smol' });
    note.textContent = store.storageError || 'saved only in this browser';
    renderList();
    if (!dialog.open) dialog.showModal();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  clearButton.addEventListener('click', async () => {
    store.save(getMessages(), { modelId: getModelId?.() || 'smol' });
    store.startNew({ modelId: getModelId?.() || 'smol' });
    await onReset?.();
  });

  return {
    setDisabled(disabled) {
      historyButton.disabled = disabled;
      clearButton.disabled = disabled;
    },
    refresh: renderList,
    destroy() {
      dialog.remove();
      historyButton.remove();
      if (!resetButton) clearButton.remove();
    },
  };
}
