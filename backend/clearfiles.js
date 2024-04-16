const fs = require("fs");
const path = require("path");
const util = require("util");

const readdir = util.promisify(fs.readdir);
const unlink = util.promisify(fs.unlink);
const rmdir = util.promisify(fs.rmdir);

async function clearDirectory(directoryPath, isUnzippedFolder = false) {
  try {
    const files = await readdir(directoryPath);

    for (const file of files) {
      if (file === ".gitignore" || file === ".gitkeep") continue;

      const filePath = path.join(directoryPath, file);
      const fileStats = await fs.promises.stat(filePath);

      if (fileStats.isDirectory()) {
        await clearDirectory(filePath);
        if (!isUnzippedFolder || file !== ".gitkeep") {
          await rmdir(filePath);
        }
      } else {
        await unlink(filePath);
      }
    }
  } catch (error) {
    console.error(`Error clearing directory at ${directoryPath}: ${error.message}`);
    throw error;
  }
}

async function wipeFolders() {
  try {
    const foldersToWipe = ["html", "parsedPDFs", "unzipped", "uploads"];
    const baseDirectory = path.join(__dirname, "files");

    for (const folder of foldersToWipe) {
      const folderPath = path.join(baseDirectory, folder);
      const isUnzippedFolder = folder === "unzipped";
      await clearDirectory(folderPath, isUnzippedFolder);
    }

    return true;
  } catch {
    return false;
  }
}

module.exports = wipeFolders;
