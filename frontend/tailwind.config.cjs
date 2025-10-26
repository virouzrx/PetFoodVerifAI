const config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#3E5641',
          secondary: '#83BCA9',
          accent: '#D36135',
          tertiary: '#A24936',
          dark: '#282B28',
        },
      },
    },
  },
  plugins: [],
}

module.exports = config
