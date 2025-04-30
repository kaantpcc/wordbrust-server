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

        // Database'den board'u çekiyoruz
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

        // 🔁 Eğer oyun yeni başlıyorsa iki tarafa da gönder (eşleşme anı)
        if (gameRooms[gameId] === 2) {
          io.to(`game_${gameId}`).emit("board_initialized", board);
          console.log(`Board sent to BOTH for new game: ${gameId}`);
        } else {
          // 🔁 Eğer eski oyuna biri geri döndüyse sadece ona gönder
          socket.emit("board_initialized", board);
          console.log(
            `Board sent ONLY to ${socket.id} for existing game: ${gameId}`
          );
        }
      } catch (error) {
        console.log(`Error joining room: ${error}`);
      }
    });

    socket.on("leave_game_room", ({ gameId }) => {
      const roomName = `game_${gameId}`;
      socket.leave(roomName);
      console.log(`User ${socket.id} left room: ${roomName}`);
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
