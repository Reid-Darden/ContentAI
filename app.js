const express = require("express");
const multer = require("multer");
const path = require("path");
const app = express();

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/"); // Folder where PDFs will be stored
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Keep the original file name
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

app.post("/upload", upload.single("pdf"), (req, res) => {
  if (req.file) {
    res.json({ message: "File uploaded successfully" });
  } else {
    res.json({ message: "Please upload a valid PDF" });
  }
});

app.use("/frontend", express.static("frontend"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/frontend/index.html"));
  res.sendFile(path.join(__dirname, "/frontend/styles.css"));
  res.sendFile(path.join(__dirname, "/frontend/script.js"));
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
