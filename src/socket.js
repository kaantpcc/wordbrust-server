const { Server } = require("socket.io");
const BoardCells = require("./models/BoardCells");
const Games = require("./models/Games"); // 🧠 oyun eşleşmesini kontrol etmek için

let io;
const gameRooms = {}; // Oda socket kullanıcı sayısı takibi

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

        // Oda kullanıcı sayısını güncelle
        if (!gameRooms[gameId]) {
          gameRooms[gameId] = 1;
        } else {
          gameRooms[gameId]++;
        }

        console.log(`📊 game_${gameId} oda kişi sayısı: ${gameRooms[gameId]}`);

        // DB'den oyun bilgisini al (eşleşme kontrolü)
        const game = await Games.findByPk(gameId);
        if (!game || !game.player1_id || !game.player2_id) {
          console.log(`⚠️ Oyun henüz eşleşmedi. Board gönderilmeyecek.`);
          return;
        }

        // Board verisini çek
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

        // 👇 Her iki oyuncu da bağlıysa (eşleşme anı)
        if (gameRooms[gameId] === 2) {
          io.to(`game_${gameId}`).emit("board_initialized", board);
          console.log(`📦 Board gönderildi (HERKESE) game_${gameId}`);
        } else {
          // 👇 Oyuna geri dönen kullanıcıya sadece kendisine gönder
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
      // Kullanıcının hangi odalardan ayrıldığını bilmiyoruz ama gameRooms sayacını sıfırlamak isterseniz mapping tutmanız gerekir
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
