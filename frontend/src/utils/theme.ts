export type ThemeName = "dark" | "light";

const STORAGE_KEY = "yap.theme";

function isThemeName(value: string | null): value is ThemeName {
  return value === "dark" || value === "light";
}

export function loadTheme(): ThemeName {
  if (typeof window === "undefined") {
    return "dark";
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY);
  return isThemeName(storedTheme) ? storedTheme : "dark";
}

export function applyTheme(theme: ThemeName) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = theme;
}

export function saveTheme(theme: ThemeName) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, theme);
}

export function toggleTheme(theme: ThemeName): ThemeName {
  return theme === "dark" ? "light" : "dark";
}