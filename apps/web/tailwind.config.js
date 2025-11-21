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
        background: '#121212',
        primary: '#00C2FF',
        secondary: '#1F1F1F',
        divider: '#2A2A2A',
        textPrimary: '#FFFFFF',
        textSecondary: '#AAAAAA',
        highlight: '#FF6C00',
        success: '#00FF99',
        error: '#FF3366',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
