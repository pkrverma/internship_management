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

// CORS whitelist
// Parse comma-separated CORS origins from env
function parseOrigins(envValue) {
  if (!envValue) return [];
  return envValue
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

const allowedOrigins = parseOrigins(process.env.CORS_ORIGINS);

// Example: CORS_ORIGINS="http://localhost:3000, http://127.0.0.1:3000, https://your-frontend.vercel.app"
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, Postman) or whitelisted origins
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
  })
);

// Parsers and rate limit
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// DB
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/internships", internshipRoutes);

app.get("/", (req, res) => {
  res.send("Internship Management API is running 🚀");
});

// Global error handler
app.use(errorHandler);

module.exports = app;
