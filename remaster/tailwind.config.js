/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        '4xl': '32px',
      },
      colors: {
        pastel: {
          blue: '#f0f4ff',
          red: '#fff1f1',
          green: '#f1fff1',
          orange: '#fff8f1',
          purple: '#f5f1ff',
        }
      },
      boxShadow: {
        soft: '0 4px 20px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
};
