const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database.js");
const Users = require("./Users.js");
const Games = require("./Games.js");

class Moves extends Model {}

Moves.init(
  {
    game_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Games,
        key: "id",
      },
    },
    player_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Users,
        key: "id",
      },
    },
    word: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    move_type: {
      type: DataTypes.ENUM("play", "pass", "resign"),
      allowNull: false,
      defaultValue: "play",
    },
    used_letters: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    joker_used: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    bonus_effect: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    score_earned: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    start_row: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    start_col: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    direction: {
      type: DataTypes.ENUM("horizontal", "vertical"),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "Moves",
    tableName: "moves",
    timestamps: false,
  }
);

Users.hasMany(Moves, {
  foreignKey: "player_id",
  as: "moves",
});
Games.hasMany(Moves, {
  foreignKey: "game_id",
  as: "game_moves",
});
Moves.belongsTo(Users, {
  foreignKey: "player_id",
  as: "player",
});
Moves.belongsTo(Games, {
  foreignKey: "game_id",
  as: "game",
});

module.exports = Moves;
