const loginCredentials = require("./credentials.js");
const fs = require("fs");
const path = require("path");
const pdfPoppler = require("pdf-poppler");

module.exports = class Helpers {
  constructor() {}

  static GPTPrompt = Object.freeze({
    gptParagraph: 0,
    gptTable: 1,
    gptSEO: 2,
    gptJSON: 3,
    gptHTML: 4,
    gptDescription: 5,
    gptImage: 6,
  });

  // HELPERS
  removeFilenameEnding(filename) {
    const extensions = [".jpg", ".jpeg", ".png", ".gif", ".txt", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".mp3", ".mp4", ".wav"];

    for (const ext of extensions) {
      if (this.stringEndsWith(filename, ext)) {
        return filename.slice(0, -ext.length);
      }
    }

    return filename;
  }

  stringEndsWith(str, search) {
    if (!str || !search) return false;
    if (search.length > str.length) return false;

    return str.substring(str.length - search.length) === search;
  }

  getDateString = function () {
    let date = new Date();

    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = String(date.getFullYear());

    return month + day + year;
  };

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
      page: null, // Convert all pages. You can specify a page number if needed.
    };

    try {
      await pdfPoppler.convert(pdfPath, options);
      console.log(`PDF converted successfully to JPG in ${outputDir}`);
    } catch (error) {
      console.error("Error converting PDF to JPG:", error);
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
