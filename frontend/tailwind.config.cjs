const config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#BC6C25',
          secondary: '#FEFAE0',
          accent: '#DDA15E',
          tertiary: '#606C38',
          dark: '#283618',
        },
      },
    },
  },
  plugins: [],
}

module.exports = config
