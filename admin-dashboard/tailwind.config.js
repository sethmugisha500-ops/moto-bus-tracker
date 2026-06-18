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
        primary: '#00C26F',
        primaryDark: '#00A05C',
        dark: '#0A0F0C',
        darkCard: '#1A1E1C',
        darkInput: '#2A2E2C',
        muted: '#888888',
        border: '#2A2E2C',
      },
    },
  },
  plugins: [],
}