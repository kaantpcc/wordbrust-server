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

      // Bu oyuncunun daha önce harf alıp almadığını kontrol et
      const existingLetters = await PlayerLetters.findAll({
        where: { game_id: game.id, player_id: playerId },
        attributes: ["letter"],
      });

      if (existingLetters.length === 0) {
        await LetterService.giveInitialLettersToPlayer(game.id, playerId);
        // ❗️Socket yayın işlemi socket.js içerisinde yapılmalı
      }

      // 🎯 Oyuncunun mevcut harflerini getir
      const playerLetterRows = await PlayerLetters.findAll({
        where: { game_id: game.id, player_id: playerId },
        attributes: ["letter"],
      });

      const playerLetters = playerLetterRows.map((l) => ({ letter: l.letter }));

      // ❌ totalRemaining kaldırıldı çünkü artık socket ile gönderiliyor
      res.status(200).json({
        ...result,
        playerLetters,
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
}

module.exports = GameController;
