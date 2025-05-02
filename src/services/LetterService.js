const LettersPool = require("../models/LettersPool");
const PlayerLetters = require("../models/PlayerLetters");
const { Op } = require("sequelize");

class LetterService {
  static async giveInitialLettersToPlayer(gameId, playerId, count = 7) {
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

    const letterBag = [];
    for (const item of pool) {
      for (let i = 0; i < item.remaining_count; i++) {
        letterBag.push({ letter: item.letter });
      }
    }

    if (letterBag.length < count) {
      throw new Error("Yeterli harf yok.");
    }

    // 7 rastgele harf
    const selectedLetters = [];
    for (let i = 0; i < count; i++) {
      const randIndex = Math.floor(Math.random() * letterBag.length);
      const chosenLetter = letterBag[randIndex];
      selectedLetters.push(chosenLetter);
      letterBag.splice(randIndex, 1);
    }

    //kullanıcı harfleri
    await PlayerLetters.bulkCreate(
      selectedLetters.map((l) => ({
        game_id: gameId,
        player_id: playerId,
        letter: l.letter,
        is_frozen: false,
      }))
    );

    // havuzdan düşür
    const usageMap = {};
    for (const { letter } of selectedLetters) {
      usageMap[letter] = (usageMap[letter] || 0) + 1;
    }

    await Promise.all(
      Object.entries(usageMap).map(([letter, amount]) =>
        LettersPool.decrement("remaining_count", {
          by: amount,
          where: { game_id: gameId, letter },
        })
      )
    );

    return {
      letters: selectedLetters,
    }; // [{ letter: "A" }, ...]
  }
}

module.exports = LetterService;
