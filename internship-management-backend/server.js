// Load environment variables first

// At the VERY top of server.js
process.on("uncaughtException", err => {
  console.error("🔥 Uncaught exception:", err);
  console.error(err.stack);
});
process.on("unhandledRejection", err => {
  console.error("🔥 Unhandled rejection:", err);
});

const dotenv = require("dotenv");
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// Import the express app
const app = require("./src/app");

// For Vercel: export the app (no listen)
module.exports = app;

// For local development: start server if run directly
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running locally at http://localhost:${PORT}`);
  });
}
