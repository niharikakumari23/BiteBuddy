const Goal = require("../models/goals");

// Save or update a goal (upsert)
async function saveGoal(req, res) {
    try {
        const { diet, weightGoal, calorieGoal } = req.body;

        if (!diet || !weightGoal || !calorieGoal) {
            return res.status(400).json({ error: "diet, weightGoal, and calorieGoal are required" });
        }

        const savedGoal = await Goal.findOneAndUpdate(
            { userId: req.user._id },
            { diet, weightGoal, calorieGoal },
            { upsert: true, new: true, runValidators: true }
        );

        res.status(200).json(savedGoal);
    } catch (err) {
        console.error("Error saving goal:", err);
        res.status(500).json({ error: "Failed to save goal" });
    }
}

// Get saved goal
async function getGoal(req, res) {
    try {
        const goal = await Goal.findOne({ userId: req.user._id }).sort({ updatedAt: -1 });

        if (!goal) {
            return res.status(404).json({ error: "No saved goals found" });
        }

        res.status(200).json(goal);
    } catch (err) {
        console.error("Error fetching goal:", err);
        res.status(500).json({ error: "Failed to fetch goal" });
    }
}

module.exports = { saveGoal, getGoal };