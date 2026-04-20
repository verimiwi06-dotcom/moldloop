import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050810", // Deep navy/black from OpenClaw
        foreground: "#f0f4ff", // Off-white text
        accent: {
          coral: "#ef4b58", // OpenClaw Coral
          cyan: "#008f87",  // OpenClaw Cyan/Teal
        },
        card: {
          bg: "rgba(10, 15, 26, 0.8)",
          border: "rgba(136, 146, 176, 0.15)",
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Clash Display", "Inter", "sans-serif"],
        mono: ["SF Mono", "Fira Code", "ui-monospace", "monospace"],
      },
      animation: {
        "crt-flicker": "flicker 0.15s infinite",
        "scanline": "scanline 8s linear infinite",
        "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        flicker: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.97" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 20px rgba(239, 75, 88, 0.4)" },
          "50%": { opacity: "0.8", boxShadow: "0 0 10px rgba(239, 75, 88, 0.2)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        }
      },
    },
  },
  plugins: [],
};
export default config;
