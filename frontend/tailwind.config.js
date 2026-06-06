/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        card: "var(--card)",
        accent: {
          amber: {
            50: "#fffbeb",
            100: "#fef3c7",
            400: "#fbbf24",
            500: "#f59e0b",
            600: "#d97706",
            DEFAULT: "#f59e0b",
          },
          emerald: {
            50: "#ecfdf5",
            400: "#34d399",
            500: "#10b981",
            600: "#059669",
            DEFAULT: "#10b981",
          },
          violet: {
            50: "#f5f3ff",
            400: "#a78bfa",
            500: "#8b5cf6",
            600: "#7c3aed",
            DEFAULT: "#8b5cf6",
          },
          rose: {
            50: "#fff1f2",
            400: "#fb7185",
            500: "#f43f5e",
            600: "#e11d48",
            DEFAULT: "#f43f5e",
          },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
