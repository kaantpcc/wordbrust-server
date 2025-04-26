const Users = require("../models/Users");

class UserService {
  static async getProfile(user) {
    const userData = await Users.findByPk(user.id);

    if (!userData) throw new Error("Kullanıcı bulunamadı");

    return {
      id: userData.id,
      username: userData.username,
      email: userData.email_address,
      user_win_count: userData.user_win_count,
      user_lose_count: userData.user_lose_count,
    };
  }
}

module.exports = UserService;
