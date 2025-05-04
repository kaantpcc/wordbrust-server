const Games = require("../models/Games.js");
const BoardService = require("./BoardService.js");
const Users = require("../models/Users.js");
const BoardCells = require("../models/BoardCells.js");
const PlayerLetters = require("../models/PlayerLetters.js");
const LettersPool = require("../models/LettersPool.js");
const LetterService = require("./LetterService.js");
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

      const existingCells = await BoardCells.findOne({
        where: { game_id: waitingGame.id },
      });
      if (!existingCells) {
        await BoardService.initializeBoard(waitingGame.id);
      }

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

      await BoardService.initializeBoard(newGame.id);

      return {
        message: "Yeni oyun oluşturuldu",
        game: newGame,
      };
    }
  }

  static async joinGame(gameId, playerId) {
    const game = await Games.findByPk(gameId);
    if (!game) {
      throw new Error("Oyun bulunamadı");
    }

    const board = await BoardCells.findAll({
      where: { game_id: gameId },
      attributes: [
        "row",
        "col",
        "letter",
        "letter_multiplier",
        "word_multiplier",
        "mine_type",
        "bonus_type",
      ],
      raw: true,
    });

    let playerLetters = await PlayerLetters.findAll({
      where: { game_id: gameId, player_id: playerId },
      attributes: ["letter"],
      raw: true,
    });

    if (playerLetters.length === 0) {
      const result = await LetterService.giveInitialLettersToPlayer(
        gameId,
        playerId
      );
      playerLetters = await PlayerLetters.findAll({
        where: { game_id: gameId, player_id: playerId },
        attributes: ["letter"],
        raw: true,
      });
      if (!result.success) {
        throw new Error("Başlangıç harfleri alınamadı");
      }
    }

    const letters = playerLetters.map((l) => ({ letter: l.letter }));

    // 4. Oyuncu bilgileri
    const [p1, p2] = await Promise.all([
      Users.findByPk(game.player1_id, { attributes: ["id", "username"] }),
      Users.findByPk(game.player2_id, { attributes: ["id", "username"] }),
    ]);

    const players = [
      { id: p1.id, username: p1.username, score: game.player1_score },
      { id: p2.id, username: p2.username, score: game.player2_score },
    ];

    // 5. Kalan harf
    const totalRemaining =
      (await LettersPool.sum("remaining_count", {
        where: { game_id: gameId },
      })) || 0;

    const isMyTurn = game.current_turn_player_id === playerId;

    return { board, letters, players, totalRemaining, isMyTurn };
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
        game.current_turn_player_id && game.current_turn_player_id === playerId
          ? "Oyun sırası sizde."
          : "Oyun sırası bekleniyor.";

      const elapsedMinutes = game.last_move_at
        ? Math.floor((new Date() - new Date(game.last_move_at)) / 60000)
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

  static async getGameScores(gameId) {
    const game = await Games.findByPk(gameId);
    if (!game) {
      throw new Error("Oyun bulunamadı");
    }

    return {
      player1_id: game.player1_id,
      player2_id: game.player2_id,
      player1_score: game.player1_score,
      player2_score: game.player2_score,
    };
  }

  static async getFinishedGamesByPlayer(playerId) {
    const finishedGames = await Games.findAll({
      where: {
        game_status: "finished",
        [Op.or]: [{ player1_id: playerId }, { player2_id: playerId }],
      },
      include: [
        { model: Users, as: "player1", attributes: ["id", "username"] },
        { model: Users, as: "player2", attributes: ["id", "username"] },
      ],
      order: [["updatedAt", "DESC"]],
    });

    return finishedGames.map((game) => ({
      gameId: game.id,
      player1: {
        id: game.player1?.id,
        username: game.player1?.username,
        score: game.player1_score,
      },
      player2: {
        id: game.player2?.id,
        username: game.player2?.username,
        score: game.player2_score,
      },
      winnerId: game.winner_id,
      winnerScore: game.winner_score,
      updatedAt: game.updatedAt,
    }));
  }

  static async resignGame(gameId, userId) {
    const game = await Games.findByPk(gameId);
    if (!game) {
      const error = new Error("Game not found");
      error.status = 404;
      throw error;
    }

    if (game.game_status === "finished") {
      const error = new Error("Game already finished");
      error.status = 400;
      throw error;
    }

    if (userId !== game.player1_id && userId !== game.player2_id) {
      const error = new Error("You are not a player in this game");
      error.status = 403;
      throw error;
    }

    const opponentId =
      userId === game.player1_id ? game.player2_id : game.player1_id;
    const winnerScore =
      userId === game.player1_id ? game.player2_score : game.player1_score;

    game.game_status = "finished";
    game.winner_id = opponentId;
    game.winner_score = winnerScore;
    await game.save();

    // Kullanıcı istatistiklerini güncelle
    await Users.increment("user_win_count", { where: { id: opponentId } });
    await Users.increment("user_loss_count", { where: { id: userId } });

    return {
      message: "Game resigned successfully",
      winnerId: opponentId,
      gameId: game.id,
    };
  }
}

module.exports = GameService;
