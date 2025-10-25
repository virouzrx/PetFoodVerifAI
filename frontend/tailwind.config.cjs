const config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#1d4ed8',
          secondary: '#2563eb',
          accent: '#f97316',
        },
      },
    },
  },
  plugins: [],
}

module.exports = config
