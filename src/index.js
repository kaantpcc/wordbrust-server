const express = require("express");
const path = require("path");
const cors = require("cors");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const authRoutes = require("./routes/AuthRoutes.js");
const userRoutes = require("./routes/UserRoutes.js"); 

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes); // authentication routes
app.use("/api/user", userRoutes); // user routes

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
