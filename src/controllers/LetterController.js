const LetterService = require("../services/LetterService");

class LetterController {
  static async getLettersForPlayer(req, res) {
    try {
      const { gameId } = req.params;
      const playerId = req.user.id;

      const letters = await LetterService.getLettersForPlayer(gameId, playerId);
      res.status(200).json(letters);
    } catch (error) {
      console.error("getPlayerLetters error:", error);
      res.status(500).json({ error: "Harfler alınamadı" });
    }
  }

  static async getRemainingLetterCount(req, res) {
    try {
      const { gameId } = req.params;
      const remaining = await LetterService.getRemainingLetterCount(gameId);
      res.status(200).json({ remaining });
    } catch (error) {
      console.error("getRemainingLetters error:", error);
      res.status(500).json({ error: "Kalan harf sayısı alınamadı" });
    }
  }
}

module.exports = LetterController;
