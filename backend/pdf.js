const AdmZip = require("adm-zip");
const xlsx = require("xlsx");
const importHelpers = require("./helpers.js");
const Helpers = new importHelpers();

// MIDDLEWARE FOR PDF PARSING
const multer = require("multer");

// ADOBE API
const PDFToolsSdk = require("@adobe/pdfservices-node-sdk");
const adobeClientID = "5f3f3107036947818f19b8bb6edbb37c";
const adobeSecret = "p8e-kX0Bpm5gXp0MkP2UUa-VuA49awtDYEdb";

// ADDRESS ABOVE TO IDEALLY FIX THE INSTANCE ISSUE

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: "./frontend/files/uploads/",
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

// Function to parse pdf
async function parsePDF(filename) {
  let test = 0;
  let credentials = PDFToolsSdk.Credentials.servicePrincipalCredentialsBuilder().withClientId(adobeClientID).withClientSecret(adobeSecret).build();
  let executionContext = PDFToolsSdk.ExecutionContext.create(credentials);
  let extractPDFOperation = PDFToolsSdk.ExtractPDF.Operation.createNew();
  test = 1;
  const source = PDFToolsSdk.FileRef.createFromLocalFile(`./frontend/files/uploads/${filename}`);

  let newFile = Helpers.removeFilenameEnding(filename);

  extractPDFOperation.setInput(source);

  // Build extractPDF options
  const options = new PDFToolsSdk.ExtractPDF.options.ExtractPdfOptions.Builder().addElementsToExtract(PDFToolsSdk.ExtractPDF.options.ExtractElementType.TEXT, PDFToolsSdk.ExtractPDF.options.ExtractElementType.TABLES).build();
  test = 2;
  extractPDFOperation.setOptions(options);

  try {
    // do the extraction
    await extractPDFOperation.execute(executionContext).then((result) => result.saveAsFile(`./frontend/files/parsedPDFs/${newFile}.zip`));
    test = 3;
    // unzip the extracted data
    let zipped = new AdmZip(`./frontend/files/parsedPDFs/${newFile}.zip`);
    test = 4;
    zipped.extractAllTo(`./frontend/files/unzipped/EXTRACTED${Helpers.getDateString()}_${newFile}`);
    test = 5;
    let zippedEntries = zipped.getEntries();
    let extractedExcelFileNames = [];

    for (let i = 0; i < zippedEntries.length; i++) {
      let entry = zippedEntries[i].entryName;
      if (Helpers.stringEndsWith(entry, ".xls") || Helpers.stringEndsWith(entry, ".xlsx")) {
        extractedExcelFileNames.push({ filename: entry });
      }
    }

    // when at this point we have successfully extracted
    // this is a workaround for the adobe pdf sdk error for multiple instances when using this to create multiple articles
    credentials = null;
    executionContext = null;
    extractPDFOperation = null;

    return extractedExcelFileNames;
  } catch (error) {
    error.message = "PDF" + test;
    throw error;
  }
}

// Function to parse excel files from the parsed PDFs/uploads folder
async function parseExcelFiles(files, orignalFileName) {
  let output = [];

  let newFile = Helpers.removeFilenameEnding(orignalFileName);

  for (let i = 0; i < files.length; i++) {
    let excelFile = files[i].filename;

    let file = xlsx.readFile(`./frontend/files/unzipped/EXTRACTED${Helpers.getDateString()}_${newFile}/${excelFile}`);

    let values = xlsx.utils.sheet_to_json(file.Sheets["Sheet1"]);

    output.push(values);
  }

  return output;
}

module.exports = { storage, upload, parseExcelFiles, parsePDF };
