/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12202f",
        steel: "#45576b",
        mist: "#eef2f6",
        leaf: "#14835a",
        clay: "#c0582f",
      },
      boxShadow: {
        panel: "0 1px 2px rgba(10, 25, 41, 0.08), 0 8px 24px rgba(10, 25, 41, 0.04)",
      },
    },
  },
  plugins: [],
};
