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
          console.log(`⚠️ Oyun henüz eşleşmedi.`);
          return;
        }

        // 1. Kalan harf sayısını gönder
        const totalRemaining =
          (await LettersPool.sum("remaining_count", {
            where: { game_id: gameId },
          })) || 0;

        io.to(`game_${gameId}`).emit("remaining_letters_updated", {
          totalRemaining,
        });

        // 2. Board'u gönder
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

        // ✅ Her kullanıcıya board gönder
        for (const socketId of gameRooms[gameId]) {
          io.to(socketId).emit("board_initialized", board);
          console.log(`📦 Board gönderildi → ${socketId}`);
        }

        // 3. Her oyuncuya özel harf gönder
        const sockets = Array.from(gameRooms[gameId]);

        const players = [
          { id: game.player1_id, socketId: sockets[0] },
          { id: game.player2_id, socketId: sockets[1] },
        ];

        for (const player of players) {
          const existingLetters = await PlayerLetters.findAll({
            where: { game_id: gameId, player_id: player.id },
            attributes: ["letter"],
          });

          if (existingLetters.length === 0) {
            const { letters } = await LetterService.giveInitialLettersToPlayer(
              gameId,
              player.id
            );
            io.to(player.socketId).emit("initial_letters", {
              playerId: player.id,
              letters,
            });
            console.log(`🆕 Harfler verildi → ${player.id}`);
          } else {
            const letters = existingLetters.map((l) => ({ letter: l.letter }));
            io.to(player.socketId).emit("initial_letters", {
              playerId: player.id,
              letters,
            });
            console.log(`🔁 Zaten harf almıştı → ${player.id}`);
          }

          const updatedRemaining =
            (await LettersPool.sum("remaining_count", {
              where: { game_id: gameId },
            })) || 0;

          io.to(`game_${gameId}`).emit("remaining_letters_updated", {
            totalRemaining: updatedRemaining,
          });
          console.log(
            `🔄 Güncel kalan harf sayısı gönderildi: ${updatedRemaining}`
          );
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
