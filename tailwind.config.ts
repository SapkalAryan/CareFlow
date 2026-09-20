import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          800: '#07476b',
          900: '#0c3a57',
        },
        medical: {
          blue: '#0284c7',
          slate: '#475569',
          light: '#f8fafc',
          green: '#16a34a',
          emerald: '#059669',
          amber: '#d97706',
          rose: '#e11d48',
        }
      },
    },
  },
  plugins: [],
};
export default config;
