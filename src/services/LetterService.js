const LettersPool = require("../models/LettersPool");
const PlayerLetters = require("../models/PlayerLetters");
const { Op } = require("sequelize");

class LetterService {
  static async selectRandomLettersFromPool(pool, count) {
    const letterBag = [];

    for (const item of pool) {
      for (let i = 0; i < item.remaining_count; i++) {
        letterBag.push({ letter: item.letter });
      }
    }

    if (letterBag.length < count) {
      throw new Error("Yeterli harf yok.");
    }

    const selectedLetters = [];
    for (let i = 0; i < count; i++) {
      const randIndex = Math.floor(Math.random() * letterBag.length);
      const chosenLetter = letterBag[randIndex];
      selectedLetters.push(chosenLetter);
      letterBag.splice(randIndex, 1);
    }

    return selectedLetters;
  }

  static async giveInitialLettersToBothPlayers(
    gameId,
    player1Id,
    player2Id,
    count = 7
  ) {
    const pool = await LettersPool.findAll({
      where: {
        game_id: gameId,
        remaining_count: {
          [Op.gt]: 0,
        },
      },
    });

    if (!pool.length) {
      throw new Error("Harf havuzu boş.");
    }

    const lettersForPlayer1 = await this.selectRandomLettersFromPool(
      pool,
      count
    );
    const lettersForPlayer2 = await this.selectRandomLettersFromPool(
      pool,
      count
    );

    // Havuzdan sadece burada düşür
    const usageMap = {};

    [...lettersForPlayer1, ...lettersForPlayer2].forEach(({ letter }) => {
      usageMap[letter] = (usageMap[letter] || 0) + 1;
    });

    await PlayerLetters.bulkCreate([
      ...lettersForPlayer1.map((l) => ({
        game_id: gameId,
        player_id: player1Id,
        letter: l.letter,
        is_frozen: false,
      })),
      ...lettersForPlayer2.map((l) => ({
        game_id: gameId,
        player_id: player2Id,
        letter: l.letter,
        is_frozen: false,
      })),
    ]);

    await Promise.all(
      Object.entries(usageMap).map(([letter, amount]) =>
        LettersPool.decrement("remaining_count", {
          by: amount,
          where: { game_id: gameId, letter },
        })
      )
    );

    const remaining = await LettersPool.sum("remaining_count", {
      where: { game_id: gameId },
    });

    return {
      player1Letters: lettersForPlayer1,
      player2Letters: lettersForPlayer2,
      totalRemaining: remaining || 0,
    };
  }
}

module.exports = LetterService;
