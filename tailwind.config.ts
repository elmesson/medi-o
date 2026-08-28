import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}", "./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdf4",
          100: "#dcfce7",
          500: "#00A868",
          600: "#059669",
          700: "#047857",
          900: "#022c22"
        },
        ink: "#0f172a",
        muted: "#64748b"
      },
      fontFamily: { sans: ["Inter","system-ui","sans-serif"] },
      borderRadius: { "2xl": "1rem", "3xl": "1.5rem" }
    }
  },
  plugins: []
};
export default config;
