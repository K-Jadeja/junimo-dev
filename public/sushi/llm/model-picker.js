import {
  MODEL_DEFINITIONS,
  MODEL_IDS,
  getPreferredModel,
  rememberModel,
} from './model-registry.js';

export function mountModelPicker(container, { mobile = false, onChange, showHint = true } = {}) {
  if (!container) throw new Error('Model picker container is missing.');

  const fieldset = document.createElement('fieldset');
  fieldset.className = 'model-picker';
  fieldset.setAttribute('aria-label', 'Choose language model');

  const legend = document.createElement('legend');
  legend.textContent = 'Choose a local model';
  fieldset.appendChild(legend);

  if (showHint) {
    const hint = document.createElement('p');
    hint.className = 'model-picker-hint';
    hint.textContent = mobile
      ? 'Mobile mode uses the compact Smol model.'
      : 'Both models run locally. Switching models stops the current reply.';
    fieldset.appendChild(hint);
  }

  const cards = new Map();
  let selected = getPreferredModel({ mobile });

  const select = (modelId, { notify = true } = {}) => {
    if (!MODEL_DEFINITIONS[modelId]) return;
    if (mobile && modelId !== MODEL_IDS.SMOL) return;
    selected = modelId;
    rememberModel(modelId);
    for (const [id, card] of cards) {
      const isSelected = id === selected;
      card.classList.toggle('selected', isSelected);
      card.setAttribute('aria-checked', String(isSelected));
    }
    if (notify) onChange?.(selected);
  };

  for (const model of Object.values(MODEL_DEFINITIONS)) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'model-card';
    card.dataset.modelId = model.id;
    card.setAttribute('role', 'radio');
    card.setAttribute('aria-label', `${model.label}: ${model.description}`);
    card.disabled = mobile && !model.mobile;

    const top = document.createElement('span');
    top.className = 'model-card-top';
    const eyebrow = document.createElement('span');
    eyebrow.className = 'model-card-eyebrow';
    eyebrow.textContent = model.eyebrow;
    const mark = document.createElement('span');
    mark.className = 'model-card-mark';
    mark.textContent = model.id === MODEL_IDS.GEMMA4 ? 'G4' : 'S2';
    top.append(eyebrow, mark);

    const title = document.createElement('strong');
    title.className = 'model-card-title';
    title.textContent = model.label;

    const description = document.createElement('span');
    description.className = 'model-card-description';
    description.textContent = model.description;

    const size = document.createElement('span');
    size.className = 'model-card-size';
    size.textContent = mobile ? (model.mobileSize || 'Desktop only') : model.desktopSize;

    card.append(top, title, description, size);
    card.addEventListener('click', () => select(model.id));
    cards.set(model.id, card);
    fieldset.appendChild(card);
  }

  container.replaceChildren(fieldset);
  select(selected, { notify: false });

  return {
    get selected() {
      return selected;
    },
    select,
    setDisabled(disabled) {
      for (const card of cards.values()) card.disabled = disabled || (mobile && card.dataset.modelId !== MODEL_IDS.SMOL);
    },
  };
}
