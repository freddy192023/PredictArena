/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        arena: {
          50:  '#f0f4ff',
          100: '#e0eaff',
          200: '#c0c6ff', // Lavanda suave
          300: '#9b87ff', // Violeta medio
          400: '#7c6aff', // Violeta principal
          500: '#6246ea', // Violeta profundo (primary)
          600: '#4f35c4',
          700: '#3d28a0',
          800: '#2b1d7a',
          900: '#1a1155',
          950: '#0d0830',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'arena-gradient': 'linear-gradient(135deg, #0d0830 0%, #1a1155 50%, #2b1d7a 100%)',
        'card-glass': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        'hero-glow': 'radial-gradient(ellipse at center top, rgba(98,70,234,0.3) 0%, transparent 70%)',
      },
      boxShadow: {
        'arena': '0 0 40px rgba(98, 70, 234, 0.2)',
        'arena-lg': '0 0 80px rgba(98, 70, 234, 0.3)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'glow': '0 0 20px rgba(98, 70, 234, 0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(98, 70, 234, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(98, 70, 234, 0.8)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}
