import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        axis: {
          black: "#000000",
          ink: "#1d1d1f",
          bg: "#f5f5f7",
          white: "#ffffff",
          blue: "#0071e3",
          link: "#0066cc",
          muted: "#6e6e73",
          border: "#d2d2d7",
          "border-strong": "#86868b"
        }
      },
      fontFamily: {
        sans: ["Pretendard", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
