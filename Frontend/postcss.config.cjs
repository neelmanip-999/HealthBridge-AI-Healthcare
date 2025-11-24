// HealthBridge/frontend/postcss.config.cjs
module.exports = {
  plugins: {
    // 🛑 We are now using the correct package for PostCSS integration
    '@tailwindcss/postcss': {}, 
    autoprefixer: {},
  },
}