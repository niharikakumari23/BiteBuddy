const express = require('express');
const router = express.Router();
const WaterLog = require('../models/WaterLog');
const auth = require('../middleware/auth');

// GET /api/waterlog?date=YYYY-MM-DD
router.get('/', auth, async (req, res) => {
  try {
    const date = req.query.date || new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
    const log = await WaterLog.findOne({ userId: req.user._id, date });
    res.json(log || { userId: req.user._id, date, glasses: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/waterlog - Upsert water log
router.post('/', auth, async (req, res) => {
  try {
    const { date, glasses } = req.body;
    if (!date) return res.status(400).json({ error: 'Date is required YYYY-MM-DD' });

    const log = await WaterLog.findOneAndUpdate(
      { userId: req.user._id, date },
      { glasses: Math.max(0, glasses) },
      { new: true, upsert: true }
    );

    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
