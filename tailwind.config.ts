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
        ink: "oklch(21% 0.012 160)",
        paper: "oklch(98% 0.004 155)",
        panel: "oklch(99.3% 0.003 155)",
        line: "oklch(88% 0.012 155)",
        muted: "oklch(49% 0.022 160)",
        signal: "oklch(55% 0.115 164)",
        cobalt: "oklch(39% 0.05 165)",
        amber: "oklch(71% 0.13 82)",
        rose: "oklch(58% 0.14 22)"
      },
      boxShadow: {
        soft: "0 18px 48px rgb(36 50 42 / 0.08)",
        diffusion: "0 24px 70px -34px rgb(31 45 38 / 0.22)"
      }
    }
  },
  plugins: []
};

export default config;
