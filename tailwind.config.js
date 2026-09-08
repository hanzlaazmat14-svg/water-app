/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: 'var(--brand-50, #f0f9ff)',
          100: 'var(--brand-100, #e0f2fe)',
          200: 'var(--brand-200, #bae6fd)',
          300: 'var(--brand-300, #7dd3fc)',
          400: 'var(--brand-400, #38bdf8)',
          500: 'var(--brand-500, #0ea5e9)',
          600: 'var(--brand-600, #0284c7)',
          700: 'var(--brand-700, #0369a1)',
          800: 'var(--brand-800, #075985)',
          900: 'var(--brand-900, #0c4a6e)',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'elevated': '0 10px 25px -5px rgba(2, 132, 199, 0.12), 0 8px 10px -6px rgba(2, 132, 199, 0.08)',
        'float': '0 20px 30px -10px rgba(0, 0, 0, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-subtle': 'pulseSubtle 2.5s infinite ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
      }
    },
  },
  plugins: [],
}
