const loginCredentials = require("./credentials.js");
const fs = require("fs");
const path = require("path");

const { exec } = require("child_process");

module.exports = class Helpers {
  constructor() {}

  static GPTPrompt = Object.freeze({
    gptSEO: 0,
    gptJSON: 1,
    gptHTML: 2,
    gptDescription: 3,
    gptImage: 4,
    gptHTMLEx: 5,
    gptProductDataExtract: 6,
    gptProductDataExtractEx: 7,
    gptProductDataExtractRules: 8,
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
    try {
      // do the work to conver the pdf to jpg here. find the best way to do this
      const pyPath = path.join(__dirname, "convert.py");

      const command = `python "${pyPath}" "${outputDir}" "${outputDir}"`;

      return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error converting PDF to JPG: ${error.message}`);
            reject(error);
            return;
          }
          if (stderr) {
            console.error(`Error during conversion: ${stderr}`);
            reject(error);
            return;
          }

          const convertedFile = path.join(outputDir, `${path.basename(pdfPath, path.extname(pdfPath))}.jpg`);

          console.log(`PDF converted successfully to JPG in ${outputDir}`);

          resolve(convertedFile);
        });
      });
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

  findUserDataByUsername(arr, targetUsername, targetDataPoint) {
    const user = arr.find((user) => user.username === targetUsername);
    return user ? user[targetDataPoint] : null;
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
