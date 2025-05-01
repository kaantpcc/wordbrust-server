const GameService = require("../services/GameService");
const LetterService = require("../services/LetterService");
const PlayerLetters = require("../models/PlayerLetters.js");
const LettersPool = require("../models/LettersPool.js");
const LETTER_DEFINITIONS = require("../config/letterDefinitions.js");

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
      const player1Id = game.player1_id;
      const player2Id = game.player2_id;

      // Bu oyuncunun daha önce harf alıp almadığını kontrol et
      const existingLetters = await PlayerLetters.findAll({
        where: { game_id: game.id, player_id: playerId },
        attributes: ["letter"],
      });

      let playerLetters = [];
      let totalRemaining = 0;

      if (existingLetters.length === 0) {
        // Bu oyuncuya harf verilmeli
        await LetterService.giveInitialLettersToPlayer(game.id, playerId);
      }

      totalRemaining =
        (await LettersPool.sum("remaining_count", {
          where: { game_id: game.id },
        })) || 0;

      // 🎯 Bu oyuncunun harflerini yeniden çekiyoruz (verdiğimiz veya önceki harfler olabilir)
      const playerLetterRows = await PlayerLetters.findAll({
        where: { game_id: game.id, player_id: playerId },
        attributes: ["letter"],
      });

      playerLetters = playerLetterRows.map((l) => ({ letter: l.letter }));

      res.status(200).json({
        ...result,
        playerLetters,
        totalRemaining,
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
