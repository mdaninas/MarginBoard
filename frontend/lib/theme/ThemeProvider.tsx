"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "marginboard.theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Default to "light" for SSR; sync from localStorage on first client render.
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const initial = readStoredTheme();
    setThemeState(initial);
    applyTheme(initial);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage failures in private/restricted contexts
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggle }),
    [theme, setTheme, toggle],
  );

  // Render children immediately — no visibility:hidden gate that could cause
  // a permanent blank page if hydration errors. A brief light→dark flash on
  // dark-mode users is the acceptable trade-off.
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}

export function useThemeColors() {
  const { theme } = useTheme();
  return useMemo(() => {
    if (typeof window === "undefined") {
      return FALLBACK_COLORS.light;
    }
    const root = window.getComputedStyle(document.documentElement);
    const read = (name: string) => root.getPropertyValue(name).trim();
    return {
      accent:     read("--color-accent")     || FALLBACK_COLORS[theme].accent,
      accentSoft: read("--color-accent-soft") || FALLBACK_COLORS[theme].accentSoft,
      accentInk:  read("--color-accent-ink")  || FALLBACK_COLORS[theme].accentInk,
      ink:        read("--color-ink")         || FALLBACK_COLORS[theme].ink,
      inkMuted:   read("--color-ink-2")       || FALLBACK_COLORS[theme].inkMuted,
      inkFaint:   read("--color-ink-3")       || FALLBACK_COLORS[theme].inkFaint,
      border:     read("--color-rule")        || FALLBACK_COLORS[theme].border,
      surface:    read("--color-surface")     || FALLBACK_COLORS[theme].surface,
      surface2:   read("--color-surface-2")   || FALLBACK_COLORS[theme].surface2,
      surface3:   read("--color-surface-3")   || FALLBACK_COLORS[theme].surface3,
      good:       read("--color-good")        || FALLBACK_COLORS[theme].good,
      warn:       read("--color-warn")        || FALLBACK_COLORS[theme].warn,
      bad:        read("--color-bad")         || FALLBACK_COLORS[theme].bad,
    };
  }, [theme]);
}

const FALLBACK_COLORS = {
  light: {
    accent: "#e36b3a", accentSoft: "#fde2d2", accentInk: "#a8431c",
    ink: "#1f1b16", inkMuted: "#5a5247", inkFaint: "#9a9286",
    border: "#ece4d4", surface: "#ffffff", surface2: "#fbf6ec", surface3: "#f0e9d8",
    good: "#3f8a5a", warn: "#b8821e", bad: "#c64a3a",
  },
  dark: {
    accent: "#ff8456", accentSoft: "#4a2818", accentInk: "#ffaa7a",
    ink: "#f0e8db", inkMuted: "#c0b8a8", inkFaint: "#847b6c",
    border: "#322c26", surface: "#221d18", surface2: "#2a2520", surface3: "#322c26",
    good: "#6fb685", warn: "#d4a445", bad: "#e2664f",
  },
} as const;
