const GameService = require("../services/GameService");
const LetterService = require("../services/LetterService");
const PlayerLetters = require("../models/PlayerLetters.js");

class GameController {
  static async findOrCreateGame(req, res) {
    try {
      const playerId = req.user.id;
      const { game_mode } = req.body;

      if (!game_mode) {
        return res.status(400).json({ message: "Game mode is required" });
      }

      const result = await GameService.findOrCreateGame(playerId, game_mode);
      const game = result.game;

      // ❌ totalRemaining kaldırıldı çünkü artık socket ile gönderiliyor
      res.status(200).json({
        ...result,
      });
    } catch (error) {
      console.error("Error in findOrCreateGame:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getActiveGamesByPlayer(req, res) {
    try {
      const playerId = req.user.id;
      console.log("Player ID:", playerId);
      const activeGames = await GameService.getActiveGamesByPlayer(playerId);

      res.status(200).json(activeGames);
    } catch (error) {
      console.error("Error in getActiveGamesByPlayer:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getGameById(req, res, next) {
    try {
      const { gameId } = req.params;
      const game = await GameService.getGameById(gameId);
      return res.json({ success: true, game });
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = GameController;
