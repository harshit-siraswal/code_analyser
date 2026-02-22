export type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "code-analyser-theme";

function getSystemTheme(): ThemeMode {
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function readTheme(): ThemeMode {
  if (typeof document !== "undefined") {
    const current = document.documentElement.getAttribute("data-theme");
    if (current === "light" || current === "dark") {
      return current;
    }
  }

  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        return stored;
      }
    } catch {
      // Ignore storage access issues and fall back to system preference.
    }
  }

  return getSystemTheme();
}

export function applyTheme(theme: ThemeMode): void {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
  }

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage access issues in restricted environments.
    }
  }
}

export function initializeTheme(): ThemeMode {
  const theme = readTheme();
  applyTheme(theme);
  return theme;
}
