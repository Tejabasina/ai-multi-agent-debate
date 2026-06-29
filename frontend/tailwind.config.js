/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0b0f19',
        cardBg: 'rgba(17, 24, 39, 0.7)',
        accentPro: '#ff5e57',   // Agent A color
        accentCon: '#00d2d3',   // Agent B color
        accentJudge: '#ffb8b8', // Judge color
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
