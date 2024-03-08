const fs = require("fs");
const path = require("path");
const util = require("util");

// Promisify the readdir and unlink functions to use them with async/await
const readdir = util.promisify(fs.readdir);
const unlink = util.promisify(fs.unlink);

async function clearDirectory(directoryPath) {
  try {
    // Read all files in directory
    const files = await readdir(directoryPath);

    // Loop through all files and delete them
    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      const fileStats = await fs.promises.stat(filePath);

      if (fileStats.isDirectory()) {
        // If it's a directory, recursively clear its contents
        await clearDirectory(filePath);
      } else {
        // If it's a file, delete it
        await unlink(filePath);
      }
    }
  } catch (error) {
    console.error(`Error clearing directory at ${directoryPath}: ${error.message}`);
    throw error; // Rethrow the error for the caller to handle
  }
}

async function wipeFolders() {
  // List of folders to clear
  const foldersToWipe = ["html", "parsedPDFs", "unzipped", "uploads"];
  const baseDirectory = path.join(__dirname, "files");

  for (const folder of foldersToWipe) {
    const folderPath = path.join(baseDirectory, folder);
    await clearDirectory(folderPath);
  }
}

// Export the function if you are using modules
module.exports = wipeFolders;
