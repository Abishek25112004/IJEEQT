// index.js — Main Express server entry point
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { errorHandler } = require("./middleware/errorHandler");

// Initialize Firebase (must be done before importing routes)
require("./config/firebase");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logger (development)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use("/api/auth", require("./routes/auth"));
app.use("/api/papers", require("./routes/papers"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/content", require("./routes/content"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = app;
