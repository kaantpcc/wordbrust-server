const sequelize = require("../config/database.js");
const Users = require("../models/Users.js");

async function syncDatabase() {
  try {
    await sequelize.sync({ alter: true });
    console.log("Database synchronized successfully.");
  } catch (error) {
    console.error(
      "An error occurred while synchronizing the database: ",
      error
    );
  } finally {
    await sequelize.close();
  }
}

console.log("Syncing database...");

syncDatabase();