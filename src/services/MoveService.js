const Moves = require("../models/Moves");
const Games = require("../models/Games");
const BoardCells = require("../models/BoardCells");
const Words = require("../models/Words");
const LetterService = require("./LetterService");
const Users = require("../models/Users");

const TURN_TIMEOUTS = {
  "2min": 2 * 60 * 1000,
  "5min": 5 * 60 * 1000,
  "12h": 12 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
};

const LETTER_POINTS = {
  A: 1,
  B: 3,
  C: 4,
  Ç: 4,
  D: 3,
  E: 1,
  F: 7,
  G: 5,
  Ğ: 8,
  H: 5,
  I: 2,
  İ: 1,
  J: 10,
  K: 1,
  L: 1,
  M: 2,
  N: 1,
  O: 1,
  Ö: 7,
  P: 5,
  R: 1,
  S: 2,
  Ş: 4,
  T: 1,
  U: 2,
  Ü: 3,
  V: 7,
  Y: 3,
  Z: 4,
  "*": 0,
};

function calculateWordScore(wordCells, usedLetterMap) {
  let total = 0;
  let wordMultiplier = 1;
  for (const cell of wordCells) {
    const isNew = usedLetterMap.has(`${cell.row}-${cell.col}`);
    const letter = isNew
      ? usedLetterMap.get(`${cell.row}-${cell.col}`)
      : cell.letter;
    const basePoint = LETTER_POINTS[letter.toUpperCase()] || 0;
    let letterScore = basePoint;
    if (isNew) {
      letterScore *= cell.letter_multiplier || 1;
      wordMultiplier *= cell.word_multiplier || 1;
    }
    total += letterScore;
  }
  return total * wordMultiplier;
}

function hasGapBetweenLetters(usedLetters, boardMap, direction) {
  const positions = usedLetters.map((l) =>
    direction === "horizontal" ? l.col : l.row
  );
  const fixed =
    direction === "horizontal" ? usedLetters[0].row : usedLetters[0].col;
  const min = Math.min(...positions);
  const max = Math.max(...positions);

  for (let i = min; i <= max; i++) {
    const key = direction === "horizontal" ? `${fixed}-${i}` : `${i}-${fixed}`;
    if (
      !boardMap.has(key) &&
      !usedLetters.some(
        (l) =>
          (direction === "horizontal" ? l.col : l.row) === i &&
          (direction === "horizontal" ? l.row : l.col) === fixed
      )
    ) {
      return true;
    }
  }
  return false;
}

class MoveService {
  static async createMove({
    gameId,
    playerId,
    word,
    startRow,
    startCol,
    direction,
    usedLetters,
  }) {
    const game = await Games.findByPk(gameId);
    if (!game) throw new Error("Game not found");
    if (game.game_status === "finished")
      throw new Error("Game is already finished.");

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
      const err = new Error("Süre doldu. Oyun sona erdi.");
      err.code = "timeout_game_over";
      throw err;
    }

    if (game.current_turn_player_id !== playerId)
      throw new Error("Sıra sizde değil.");

    const allSameRow = usedLetters.every((l) => l.row === startRow);
    const allSameCol = usedLetters.every((l) => l.col === startCol);
    if (direction === "horizontal" && !allSameRow)
      throw new Error(
        "Yatay yerleştirme hatalı: Tüm harfler aynı satırda olmalı."
      );
    if (direction === "vertical" && !allSameCol)
      throw new Error(
        "Dikey yerleştirme hatalı: Tüm harfler aynı sütunda olmalı."
      );

    const totalMoves = await Moves.count({ where: { game_id: gameId } });
    if (
      totalMoves === 0 &&
      !usedLetters.some((l) => l.row === 7 && l.col === 7)
    ) {
      throw new Error("İlk hamlede kelime tahtanın ortasından (7,7) geçmeli.");
    }

    const boardCells = await BoardCells.findAll({ where: { game_id: gameId } });
    const boardMap = new Map();
    const cellMap = new Map();
    for (const cell of boardCells) {
      if (cell.letter) boardMap.set(`${cell.row}-${cell.col}`, cell.letter);
      cellMap.set(`${cell.row}-${cell.col}`, cell);
    }

    if (hasGapBetweenLetters(usedLetters, boardMap, direction)) {
      throw new Error(
        "Yeni harfler arasında boşluk bırakılamaz. Tüm harfler bitişik olmalı."
      );
    }

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
    if (!isTouching)
      throw new Error("Yeni harfler mevcut harflerle temas etmeli.");

    const usedLetterMap = new Map();
    for (const { row, col, letter } of usedLetters) {
      usedLetterMap.set(`${row}-${col}`, letter);
    }

    const wordsToCheck = new Set();
    const wordsToScore = [];
    const debugWordList = [];

    for (const { row, col } of usedLetters) {
      // Ana yön - Horizontal
      let sc = col;
      while (
        sc > 0 &&
        (boardMap.has(`${row}-${sc - 1}`) ||
          usedLetterMap.has(`${row}-${sc - 1}`))
      )
        sc--;
      const hCells = [];
      for (let i = sc; i < 15; i++) {
        const l =
          usedLetterMap.get(`${row}-${i}`) || boardMap.get(`${row}-${i}`);
        if (!l) break;
        hCells.push(cellMap.get(`${row}-${i}`) || { row, col: i });
      }
      if (hCells.length > 1) {
        const hWord = hCells
          .map((c) => usedLetterMap.get(`${c.row}-${c.col}`) || c.letter)
          .join("");
        wordsToCheck.add(hWord.toLowerCase());
        wordsToScore.push(hCells);
        debugWordList.push(hWord.toLowerCase());
      }

      // Dikey yön - Vertical
      let sr = row;
      while (
        sr > 0 &&
        (boardMap.has(`${sr - 1}-${col}`) ||
          usedLetterMap.has(`${sr - 1}-${col}`))
      )
        sr--;
      const vCells = [];
      for (let j = sr; j < 15; j++) {
        const l =
          usedLetterMap.get(`${j}-${col}`) || boardMap.get(`${j}-${col}`);
        if (!l) break;
        vCells.push(cellMap.get(`${j}-${col}`) || { row: j, col });
      }
      if (vCells.length > 1) {
        const vWord = vCells
          .map((c) => usedLetterMap.get(`${c.row}-${c.col}`) || c.letter)
          .join("");
        wordsToCheck.add(vWord.toLowerCase());
        wordsToScore.push(vCells);
        debugWordList.push(vWord.toLowerCase());
      }
    }

    
    console.log("✅ Oluşan tüm kelimeler:", debugWordList);

    for (const w of wordsToCheck) {
      const valid = await Words.findOne({ where: { word: w } });
      if (!valid) {
        const error = new Error(`Geçersiz kelime: ${w}`);
        error.invalidWord = w;
        error.code = "invalid_word";
        throw error;
      }
    }

    const totalScore = wordsToScore.reduce(
      (sum, wordCells) => sum + calculateWordScore(wordCells, usedLetterMap),
      0
    );

    await Moves.create({
      game_id: gameId,
      player_id: playerId,
      word,
      score_earned: totalScore,
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

    if (playerId === game.player1_id) game.player1_score += totalScore;
    else game.player2_score += totalScore;

    game.current_turn_player_id =
      playerId === game.player1_id ? game.player2_id : game.player1_id;
    game.last_move_at = new Date();

    for (const letter of usedLetters) {
      await BoardCells.update(
        { letter: letter.letter },
        { where: { game_id: gameId, row: letter.row, col: letter.col } }
      );
    }

    const remaining = await LetterService.getRemainingLetterCount(gameId);
    const p1 = await LetterService.getPlayerLettersCount(
      gameId,
      game.player1_id
    );
    const p2 = await LetterService.getPlayerLettersCount(
      gameId,
      game.player2_id
    );

    if (remaining === 0 && p1 === 0 && p2 === 0) {
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

    if (game.winner_id) {
      await Users.increment("user_win_count", {
        where: { id: game.winner_id },
      });

      const loserId =
        game.winner_id === game.player1_id ? game.player2_id : game.player1_id;

      await Users.increment("user_loss_count", { where: { id: loserId } });
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
