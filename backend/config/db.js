const mongoose = require("mongoose");

const mongoURI =
    process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/bitebuddy";

const MAX_RETRY_DELAY = 5000;

mongoose.set("strictQuery", true);

async function connectWithRetry(delay = 1000) {
    try {
        await mongoose.connect(mongoURI);

        console.log("✅ Connected to MongoDB");
    } catch (err) {
        console.error("❌ MongoDB connection failed:", err.message);
        console.log(`Retrying in ${delay / 1000} second(s)...`);

        setTimeout(() => {
            connectWithRetry(Math.min(delay * 2, MAX_RETRY_DELAY));
        }, delay);
    }
}

// Start connection
connectWithRetry();

const db = mongoose.connection;

// Connection opened
db.on("open", async () => {
    console.log("📦 MongoDB connection opened");
    try {
        await mongoose.connection.collection('mealplans').dropIndex('userId_1_diet_1');
        console.log("✅ Successfully dropped stale unique index userId_1_diet_1");
    } catch (err) {
        // Stale index already dropped or not present
    }
});

// Connection error
db.on("error", (err) => {
    console.error("❌ MongoDB error:", err);
});

// Connection closed
db.on("close", () => {
    console.log("⚠️ MongoDB connection closed");
});

// Connection disconnected
db.on("disconnected", () => {
    console.log("⚠️ MongoDB disconnected");
});

// Keep the connection alive
db.on("connected", () => {
    console.log("✅ MongoDB connected");
});

// Graceful shutdown
process.on("SIGINT", async () => {
    try {
        await mongoose.connection.close();
        console.log("🛑 MongoDB connection closed due to app termination");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
});

module.exports = mongoose;
