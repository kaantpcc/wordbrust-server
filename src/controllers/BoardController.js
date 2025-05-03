const BoardService = require("../services/BoardService");

class BoardController {
  static async getBoardByGameId(req, res) {
    try {
      const { gameId } = req.params;
      const board = await BoardService.getBoardByGameId(gameId);
      res.status(200).json(board);
    } catch (error) {
      console.error("Error fetching board:", error);
      res.status(500).json({
        message: "Error fetching board",
        error: error.message,
      });
    }
  }
}

module.exports = BoardController;
