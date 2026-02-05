const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      console.warn(" MONGO_URI not found. Running without database connection.");
      return;
    }
    await mongoose.connect(mongoURI);
    console.log(" MongoDB connected successfully");
  } catch (err) {
    console.error(" MongoDB connection failed:", err.message);
    console.warn("  Continuing without database. Some features may not work.");
    // Don't exit - allow server to run without DB for development
  }
};

module.exports = connectDB;
