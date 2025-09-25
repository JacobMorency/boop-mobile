/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: {
          dark: "#ffd5d3", // oklch(0.92 0.075 20)
          DEFAULT: "#ffe7e6", // oklch(0.96 0.075 20)
          light: "#ffffff", // oklch(1 0.075 20)
        },
        text: {
          DEFAULT: "#230001", // oklch(0.15 0.15 20)
          muted: "#860f23", // oklch(0.4 0.15 20)
        },
        highlight: "#ffffff", // oklch(1 0.15 20)
        border: {
          DEFAULT: "#ca545a", // oklch(0.6 0.15 20)
          muted: "#ed7477", // oklch(0.7 0.15 20)
        },
        primary: "#860f23", // oklch(0.4 0.15 20)
        secondary: "#00555a", // oklch(0.4 0.15 200)
        danger: "#a8372a", // oklch(0.5 0.15 30)
        warning: "#746300", // oklch(0.5 0.15 100)
        success: "#007a46", // oklch(0.5 0.15 160)
        info: "#2a5fb7", // oklch(0.5 0.15 260)
      },
    },
  },
  plugins: [],
};
