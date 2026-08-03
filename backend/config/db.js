const mongoose = require("mongoose");

const mongoURI =
    process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/bitebuddy";

mongoose.set("strictQuery", true);

let isConnected = false;

async function connectDB() {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (isConnected) {
        return mongoose.connection;
    }

    try {
        const db = await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000,
        });
        isConnected = true;
        console.log("✅ Connected to MongoDB");
        return db;
    } catch (err) {
        console.error("❌ MongoDB connection failed:", err.message);
        throw err;
    }
}

// Auto-connect for local environment
connectDB().catch(err => {
    console.log("Initial DB connection attempt:", err.message);
});

module.exports = {
    mongoose,
    connectDB
};
