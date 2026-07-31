const express = require('express');
const router = express.Router();
const UserProfile = require('../models/UserProfile');
const User = require('../models/User');
const auth = require('../middleware/auth');

// GET /api/profile
router.get('/', auth, async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/profile
router.post('/', auth, async (req, res) => {
  try {
    // Prevent duplicate profiles for the same user
    const existingProfile = await UserProfile.findOne({ userId: req.user._id });
    if (existingProfile) {
      return res.status(400).json({ error: 'Profile already exists' });
    }

    const profile = new UserProfile({
      ...req.body,
      userId: req.user._id
    });
    await profile.save();

    // Mark user profile setup as complete
    await User.findByIdAndUpdate(req.user._id, { profileCompleted: true });

    res.status(201).json(profile);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/profile
router.put('/', auth, async (req, res) => {
  try {
    const profile = await UserProfile.findOneAndUpdate(
      { userId: req.user._id },
      req.body,
      { new: true, upsert: true }
    );
    
    // Ensure profileCompleted flag is synced
    await User.findByIdAndUpdate(req.user._id, { profileCompleted: true });

    res.json(profile);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/profile
router.delete('/', auth, async (req, res) => {
  try {
    await UserProfile.deleteOne({ userId: req.user._id });
    await User.findByIdAndUpdate(req.user._id, { profileCompleted: false });
    res.json({ message: 'Profile deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
