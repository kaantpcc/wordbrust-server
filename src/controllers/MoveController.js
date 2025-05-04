const MoveService = require("../services/MoveService");
const { emitMoveMade } = require("../socket.js");

class MoveController {
  static async createMove(req, res) {
    try {
      const playerId = req.user.id;
      const { gameId } = req.params;
      const { word, score, startRow, startCol, direction, usedLetters } =
        req.body;

      const result = await MoveService.createMove({
        gameId,
        playerId,
        word,
        score,
        startRow,
        startCol,
        direction,
        usedLetters,
      });

      emitMoveMade(gameId);

      res.status(200).json({
        result,
      });
    } catch (error) {
      console.error("Error creating move:", error);
      res.status(500).json({
        message: "Error creating move",
        error: error.message,
      });
    }
  }
}

module.exports = MoveController;
