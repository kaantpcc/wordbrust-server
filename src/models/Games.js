const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database.js");
const Users = require("./Users.js");

class Games extends Model {}

Games.init(
  {
    player1_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Users,
        key: "id",
      },
    },
    player2_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Users,
        key: "id",
      },
    },
    player1_score: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    player2_score: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    game_status: {
      type: DataTypes.ENUM("waiting", "active", "finished"),
      allowNull: false,
      defaultValue: "waiting",
    },
    winner_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Users,
        key: "id",
      },
    },
    winner_score: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    game_mode: {
      type: DataTypes.ENUM("2min", "5min", "12h", "24h"),
      allowNull: false,
    },
    last_move_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    current_turn_player_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Users,
        key: "id",
      },
    },
  },
  {
    sequelize,
    modelName: "Games",
    tableName: "games",
  }
);

Users.hasMany(Games, {
  foreignKey: "player1_id",
  as: "games_as_player1",
});
Users.hasMany(Games, {
  foreignKey: "player2_id",
  as: "games_as_player2",
});
Users.hasMany(Games, {
  foreignKey: "winner_id",
  as: "games_as_winner",
});
Games.belongsTo(Users, {
  foreignKey: "player1_id",
  as: "player1",
});
Games.belongsTo(Users, {
  foreignKey: "player2_id",
  as: "player2",
});
Games.belongsTo(Users, {
  foreignKey: "winner_id",
  as: "winner",
});
Games.belongsTo(Users, {
  foreignKey: "current_turn_player_id",
  as: "current_turn_player",
});

module.exports = Games;
