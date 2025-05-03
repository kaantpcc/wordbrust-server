const express = require('express');
const router = express.Router();
const BoardController = require('../controllers/BoardController.js');
const { authenticateToken } = require('../middlewares/authMiddleware.js');

router.get("/:gameId/board", authenticateToken, BoardController.getBoardByGameId);

module.exports = router;