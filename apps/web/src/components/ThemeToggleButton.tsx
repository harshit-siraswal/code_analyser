import { useEffect, useState } from "react";
import { applyTheme, readTheme, type ThemeMode } from "../lib/theme";

type ThemeToggleButtonProps = {
  compact?: boolean;
};

export function ThemeToggleButton({ compact = false }: ThemeToggleButtonProps) {
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
      className={`ghost-btn theme-toggle-btn${compact ? " compact" : ""}`}
      onClick={onToggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? "Light Mode" : "Dark Mode"}
    </button>
  );
}
