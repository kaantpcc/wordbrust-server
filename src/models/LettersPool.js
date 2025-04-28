const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database.js");
const Games = require("./Games.js");

class LettersPool extends Model {}

LettersPool.init(
  {
    game_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Games,
        key: "id",
      },
    },
    letter: {
      type: DataTypes.STRING(1),
      allowNull: false,
    },
    remaining_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    letter_score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    sequelize,
    modelName: "LettersPool",
    tableName: "letters_pool",
    timestamps: false,
  }
);

Games.hasMany(LettersPool, { foreignKey: "game_id", as: "letters_pool" });
LettersPool.belongsTo(Games, { foreignKey: "game_id", as: "game" });

module.exports = LettersPool;
