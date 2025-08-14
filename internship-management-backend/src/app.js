const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

const adminAuthRoutes = require("./routes/adminAuthRoutes");
const authRoutes = require("./routes/authRoutes");
const internshipRoutes = require("./routes/internshipRoutes");
const errorHandler = require("./middleware/errorHandler");
const statsRoutes = require("./routes/statsRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

app.set("trust proxy", 1);

// Security headers
app.use(helmet());

// Parse allowed CORS origins from env
function parseOrigins(envValue) {
  if (!envValue) return [];
  return envValue
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

const allowedOrigins = parseOrigins(process.env.CORS_ORIGINS || "");
console.log("🌐 Allowed CORS origins:", allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.log("❌ CORS blocked origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.options(/.*/, cors());

// Parse JSON body
app.use(express.json());

// Rate limiter
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/internships", internshipRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin/auth", adminAuthRoutes);


// Health check
app.get("/", (req, res) => {
  res.send("Internship Management API is running 🚀");
});

app.all(/.*/, (req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// Error handler
app.use(errorHandler);

module.exports = app;
