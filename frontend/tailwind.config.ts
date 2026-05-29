import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Warm cream-and-coral palette ("Style B").
        // Each token resolves to a CSS var so dark mode is a class flip.
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        "surface-2": "var(--color-surface-2)",
        "surface-3": "var(--color-surface-3)",
        ink: {
          DEFAULT: "var(--color-ink)",
          muted: "var(--color-ink-2)",
          faint: "var(--color-ink-3)",
          disabled: "var(--color-ink-4)",
        },
        rule: "var(--color-rule)",
        "rule-strong": "var(--color-rule-strong)",
        accent: {
          DEFAULT: "var(--color-accent)",
          soft: "var(--color-accent-soft)",
          ink: "var(--color-accent-ink)",
        },
        good: {
          DEFAULT: "var(--color-good)",
          soft: "var(--color-good-soft)",
        },
        warn: {
          DEFAULT: "var(--color-warn)",
          soft: "var(--color-warn-soft)",
        },
        bad: {
          DEFAULT: "var(--color-bad)",
          soft: "var(--color-bad-soft)",
        },
        // Aliases preserved for components that already use them.
        border: "var(--color-rule)",
        success: "var(--color-good)",
        warning: "var(--color-warn)",
        danger: "var(--color-bad)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      borderRadius: {
        // Aligns with the design system's 8 / 12 / 16 / 20 scale.
        "mb-1": "8px",
        "mb-2": "12px",
        "mb-3": "16px",
        "mb-4": "20px",
      },
      boxShadow: {
        // Soft, low-contrast — fintech card look.
        card: "0 1px 0 rgba(0,0,0,0.02)",
        "card-lg": "0 2px 6px rgba(31, 27, 22, 0.04), 0 1px 0 rgba(0,0,0,0.02)",
      },
    },
  },
  plugins: [],
};

export default config;
