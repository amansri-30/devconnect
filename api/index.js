// Vercel serverless entrypoint. Exports the Express app (never calls
// app.listen). MongoDB connection is cached and reused across cold starts so
// we don't open a new connection on every invocation.
require('dotenv').config();

const mongoose = require('mongoose');
const { MONGO_URI, JWT_SECRET } = require('../config/keys');
const app = require('../app');

let cachedDb = null;
let lastError = null;

async function connectDB() {
  if (!MONGO_URI) {
    throw new Error(
      'MONGO_URI is not set. Add it in Vercel -> Settings -> Environment Variables.'
    );
  }

  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  cachedDb = await mongoose.connect(MONGO_URI);

  return cachedDb;
}

// Warm up the database connection before handling the request. Unlike before,
// a failed connection is NOT swallowed: the error is surfaced so the resulting
// 500 clearly reports the root cause instead of an opaque "Server error".
const handler = async (req, res) => {
  try {
    await connectDB();
    lastError = null;
  } catch (err) {
    lastError = err;
    console.error('[api/index.js] MongoDB connection error:', err.message);
  }

  return app(req, res);
};

// Expose connection state for diagnostics (used by /api/health).
handler.getDbState = () => ({
  connected: mongoose.connection.readyState === 1,
  readyState: mongoose.connection.readyState, // 0 disconnected, 1 connected, 2 connecting, 3 disconnecting
  lastError: lastError ? lastError.message : null,
  mongoUriSet: Boolean(MONGO_URI),
  jwtSecretSet: Boolean(JWT_SECRET)
});

module.exports = handler;
