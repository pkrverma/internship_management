const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const internshipRoutes = require("./routes/internshipRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Security headers
app.use(helmet());

// Parse comma-separated CORS origins from env
function parseOrigins(envValue) {
  if (!envValue) return [];
  return envValue
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

// CORS: allow specific frontend origins
const allowedOrigins = parseOrigins(process.env.CORS_ORIGINS);

// Log allowed origins for debugging (optional)
console.log("🌐 Allowed CORS origins:", allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, Postman) or whitelisted origins
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.log("❌ CORS blocked origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true, // Allow cookies and auth headers
  })
);

// Body parser
app.use(express.json());

// Rate limiter
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
  })
);

// Connect Database
connectDB();

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/internships", internshipRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Internship Management API is running 🚀");
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
