const GameService = require("../services/GameService");

class GameController {
  static async findOrCreateGame(req, res) {
    try {
      const playerId = req.user.id;
      const { game_mode } = req.body;

      if (!game_mode) {
        return res.status(400).json({ message: "Game mode is required" });
      }

      const result = await GameService.findOrCreateGame(playerId, game_mode);
      res.status(200).json({
        message: result.message,
        game: {
          id: result.game.id,
          player1_id: result.game.player1_id,
          player2_id: result.game.player2_id,
          game_status: result.game.game_status,
          game_mode: result.game.game_mode,
          current_turn_player_id: result.game.current_turn_player_id,
        },
      });
    } catch (error) {
      console.error("Error in findOrCreateGame:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = GameController;
