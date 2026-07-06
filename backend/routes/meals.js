// backend/routes/meals.js

const express = require('express');
const multer = require('multer');
const path = require('path');
const { scanMeal } = require('../controllers/mealController');

const router = express.Router();

// Multer storage – store uploads in ./uploads with unique filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({ storage });

// POST /api/meals/scan – expects a single image file under field name "image"
router.post('/scan', upload.single('image'), scanMeal);

module.exports = router;
