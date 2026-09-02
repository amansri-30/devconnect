require('dotenv').config();
const express = require('express'); // body parser is part of express
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const path = require('path');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

// Connect Database
connectDB();

// Security headers
app.use(helmet());

// Trust proxy so rate limiting works correctly behind a reverse proxy / Heroku
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

// Serve static assets if in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

// API 404 handler
app.use('/api', notFound);

// Central error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running on port ${PORT}`));
