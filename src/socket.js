const { Server } = require("socket.io");
const BoardCells = require("./models/BoardCells");
const Games = require("./models/Games");
const LettersPool = require("./models/LettersPool"); // ⬅️ Havuzdan harf sayısını okumak için

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

    socket.on("join_game_room", async ({ gameId }) => {
      try {
        console.log(`➡️ ${socket.id} game_${gameId} odasına katılıyor...`);
        socket.join(`game_${gameId}`);

        if (!gameRooms[gameId]) {
          gameRooms[gameId] = 1;
        } else {
          gameRooms[gameId]++;
        }

        console.log(`📊 game_${gameId} oda kişi sayısı: ${gameRooms[gameId]}`);

        const game = await Games.findByPk(gameId);
        if (!game || !game.player1_id || !game.player2_id) {
          console.log(
            `⚠️ Oyun henüz eşleşmedi. Board ve harf sayısı gönderilmeyecek.`
          );
          return;
        }

        // 🎯 Kalan harf sayısını al
        const totalRemaining =
          (await LettersPool.sum("remaining_count", {
            where: { game_id: gameId },
          })) || 0;

        // 👇 Her iki oyuncuya gönder
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

        if (gameRooms[gameId] === 2) {
          io.to(`game_${gameId}`).emit("board_initialized", board);
          console.log(`📦 Board gönderildi (HERKESE) game_${gameId}`);
        } else {
          socket.emit("board_initialized", board);
          console.log(`📦 Board gönderildi (SADECE) ${socket.id}`);
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
