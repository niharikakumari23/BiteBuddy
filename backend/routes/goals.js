const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const { saveGoal, getGoal } = require("../controllers/goal.controller");

// GET /api/goals — fetch saved goals
router.get("/", auth, getGoal);

// POST /api/goals — save/update goals
router.post("/", auth, saveGoal);

module.exports = router;