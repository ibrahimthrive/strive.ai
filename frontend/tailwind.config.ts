import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "deep-space": "#09090B",
        "midnight-navy": "#0F172A",
        graphite: "#1E293B",
        "electric-blue": "#2563EB",
        "neural-cyan": "#06B6D4",
        "aurora-violet": "#7C3AED",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        ink: {
          primary: "#F8FAFC",
          secondary: "#CBD5E1",
          muted: "#94A3B8",
          disabled: "#64748B",
        },
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #2563EB, #06B6D4)",
        "gradient-ai": "linear-gradient(135deg, #2563EB, #7C3AED, #06B6D4)",
        "gradient-app": "linear-gradient(180deg, #09090B, #0F172A, #111827)",
        "gradient-user-bubble": "linear-gradient(135deg, #2563EB, #1D4ED8)",
        "gradient-ai-bubble": "linear-gradient(135deg, #1E293B, #0F172A)",
      },
      boxShadow: {
        glow: "0 0 24px rgba(37,99,235,0.35), 0 0 48px rgba(6,182,212,0.25)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
