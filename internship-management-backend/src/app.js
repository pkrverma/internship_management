const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const internshipRoutes = require("./routes/internshipRoutes");
const errorHandler = require("./middleware/errorHandler");
const statsRoutes = require("./routes/statsRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

// ✅ Trust first proxy (important for Vercel + rate limiter to work correctly)
app.set("trust proxy", 1);

// ✅ Security headers
app.use(helmet());

/**
 * Utility: parse comma-separated CORS origins from env variable
 */
function parseOrigins(envValue) {
  if (!envValue) return [];
  return envValue
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

// ✅ Read allowed origins from ENV and log them
const allowedOrigins = parseOrigins(process.env.CORS_ORIGINS || "");
console.log("🌐 Allowed CORS origins:", allowedOrigins);

// ✅ CORS middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (Postman, curl, mobile)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.log("❌ CORS blocked origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true, // Allow cookies & Authorization headers
    optionsSuccessStatus: 200, // For legacy browsers
  })
);

// ✅ Pre-flight request handler for all routes (Express 5-safe)
app.options(/.*/, cors());

// ✅ Body parser for JSON
app.use(express.json());

// ✅ Rate limiter (after trust proxy is set)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
  })
);

// ✅ Connect to MongoDB
connectDB();

// ✅ Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/internships", internshipRoutes);

// ✅ Root health check
app.get("/", (req, res) => {
  res.send("Internship Management API is running 🚀");
});

app.use("/api/stats", statsRoutes);

app.use("/api/notifications", notificationRoutes);

// =======================
// Catch-all 404 for unmatched routes (Express 5 safe)
// =======================
app.all(/.*/, (req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// ✅ Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
