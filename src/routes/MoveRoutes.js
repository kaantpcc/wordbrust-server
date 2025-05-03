const express = require("express");
const router = express.Router();
const MoveController = require("../controllers/MoveController.js");
const { authenticateToken } = require("../middlewares/authMiddleware.js");

router.post("/:gameId/move", authenticateToken, MoveController.createMove);

module.exports = router;
