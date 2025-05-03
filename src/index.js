const express = require("express");
const path = require("path");
const cors = require("cors");
const http = require("http");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const authRoutes = require("./routes/AuthRoutes.js");
const userRoutes = require("./routes/UserRoutes.js");
const gameRoutes = require("./routes/GameRoutes.js");
const boardRoutes = require("./routes/BoardRoutes.js");
const letterRoutes = require("./routes/LetterRoutes.js");
const moveRoutes = require("./routes/MoveRoutes.js");

const { initSocket } = require("./socket");

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/board", boardRoutes);
app.use("/api/letter", letterRoutes);
app.use("/api/move", moveRoutes);

const server = http.createServer(app);

// 🔥 burada socket başlatıyoruz
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
