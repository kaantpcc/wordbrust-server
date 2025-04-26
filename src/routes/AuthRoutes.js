const express = require("express");
const AuthController = require("../controllers/AuthController.js");
const router = express.Router();

router.post("/register", AuthController.register);

module.exports = router;
