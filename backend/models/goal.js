const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,

    },
    diet: {
        type: String,
        required: true,

    },
    weightgoal: {
        type: String,
        required: true,
    },
    calorieGoal: {
        type: Number,
        required: true,
    },
});

module.exports = mongoose.model("Goal", goalSchema);
