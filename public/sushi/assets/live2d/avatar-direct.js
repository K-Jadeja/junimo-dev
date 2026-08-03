import { shapeMouthLevel } from '../../llm-tts/avatar-signal.mjs';
import { clampAvatarZoom, DEFAULT_AVATAR_ZOOM } from '../../llm-tts/avatar-zoom.mjs';

const canvas = document.getElementById('live2d-canvas');

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error('Cubism canvas was not created.');
}

if (!window.PIXI) {
  throw new Error('PIXI failed to load for the Cubism avatar.');
}

if (!window.PIXI.live2d?.Live2DModel) {
  throw new Error('pixi-live2d-display failed to load for the Cubism avatar.');
}

const modelUrl = new URL('./live2d-models/Alexia/Alexia.model3.json', window.location.href).toString();
const expressionQueue = ['zs1', 'bbt', 'lh', 'lzx'];

let app = null;
let model = null;
let liveLevel = 0;
let targetLevel = 0;
let avatarZoom = DEFAULT_AVATAR_ZOOM;
let expressionIndex = 0;

function applyExpression(name) {
  if (!model || !name) {
    return;
  }

  try {
    model.expression(name);
  } catch (error) {
    console.warn('[aidoru-cubism] expression failed:', error);
  }
}

function nextExpression() {
  const name = expressionQueue[expressionIndex % expressionQueue.length];
  expressionIndex += 1;
  applyExpression(name);
}

function fitModel() {
  if (!app || !model) {
    return;
  }

  const bounds = model.getLocalBounds();
  if (!bounds.width || !bounds.height) {
    return;
  }

  const viewportWidth = app.renderer.screen?.width || app.renderer.width;
  const viewportHeight = app.renderer.screen?.height || app.renderer.height;
  const widthScale = (viewportWidth * 0.94) / bounds.width;
  const scale = Math.min(
    widthScale * avatarZoom,
    (viewportHeight * 0.98) / bounds.height
  );

  model.scale.set(scale);
  model.anchor.set(0.5, 0.5);
  // Center horizontally; nudge slightly above mid-height so the glassy
  // subtitle bubble (anchored bottom-center of .avatar-scene) doesn't
  // overlap the model's chin/feet.
  model.position.set(viewportWidth * 0.5, viewportHeight * 0.5);
}

function updateLipSync(deltaMs) {
  if (!model?.internalModel?.coreModel) {
    return;
  }

  const desiredLevel = shapeMouthLevel(targetLevel);
  const damp = Math.min(1, deltaMs / (desiredLevel > liveLevel ? 28 : 84));
  liveLevel += (desiredLevel - liveLevel) * damp;

  const mouthValue = Math.max(0, Math.min(1, liveLevel));
  model.internalModel.coreModel.setParameterValueById('ParamMouthOpenY', mouthValue);
}

async function boot() {
  app = new window.PIXI.Application({
    view: canvas,
    autoStart: true,
    resizeTo: window,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
    backgroundAlpha: 0,
    antialias: true,
  });

  model = await window.PIXI.live2d.Live2DModel.from(modelUrl, {
    autoInteract: false,
  });

  window.__aidoruCubismModel = model;
  app.stage.addChild(model);
  fitModel();
  applyExpression('zs1');

  app.ticker.add(() => {
    updateLipSync(app.ticker.elapsedMS);
  });

  window.addEventListener('resize', fitModel);

  window.aidoruCubismAvatar = {
    ready: true,
    setZoom(level) {
      avatarZoom = clampAvatarZoom(level);
      fitModel();
    },
    setVolume(level) {
      targetLevel = Math.max(0, Math.min(1, Number(level) || 0));
    },
    startSpeech() {
      nextExpression();
    },
    stopSpeech() {
      targetLevel = 0;
      applyExpression('zs1');
    },
    setExpression(name) {
      applyExpression(name);
    },
    getState() {
      return {
        ready: true,
        liveLevel,
        targetLevel,
        hasCoreModel: !!model?.internalModel?.coreModel,
      };
    },
  };
}

boot().catch((error) => {
  console.error('[aidoru-cubism] direct avatar boot failed:', error);
  throw error;
});
