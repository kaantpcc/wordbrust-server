const express = require('express');
const router = express.Router();
const LetterController = require('../controllers/LetterController.js');
const { authenticateToken } = require('../middlewares/authMiddleware.js');

router.get("/:gameId/letters", authenticateToken, LetterController.getLettersForPlayer);
router.get("/:gameId/remaining", authenticateToken, LetterController.getRemainingLetterCount);

module.exports = router;