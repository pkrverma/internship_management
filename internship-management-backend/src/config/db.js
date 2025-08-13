// src/config/db.js
const mongoose = require("mongoose");

let isConnected = false; // Track the connection state for serverless

/**
 * Connect to MongoDB Atlas
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error(
      "❌ MONGO_URI is not defined. Check your environment variables in Vercel and .env for local."
    );
  }

  if (isConnected) {
    console.log("⚡ MongoDB already connected.");
    return;
  }

  try {
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Fail fast if cannot connect
    });

    isConnected = conn.connections[0].readyState === 1;

    console.log(
      `✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`
    );
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    // In serverless, don't exit process — let the platform handle retries
    if (process.env.NODE_ENV !== "production") {
      process.exit(1);
    } else {
      throw error; // Let Vercel log the function error
    }
  }
};

module.exports = connectDB;
