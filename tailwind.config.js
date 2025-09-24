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
        'game-layout-sm': '1fr 380px',
        'game-layout-md': '1fr 420px',
        'game-layout-lg': '2fr 1fr',
        'game-layout-xl': '3fr 2fr',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}