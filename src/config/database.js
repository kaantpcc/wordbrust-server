const { Sequelize } = require("sequelize");
const config = require("./config.js");

const env = process.env.NODE_ENV;
const sequelizeConfig = config[env];

let sequelize;

if (sequelizeConfig.use_env_variable) {
  sequelize = new Sequelize(process.env[sequelizeConfig.use_env_variable], {
    dialect: sequelizeConfig.dialect,
    dialectOptions: sequelizeConfig.dialectOptions,
  });
}

module.exports = sequelize;
