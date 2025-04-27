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

      res.status(200).json(result);

    } catch (error) {
      console.error("Error in findOrCreateGame:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = GameController;
