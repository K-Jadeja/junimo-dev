/**
 * Convert a Pocket TTS PCM chunk into a small bounded signal for avatar
 * mouth movement and status readouts.
 */
export function measureVoiceFrame(samples) {
  const values = samples instanceof Float32Array ? samples : new Float32Array(samples || []);
  let peak = 0;
  let sumSquares = 0;
  let count = 0;

  for (let i = 0; i < values.length; i += 8) {
    const value = values[i];
    const magnitude = Math.abs(value);
    if (magnitude > peak) peak = magnitude;
    sumSquares += value * value;
    count += 1;
  }

  const rms = count > 0 ? Math.sqrt(sumSquares / count) : 0;
  const level = Math.min(1, rms * 4.8 + peak * 1.4);
  return { peak, rms, level };
}

export function shapeMouthLevel(level) {
  const normalized = Math.max(0, Math.min(1, Number(level) || 0));
  return Math.min(1, Math.pow(normalized, 0.68) * 1.12);
}

export function resolveCompanionMode({ activeMode = 'idle', modelState = 'idle', ttsState = 'boot' } = {}) {
  if (activeMode === 'thinking') return { mode: 'thinking', label: 'thinking' };
  if (activeMode === 'speaking') return { mode: 'speaking', label: 'speaking' };
  if (modelState === 'error' || ttsState === 'error') {
    return { mode: 'error', label: 'error' };
  }
  if (modelState === 'loading' || ttsState === 'loading') {
    return { mode: 'loading', label: 'loading' };
  }
  if (modelState === 'ready' && ttsState === 'ready') {
    return { mode: 'ready', label: 'ready' };
  }
  if (ttsState === 'ready') return { mode: 'ready', label: 'ready' };
  if (modelState === 'ready') return { mode: 'ready', label: 'ready' };
  return null;
}
