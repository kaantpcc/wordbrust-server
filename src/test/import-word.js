const axios = require("axios");
const Words = require("../models/Words.js");
const sequelize = require("../config/database.js");

async function importWordsFromGithub() {
  try {
    await sequelize.sync();

    const response = await axios.get(
      "https://raw.githubusercontent.com/CanNuhlar/Turkce-Kelime-Listesi/refs/heads/master/turkce_kelime_listesi.txt"
    );
    const words = response.data.split("\n");

    const wordObjects = words
      .map((word) => {
        const trimmedWord = word.trim().toLowerCase();
        if (trimmedWord.length > 0) {
          return { word: trimmedWord };
        }
        return null;
      })
      .filter(Boolean);

    await Words.bulkCreate(wordObjects, {
      ignoreDuplicates: true,
    });
    console.log("Words imported successfully.");
  } catch (error) {
    console.error("Error importing words:", error);
  }
}

importWordsFromGithub();
