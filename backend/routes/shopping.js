const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const { saveShoppingList, getShoppingList } = require("../controllers/shopping.controller");

// GET /api/shopping?diet=balanced — fetch saved shopping list
router.get("/", auth, getShoppingList);

// POST /api/shopping — save/update shopping list
router.post("/", auth, saveShoppingList);

module.exports = router;
