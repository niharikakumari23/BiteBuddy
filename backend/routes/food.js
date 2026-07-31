// backend/routes/food.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { analyzeAndLogFood } = require('../controllers/foodController');

// POST /api/food/analyze
router.post('/analyze', auth, analyzeAndLogFood);

module.exports = router;
