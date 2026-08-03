export const MODEL_IDS = Object.freeze({
  SMOL: 'smol',
  GEMMA4: 'gemma4',
});

export const MODEL_PREFERENCE_KEY = 'sushi.llm.model';

const GEMMA_RUNTIME_URL = new URL('./gemma4-runtime/', import.meta.url).href;

export const MODEL_DEFINITIONS = Object.freeze({
  [MODEL_IDS.SMOL]: Object.freeze({
    id: MODEL_IDS.SMOL,
    label: 'SmolLM2',
    shortLabel: 'Smol',
    eyebrow: 'QUICK / COMPACT',
    description: 'Fast, light, and already cached by most Sushi demos.',
    desktopSize: '~1-2.7GB',
    mobileSize: '~271MB',
    mobile: true,
  }),
  [MODEL_IDS.GEMMA4]: Object.freeze({
    id: MODEL_IDS.GEMMA4,
    label: 'Gemma 4 E2B',
    shortLabel: 'Gemma',
    eyebrow: 'RICHER / ROLEPLAY',
    description: 'A larger local model for more expressive character chat.',
    desktopSize: '~2.6GB',
    mobileSize: null,
    mobile: false,
    runtimeUrl: GEMMA_RUNTIME_URL,
    modelUrl: 'https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it-web.task',
  }),
});

export function getModelDefinition(modelId) {
  return MODEL_DEFINITIONS[modelId] || MODEL_DEFINITIONS[MODEL_IDS.SMOL];
}

export function getPreferredModel({ mobile = false } = {}) {
  try {
    const stored = localStorage.getItem(MODEL_PREFERENCE_KEY);
    if (stored && MODEL_DEFINITIONS[stored] && (!mobile || MODEL_DEFINITIONS[stored].mobile)) {
      return stored;
    }
  } catch (_) {
    // Private browsing or blocked storage should not prevent model selection.
  }
  return MODEL_IDS.SMOL;
}

export function rememberModel(modelId) {
  try {
    localStorage.setItem(MODEL_PREFERENCE_KEY, modelId);
  } catch (_) {
    // The selection remains usable for this page even when persistence fails.
  }
}

export function isModelAvailable(modelId, { mobile = false } = {}) {
  const model = getModelDefinition(modelId);
  return !mobile || model.mobile;
}
