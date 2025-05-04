const { Server } = require("socket.io");

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

    socket.on("join_game_room", async ({ gameId }) => {
      try {
        const roomName = `game_${gameId}`;
        console.log(`➡️ ${socket.id} joining ${roomName}...`);
        await socket.join(roomName);

        const clients = await io.in(roomName).allSockets(); // Set<string>
        console.log(`📊 ${roomName} kişi sayısı: ${clients.size}`);

        if (clients.size === 2) {
          io.to(roomName).emit("both_players_ready", {
            message: "Her iki oyuncu odaya katıldı.",
          });
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

function emitMoveMade(gameId) {
  if (io) {
    io.to(`game_${gameId}`).emit("move_made");
    console.log(`📢 move_made sinyali gönderildi -> game_${gameId}`);
  }
}

function resignSignal(gameId, resignedBy, winnerId, winnerScore) {
  if (io) {
    io.to(`game_${gameId}`).emit("game_resigned", {
      gameId,
      resignedBy,
      winnerId,
      winnerScore,
    });
    console.log(
      `📢 resignSignal: game_${gameId} -> player ${resignedBy} pes etti`
    );
  }
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}

module.exports = { initSocket, getIO, emitMoveMade, resignSignal };
