const Games = require("../models/Games.js");
const BoardService = require("./BoardService.js");
const Users = require("../models/Users.js");
const { Op } = require("sequelize");

class GameService {
  static async findOrCreateGame(playerId, game_mode) {
    const waitingGame = await Games.findOne({
      where: {
        game_status: "waiting",
        player2_id: null,
        game_mode: game_mode,
        player1_id: { [Op.ne]: playerId },
      },
    });

    if (waitingGame) {
      const starter = Math.random() < 0.5 ? waitingGame.player1_id : playerId;
      waitingGame.player2_id = playerId;
      waitingGame.game_status = "active";
      waitingGame.current_turn_player_id = starter;
      waitingGame.last_move_at = new Date();
      await waitingGame.save();

      await BoardService.initializeBoard(waitingGame.id);

      return {
        message: "Oyun bulundu",
        game: waitingGame,
      };
    } else {
      const newGame = await Games.create({
        player1_id: playerId,
        game_mode: game_mode,
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

  static async getActiveGamesByPlayer(playerId) {
    const activeGames = await Games.findAll({
      where: {
        game_status: "active",
        [Op.or]: [{ player1_id: playerId }, { player2_id: playerId }],
      },
      include: [
        { model: Users, as: "player1", attributes: ["id", "username"] },
        { model: Users, as: "player2", attributes: ["id", "username"] },
        { model: Users, as: "current_turn_player", attributes: ["id"] },
      ],
      order: [["updatedAt", "DESC"]],
    });

    return activeGames.map((game) => {
      const isPlayer1 = game.player1_id === playerId;
      const yourScore = isPlayer1 ? game.player1_score : game.player2_score;
      const opponentScore = isPlayer1 ? game.player2_score : game.player1_score;
      const opponent = isPlayer1
        ? game.player2?.username || "Rakip bekleniyor"
        : game.player1?.username || "Rakip bekleniyor";

      const turnInfo =
        game.current_turn_player_id === playerId
          ? "Oyun sırası sizde."
          : "Oyun sırası bekleniyor.";

      const elapsedMinutes = game.last_move_at
        ? Math.floor((Date.now() - new Date(game.last_move_at)) / 60000)
        : 0;

      return {
        gameId: game.id,
        opponentUsername: opponent,
        scoreText: `Liste: ${yourScore} - ${opponentScore}`,
        durationText: `Süre: ${elapsedMinutes} dk.`,
        turnInfo,
      };
    });
  }
}

module.exports = GameService;
