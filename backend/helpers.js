const loginCredentials = require("./credentials.js");
const fs = require("fs");
const path = require("path");
const pdfPoppler = require("pdf-poppler");

module.exports = class Helpers {
  constructor() {}

  static GPTPrompt = Object.freeze({
    gptSEO: 0,
    gptJSON: 1,
    gptHTML: 2,
    gptDescription: 3,
    gptImage: 4,
    gptHTMLEx: 5,
  });

  // HELPERS
  async imagePathToBase64String(imagePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(imagePath, (err, data) => {
        if (err) {
          reject(err);
        } else {
          const base64Image = data.toString("base64");
          resolve(base64Image);
        }
      });
    });
  }

  async convertPdfToJpg(pdfPath, outputDir) {
    const options = {
      format: "jpeg",
      out_dir: outputDir,
      out_prefix: path.basename(pdfPath, path.extname(pdfPath)),
      page: null, // Convert all pages
    };

    try {
      await pdfPoppler.convert(pdfPath, options);

      const convertedFile = path.join(options.out_dir, `${options.out_prefix}-1.jpg`);

      console.log(`PDF converted successfully to JPG in ${outputDir}`);

      return convertedFile;
    } catch (err) {
      console.error("Error converting PDF to JPG:", err);
      throw err;
    }
  }

  // LOGIN HELPERS
  generatePassword() {
    const date = new Date();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);

    return `gvc${month}${year}`;
  }

  findNameByUsername(arr, targetUsername) {
    const user = arr.find((user) => user.username === targetUsername);
    return user ? user.name : null;
  }

  findRoleByUsername(arr, targetUsername) {
    const user = arr.find((user) => user.username === targetUsername);
    return user ? user.role : null;
  }

  checkUserNameValue(user) {
    let check = loginCredentials.find((u) => u.username === user);
    if (check) {
      return true;
    } else {
      return false;
    }
  }
};
