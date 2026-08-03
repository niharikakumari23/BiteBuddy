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
  if (req.path === '/' || req.path === '/api/health' || req.path === '/health') return next();
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

// Health check routes
app.get(['/api/health', '/health'], (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes (Mounted under both /api/* and /* for full compatibility)
const routesMap = [
  ['/auth', authRouter],
  ['/meals', mealsRouter],
  ['/goals', goalsRouter],
  ['/shopping', shoppingRouter],
  ['/mealplan', mealplanRouter],
  ['/profile', profileRouter],
  ['/workouts', workoutsRouter],
  ['/meallog', meallogRouter],
  ['/generate', generateRouter],
  ['/food', foodRouter],
  ['/chat', chatRouter],
  ['/waterlog', waterlogRouter],
  ['/analytics', analyticsRouter],
];

routesMap.forEach(([routePath, router]) => {
  app.use(`/api${routePath}`, router);
  app.use(routePath, router);
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error("Global Server Error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
