export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "junimo-theme";

export function isTheme(value: string | null): value is Theme {
  return value === "dark" || value === "light";
}

export function readThemeFromSearch(search: string): Theme | null {
  const value = new URLSearchParams(search).get("theme");
  return isTheme(value) ? value : null;
}

export function readStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;

  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
}

export function getInitialTheme(search: string): Theme {
  return readThemeFromSearch(search) ?? readStoredTheme() ?? "dark";
}

export function persistTheme(theme: Theme) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Theme persistence is an enhancement; the in-memory theme still works.
  }
}

export function applyThemeData(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  if (document.body) document.body.dataset.theme = theme;
}
