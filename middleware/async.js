// Wraps async route handlers so unhandled promise rejections are forwarded to
// the centralized error handler instead of crashing the process.
const asyncHandler =
  (fn) =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
