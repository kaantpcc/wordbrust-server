const LettersPool = require("../models/LettersPool");
const PlayerLetters = require("../models/PlayerLetters");
const { Op } = require("sequelize");
const sequelize = require("../config/database"); // Sequelize instance

class LetterService {
  static async giveInitialLettersToPlayer(gameId, playerId, count = 7) {
    return await sequelize.transaction(async (t) => {
      const pool = await LettersPool.findAll({
        where: {
          game_id: gameId,
          remaining_count: { [Op.gt]: 0 },
        },
        lock: t.LOCK.UPDATE, // Diğer transaction'lara karşı kilitle
        transaction: t,
      });

      if (!pool.length) throw new Error("Harf havuzu boş.");

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

      // Harfleri oyuncuya yaz
      await PlayerLetters.bulkCreate(
        selectedLetters.map((l) => ({
          game_id: gameId,
          player_id: playerId,
          letter: l.letter,
          is_frozen: false,
        })),
        { transaction: t }
      );

      // Havuzdan düşür
      const usageMap = {};
      for (const { letter } of selectedLetters) {
        usageMap[letter] = (usageMap[letter] || 0) + 1;
      }

      for (const [letter, amount] of Object.entries(usageMap)) {
        await LettersPool.decrement("remaining_count", {
          by: amount,
          where: { game_id: gameId, letter },
          transaction: t,
        });
      }

      // Sadece harfleri dön
      return {
        success: true,
        letters: selectedLetters,
      }; // Örn: [{ letter: 'A' }, { letter: 'K' }, ...]
    });
  }

  static async drawLettersToFill(gameId, playerId) {
    const currentLetters = await PlayerLetters.findAll({
      where: { game_id: gameId, player_id: playerId },
    });

    const lettersNeeded = 7 - currentLetters.length;
    if (lettersNeeded <= 0) return [];

    // Havuzdan rastgele harfler çek
    const pool = await LettersPool.findAll({
      where: {
        game_id: gameId,
        remaining_count: { [Op.gt]: 0 },
      },
    });

    const drawn = [];

    for (let i = 0; i < lettersNeeded && pool.length > 0; i++) {
      // Rastgele harf seç
      const randomIndex = Math.floor(Math.random() * pool.length);
      const letterEntry = pool[randomIndex];

      // Harfi kaydet
      await PlayerLetters.create({
        game_id: gameId,
        player_id: playerId,
        letter: letterEntry.letter,
      });

      // Havuzdan bir eksilt
      letterEntry.remaining_count -= 1;
      await letterEntry.save();

      drawn.push(letterEntry.letter);

      // Eğer sayısı 0'a düştüyse pool'dan çıkar
      if (letterEntry.remaining_count === 0) {
        pool.splice(randomIndex, 1);
      }
    }

    return drawn; // İstersek frontend'e de dönebiliriz
  }

  static async getLettersForPlayer(gameId, playerId) {
    const letters = await PlayerLetters.findAll({
      where: { game_id: gameId, player_id: playerId },
      attributes: ["letter"],
      raw: true,
    });

    return letters.map((l) => l.letter); // Harfleri döndür
  }

  static async getRemainingLetterCount(gameId) {
    const total = await LettersPool.sum("remaining_count", {
      where: { game_id: gameId },
    });
    return total || 0;
  }

  static async getPlayerLettersCount(gameId, playerId) {
    const total = await PlayerLetters.count({
      where: { game_id: gameId, player_id: playerId },
    });
    return total || 0;
  }

  static async removeUsedLetters(gameId, playerId, usedLetterArray) {
    const currentLetters = await PlayerLetters.findAll({
      where: { game_id: gameId, player_id: playerId },
    });

    const used = [...usedLetterArray]; // ['E', 'L']

    for (const letterObj of currentLetters) {
      const idx = used.findIndex((l) => l === letterObj.letter);
      if (idx !== -1) {
        await letterObj.destroy(); // sadece birini sil
        used.splice(idx, 1); // o harfi kullandık, çıkar
      }
      if (used.length === 0) break;
    }
  }
}

module.exports = LetterService;
