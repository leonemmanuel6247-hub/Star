/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.tsx',
    './src/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        star: {
          primary: '#6366f1',
          accent: '#a855f7',
          bg: '#0f172a',
          surface: '#1e293b',
          surface2: '#334155',
          text: '#f1f5f9',
          subtext: '#94a3b8',
          border: '#475569',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
        },
      },
    },
  },
  plugins: [],
};
