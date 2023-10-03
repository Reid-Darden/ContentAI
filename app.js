const express = require("express");
const multer = require("multer");
const path = require("path");
const pdf = require("pdf-parse");
const fs = require("fs");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.json());

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

// Server side calls from page

// PDF upload
app.post("/uploads", upload.single("pdf"), (req, res) => {
  if (req.file) {
    res.json({ message: "File uploaded successfully.", file: req.file.path });
  } else {
    res.json({ message: "Please upload a valid PDF." });
  }
});

// PDF parsing
app.post("/parsedPDFs", async (req, res) => {
  const filename = req.body.filename;

  if (!filename) {
    return res.status(400).json({ success: false, message: "No filename provided" });
  }

  try {
    const parsedData = await parsePDF(filename);
    res.json({
      success: true,
      parsedData: parsedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to parse the PDF.",
    });
  }
});

// Site setup
app.use("/frontend", express.static("frontend"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/frontend/index.html"));
});

app.listen(5000, () => {
  console.log("Server started on port 5000.");
});

// Function to parse pdf
async function parsePDF(filename) {
  // Assuming files are saved in an 'uploads' directory. Adjust the path accordingly.
  const dataBuffer = fs.readFileSync(`.\\${filename}`);
  let data = await pdf(dataBuffer);
  // 'data.text' contains all the extracted text from the PDF
  return data.text;
}
