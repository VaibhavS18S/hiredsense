/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F7F7F4',
        ink: {
          DEFAULT: '#171A21',
          light: '#2E333D',
          muted: '#626875',
          subtle: '#8C92A0',
        },
        forest: {
          50: '#F0F7F4',
          100: '#DDEFE7',
          200: '#BDDFD2',
          300: '#90C7B4',
          400: '#4D9C82',
          500: '#176B52',
          600: '#135742',
          700: '#0F4434',
          800: '#0B3327',
          900: '#072119',
        },
        sage: {
          50: '#F6F9F7',
          100: '#E8F0EA',
          200: '#D5E2D8',
          300: '#BFD3C4',
          400: '#9EBDB5',
        },
        warning: {
          amber: '#D97706',
          surface: '#FEF3C7',
          border: '#FDE68A',
        },
        border: {
          light: '#EBECE8',
          DEFAULT: '#E2E4DE',
          dark: '#CFD2C8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        editorial: ['Charter', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(23, 26, 33, 0.04), 0 1px 2px -1px rgba(23, 26, 33, 0.04)',
        card: '0 2px 5px -1px rgba(23, 26, 33, 0.06), 0 1px 3px -1px rgba(23, 26, 33, 0.04)',
        dropdown: '0 10px 25px -5px rgba(23, 26, 33, 0.08), 0 8px 10px -6px rgba(23, 26, 33, 0.04)',
        hover: '0 6px 16px -2px rgba(23, 26, 33, 0.08), 0 3px 6px -3px rgba(23, 26, 33, 0.05)',
      }
    },
  },
  plugins: [],
}
