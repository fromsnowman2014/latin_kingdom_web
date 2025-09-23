/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'game-primary': '#2D5A27',
        'game-secondary': '#8B4513',
        'game-accent': '#FFD700',
        'game-danger': '#DC2626',
        'game-success': '#16A34A',
      },
      fontFamily: {
        'game': ['Cinzel', 'serif'],
      },
      gridTemplateColumns: {
        'game-layout': '1fr 320px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}