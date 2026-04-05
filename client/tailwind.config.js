// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Journal brand colours
        journal: {
          50:  "#eff6ff",
          100: "#dbeafe",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Times New Roman", "serif"],
        sans:  ["system-ui", "Helvetica", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
  safelist: [
    // Dynamic color classes used in Dashboard stats
    "border-blue-500", "border-yellow-500", "border-green-500", "border-emerald-500",
    "text-blue-600", "text-yellow-600", "text-green-600", "text-emerald-600",
  ],
};
