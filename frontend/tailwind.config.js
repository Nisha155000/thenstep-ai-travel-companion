/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        step: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        tealbrand: {
          500: '#14b8a6',
          600: '#0d9488',
        },
        accentpurple: {
          500: '#8b5cf6',
          600: '#7c3aed',
        }
      },
      boxShadow: {
        '3d-soft': '0 10px 25px -5px rgba(2, 132, 199, 0.1), 0 8px 10px -6px rgba(2, 132, 199, 0.06)',
        '3d-card': '0 14px 34px -8px rgba(15, 23, 42, 0.08), 0 4px 12px 0 rgba(15, 23, 42, 0.04)',
        '3d-btn': '0 4px 14px 0 rgba(2, 132, 199, 0.35)',
        '3d-inset': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}
