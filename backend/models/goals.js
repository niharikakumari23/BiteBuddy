const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    diet: {
        type: String,
        required: true,
    },
    weightGoal: {
        type: String,
        required: true,
    },
    calorieGoal: {
        type: Number,
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model("Goal", goalSchema);
