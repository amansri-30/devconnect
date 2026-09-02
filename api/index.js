// Vercel serverless entrypoint. Exports the Express app (never calls
// app.listen). MongoDB connection is cached and reused across cold starts so
// we don't open a new connection on every invocation.
require('dotenv').config();

const mongoose = require('mongoose');
const { MONGO_URI } = require('../config/keys');
const app = require('../app');

let cachedDb = null;

async function connectDB() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  cachedDb = await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  return cachedDb;
}

// Warm up the database connection before handling the request.
const handler = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
  }

  return app(req, res);
};

module.exports = handler;
