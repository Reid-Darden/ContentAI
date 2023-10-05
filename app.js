const express = require("express");
const multer = require("multer");
const path = require("path");
const pdf = require("pdf-parse");
const fs = require("fs");
const bodyParser = require("body-parser");
var AdmZip = require("adm-zip");

// ADOBE API
const PDFToolsSdk = require("@adobe/pdfservices-node-sdk");
const adobeClientID = "5f3f3107036947818f19b8bb6edbb37c";
const adobeSecret = "p8e-kX0Bpm5gXp0MkP2UUa-VuA49awtDYEdb";

//const clientConfig = PDFToolsSdk.ClientConfig.clientConfigBuilder().withConnectTimeout(15000).withReadTimeout(15000).build();

const credentials = PDFToolsSdk.Credentials.servicePrincipalCredentialsBuilder().withClientId(adobeClientID).withClientSecret(adobeSecret).build();

const executionContext = PDFToolsSdk.ExecutionContext.create(credentials);
const extractPDFOperation = PDFToolsSdk.ExtractPDF.Operation.createNew();

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
    res.json({ message: "File uploaded successfully.", file: req.file.filename });
  } else {
    res.json({ message: "Please upload a valid PDF." });
  }
});

// PDF PARSING
app.post("/parsedPDFs", async (req, res) => {
  const filename = req.body.filename;

  if (!filename) {
    return res.status(400).json({ success: false, message: "No filename provided" });
  }

  try {
    // do the actual parse and return an array of the excel file names that contain the data
    const parsedData = await parsePDF(filename);

    // excel files will contain the data needed
    // determine best way to extract the data from the excel files
    // new framework more than likely
    // build return text that is sent to the chatgpt ai from the excel files
    res.json({
      success: true,
      parsedData: parsedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error,
    });
  }
});

// SITE SETUP
app.use("/frontend", express.static("frontend"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/frontend/index.html"));
});

app.listen(5000, () => {
  console.log("Server started on port 5000.");
});

// == FUNCTIONS ==

// Function to parse pdf
async function parsePDF(filename) {
  const source = PDFToolsSdk.FileRef.createFromLocalFile(`./uploads/${filename}`);

  extractPDFOperation.setInput(source);

  // Build extractPDF options
  const options = new PDFToolsSdk.ExtractPDF.options.ExtractPdfOptions.Builder().addElementsToExtract(PDFToolsSdk.ExtractPDF.options.ExtractElementType.TEXT, PDFToolsSdk.ExtractPDF.options.ExtractElementType.TABLES).build();

  extractPDFOperation.setOptions(options);

  try {
    // do the extraction
    let result = await extractPDFOperation
      .execute(executionContext)
      .then((result) => result.saveAsFile(`./parsedPDFs/uploads/${removeFilenameEnding(filename)}.zip`))
      .catch((err) => {
        if (err instanceof PDFServicesSdk.Error.ServiceApiError || err instanceof PDFServicesSdk.Error.ServiceUsageError) {
          console.log("Exception encountered while executing operation", err);
        } else {
          console.log("Exception encountered while executing operation", err);
        }
      });

    // unzip the extracted data
    let zipped = new AdmZip(`./parsedPDFs/uploads/${removeFilenameEnding(filename)}.zip`);
    let zippedEntries = zipped.getEntries();

    for (let i = 0; i < zippedEntries.length; i++) {
      let entry = zippedEntries[i];
      if (entry.entryName == "structuredData.json") {
        let x = entry.getData().toString("utf8");
        return x;
      }
    }
  } catch (error) {
    throw error;
  }
}

function removeFilenameEnding(filename) {
  const extensions = [".jpg", ".jpeg", ".png", ".gif", ".txt", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".mp3", ".mp4", ".wav"];

  for (const ext of extensions) {
    if (filename.endsWith(ext)) {
      return filename.slice(0, -ext.length);
    }
  }

  return filename;
}
