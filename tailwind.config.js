/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'graphik': ['Graphik', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'matter': ['Matter', 'system-ui', '-apple-system', 'sans-serif'],
        'calluna': ['Calluna', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      screens: {
        'xs': '481px',
        'desktop': '814px',
      },
    },
  },
  plugins: [],
}
