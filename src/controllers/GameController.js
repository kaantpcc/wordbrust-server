const GameService = require("../services/GameService");
const LetterService = require("../services/LetterService");

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

      // Daha önce harf atanmış mı kontrol et
      const existingLetters = await PlayerLetters.findAll({
        where: { game_id: game.id, player_id: playerId },
        attributes: ["letter"],
      });

      let playerLetters = [];
      let totalRemaining = await LettersPool.sum("remaining_count", {
        where: { game_id: game.id },
      });

      if (existingLetters.length === 0) {
        // Harf yoksa ver
        const resultLetters = await LetterService.giveInitialLettersToPlayer(
          game.id,
          playerId
        );
        playerLetters = resultLetters.letters;
        totalRemaining = resultLetters.totalRemaining;
      } else {
        // Varsa var olanları kullan
        playerLetters = existingLetters.map((l) => ({ letter: l.letter }));
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
