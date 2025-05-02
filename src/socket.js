const { Server } = require("socket.io");
const BoardCells = require("./models/BoardCells");
const Games = require("./models/Games");
const LettersPool = require("./models/LettersPool"); // ⬅️ Havuzdan harf sayısını okumak için
const PlayerLetters = require("./models/PlayerLetters");
const LetterService = require("./services/LetterService"); // ⬅️ Harfleri vermek için

let io;
const gameRooms = {};

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`🟢 Kullanıcı bağlandı: ${socket.id}`);

    socket.on("join_game_room", async ({ gameId, playerId }) => {
      try {
        console.log(`➡️ ${socket.id} game_${gameId} odasına katılıyor...`);
        socket.join(`game_${gameId}`);

        if (!gameRooms[gameId]) {
          gameRooms[gameId] = new Set();
        }

        gameRooms[gameId].add(socket.id);
        console.log(
          `📊 game_${gameId} oda kişi sayısı: ${gameRooms[gameId].size}`
        );

        const game = await Games.findByPk(gameId);
        if (!game || !game.player1_id || !game.player2_id) {
          console.log(
            `⚠️ Oyun henüz eşleşmedi. Board ve harf sayısı gönderilmeyecek.`
          );
          return;
        }

        // 🎯 Kalan harf sayısını al ve gönder
        const totalRemaining =
          (await LettersPool.sum("remaining_count", {
            where: { game_id: gameId },
          })) || 0;

        io.to(`game_${gameId}`).emit("remaining_letters_updated", {
          totalRemaining,
        });
        console.log(`🔤 Kalan harf sayısı gönderildi: ${totalRemaining}`);

        // 📦 Board'u gönder
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
        });

        for (const socketId of gameRooms[gameId]) {
          io.to(socketId).emit("board_initialized", board);
          console.log(`📦 Board gönderildi → ${socketId}`);
        }

        // 🎯 İlk harfleri yalnızca ilk kez ver
        const giveInitialLettersIfNeeded = async (playerId, socketId) => {
          const existingLetters = await PlayerLetters.findAll({
            where: { game_id: gameId, player_id: playerId },
            attributes: ["letter"],
          });

          if (existingLetters.length === 0) {
            const { letters } = await LetterService.giveInitialLettersToPlayer(
              gameId,
              playerId
            );
            io.to(socketId).emit("initial_letters", { playerId, letters });
            console.log(`🆕 Harfler verildi → ${playerId}`);
          } else {
            const letters = existingLetters.map((l) => ({ letter: l.letter }));
            io.to(socketId).emit("initial_letters", { playerId, letters });
            console.log(`🔁 Zaten harf almıştı → ${playerId}`);
          }
        };

        // Harfleri gönder (oyuncular belli)
        if (playerId === game.player1_id) {
          await giveInitialLettersIfNeeded(game.player1_id, socket.id);
        } else if (playerId === game.player2_id) {
          await giveInitialLettersIfNeeded(game.player2_id, socket.id);
        }
      } catch (error) {
        console.log(`❌ Odaya katılırken hata: ${error}`);
      }
    });

    socket.on("leave_game_room", ({ gameId }) => {
      const roomName = `game_${gameId}`;
      socket.leave(roomName);
      console.log(`🚪 Kullanıcı ayrıldı: ${socket.id} → ${roomName}`);

      if (gameRooms[gameId]) {
        gameRooms[gameId]--;

        if (gameRooms[gameId] <= 0) {
          delete gameRooms[gameId];
        }
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔴 Kullanıcı bağlantısı kesildi: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}

module.exports = { initSocket, getIO };
