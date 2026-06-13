/**
 * src/middleware/logger.js
 * Request Logger Middleware.
 * Logs every incoming request to the console with method, path, and timestamp.
 */

const logger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
};

module.exports = logger;
