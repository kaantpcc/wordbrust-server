const express = require("express");
const path = require("path");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const authRoutes = require("./routes/AuthRoutes.js");
const userRoutes = require("./routes/UserRoutes.js");
const gameRoutes = require("./routes/GameRoutes.js");

const BoardCells = require("./models/BoardCells.js");

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes); // authentication routes
app.use("/api/user", userRoutes); // user routes
app.use("/api/game", gameRoutes); // game routes

const server = http.createServer(app);

const io = new Server(server, {
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

      console.log(`Board initialized for game ${gameId}`);
    } catch (error) {
      console.log(`Error sending board to room: ${error}`);
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
