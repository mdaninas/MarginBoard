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

function readInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const initial = readInitialTheme();
    setThemeState(initial);
    applyTheme(initial);
    setHydrated(true);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore localStorage failures (private mode, quota)
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggle }),
    [theme, setTheme, toggle],
  );

  // Avoid a flash of mismatched UI between SSR (light default) and hydrated theme.
  if (!hydrated) {
    return (
      <ThemeContext.Provider value={value}>
        <div style={{ visibility: "hidden" }}>{children}</div>
      </ThemeContext.Provider>
    );
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}

/**
 * Resolve a Tailwind CSS variable to its concrete color value. Useful for
 * libraries that take colors as props (Recharts, etc.) and cannot consume
 * CSS variables directly through className.
 */
export function useThemeColors() {
  const { theme } = useTheme();
  return useMemo(() => {
    if (typeof window === "undefined") {
      return FALLBACK_COLORS.light;
    }
    const root = window.getComputedStyle(document.documentElement);
    const read = (name: string) => root.getPropertyValue(name).trim();
    return {
      accent: read("--color-accent") || FALLBACK_COLORS[theme].accent,
      ink: read("--color-ink") || FALLBACK_COLORS[theme].ink,
      inkMuted: read("--color-ink-muted") || FALLBACK_COLORS[theme].inkMuted,
      border: read("--color-border") || FALLBACK_COLORS[theme].border,
      surface: read("--color-surface") || FALLBACK_COLORS[theme].surface,
    };
  }, [theme]);
}

const FALLBACK_COLORS = {
  light: {
    accent: "#2563eb",
    ink: "#0f172a",
    inkMuted: "#64748b",
    border: "#e2e8f0",
    surface: "#ffffff",
  },
  dark: {
    accent: "#60a5fa",
    ink: "#e2e8f0",
    inkMuted: "#94a3b8",
    border: "#1f2937",
    surface: "#111827",
  },
} as const;
