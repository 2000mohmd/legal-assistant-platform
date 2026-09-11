import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        primary: {
          DEFAULT: "var(--primary)",
          tint: "var(--primary-tint)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          tint: "var(--accent-tint)",
        },
        secondary: "var(--secondary)",
        body: "var(--text)",
        muted: "var(--text-muted)",
        line: "var(--line)",
      },
      fontFamily: {
        sans: ["var(--font-body)", "sans-serif"],
        serif: ["var(--font-display)", "serif"],
      },
      borderRadius: {
        card: "0.875rem",
      },
    },
  },
  plugins: [],
};

export default config;
