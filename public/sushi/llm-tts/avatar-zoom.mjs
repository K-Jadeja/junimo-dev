export const MIN_AVATAR_ZOOM = 1;
export const MAX_AVATAR_ZOOM = 1.75;
export const DEFAULT_AVATAR_ZOOM = 1.2;

export function clampAvatarZoom(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return DEFAULT_AVATAR_ZOOM;
  return Math.max(MIN_AVATAR_ZOOM, Math.min(MAX_AVATAR_ZOOM, numeric));
}

export function avatarStageHeight(zoom, baseHeight = 520) {
  return Math.round(baseHeight * clampAvatarZoom(zoom));
}
