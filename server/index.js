// index.js — Main Express server entry point
require("dotenv").config();

// Force IPv4 DNS resolution (Fixes NodeMailer hanging on Render due to IPv6 drops)
require('node:dns').setDefaultResultOrder('ipv4first');

const express = require("express");
const cors = require("cors");
const { errorHandler } = require("./middleware/errorHandler");

// Initialize Firebase (must be done before importing routes)
require("./config/firebase");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Automatically accept any variation of ijeeqt.org (with or without www), vercel domains, and localhost
    if (
      origin.includes("ijeeqt.org") || 
      origin.includes("vercel.app") || 
      origin.startsWith("http://localhost:")
    ) {
      return callback(null, true);
    }

    const clientUrl = (process.env.CLIENT_URL || "").replace(/\/$/, ""); // removes trailing slash if user added it accidentally
    if (origin === clientUrl) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
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
app.use("/api/reviewer", require("./routes/reviewer"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/content", require("./routes/content"));
app.use("/api/contact", require("./routes/contact"));

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
