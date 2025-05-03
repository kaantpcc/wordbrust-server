const BoardCells = require("../models/BoardCells.js");
const LettersPool = require("../models/LettersPool.js");
const LETTER_DEFINITIONS = require("../config/letterDefinitions.js");

const initializeLettersPool = async (gameId) => {
  const lettersPool = LETTER_DEFINITIONS.map((letter) => {
    return {
      game_id: gameId,
      letter: letter.letter,
      remaining_count: letter.count,
      letter_score: letter.score,
    };
  });

  await LettersPool.bulkCreate(lettersPool);
  console.log("Letters pool initialized successfully.");
};

class BoardService {
  static async initializeBoard(gameId) {
    const boardSize = 15; // 15x15 board
    const boardCells = [];

    const specialCells = {
      word3x: [
        [0, 2],
        [0, 12],
        [2, 0],
        [2, 14],
        [12, 0],
        [12, 14],
        [14, 2],
        [14, 12],
      ],
      word2x: [
        [3, 3],
        [2, 7],
        [3, 11],
        [7, 2],
        [7, 12],
        [11, 3],
        [11, 11],
        [12, 7],
      ],
      letter3x: [
        [1, 1],
        [1, 13],
        [13, 1],
        [13, 13],
        [4, 4],
        [4, 10],
        [10, 4],
        [10, 10],
      ],
      letter2x: [
        [0, 5],
        [0, 9],
        [1, 6],
        [1, 8],
        [5, 0],
        [5, 14],
        [6, 1],
        [6, 13],
        [9, 0],
        [9, 14],
        [8, 1],
        [8, 13],
        [14, 5],
        [14, 9],
        [13, 6],
        [13, 8],
        [5, 5],
        [5, 9],
        [9, 5],
        [9, 9],
        [6, 6],
        [6, 8],
        [8, 6],
        [8, 8],
      ],
    };

    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        let letterMultiplier = 1;
        let wordMultiplier = 1;

        if (
          specialCells.word3x.some((cell) => cell[0] === row && cell[1] === col)
        ) {
          wordMultiplier = 3;
        } else if (
          specialCells.word2x.some((cell) => cell[0] === row && cell[1] === col)
        ) {
          wordMultiplier = 2;
        } else if (
          specialCells.letter3x.some(
            (cell) => cell[0] === row && cell[1] === col
          )
        ) {
          letterMultiplier = 3;
        } else if (
          specialCells.letter2x.some(
            (cell) => cell[0] === row && cell[1] === col
          )
        ) {
          letterMultiplier = 2;
        }
        boardCells.push({
          game_id: gameId,
          row,
          col,
          letter: null,
          letter_multiplier: letterMultiplier,
          word_multiplier: wordMultiplier,
          mine_type: null,
          bonus_type: null,
        });
      }
    }

    let eligibleCells = boardCells.filter(
      (cell) => !(cell.row === 7 && cell.col === 7)
    );

    const mines = [
      { type: "point_split", count: 5 },
      { type: "point_transfer", count: 4 },
      { type: "letter_loss", count: 3 },
      { type: "move_block", count: 2 },
      { type: "word_cancel", count: 1 },
    ];

    for (const mine of mines) {
      for (let i = 0; i < mine.count; i++) {
        const randomIndex = Math.floor(Math.random() * eligibleCells.length);
        eligibleCells[randomIndex].mine_type = mine.type;
        eligibleCells.splice(randomIndex, 1); // Remove the cell from eligibleCells
      }
    }

    const bonuses = [
      { type: "zone_block", count: 2 },
      { type: "letter_freeze", count: 3 },
      { type: "extra_move", count: 2 },
    ];

    for (const bonus of bonuses) {
      for (let i = 0; i < bonus.count; i++) {
        const randomIndex = Math.floor(Math.random() * eligibleCells.length);
        eligibleCells[randomIndex].bonus_type = bonus.type;
        eligibleCells.splice(randomIndex, 1); // Remove the cell from eligibleCells
      }
    }

    await BoardCells.bulkCreate(boardCells);

    await initializeLettersPool(gameId);

    console.log("Board initialized successfully.");
  }

  static async getBoardByGameId(gameId) {
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
      order: [
        ["row", "ASC"],
        ["col", "ASC"],
      ],
      raw: true,
    });

    return board;
  }
}

module.exports = BoardService;
