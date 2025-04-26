const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database.js");

class Users extends Model {}

Users.init(
  {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email_address: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    user_password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user_win_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    user_loss_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: "Users",
    tableName: "users",
    timestamps: false,
  }
);

module.exports = Users;
