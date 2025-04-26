const Users = require("../models/Users");

class UserService {
  static async getProfile(user) {
    if (!user) throw new Error("Kullanıcı bulunamadı");

    return {
      id: user.id,
      username: user.username,
      email_address: user.email_address,
      user_win_count: user.user_win_count,
      user_loss_count: user.user_loss_count,
    };
  }
}

module.exports = UserService;
