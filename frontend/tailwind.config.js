/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        srm: {
          green: '#70b830',
          red: '#c01818',
          navy: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        srm: '0 8px 30px rgb(0 0 0 / 0.04)',
      },
    },
  },
  plugins: [],
}
