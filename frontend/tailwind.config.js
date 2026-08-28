/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}", "./tests/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Figtree", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Newsreader", "ui-serif", "Georgia", "serif"],
      },
      colors: {
        ink: {
          DEFAULT: "#1F1B16",
          muted: "#6F675E",
          faint: "#A39B90",
        },
        paper: {
          DEFAULT: "#F6F1E8",
          raised: "#FFFBF4",
          sunken: "#EFE8DC",
        },
        line: "#E4D9C8",
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          hover: "rgb(var(--accent-hover) / <alpha-value>)",
          soft: "rgb(var(--accent-soft) / <alpha-value>)",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(31, 27, 22, 0.04), 0 8px 24px rgba(31, 27, 22, 0.04)",
      },
    },
  },
  plugins: [],
};
