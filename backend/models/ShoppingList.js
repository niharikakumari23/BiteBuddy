const mongoose = require("mongoose");

const shoppingItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    qty: { type: String, required: true },
    checked: { type: Boolean, default: false },
}, { _id: false });

const shoppingListSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    diet: { type: String, required: true },
    items: [shoppingItemSchema],
}, { timestamps: true });

// Compound index so each user has one list per diet
shoppingListSchema.index({ userId: 1, diet: 1 }, { unique: true });

module.exports = mongoose.model("ShoppingList", shoppingListSchema);
