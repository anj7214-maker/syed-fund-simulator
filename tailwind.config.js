/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        terminal: ["Inter", "ui-sans-serif", "system-ui"],
        mono: ["JetBrains Mono", "Consolas", "monospace"],
      },
      colors: {
        terminal: {
          ink: "#d6e2ea",
          muted: "#78909d",
          panel: "#0f171b",
          panel2: "#142025",
          line: "#263940",
          green: "#26d07c",
          red: "#ff5a6a",
          amber: "#f3bf45",
          cyan: "#47d5e7"
        }
      }
    },
  },
  plugins: [],
};
