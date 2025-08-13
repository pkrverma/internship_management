// src/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const internshipRoutes = require("./routes/internshipRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Trust first proxy (important for Vercel so rate-limit and IP detection work correctly)
app.set("trust proxy", 1);

// Security headers
app.use(helmet());

/**
 * Utility: parse comma-separated CORS origins from env variable
 * @param {string} envValue - raw env var string
 * @returns {string[]} - list of allowed origins
 */
function parseOrigins(envValue) {
  if (!envValue) return [];
  return envValue
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

// Read and parse allowed origins from environment
const allowedOrigins = parseOrigins(process.env.CORS_ORIGINS);

// Debug log for allowed origins
console.log("🌐 Allowed CORS origins:", allowedOrigins);

// CORS middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g. Postman, curl, mobile)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.log("❌ CORS blocked origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true, // Allow cookies and Authorization headers
  })
);

// Body parser for JSON
app.use(express.json());

// Rate limiter (15 minutes, max 100 requests per IP)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

// Connect to MongoDB
connectDB();

// Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/internships", internshipRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Internship Management API is running 🚀");
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
