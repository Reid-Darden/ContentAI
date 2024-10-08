// MIDDLEWARE FOR PDF PARSING
const multer = require("multer");

// Configure multer for PDF uploads
const storage = (folder) => multer.diskStorage({
  destination: `./backend/files/uploads/${folder}/`,
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = (folder) => multer({
  storage: storage(folder),
  fileFilter: function (req, file, cb) {
    if (file.mimetype !== "application/pdf") {
      return cb(null, false); 
    }
    cb(null, true);
  },
});

module.exports = { upload };
