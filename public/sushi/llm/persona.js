const PERSONA_STORAGE_KEY = 'sushi.persona.v1';

const MAX_LENGTHS = Object.freeze({
  name: 80,
  role: 320,
  description: 1200,
  personality: 800,
  speakingStyle: 800,
  scenario: 1200,
});

export const DEFAULT_PERSONA = Object.freeze({
  name: 'Sable Quickquill',
  role: 'A tiefling cartographer and pact-bound field scholar traveling as the party\'s companion.',
  description: 'Sable carries a map stitched from stolen royal decrees. A forgotten star speaks to her through its ink, pointing toward places that should not exist. She joined the user\'s adventuring party after saving them from a collapsing observatory and now pretends the arrangement is purely practical.',
  personality: 'Curious, dryly funny, fiercely loyal, suspicious of nobles, and secretly afraid of being forgotten. She notices small details, protects people by teasing them, and becomes unexpectedly sincere around old magic or lost travelers.',
  speakingStyle: 'Conversational and vivid, with gentle sarcasm, occasional dungeon slang, and sharp sensory details. Keep replies natural and reasonably concise instead of turning every line into purple prose.',
  scenario: 'The user and Sable are traveling companions in a living D&D-style fantasy campaign. The party has just found a sealed door beneath an abandoned observatory; moonlight leaks through the ceiling, and something on the other side is tapping in reply. Follow the user when they change the scene.',
});

const FIELD_DEFINITIONS = Object.freeze([
  { key: 'name', label: 'character name', description: 'Who the companion is called.', type: 'input' },
  { key: 'role', label: 'role / background', description: 'Class, species, job, or place in the story.', type: 'textarea', rows: 2 },
  { key: 'description', label: 'character description', description: 'History, motives, secrets, and useful details.', type: 'textarea', rows: 3 },
  { key: 'personality', label: 'personality', description: 'Traits, wants, fears, and emotional patterns.', type: 'textarea', rows: 3 },
  { key: 'speakingStyle', label: 'speaking style', description: 'Voice, rhythm, vocabulary, and reply length.', type: 'textarea', rows: 3 },
  { key: 'scenario', label: 'roleplay situation', description: 'The current world, relationship, and opening hook.', type: 'textarea', rows: 4 },
]);

function clip(value, fallback, maxLength) {
  const text = typeof value === 'string' ? value.trim() : '';
  return (text || fallback).slice(0, maxLength).trim();
}

export function normalizePersona(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    name: clip(source.name, DEFAULT_PERSONA.name, MAX_LENGTHS.name),
    role: clip(source.role, DEFAULT_PERSONA.role, MAX_LENGTHS.role),
    description: clip(source.description, DEFAULT_PERSONA.description, MAX_LENGTHS.description),
    personality: clip(source.personality, DEFAULT_PERSONA.personality, MAX_LENGTHS.personality),
    speakingStyle: clip(source.speakingStyle, DEFAULT_PERSONA.speakingStyle, MAX_LENGTHS.speakingStyle),
    scenario: clip(source.scenario, DEFAULT_PERSONA.scenario, MAX_LENGTHS.scenario),
  };
}

export function loadPersona() {
  try {
    const stored = globalThis.localStorage?.getItem(PERSONA_STORAGE_KEY);
    if (stored) return normalizePersona(JSON.parse(stored));
  } catch (_) {
    // Private browsing or blocked storage should not prevent roleplay.
  }
  return normalizePersona(DEFAULT_PERSONA);
}

export function savePersona(value) {
  const persona = normalizePersona(value);
  let storageError = null;
  try {
    const storage = globalThis.localStorage;
    if (!storage) throw new Error('Browser storage is unavailable.');
    storage.setItem(PERSONA_STORAGE_KEY, JSON.stringify(persona));
  } catch (error) {
    storageError = error;
  }
  return { persona, storageError };
}

export function buildSystemPrompt(value, { voice = false } = {}) {
  const persona = normalizePersona(value);
  const voiceRule = voice
    ? 'Your replies are read aloud, so keep them vivid, natural, and reasonably concise. Do not use stage directions in brackets unless they are genuinely useful to the scene.'
    : 'Keep replies vivid, natural, and reasonably concise. Ask a natural question when the scene needs the user to choose what happens next.';

  return [
    `You are ${persona.name}, ${persona.role}`,
    `Character description: ${persona.description}`,
    `Personality: ${persona.personality}`,
    `Speaking style: ${persona.speakingStyle}`,
    `Roleplay situation: ${persona.scenario}`,
    `Roleplay rules:
- Roleplay in the first person as the character. Use I, me, and my for your own speech, actions, feelings, and memories; never describe yourself as an outside narrator or refer to yourself as ${persona.name}, she, or he.
- Keep action beats brief and in first-person present tense when they help the scene, such as "I glance toward the door." Do not turn every reply into stage directions.
- Stay in character and treat the user as an equal participant in the scene.
- Never write the user's dialogue, thoughts, choices, or actions for them.
- Follow the user's changes to the setting or story without arguing about the prompt.
- Do not mention system prompts, language models, or being an AI unless the user explicitly ends the roleplay to ask about them.
- ${voiceRule}`,
  ].join('\n\n');
}

function createField(definition) {
  const label = document.createElement('label');
  label.className = 'persona-field';

  const heading = document.createElement('span');
  heading.className = 'persona-field-label';
  heading.textContent = definition.label;

  const hint = document.createElement('span');
  hint.className = 'persona-field-hint';
  hint.textContent = definition.description;

  const control = document.createElement(definition.type === 'input' ? 'input' : 'textarea');
  control.id = `persona-${definition.key}`;
  control.name = definition.key;
  control.maxLength = MAX_LENGTHS[definition.key];
  control.autocomplete = 'off';
  if (definition.rows) control.rows = definition.rows;

  label.append(heading, hint, control);
  return { key: definition.key, control, label };
}

export function mountPersonaEditor({ container, getPersona = loadPersona, onChange } = {}) {
  if (!container || typeof getPersona !== 'function') {
    throw new Error('Persona editor requires a container and persona reader.');
  }

  const openButton = document.createElement('button');
  openButton.type = 'button';
  openButton.className = 'persona-control chat-history-control';
  openButton.textContent = 'character';
  openButton.title = 'Edit the roleplay character';

  const dialog = document.createElement('dialog');
  dialog.className = 'persona-dialog';
  dialog.setAttribute('aria-labelledby', 'persona-dialog-title');

  const header = document.createElement('div');
  header.className = 'persona-dialog-header';
  const title = document.createElement('strong');
  title.id = 'persona-dialog-title';
  title.textContent = 'character';
  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'chat-history-control';
  closeButton.textContent = 'close';
  header.append(title, closeButton);

  const note = document.createElement('p');
  note.className = 'persona-dialog-note';
  note.textContent = 'Saved only in this browser. Changes apply to the next reply.';

  const form = document.createElement('form');
  form.className = 'persona-form';
  const fields = new Map(FIELD_DEFINITIONS.map((definition) => {
    const field = createField(definition);
    form.appendChild(field.label);
    return [field.key, field.control];
  }));

  const actions = document.createElement('div');
  actions.className = 'persona-dialog-actions';
  const defaultsButton = document.createElement('button');
  defaultsButton.type = 'button';
  defaultsButton.className = 'persona-defaults';
  defaultsButton.textContent = 'use companion';
  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.className = 'chat-history-control';
  cancelButton.textContent = 'cancel';
  const saveButton = document.createElement('button');
  saveButton.type = 'submit';
  saveButton.className = 'chat-history-control';
  saveButton.textContent = 'save character';
  actions.append(defaultsButton, cancelButton, saveButton);
  form.appendChild(actions);

  dialog.append(header, note, form);
  document.body.appendChild(dialog);
  container.appendChild(openButton);

  let current = normalizePersona(getPersona());

  function fill(persona) {
    for (const [key, control] of fields) control.value = persona[key];
  }

  function open() {
    current = normalizePersona(getPersona());
    fill(current);
    note.textContent = 'Saved only in this browser. Changes apply to the next reply.';
    dialog.showModal();
    fields.get('name')?.focus();
  }

  openButton.addEventListener('click', open);
  closeButton.addEventListener('click', () => dialog.close());
  cancelButton.addEventListener('click', () => dialog.close());
  defaultsButton.addEventListener('click', () => {
    current = normalizePersona(DEFAULT_PERSONA);
    fill(current);
    note.textContent = 'Default companion loaded. Save character to keep it.';
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const draft = Object.fromEntries([...fields].map(([key, control]) => [key, control.value]));
    const result = savePersona(draft);
    current = result.persona;
    onChange?.(current, result);
    note.textContent = result.storageError
      ? 'Storage is unavailable; using this character for this page.'
      : 'Saved only in this browser. Changes apply to the next reply.';
    dialog.close();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  return {
    get persona() {
      return current;
    },
    setDisabled(disabled) {
      openButton.disabled = Boolean(disabled);
    },
    destroy() {
      dialog.remove();
      openButton.remove();
    },
  };
}
