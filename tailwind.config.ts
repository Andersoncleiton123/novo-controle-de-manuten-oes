import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#2563eb",
          600: "#1d4ed8",
          700: "#1e40af",
          900: "#1e3a8a",
        },
        status: {
          emDia: "#16a34a",
          proxima: "#ca8a04",
          atencao: "#ea580c",
          atrasada: "#dc2626",
        },
      },
    },
  },
  plugins: [],
};

export default config;
