const Moves = require("../models/Moves");
const Games = require("../models/Games");
const BoardCells = require("../models/BoardCells");
const Words = require("../models/Words");
const LetterService = require("./LetterService");

const TURN_TIMEOUTS = {
  "2min": 2 * 60 * 1000,
  "5min": 5 * 60 * 1000,
  "12h": 12 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
};

class MoveService {
  static async createMove({
    gameId,
    playerId,
    word,
    score,
    startRow,
    startCol,
    direction,
    usedLetters,
  }) {
    const game = await Games.findByPk(gameId);
    if (!game) throw new Error("Game not found");

    if (game.game_status === "finished") {
      throw new Error("Game is already finished.");
    }

    const now = new Date();
    const lastMoveAt = new Date(game.last_move_at || now);
    const timeoutMs = TURN_TIMEOUTS[game.game_mode];

    if (timeoutMs && now - lastMoveAt > timeoutMs) {
      const loserId = game.current_turn_player_id;
      const winnerId =
        loserId === game.player1_id ? game.player2_id : game.player1_id;
      const winnerScore =
        winnerId === game.player1_id ? game.player1_score : game.player2_score;

      game.game_status = "finished";
      game.winner_id = winnerId;
      game.winner_score = winnerScore;
      await game.save();

      throw new Error("timeout_game_over");
    }

    if (game.current_turn_player_id !== playerId)
      throw new Error("Not your turn");

    const allSameRow = usedLetters.every((l) => l.row === startRow);
    const allSameCol = usedLetters.every((l) => l.col === startCol);
    if (direction === "horizontal" && !allSameRow)
      throw new Error("Yatay kelimede tüm harfler aynı satırda olmalı");
    if (direction === "vertical" && !allSameCol)
      throw new Error("Dikey kelimede tüm harfler aynı sütunda olmalı");

    const totalMoves = await Moves.count({ where: { game_id: gameId } });
    if (totalMoves === 0) {
      const includesCenter = usedLetters.some(
        (l) => l.row === 7 && l.col === 7
      );
      if (!includesCenter)
        throw new Error("İlk hamlede kelime tahtanın ortasından geçmeli (7,7)");
    }

    // 🧠 Board map'i hazırla (tahta üzerindeki harfleri getir)
    const boardCells = await BoardCells.findAll({
      where: { game_id: gameId },
    });
    const boardMap = new Map();
    for (const cell of boardCells) {
      if (cell.letter) {
        boardMap.set(`${cell.row}-${cell.col}`, cell.letter);
      }
    }

    // ✅ TEMAS KONTROLÜ (mevcut harfe komşu olmalı)
    const isTouching =
      totalMoves === 0 ||
      usedLetters.some((cell) => {
        return (
          boardMap.has(`${cell.row - 1}-${cell.col}`) ||
          boardMap.has(`${cell.row + 1}-${cell.col}`) ||
          boardMap.has(`${cell.row}-${cell.col - 1}`) ||
          boardMap.has(`${cell.row}-${cell.col + 1}`)
        );
      });

    if (!isTouching) {
      throw new Error("Yeni harfler mevcut harflerle temas etmeli.");
    }

    // ✅ OLUŞAN TÜM KELİMELERİN GEÇERLİLİK KONTROLÜ
    for (const { row, col } of usedLetters) {
      // Yatay kelime
      let startCol = col;
      while (startCol > 0 && boardMap.get(`${row}-${startCol - 1}`)) {
        startCol--;
      }
      let horizontalWord = "";
      let i = startCol;
      while (
        i < 15 &&
        (boardMap.get(`${row}-${i}`) ||
          usedLetters.find((u) => u.row === row && u.col === i))
      ) {
        const l =
          usedLetters.find((u) => u.row === row && u.col === i)?.letter ||
          boardMap.get(`${row}-${i}`);
        if (!l) break;
        horizontalWord += l;
        i++;
      }

      if (horizontalWord.length > 1) {
        const exists = await Words.findOne({
          where: { word: horizontalWord.toLowerCase() },
        });
        if (!exists) {
          throw new Error(`Geçersiz kelime (yatay): ${horizontalWord}`);
        }
      }

      // Dikey kelime
      let startRow = row;
      while (startRow > 0 && boardMap.get(`${startRow - 1}-${col}`)) {
        startRow--;
      }
      let verticalWord = "";
      let j = startRow;
      while (
        j < 15 &&
        (boardMap.get(`${j}-${col}`) ||
          usedLetters.find((u) => u.row === j && u.col === col))
      ) {
        const l =
          usedLetters.find((u) => u.row === j && u.col === col)?.letter ||
          boardMap.get(`${j}-${col}`);
        if (!l) break;
        verticalWord += l;
        j++;
      }

      if (verticalWord.length > 1) {
        const exists = await Words.findOne({
          where: { word: verticalWord.toLowerCase() },
        });
        if (!exists) {
          throw new Error(`Geçersiz kelime (dikey): ${verticalWord}`);
        }
      }
    }

    // ✅ Hamleyi kaydet
    await Moves.create({
      game_id: gameId,
      player_id: playerId,
      word,
      score_earned: score,
      start_row: startRow,
      start_col: startCol,
      direction,
      used_letters: JSON.stringify(usedLetters),
    });

    await LetterService.removeUsedLetters(
      gameId,
      playerId,
      usedLetters.map((l) => l.letter)
    );
    const newlyDrawnLetters = await LetterService.drawLettersToFill(
      gameId,
      playerId
    );

    if (playerId === game.player1_id) {
      game.player1_score += score;
    } else {
      game.player2_score += score;
    }

    game.current_turn_player_id =
      playerId === game.player1_id ? game.player2_id : game.player1_id;
    game.last_move_at = new Date();

    // Tahtayı güncelle
    for (const letter of usedLetters) {
      await BoardCells.update(
        { letter: letter.letter },
        { where: { game_id: gameId, row: letter.row, col: letter.col } }
      );
    }

    // ✅ Harfler bittiyse oyunu bitir
    const remainingPoolLetters = await LetterService.getRemainingLetterCount(
      gameId
    );
    const player1Letters = await LetterService.getPlayerLettersCount(
      gameId,
      game.player1_id
    );
    const player2Letters = await LetterService.getPlayerLettersCount(
      gameId,
      game.player2_id
    );

    if (
      remainingPoolLetters === 0 &&
      player1Letters === 0 &&
      player2Letters === 0
    ) {
      game.game_status = "finished";
      if (game.player1_score > game.player2_score) {
        game.winner_id = game.player1_id;
        game.winner_score = game.player1_score;
      } else if (game.player2_score > game.player1_score) {
        game.winner_id = game.player2_id;
        game.winner_score = game.player2_score;
      } else {
        game.winner_id = null;
        game.winner_score = game.player1_score;
      }
    }

    await game.save();

    return {
      message: "Move created successfully",
      newTurnPlayerId: game.current_turn_player_id,
      updatedScores: {
        player1_score: game.player1_score,
        player2_score: game.player2_score,
      },
      nextTurnStartTime: game.last_move_at,
      newLetters: newlyDrawnLetters.map((l) => l.letter),
    };
  }
}

module.exports = MoveService;
