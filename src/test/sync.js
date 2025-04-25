const sequelize = require("../config/database.js");

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

syncDatabase();