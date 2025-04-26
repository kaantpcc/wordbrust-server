const Users = require("../models/Users.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");

class AuthService {
  static async register(userData) {
    const { username, email_address, user_password } = userData;

    if (!username) throw new Error("Kullanıcı adı boş bırakılamaz");
    if (!email_address) throw new Error("Email adresi boş bırakılamaz");
    if (!user_password) throw new Error("Şifre boş bırakılamaz");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email_address))
      throw new Error("Lütfen geçerli bir email adresi girin");

    const existingUserEmail = await Users.findOne({
      where: {
        email_address,
      },
    });

    if (existingUserEmail) throw new Error("Bu email adresi zaten alınmış");

    const existingUserName = await Users.findOne({
      where: {
        username,
      },
    });

    if (existingUserName) throw new Error("Bu kullanıcı adı zaten alınmış");

    if (user_password.length < 8)
      throw new Error("Şifre en az 8 karakter olmalıdır");

    const hasUpperCase = /[A-Z]/.test(user_password);
    const hasLowerCase = /[a-z]/.test(user_password);
    const hasNumbers = /\d/.test(user_password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers)
      throw new Error(
        "Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir"
      );

    const hashedPassword = await bcrypt.hash(user_password, 10);

    const newUser = await Users.create({
      username,
      email_address,
      user_password: hashedPassword,
    });

    console.log("User created succesfully: ", newUser.username);

    return newUser;
  }

  static async login(userData) {
    const { email_or_username, user_password, remember_me } = userData;
    if (!email_or_username)
      throw new Error("Kullanıcı adı veya email adresi boş bırakılamaz");
    if (!user_password) throw new Error("Şifre boş bırakılamaz");

    const user = await Users.findOne({
      where: {
        [Op.or]: [
          { email_address: email_or_username },
          { username: email_or_username },
        ],
      },
    });

    if (!user) throw new Error("Kullanıcı bulunamadı");

    const passwordMatch = await bcrypt.compare(
      user_password,
      user.user_password
    );
    if (!passwordMatch) throw new Error("Geçersiz şifre");

    const payload = {
      id: user.id,
      email_address: user.email_address,
      username: user.username,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: remember_me ? "7d" : "1h",
    });

    return { token, user: payload };
  }

  static async logout(userData) {
    console.log(
      `Logout request for user: ${userData.username} (ID: ${userData.id})`
    );
    return { message: "Başarıyla çıkış yaptınız" };
  }
}

module.exports = AuthService;
