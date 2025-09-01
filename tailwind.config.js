/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-dark': '#131313',
        'brand-gray': '#1e1f22',
        'brand-light-gray': '#2b2d31',
        'brand-green': '#a8ff00',
        'brand-red': '#f84339',
        'brand-text': '#c3c3c3',
        'brand-purple': '#a78bfa',
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
      },
      boxShadow: {
          'green-glow': '0 0 15px rgba(168, 255, 0, 0.5)',
          'red-glow': '0 0 15px rgba(248, 67, 57, 0.5)',
      },
      animation: {
        'fade-in-slide-up': 'fadeInSlideUp 0.7s ease-out forwards',
        'pulse-indicator': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
      },
      keyframes: {
        fadeInSlideUp: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.5)', opacity: '0.5' },
        },
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        scaleIn: {
          'from': { transform: 'scale(0.95)', opacity: '0' },
          'to': { transform: 'scale(1)', opacity: '1' },
        },
      }
    },
  },
  plugins: [],
}
