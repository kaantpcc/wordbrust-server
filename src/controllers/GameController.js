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

      let playerLetters = [];
      let totalRemaining = 0;

      if (result.game && result.game.game_status === "active") {
        const player1Id = result.game.player1_id;
        const player2Id = result.game.player2_id;

        // Her iki oyuncuya da harfleri ver
        const lettersForPlayer1 =
          await LetterService.giveInitialLettersToPlayer(
            result.game.id,
            player1Id
          );

        const lettersForPlayer2 =
          await LetterService.giveInitialLettersToPlayer(
            result.game.id,
            player2Id
          );

        // İstek yapan kullanıcı kimse, onun harflerini ve toplam kalan harf sayısını al
        playerLetters =
          playerId === player1Id
            ? lettersForPlayer1.letters
            : lettersForPlayer2.letters;

        totalRemaining = lettersForPlayer1.totalRemaining; // ikisi zaten aynı sonucu döner
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
