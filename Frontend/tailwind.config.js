/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  // CRITICAL FIX: Safelist dynamic classes so Tailwind JIT doesn't exclude them
  safelist: [
    {
      pattern: /bg-(indigo|green|yellow)-(500|600|700)/,
    },
    {
      pattern: /border-(indigo|green|yellow)-(500|600)/,
    },
    {
      pattern: /text-(indigo|green|yellow)-(600|700|800)/,
    }
  ],
  plugins: [],
}
