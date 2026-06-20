import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "oklch(21% 0.016 235)",
        paper: "oklch(97% 0.006 230)",
        panel: "oklch(99% 0.004 230)",
        line: "oklch(88% 0.012 230)",
        muted: "oklch(55% 0.025 235)",
        signal: "oklch(57% 0.14 176)",
        cobalt: "oklch(48% 0.13 250)",
        amber: "oklch(74% 0.15 78)",
        rose: "oklch(59% 0.16 18)"
      },
      boxShadow: {
        soft: "0 16px 45px rgb(22 31 44 / 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
