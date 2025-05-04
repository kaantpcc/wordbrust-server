const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database.js");
const Users = require("./Users.js");
const Games = require("./Games.js");

class PlayerLetters extends Model {}

PlayerLetters.init(
  {
    player_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Users,
        key: "id",
      },
    },
    game_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Games,
        key: "id",
      },
    },
    letter: {
      type: DataTypes.STRING(2),
      allowNull: false,
    },
    is_frozen: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "PlayerLetters",
    tableName: "player_letters",
    timestamps: false,
  }
);

Users.hasMany(PlayerLetters, {
  foreignKey: "player_id",
  as: "player_letters",
});

Games.hasMany(PlayerLetters, {
  foreignKey: "game_id",
  as: "game_letters",
});

PlayerLetters.belongsTo(Users, {
  foreignKey: "player_id",
  as: "player",
});

PlayerLetters.belongsTo(Games, {
  foreignKey: "game_id",
  as: "game",
});

module.exports = PlayerLetters;
