import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--font-playfair)", "serif"],
        body: ["var(--font-karla)", "sans-serif"]
      },
      colors: {
        ink: "oklch(21% 0.016 235)",
        paper: "oklch(97.5% 0.002 240)",
        panel: "oklch(100% 0 0)",
        line: "oklch(91% 0.005 240)",
        muted: "oklch(55% 0.025 235)",
        signal: "oklch(57% 0.14 176)",
        cobalt: "oklch(48% 0.13 250)",
        orange: "#F97316",
        rose: "oklch(59% 0.16 18)"
      },
      boxShadow: {
        soft: "0 16px 45px rgb(22 31 44 / 0.08)",
        glow: "0 0 20px rgba(249, 115, 22, 0.3)",
        "glow-hover": "0 0 30px rgba(249, 115, 22, 0.45)"
      },
      keyframes: {
        fadeSlideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        gradientGlow: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" }
        },
        pulseSoft: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.15)", opacity: "0.7" }
        },

      },
      animation: {
        "fade-slide-up": "fadeSlideUp 500ms ease-out both",
        "fade-slide-up-1": "fadeSlideUp 500ms ease-out 80ms both",
        "fade-slide-up-2": "fadeSlideUp 500ms ease-out 160ms both",
        "fade-slide-up-3": "fadeSlideUp 500ms ease-out 240ms both",
        "fade-slide-up-4": "fadeSlideUp 500ms ease-out 320ms both",
        "gradient-glow": "gradientGlow 3s ease infinite",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",

      }
    }
  },
  plugins: []
};

export default config;
