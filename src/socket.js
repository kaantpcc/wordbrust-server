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
    console.log(`A user connected: ${socket.id}`);

    socket.on("join_game_room", async ({ gameId }) => {
      try {
        console.log(`User ${socket.id} joined game room: ${gameId}`);
        socket.join(`game_${gameId}`);
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
