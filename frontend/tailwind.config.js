/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0d0c22',
        text: '#e0e0e0',
        primary: '#00f5c3',
        secondary: '#7f5af0',
        accent: '#2cb67d',
      },
      boxShadow: {
        'neon-glow': '0 0 15px rgba(0, 245, 195, 0.3), 0 0 5px rgba(0, 245, 195, 0.2)',
      }
    },
  },
  plugins: [],
}
