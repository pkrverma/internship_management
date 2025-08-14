const mongoose = require("mongoose");

let isConnected = false; // Track state for serverless

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error(
      "❌ MONGO_URI is not defined. Check your environment variables (.env)"
    );
  }

  if (isConnected) {
    console.log("⚡ MongoDB already connected.");
    return;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = conn.connections[0].readyState === 1;
    console.log(
      `✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`
    );
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    if (process.env.NODE_ENV !== "production") {
      process.exit(1);
    } else {
      throw error;
    }
  }
};

module.exports = connectDB;
