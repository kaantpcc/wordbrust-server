const express = require("express");
const AuthController = require("../controllers/AuthController.js");
const router = express.Router();
const { authenticateToken } = require("../middlewares/authMiddleware.js");

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/logout", authenticateToken, AuthController.logout);

module.exports = router;
