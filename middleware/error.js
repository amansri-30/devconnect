// 404 handler for unmatched API routes
const notFound = (req, res, next) => {
  res.status(404).json({ msg: `Route not found: ${req.originalUrl}` });
};

// Centralized error handler
const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err.message);

  // If the response has already begun, delegate to the default handler
  if (res.headersSent) {
    return next(err);
  }

  res.status(err.statusCode || 500).json({
    msg: err.expose ? err.message : 'Server error'
  });
};

module.exports = { notFound, errorHandler };
