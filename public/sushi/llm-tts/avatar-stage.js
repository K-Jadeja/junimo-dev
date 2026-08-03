import { measureVoiceFrame, resolveCompanionMode } from './avatar-signal.mjs';
import { avatarStageHeight, clampAvatarZoom, DEFAULT_AVATAR_ZOOM } from './avatar-zoom.mjs';

export { measureVoiceFrame } from './avatar-signal.mjs';

const MODE_LABELS = {
  boot: 'loading',
  loading: 'loading',
  ready: 'ready',
  thinking: 'thinking',
  speaking: 'speaking',
  error: 'error',
};

const DEFAULT_LINE = '';

function noop() {}

/**
 * Mount the reference Cubism avatar inside the deliberately spare Sushi
 * stage. The iframe keeps the third-party Pixi/Cubism globals away from the
 * chat page while still allowing same-origin control of the local model.
 */
export function mountCompanionAvatar(root) {
  if (!root) {
    return {
      setModelStatus: noop,
      setTtsStatus: noop,
      setTtsError: noop,
      setThinking: noop,
      beginSpeech: noop,
      setAudioLevel: noop,
      setZoom: noop,
      stopSpeech: noop,
      clear: noop,
      destroy: noop,
    };
  }

  const frame = root.querySelector('[data-companion-frame]');
  const stateText = root.querySelector('[data-companion-state]');
  const line = root.querySelector('[data-companion-line]');
  const modelText = root.querySelector('[data-companion-model]');
  const audioText = root.querySelector('[data-companion-audio]');
  const queueText = root.querySelector('[data-companion-queue]');
  const zoomControl = root.querySelector('[data-avatar-zoom]');

  if (!frame || !stateText || !line) {
    throw new Error('Companion avatar stage DOM is incomplete.');
  }

  let currentMode = 'boot';
  let modelState = 'idle';
  let ttsState = 'boot';
  let pollTimer = 0;
  let clearTimer = 0;
  let queueCount = 0;
  let avatarZoom = readStoredZoom();

  function readStoredZoom() {
    try {
      return clampAvatarZoom(Number.parseFloat(window.localStorage.getItem('sushi:llm-tts:avatar-zoom')));
    } catch (_) {
      return DEFAULT_AVATAR_ZOOM;
    }
  }

  function writeStoredZoom(zoom) {
    try {
      window.localStorage.setItem('sushi:llm-tts:avatar-zoom', String(zoom));
    } catch (_) {
      // The control remains usable when storage is unavailable or blocked.
    }
  }

  function getApi() {
    try {
      return frame.contentWindow?.aidoruCubismAvatar || null;
    } catch (_) {
      return null;
    }
  }

  function setMode(mode, detail = '') {
    currentMode = mode;
    root.dataset.mode = mode;
    stateText.textContent = detail || MODE_LABELS[mode] || MODE_LABELS.ready;
  }

  function setLine(text) {
    const next = String(text || '').trim();
    line.textContent = next;
  }

  function refreshPipelineState() {
    const next = resolveCompanionMode({ activeMode: currentMode, modelState, ttsState });
    if (next) setMode(next.mode, next.label);
  }

  function findAvatar() {
    const api = getApi();
    if (!api?.ready) return false;
    root.dataset.avatarReady = 'true';
    invoke('setZoom', avatarZoom);
    if (currentMode === 'boot') setMode('ready');
    return true;
  }

  function invoke(method, ...args) {
    const api = getApi();
    if (typeof api?.[method] !== 'function') return false;
    try {
      api[method](...args);
      return true;
    } catch (error) {
      console.warn(`[sushi-avatar] ${method} failed:`, error);
      return false;
    }
  }

  function setZoom(value, { persist = true } = {}) {
    avatarZoom = clampAvatarZoom(value);
    const baseHeight = window.matchMedia?.('(max-width: 700px)').matches ? 340 : 520;
    root.style.setProperty('--companion-stage-height', `${avatarStageHeight(avatarZoom, baseHeight)}px`);
    if (zoomControl) zoomControl.value = String(avatarZoom);
    if (persist) writeStoredZoom(avatarZoom);
    invoke('setZoom', avatarZoom);
  }

  function setModelStatus(text, state) {
    if (modelText) modelText.textContent = text || 'model idle';
    modelState = state || 'idle';
    refreshPipelineState();
  }

  function setTtsStatus(text, ready = false, progress = null) {
    const detail = String(text || '').trim();
    if (ready) {
      ttsState = 'ready';
      refreshPipelineState();
      if (queueText) queueText.textContent = 'choose a voice';
      return;
    }
    if (/error|failed|unreachable/i.test(detail)) {
      ttsState = 'error';
      refreshPipelineState();
      return;
    }
    if (/generat|speaking/i.test(detail)) {
      ttsState = 'ready';
      setMode('speaking', detail || 'speaking');
      return;
    }
    ttsState = 'loading';
    if (progress?.total > 0) {
      const pct = Math.round((progress.loaded / progress.total) * 100);
      setMode('loading', `${detail || 'loading'} ${pct}%`);
      return;
    }
    setMode('loading', detail || 'loading');
  }

  function setTtsError() {
    ttsState = 'error';
    setMode('error', 'error');
    if (queueText) queueText.textContent = 'retry voice load';
  }

  function setThinking(text = '') {
    setMode('thinking', 'thinking');
    setLine(text);
    if (queueText) queueText.textContent = 'reply in progress';
  }

  function beginSpeech(text) {
    queueCount += 1;
    setMode('speaking', 'speaking');
    setLine(text);
    if (queueText) queueText.textContent = `${queueCount} sentence${queueCount === 1 ? '' : 's'} queued`;
    invoke('startSpeech', text);
  }

  function setAudioLevel(level) {
    const normalized = Math.max(0, Math.min(1, Number(level) || 0));
    if (audioText) {
      audioText.textContent = normalized < 0.02 ? 'silent' : `voice ${Math.round(normalized * 100)}%`;
    }
    invoke('setVolume', normalized);
  }

  function stopSpeech() {
    setAudioLevel(0);
    invoke('stopSpeech');
    if (currentMode === 'speaking') {
      currentMode = 'idle';
      refreshPipelineState();
    }
    queueCount = 0;
    if (queueText) queueText.textContent = 'idle';
  }

  function clear() {
    clearTimeout(clearTimer);
    queueCount = 0;
    setAudioLevel(0);
    invoke('stopSpeech');
    setLine(DEFAULT_LINE);
    if (queueText) queueText.textContent = 'idle';
    if (currentMode !== 'error') {
      currentMode = 'idle';
      refreshPipelineState();
    }
  }

  function handleZoomInput() {
    setZoom(zoomControl.value);
  }

  const handleViewportResize = () => setZoom(avatarZoom, { persist: false });

  frame.addEventListener('load', findAvatar);
  zoomControl?.addEventListener('input', handleZoomInput);
  window.addEventListener('resize', handleViewportResize);
  pollTimer = window.setInterval(() => {
    if (findAvatar()) {
      window.clearInterval(pollTimer);
      pollTimer = 0;
    }
  }, 250);

  setMode('boot');
  setZoom(avatarZoom, { persist: false });
  setLine(DEFAULT_LINE);
  if (modelText) modelText.textContent = 'model waiting';
  if (audioText) audioText.textContent = 'silent';
  if (queueText) queueText.textContent = 'idle';

  return {
    setModelStatus,
    setTtsStatus,
    setTtsError,
    setThinking,
    beginSpeech,
    setAudioLevel,
    setZoom,
    stopSpeech,
    clear,
    destroy() {
      if (pollTimer) window.clearInterval(pollTimer);
      if (clearTimer) window.clearTimeout(clearTimer);
      zoomControl?.removeEventListener('input', handleZoomInput);
      window.removeEventListener('resize', handleViewportResize);
    },
  };
}
