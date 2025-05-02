const LettersPool = require("../models/LettersPool");
const PlayerLetters = require("../models/PlayerLetters");
const { Op } = require("sequelize");
const { getIO } = require("../socket"); // ← socket.js yoluna göre gerekirse düzelt

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

    // 🎯 7 rastgele harf seç
    const selectedLetters = [];
    for (let i = 0; i < count; i++) {
      const randIndex = Math.floor(Math.random() * letterBag.length);
      const chosenLetter = letterBag[randIndex];
      selectedLetters.push(chosenLetter);
      letterBag.splice(randIndex, 1);
    }

    // 📝 Kullanıcının harflerini kaydet
    await PlayerLetters.bulkCreate(
      selectedLetters.map((l) => ({
        game_id: gameId,
        player_id: playerId,
        letter: l.letter,
        is_frozen: false,
      }))
    );

    // 📉 Havuzdan düşür
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

    // 🔁 Güncel kalan harf sayısını yay
    const updatedRemaining = await LettersPool.sum("remaining_count", {
      where: { game_id: gameId },
    });

    getIO().to(`game_${gameId}`).emit("remaining_letters_updated", {
      totalRemaining: updatedRemaining,
    });

    return {
      letters: selectedLetters,
    };
  }
}

module.exports = LetterService;
