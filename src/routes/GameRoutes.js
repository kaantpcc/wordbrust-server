const express = require("express");
const router = express.Router();
const GameController = require("../controllers/GameController.js");
const { authenticateToken } = require("../middlewares/authMiddleware.js");

router.post("/find-or-create", authenticateToken, GameController.findOrCreateGame);
router.post("/:id/join", authenticateToken, GameController.joinGame);
router.get("/active-games", authenticateToken, GameController.getActiveGamesByPlayer);
router.get("/:gameId/scores", authenticateToken, GameController.getGameScores);
router.get("/finished-games", authenticateToken, GameController.getFinishedGamesByPlayer);

module.exports = router;