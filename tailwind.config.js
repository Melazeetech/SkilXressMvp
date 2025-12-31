/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#ffffff',
        secondary: {
          orange: '#f57c00',
          yellow: '#ffeb3b',
          cyan: '#00BCD4',
          black: '#000000',
        }
      },
      fontFamily: {
        balthazar: ['Balthazar', 'serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        }
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
      }
    },
  },
  plugins: [],
};
