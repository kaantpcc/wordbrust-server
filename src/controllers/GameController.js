const GameService = require("../services/GameService");
const LetterService = require("../services/LetterService");
const PlayerLetters = require("../models/PlayerLetters.js");
const { resignSignal } = require("../socket.js");

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

      return res.json({ message: result.message, game: result.game });
    } catch (error) {
      console.error("Error in findOrCreateGame:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async joinGame(req, res) {
    try {
      const gameId = req.params.id;
      const playerId = req.user.id;

      if (!gameId) {
        return res
          .status(400)
          .json({ error: "Geçerli bir oyun ID'si gerekli" });
      }

      const data = await GameService.joinGame(gameId, playerId);
      return res.status(200).json(data);
    } catch (error) {
      console.error("Error in joinGame:", error);

      if (error.message === "Oyun bulunamadı") {
        return res.status(404).json({ error: "Oyun bulunamadı" });
      }

      res.status(500).json({ error: "Sunucu hatası" });
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

  static async getGameScores(req, res) {
    try {
      const { gameId } = req.params;
      const scores = await GameService.getGameScores(gameId);
      res.status(200).json(scores);
    } catch (error) {
      console.error("getGameScores error:", error);
      res.status(500).json({ error: "Skorlar alınamadı" });
    }
  }
  static async getFinishedGamesByPlayer(req, res) {
    try {
      const playerId = req.user.id;
      const finishedGames = await GameService.getFinishedGamesByPlayer(
        playerId
      );
      res.status(200).json(finishedGames);
    } catch (error) {
      console.error("Error in getFinishedGamesByPlayer:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async resignGame(req, res) {
    try {
      const userId = req.user.id;
      const { gameId } = req.params;

      const result = await GameService.resignGame(gameId, userId);

      resignSignal(
        result.gameId, // oyun ID
        userId, // pes eden oyuncu
        result.winnerId, // kazanan oyuncu
        result.winnerScore // kazanan skoru
      );

      return res.status(200).json({
        success: true,
        message: result.message,
        winnerId: result.winnerId,
        gameId: result.gameId,
      });
    } catch (err) {
      console.error("❌ Oyun teslim hatası:", err);
      return res.status(err.status || 500).json({
        success: false,
        message: err.message || "Oyun teslim edilirken bir hata oluştu",
      });
    }
  }
}

module.exports = GameController;
