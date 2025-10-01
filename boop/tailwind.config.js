/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Lilac-forward color scheme
        bg: {
          dark: "#ede9fe", // lilac-tinted canvas (violet-100)
          DEFAULT: "#f5f3ff", // light lilac (violet-50)
          light: "#ffffff",
        },
        text: {
          DEFAULT: "#2e1065", // deep indigo/violet for strong contrast
          muted: "#6d28d9", // violet-700 for secondary text
        },
        highlight: "#ffffff",
        border: {
          DEFAULT: "#c4b5fd", // violet-300
          muted: "#ddd6fe", // violet-200
        },
        primary: "#c8a2c8", // lilac
        secondary: "#8b5cf6", // violet-500 accent
        danger: "#ef4444", // keep standard semantic colors
        warning: "#f59e0b",
        success: "#10b981",
        info: "#3b82f6",
      },
    },
  },
  plugins: [],
};
