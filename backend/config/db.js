const mongoose = require("mongoose");

mongoose.set("strictQuery", true);

let isConnected = false;

async function connectDB() {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoURI && (process.env.VERCEL || process.env.NODE_ENV === 'production')) {
        throw new Error("MONGODB_URI environment variable is missing in Vercel Project Settings.");
    }

    let uriToUse = mongoURI || "mongodb://localhost:27017/BiteBuddy";

    // Fix MongoDB Atlas database name casing mismatch (bitebuddy vs BiteBuddy)
    if (uriToUse.includes('/bitebuddy')) {
        uriToUse = uriToUse.replace('/bitebuddy', '/BiteBuddy');
    }

    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    try {
        const db = await mongoose.connect(uriToUse, {
            serverSelectionTimeoutMS: 5000,
        });
        isConnected = true;
        console.log("✅ Connected to MongoDB:", uriToUse.replace(/\/\/.*@/, '//***:***@'));
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
