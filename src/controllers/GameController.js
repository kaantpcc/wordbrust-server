const GameService = require("../services/GameService");
const BoardCells = require("../models/BoardCells");
const { io } = require("../index");

class GameController {
  static async findOrCreateGame(req, res) {
    try {
      const playerId = req.user.id;
      const { game_mode } = req.body;

      if (!game_mode) {
        return res.status(400).json({ message: "Game mode is required" });
      }

      const result = await GameService.findOrCreateGame(playerId, game_mode);
      if (result.message === "Oyun bulundu") {
        // Oyun bulundu ve eşleşme olduysa:
        const board = await BoardCells.findAll({
          where: { game_id: result.game.id },
          attributes: [
            "row",
            "col",
            "letter",
            "letter_multiplier",
            "word_multiplier",
            "mine_type",
            "bonus_type",
          ],
        });

        // Odaya game_found mesajı gönderiyoruz
        io.to(`game_${result.game.id}`).emit("game_found", {
          message: "Rakibin geldi, oyun başlıyor!",
          gameId: result.game.id,
        });

        // Odaya board_initialized mesajı gönderiyoruz
        io.to(`game_${result.game.id}`).emit("board_initialized", board);
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("Error in findOrCreateGame:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = GameController;
