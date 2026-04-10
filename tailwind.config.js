/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Brand colors — Vàng Heo Đất
        brand: {
          red: '#D4001A', // Đỏ tết — màu chính
          gold: '#FFD700', // Vàng
          'gold-dark': '#B8960C',
        },
        piggy: {
          pink: '#FFB3C6', // Màu heo đất
          'pink-dark': '#FF85A1',
        },
      },
      fontFamily: {
        // Thêm custom fonts khi có
      },
    },
  },
  plugins: [],
}
