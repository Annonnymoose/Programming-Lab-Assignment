/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          900: '#0F172A',
          800: '#1F2937', // base dark background
          700: '#374151', // card secondary surface
          600: '#4B5563',
          500: '#6B7280',
        },
        surface: {
          dark: '#111827',
          card: '#1F2937',
          lighter: '#374151',
          border: '#374151',
        },
        gold: {
          400: '#FACC15',
          500: '#EAB308',
          600: '#D4A017', // brand warm gold
          700: '#B45309',
          glow: 'rgba(212, 160, 23, 0.35)',
        },
        salon: {
          bg: '#1F2937',
          card: '#111827',
          border: '#374151',
          accent: '#D4A017',
          text: '#F9FAFB',
          muted: '#9CA3AF',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
        }
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
}
