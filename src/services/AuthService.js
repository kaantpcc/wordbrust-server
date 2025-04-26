const Users = require("../models/Users.js");
const bcrypt = require("bcrypt");

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
}

module.exports = AuthService;
