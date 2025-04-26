const UserService = require('../services/UserService');

class UserController {
  static async getProfile(req, res) {
    try {
      const user = req.user; // user info is set by authentication middleware
      const profile = await UserService.getProfile(user);
      res.status(200).json(profile); // HTTP 200 OK
    } catch (error) {
      console.error("Error fetching user profile:", error.message);
      res.status(400).json({ error: error.message }); // HTTP 400 Bad Request
    }
  }
}

module.exports = UserController;