/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Fikisha design tokens — see /frontend/src/styles/tokens.css for the
        // canonical source; duplicated here so Tailwind utilities can use them.
        ink: {
          DEFAULT: '#1A1A17',
        },
        forest: {
          DEFAULT: '#0E3B2C',
          deep: '#0A2C21',
        },
        cream: '#F5F2EA',
        sage: '#B9CBBC',
        amber: '#C68A2E',
        rust: '#B23A2E',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
