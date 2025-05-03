const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database.js");

class Words extends Model {}

Words.init(
  {
    word: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Words",
    tableName: "words",
    timestamps: false,
    indexes: [
      {
        name: "idx_words_word",
        fields: ["word"],
      },
    ],
  }
);

module.exports = Words;
