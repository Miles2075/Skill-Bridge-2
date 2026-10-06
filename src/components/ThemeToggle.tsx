import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

type ThemeMode = "light" | "dark" | "system";

function getSavedTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem("skillbridge-theme");
  return saved === "dark" || saved === "system" ? saved : "light";
}

function getSystemDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(mode: ThemeMode) {
  const dark = mode === "dark" || (mode === "system" && getSystemDark());
  document.documentElement.classList.toggle("dark", dark);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    const mode = getSavedTheme();
    applyTheme(mode);
    setTheme(mode);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      if (getSavedTheme() === "system") {
        applyTheme("system");
      }
    };

    media.addEventListener("change", handleSystemChange);
    return () => media.removeEventListener("change", handleSystemChange);
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    localStorage.setItem("skillbridge-theme", mode);
    applyTheme(mode);
    setTheme(mode);
  };

  return (
    <div
      className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-2xs dark:border-slate-700 dark:bg-slate-800"
      role="group"
      aria-label="Theme selection"
    >
      <button
        type="button"
        onClick={() => setThemeMode("light")}
        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
          theme === "light"
            ? "bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-slate-200"
        }`}
        aria-label="Use light theme"
        aria-pressed={theme === "light"}
      >
        <Sun className="size-3.5" />
        <span>Light</span>
      </button>

      <button
        type="button"
        onClick={() => setThemeMode("dark")}
        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
          theme === "dark"
            ? "bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-slate-200"
        }`}
        aria-label="Use dark theme"
        aria-pressed={theme === "dark"}
      >
        <Moon className="size-3.5" />
        <span>Dark</span>
      </button>

      <button
        type="button"
        onClick={() => setThemeMode("system")}
        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
          theme === "system"
            ? "bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-slate-200"
        }`}
        aria-label="Use system theme"
        aria-pressed={theme === "system"}
      >
        <Monitor className="size-3.5" />
        <span>System</span>
      </button>
    </div>
  );
}
