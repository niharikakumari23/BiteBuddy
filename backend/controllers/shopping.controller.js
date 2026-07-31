const ShoppingList = require("../models/ShoppingList");

// Save or update shopping list (upsert by userId + diet)
async function saveShoppingList(req, res) {
    try {
        const { diet, items } = req.body;

        if (!diet || !items || !Array.isArray(items)) {
            return res.status(400).json({ error: "diet and items[] are required" });
        }

        const saved = await ShoppingList.findOneAndUpdate(
            { userId: req.user._id, diet },
            { items },
            { upsert: true, new: true, runValidators: true }
        );

        res.status(200).json(saved);
    } catch (err) {
        console.error("Error saving shopping list:", err);
        res.status(500).json({ error: "Failed to save shopping list" });
    }
}

// Get saved shopping list
async function getShoppingList(req, res) {
    try {
        const { diet } = req.query;

        if (!diet) {
            return res.status(400).json({ error: "diet query parameter is required" });
        }

        const list = await ShoppingList.findOne({ userId: req.user._id, diet });

        if (!list) {
            return res.status(404).json({ error: "No saved shopping list found" });
        }

        res.status(200).json(list);
    } catch (err) {
        console.error("Error fetching shopping list:", err);
        res.status(500).json({ error: "Failed to fetch shopping list" });
    }
}

module.exports = { saveShoppingList, getShoppingList };
