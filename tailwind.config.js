/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Torr, myndighetsnära ton – dämpad blågrå snarare än reklamglad.
        brand: {
          DEFAULT: '#2b3a4a',
          50: '#f2f5f8',
          100: '#e2e8ee',
          200: '#c3cedb',
          300: '#9aabbe',
          400: '#6c8098',
          500: '#4c6076',
          600: '#3a4b5e',
          700: '#2b3a4a',
          800: '#1f2b37',
          900: '#151d26',
        },
        accent: {
          DEFAULT: '#7a5c1f',
          100: '#f3ead4',
          300: '#d8b866',
          500: '#a8842f',
          700: '#7a5c1f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
