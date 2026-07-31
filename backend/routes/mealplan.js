const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const { saveMealPlan, getMealPlan } = require("../controllers/mealplan.controller");

// GET /api/mealplan?diet=balanced — fetch saved meal plan
router.get("/", auth, getMealPlan);

// POST /api/mealplan — save/update meal plan
router.post("/", auth, saveMealPlan);

module.exports = router;
