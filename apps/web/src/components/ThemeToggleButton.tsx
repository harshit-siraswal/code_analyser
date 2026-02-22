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
        <span aria-hidden="true">{theme === "dark" ? "☀" : "🌙"}</span>
      ) : theme === "dark" ? (
        "Light Mode"
      ) : (
        "Dark Mode"
      )}
    </button>
  );
}
