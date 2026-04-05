// middleware/errorHandler.js
// Global error handler — catches any error passed to next(err)

const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // Validation errors from express-validator
  if (err.type === "validation") {
    return res.status(422).json({
      error: "Validation failed",
      details: err.errors,
    });
  }

  // Firebase errors
  if (typeof err.code === "string" && err.code.startsWith("auth/")) {
    return res.status(400).json({ error: err.message });
  }

  // Default server error
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

/**
 * Wrap async route handlers to catch promise rejections
 * Usage: router.get("/", asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, asyncHandler };
