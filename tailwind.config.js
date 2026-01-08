/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'graphik': ['Graphik', 'sans-serif'],
        'matter': ['Matter', 'sans-serif'],
        'calluna': ['Calluna', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
