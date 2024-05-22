const loginCredentials = require("./credentials.js");

module.exports = class Helpers {
  constructor() {}

  static GPTPrompt = Object.freeze({
    gptParagraph: 0,
    gptTable: 1,
    gptSEO: 2,
    gptJSON: 3,
    gptHTML: 4,
    gptDescription: 5,
    gptTest: 6,
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
