// MIDDLEWARE FOR PDF PARSING
const multer = require("multer");

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: "./backend/files/uploads/",
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype !== "application/pdf") {
      return cb(null, false); // Reject non-PDFs
    }
    cb(null, true);
  },
});

module.exports = { upload };
