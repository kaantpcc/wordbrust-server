const express = require('express');
const UserController = require('../controllers/UserController');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware.js');

router.get("/profile", authenticateToken, UserController.getProfile); // Get user profile

module.exports = router;