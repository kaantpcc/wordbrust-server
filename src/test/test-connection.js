const db = require("../models");

async function testConnection(){
    try {
        await db.sequelize.authenticate();
        console.log("Connection has been established successfully.");
    } catch (error) {
        console.error("Connection has been failed", error);
    } finally {
        await db.sequelize.close();
    }
}

testConnection();