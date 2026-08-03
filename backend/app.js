// backend/app.js

require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require("cors");

// Route imports
const mealsRouter = require('./routes/meals');
const goalsRouter = require('./routes/goals');
const shoppingRouter = require('./routes/shopping');
const mealplanRouter = require('./routes/mealplan');
const profileRouter = require('./routes/profile');
const workoutsRouter = require('./routes/workouts');
const { router: meallogRouter } = require('./routes/meallog');
const generateRouter = require('./routes/generate');
const authRouter = require('./routes/auth');
const foodRouter = require('./routes/food');
const chatRouter = require('./routes/chat');
const waterlogRouter = require('./routes/waterlog');
const analyticsRouter = require('./routes/analytics');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
require('./config/db');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// DB Connection Middleware for Serverless Routines
const { connectDB } = require('./config/db');
app.use(async (req, res, next) => {
  if (req.path === '/' || req.path === '/api/health') return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Database Connection Error:", err.message);
    return res.status(500).json({ error: "Database connection failed. Please check MONGODB_URI on Vercel." });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'BiteBuddy Express Backend API is active', status: 'ok', health: '/api/health' });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/meals', mealsRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/shopping', shoppingRouter);
app.use('/api/mealplan', mealplanRouter);
app.use('/api/profile', profileRouter);
app.use('/api/workouts', workoutsRouter);
app.use('/api/meallog', meallogRouter);
app.use('/api/generate', generateRouter);
app.use('/api/food', foodRouter);
app.use('/api/chat', chatRouter);
app.use('/api/waterlog', waterlogRouter);
app.use('/api/analytics', analyticsRouter);

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error("Global Server Error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

if (process.env.NODE_ENV !== 'production' || require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
