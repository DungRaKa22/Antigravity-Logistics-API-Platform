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
        'hairline-mid': '#e2e2e2',
        'surface-pressed': '#e2e2e2',
        body: '#5e5e5e',
        mute: '#afafaf',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'pill': '9999px',
        'xl': '16px',
        '2xl': '24px',
      },
      spacing: {
        'xxs': '4px',
        'xs': '6px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px',
        'section-margin': '64px',
      }
    },
  },
  plugins: [],
}
