/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      borderWidth: {
        DEFAULT: '0.5px',
        '0': '0px',
        '2': '2px',
        '4': '4px',
        '8': '8px',
      },
    },
  },
}
