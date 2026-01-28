/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'graphik': ['Graphik', 'Noto Sans KR', 'Noto Sans JP', 'Noto Sans SC', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'matter': ['Matter', 'Noto Sans KR', 'Noto Sans JP', 'Noto Sans SC', 'system-ui', '-apple-system', 'sans-serif'],
        'calluna': ['Calluna', 'Noto Sans KR', 'Noto Sans JP', 'Noto Sans SC', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
}
