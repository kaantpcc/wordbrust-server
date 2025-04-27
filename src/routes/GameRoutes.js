const express = require("express");
const router = express.Router();
const GameController = require("../controllers/GameController.js");
const { authenticateToken } = require("../middlewares/authMiddleware.js");

router.post("/find-or-create", authenticateToken, GameController.findOrCreateGame);

module.exports = router;