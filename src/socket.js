const { Server } = require("socket.io");
const BoardCells = require("./models/BoardCells"); // 🔥 boardu çekebilmek için ekliyoruz

let io;
const gameRooms = {}; // 🔥 Oda takibi için { gameId: userCount }

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`A user connected: ${socket.id}`);

    socket.on("join_game_room", async ({ gameId }) => {
      try {
        console.log(`User ${socket.id} joining game room: ${gameId}`);
        socket.join(`game_${gameId}`);

        // Oda kullanıcı sayısını güncelle
        if (!gameRooms[gameId]) {
          gameRooms[gameId] = 1;
        } else {
          gameRooms[gameId]++;
        }

        console.log(`Game ${gameId} current users: ${gameRooms[gameId]}`);

        // Eğer odadaki kullanıcı sayısı 2 olduysa boardu gönder
        if (gameRooms[gameId] === 2) {
          console.log(`Game ${gameId} is ready! Sending board...`);

          // Database'den boardu çekiyoruz
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

          io.to(`game_${gameId}`).emit("board_initialized", board);

          console.log(`Board sent for game ${gameId}`);
        }

      } catch (error) {
        console.log(`Error joining room: ${error}`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
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
