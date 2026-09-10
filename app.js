require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const mongoose = require('mongoose');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

// Security headers
app.use(helmet());

// Trust proxy so rate limiting works correctly behind a reverse proxy / Vercel
app.set('trust proxy', 1);

// Limit repeated requests to public/ auth endpoints against brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { msg: 'Too many requests, please try again later.' }
});

// Body parser middleware
app.use(express.json({ extended: false }));

// Use Routes
app.use('/api/auth', authLimiter, require('./routes/api/auth'));
app.use('/api/users', authLimiter, require('./routes/api/users'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));

// Health check endpoint (public) - useful for diagnosing the most common
// serverless failures (missing env vars, DB connectivity).
app.get('/api/health', (req, res) => {
  const state = {
    status: 'ok',
    time: new Date().toISOString(),
    env: {
      mongoUriSet: Boolean(process.env.MONGO_URI),
      jwtSecretSet: Boolean(process.env.JWT_SECRET),
      githubClientIdSet: Boolean(process.env.GITHUB_CLIENT_ID),
      nodeEnv: process.env.NODE_ENV
    },
    database: {
      connected: mongoose.connection.readyState === 1,
      readyState: mongoose.connection.readyState,
      mongooseVersion: mongoose.version
    },
    message: null
  };

  if (!state.env.mongoUriSet) {
    state.status = 'error';
    state.message =
      'MONGO_URI is not set. Add it in Vercel -> Settings -> Environment Variables and redeploy.';
  } else if (!state.env.jwtSecretSet) {
    state.status = 'error';
    state.message =
      'JWT_SECRET is not set. Add it in Vercel -> Settings -> Environment Variables and redeploy.';
  } else if (!state.database.connected) {
    state.status = 'error';
    state.message =
      'Database is not connected. Check MONGO_URI and that MongoDB allows Vercel IPs.';
  }

  res.status(state.status === 'ok' ? 200 : 503).json(state);
});

// API 404 handler - mounted BEFORE the SPA catch-all so unknown /api routes
// return JSON instead of the frontend's index.html.
app.use('/api', notFound);

// Serve static assets if in production (local `npm start` builds)
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, 'client', 'build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

// Central error handler
app.use(errorHandler);

module.exports = app;
