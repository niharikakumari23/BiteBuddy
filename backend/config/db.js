const mongoose = require("mongoose");

mongoose.set("strictQuery", true);

let isConnected = false;

async function connectDB() {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoURI && (process.env.VERCEL || process.env.NODE_ENV === 'production')) {
        throw new Error("MONGODB_URI environment variable is missing in Vercel Project Settings.");
    }

    let uriToUse = mongoURI || "mongodb://localhost:27017/BiteBuddy";

    // Fix MongoDB Atlas database name casing & default missing db name
    if (uriToUse.includes('/bitebuddy')) {
        uriToUse = uriToUse.replace('/bitebuddy', '/BiteBuddy');
    } else if (uriToUse.includes('.mongodb.net/?')) {
        uriToUse = uriToUse.replace('.mongodb.net/?', '.mongodb.net/BiteBuddy?');
    } else if (uriToUse.includes('.mongodb.net/test?')) {
        uriToUse = uriToUse.replace('.mongodb.net/test?', '.mongodb.net/BiteBuddy?');
    } else if (uriToUse.endsWith('mongodb.net') || uriToUse.endsWith('mongodb.net/')) {
        uriToUse = uriToUse.replace(/\/+$/, '') + '/BiteBuddy';
    }

    if (mongoose.connection.readyState >= 1) {
        return mongoose.connection;
    }

    try {
        const db = await mongoose.connect(uriToUse, {
            serverSelectionTimeoutMS: 10000,
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
