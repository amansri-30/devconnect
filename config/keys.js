// Centralized configuration. Values come from environment variables so that
// secrets are never committed to the repository.
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production.');
}

module.exports = {
  MONGO_URI: process.env.MONGO_URI,
  // Development-only default so the app runs out of the box; always set a real
  // value in production.
  JWT_SECRET:
    process.env.JWT_SECRET || (isProduction ? '' : 'devconnect_dev_secret'),
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET
};
