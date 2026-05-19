/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#ffffff',
        'canvas-soft': '#efefef',
        'canvas-softer': '#f3f3f3',
        ink: '#000000',
        primary: '#000000',
        'on-primary': '#ffffff',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'pill': '9999px',
        'xl': '16px',
      }
    },
  },
  plugins: [],
}
