const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database.js");
const Games = require("./Games.js");

class BoardCells extends Model {}

BoardCells.init(
  {
    game_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Games,
        key: "id",
      },
    },
    row: {
      // row 0-14
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    col: {
      // column 0-14
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    letter: {
      // letter a-z
      type: DataTypes.STRING(1),
      allowNull: true,
    },
    used_as_letter:{
      // for joker letters
      type: DataTypes.STRING(2),
      allowNull: true,
    },
    letter_multiplier: {
      // letter multiplier 1-3
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    word_multiplier: {
      // word multiplier 1-3
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    mine_type: {
      type: DataTypes.ENUM(
        "point_split", // puan_bolunmesi
        "point_transfer", // puan_transferi
        "letter_loss", // harf_kaybi
        "move_block", // hamle_engeli
        "word_cancel" // kelime_iptali
      ),
      allowNull: true,
    },
    bonus_type: {
      type: DataTypes.ENUM(
        "zone_block", // bolge_yasagi
        "letter_freeze", // harf_yasagi
        "extra_move" // ekstra_hamle
      ),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "BoardCells",
    tableName: "board_cells",
    timestamps: false,
  }
);

Games.hasMany(BoardCells, { foreignKey: "game_id", as: "board_cells" });
BoardCells.belongsTo(Games, { foreignKey: "game_id", as: "game" });

module.exports = BoardCells;
