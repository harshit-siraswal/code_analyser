import { useEffect, useState } from "react";
import { applyTheme, readTheme, type ThemeMode } from "../lib/theme";

type ThemeToggleButtonProps = {
  compact?: boolean;
  iconOnly?: boolean;
};

export function ThemeToggleButton({ compact = false, iconOnly = true }: ThemeToggleButtonProps) {
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    const nextTheme = readTheme();
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }, []);

  function onToggleTheme() {
    setTheme((current) => {
      const nextTheme: ThemeMode = current === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      return nextTheme;
    });
  }

  return (
    <button
      type="button"
      className={`ghost-btn theme-toggle-btn icon-action-btn${compact ? " compact" : ""}`}
      onClick={onToggleTheme}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {iconOnly ? (
        theme === "dark" ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M12 2.8v2.3M12 18.9v2.3M21.2 12h-2.3M5.1 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2L5.5 5.5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.8"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M14.8 3.2a8.8 8.8 0 1 0 6 14.4 8.7 8.7 0 0 1-11-11 8.6 8.6 0 0 1 5-3.4Z"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
        )
      ) : theme === "dark" ? (
        "Light Mode"
      ) : (
        "Dark Mode"
      )}
    </button>
  );
}
