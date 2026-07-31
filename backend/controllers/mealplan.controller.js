const MealPlan = require("../models/MealPlan");

// Save or update meal plan (upsert by userId + diet)
async function saveMealPlan(req, res) {
    try {
        const { diet, plan } = req.body;

        if (!diet || !plan) {
            return res.status(400).json({ error: "diet and plan are required" });
        }

        const saved = await MealPlan.findOneAndUpdate(
            { userId: req.user._id, diet },
            { plan },
            { upsert: true, new: true, runValidators: true }
        );

        res.status(200).json(saved);
    } catch (err) {
        console.error("Error saving meal plan:", err);
        res.status(500).json({ error: "Failed to save meal plan" });
    }
}

// Get saved meal plan
async function getMealPlan(req, res) {
    try {
        const { diet } = req.query;

        if (!diet) {
            return res.status(400).json({ error: "diet query parameter is required" });
        }

        const mealPlan = await MealPlan.findOne({ userId: req.user._id, diet });

        if (!mealPlan) {
            return res.status(404).json({ error: "No saved meal plan found" });
        }

        res.status(200).json(mealPlan);
    } catch (err) {
        console.error("Error fetching meal plan:", err);
        res.status(500).json({ error: "Failed to fetch meal plan" });
    }
}

module.exports = { saveMealPlan, getMealPlan };
