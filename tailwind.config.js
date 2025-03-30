module.exports = {
  theme: {
    // ...
  },
  plugins: [
    // ... existing plugins
  ],
  extend: {
    utilities: {
      '.scrollbar-hide': {
        /* Firefox */
        'scrollbar-width': 'none',
        /* Safari and Chrome */
        '&::-webkit-scrollbar': {
          display: 'none'
        },
        /* IE and Edge */
        '-ms-overflow-style': 'none'
      }
    }
  }
} 