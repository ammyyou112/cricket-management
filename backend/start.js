// Production start script with path alias resolution
// Maps @/ paths to dist/ directory for production builds
require('tsconfig-paths').register({
  baseUrl: __dirname,
  paths: {
    '@/*': ['dist/*']  // Map @/ to dist/ in production
  }
});

// Start the server
require('./dist/server.js');

