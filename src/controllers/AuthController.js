const AuthService = require("../services/AuthService");

class AuthController {
  static async register(req, res) {
    try {
      const userData = req.body;
      const result = await AuthService.register(userData);
      res.status(201).json(result); // HTTP 201 Created
    } catch (error) {
      console.error("Error during registration:", error.message);
      res.status(400).json({ error: error.message }); // HTTP 400 Bad Request
    }
  }
}

module.exports = AuthController;
