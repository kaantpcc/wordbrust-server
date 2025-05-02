const { Server } = require("socket.io");
const BoardCells = require("./models/BoardCells");
const Games = require("./models/Games");
const LettersPool = require("./models/LettersPool"); // ⬅️ Havuzdan harf sayısını okumak için
const PlayerLetters = require("./models/PlayerLetters");
const LetterService = require("./services/LetterService"); // ⬅️ Harfleri vermek için
const Users = require("./models/Users"); // ⬅️ Kullanıcı bilgilerini almak için

let io;

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
        const roomName = `game_${gameId}`;
        console.log(`➡️ ${socket.id} joining ${roomName}...`);
        await socket.join(roomName);

        // Adapter’dan odadaki socket ID’lerini al
        const clients = await io.in(roomName).allSockets(); // Set<string>
        console.log(`📊 ${roomName} kişi sayısı: ${clients.size}`);

        if (clients.size < 2) {
          console.log("⏳ Diğer oyuncu bekleniyor...");
          return;
        }

        // ✅ Her iki oyuncu hazır olduğunda emit
        io.to(roomName).emit("both_players_ready", {
          message: "Her iki oyuncu odaya katıldı.",
        });

        // Oyuncu eşleşme bilgilerini al
        const game = await Games.findByPk(gameId);
        if (!game?.player1_id || !game?.player2_id) {
          console.log("⚠️ Oyun henüz eşleşmedi.");
          return;
        }

        // Oyuncu bilgilerini gönder
        const [p1, p2] = await Promise.all([
          Users.findByPk(game.player1_id, { attributes: ["id", "username"] }),
          Users.findByPk(game.player2_id, { attributes: ["id", "username"] }),
        ]);
        io.to(roomName).emit("players_info", {
          players: [
            { id: p1.id, username: p1.username, score: game.player1_score },
            { id: p2.id, username: p2.username, score: game.player2_score },
          ],
        });

        // 1. Kalan harf sayısını gönder
        const totalRemaining =
          (await LettersPool.sum("remaining_count", {
            where: { game_id: gameId },
          })) || 0;
        io.to(roomName).emit("remaining_letters_updated", { totalRemaining });

        // 2. Board’u gönder (raw: true ile düz JSON)
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
          raw: true,
        });
        for (const socketId of clients) {
          io.to(socketId).emit("board_initialized", board);
          console.log(`📦 Board gönderildi → ${socketId}`);
        }

        // 3. Her oyuncuya özel harf gönder
        const sockets = Array.from(clients);
        const players = [
          { id: game.player1_id, socketId: sockets[0] },
          { id: game.player2_id, socketId: sockets[1] },
        ];

        for (const { id, socketId } of players) {
          // Daha önce harf aldıysa tekrar aldırma
          const existing = await PlayerLetters.findAll({
            where: { game_id: gameId, player_id: id },
            attributes: ["letter"],
            raw: true,
          });

          const letters = existing.length
            ? existing.map((l) => ({ letter: l.letter }))
            : (await LetterService.giveInitialLettersToPlayer(gameId, id))
                .letters;

          io.to(socketId).emit("initial_letters", { playerId: id, letters });
          console.log(
            existing.length
              ? `🔁 Zaten harf almıştı → ${id}`
              : `🆕 Harfler verildi → ${id}`
          );

          // Kalan harf sayısını güncelle
          const updatedRemaining =
            (await LettersPool.sum("remaining_count", {
              where: { game_id: gameId },
            })) || 0;
          io.to(roomName).emit("remaining_letters_updated", {
            totalRemaining: updatedRemaining,
          });
          console.log(`🔄 Güncel kalan harf sayısı: ${updatedRemaining}`);
        }
      } catch (error) {
        console.error(`❌ join_game_room hatası:`, error);
      }
    });

    socket.on("leave_game_room", ({ gameId }) => {
      const roomName = `game_${gameId}`;
      socket.leave(roomName);
      console.log(`🚪 ${socket.id} left ${roomName}`);
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
