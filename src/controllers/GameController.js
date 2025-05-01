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
      const { player1_id, player2_id, id: gameId } = game;

      // Bu oyuncuya daha önce harf atanmış mı kontrol et
      const existingLetters = await PlayerLetters.findAll({
        where: { game_id: gameId, player_id: playerId },
        attributes: ["letter"],
      });

      let playerLetters = [];
      let totalRemaining = 0;

      if (existingLetters.length === 0) {
        // 🔥 Eğer her iki oyuncu da belli ise, ilk kez harf veriliyor demektir
        if (player1_id && player2_id) {
          const letterResult =
            await LetterService.giveInitialLettersToBothPlayers(
              gameId,
              player1_id,
              player2_id
            );

          playerLetters =
            playerId === player1_id
              ? letterResult.player1Letters
              : letterResult.player2Letters;

          totalRemaining = letterResult.totalRemaining;
        } else {
          // Sadece bir oyuncu varsa, harf verilmeyecek (oyun bekliyor)
          playerLetters = [];
          totalRemaining = LETTER_DEFINITIONS.reduce(
            (sum, item) => sum + item.count,
            0
          );
        }
      } else {
        // Daha önce harf verilmişse onları çek
        const playerLetterRows = await PlayerLetters.findAll({
          where: { game_id: gameId, player_id: playerId },
          attributes: ["letter"],
        });

        playerLetters = playerLetterRows.map((l) => ({ letter: l.letter }));

        // Kalan harf sayısını hesapla
        const totalLettersGiven = await PlayerLetters.count({
          where: { game_id: gameId },
        });

        const letterCountInDefinitions = LETTER_DEFINITIONS.reduce(
          (sum, item) => sum + item.count,
          0
        );

        totalRemaining = letterCountInDefinitions - totalLettersGiven;
      }

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
