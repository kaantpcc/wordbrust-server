const Games = require("../models/Games.js");

class GameService {
  static async findOrCreateGame(playerId, gameMode) {
    const waitingGame = await Games.findOne({
      where: {
        game_status: "waiting",
        player2_id: null,
        game_mode: gameMode,
      },
    });

    if (waitingGame) {
      const starter = Math.random() < 0.5 ? waitingGame.player1_id : playerId;
      waitingGame.player2_id = playerId;
      waitingGame.game_status = "active";
      waitingGame.current_turn_player_id = starter;
      waitingGame.last_move_at = new Date();
      await waitingGame.save();

      return {
        message: "Oyun bulundu",
        game: waitingGame,
      };
    } else {
      const newGame = await Games.create({
        player1_id: playerId,
        game_mode: gameMode,
        game_status: "waiting",
        player1_score: 0,
        player2_score: 0,
        winner_id: null,
        winner_score: null,
        current_turn_player_id: null,
        last_move_at: null,
      });

      return {
        message: "Yeni oyun oluşturuldu",
        game: newGame,
      };
    }
  }
}

module.exports = GameService;
