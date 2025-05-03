const Moves = require("../models/Moves");
const Games = require("../models/Games");
const BoardCells = require("../models/BoardCells");
const Words = require("../models/Words");
const LetterService = require("./LetterService");

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
    console.log("Used letters:", usedLetters);
    console.log("Word:", word);

    const game = await Games.findByPk(gameId);
    if (!game) throw new Error("Game not found");

    // ✅ 1. Kelime geçerliliği kontrolü
    const isWordValid = await Words.findOne({
      where: { word: word.toLowerCase() },
    });
    if (!isWordValid) {
      throw new Error("Geçersiz kelime: sözlükte bulunamadı");
    }

    // ✅ 2. Sıra kontrolü
    if (game.current_turn_player_id !== playerId)
      throw new Error("Not your turn");

    const allSameRow = usedLetters.every((l) => l.row === startRow);
    const allSameCol = usedLetters.every((l) => l.col === startCol);

    if (direction === "horizontal" && !allSameRow) {
      throw new Error("Yatay kelimede tüm harfler aynı satırda olmalı");
    }
    if (direction === "vertical" && !allSameCol) {
      throw new Error("Dikey kelimede tüm harfler aynı sütunda olmalı");
    }

    // ✅ 3. İlk hamlede orta hücre kontrolü
    const totalMoves = await Moves.count({ where: { game_id: gameId } });
    if (totalMoves === 0) {
      const includesCenter = usedLetters.some(
        (l) => l.row === 7 && l.col === 7
      );
      if (!includesCenter) {
        throw new Error("İlk hamlede kelime tahtanın ortasından geçmeli (7,7)");
      }
    }

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
    } else if (playerId === game.player2_id) {
      game.player2_score += score;
    }

    const nextTurnPlayerId =
      playerId === game.player1_id ? game.player2_id : game.player1_id;
    game.current_turn_player_id = nextTurnPlayerId;
    game.last_move_at = new Date();
    await game.save();

    for (const letter of usedLetters) {
      await BoardCells.update(
        { letter: letter.letter },
        { where: { game_id: gameId, row: letter.row, col: letter.col } }
      );
    }

    return {
      message: "Move created successfully",
      newTurnPlayerId: nextTurnPlayerId,
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
