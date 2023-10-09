const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
var AdmZip = require("adm-zip");
var parser = require("node-xlsx");
const axios = require("axios");

// ADOBE API
const PDFToolsSdk = require("@adobe/pdfservices-node-sdk");
const adobeClientID = "5f3f3107036947818f19b8bb6edbb37c";
const adobeSecret = "p8e-kX0Bpm5gXp0MkP2UUa-VuA49awtDYEdb";
const credentials = PDFToolsSdk.Credentials.servicePrincipalCredentialsBuilder().withClientId(adobeClientID).withClientSecret(adobeSecret).build();
const executionContext = PDFToolsSdk.ExecutionContext.create(credentials);
const extractPDFOperation = PDFToolsSdk.ExtractPDF.Operation.createNew();

// CHATGPT AI
const openAISecret = "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";
const openAIEndpoint = "https://api.openai.com/v1/chat/completions";

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

// PDF UPLOADS
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
    // parse the PDF file and return the excel file names
    const parsedData = await parsePDF(filename);

    // read and extract the data from the excel files into string of json
    const parsedExcel = await parseExcelFiles(parsedData, filename);

    // run chatgpt to extract key data from the json into paragraphs
    // build prompt
    let excel2JSON;

    parsedExcel.forEach((file) => {
      excel2JSON += JSON.stringify(file);
    });

    const excelJSON2Text = await doGPTRequest(gptPrompts[0].prompt + excel2JSON);

    res.json({
      success: true,
      parsedData: excelJSON2Text,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error,
    });
  }
});

// CONTENT REWRITING
app.post("/rewrittenContent", async (req, res) => {
  const content = req.body.content;

  if (!content) {
    return res.status(400).json({ success: false, message: "No content provided." });
  }

  try {
    // do gpt call to rewrite the content, focusing on paragraph structure
    let rewrite = await doGPTRequest(gptPrompts[1].prompt + content);

    res.json({ success: true, rewrittenContent: rewrite });
  } catch (error) {
    res.status(500).json({ success: false, message: error });
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

  let newFile = removeFilenameEnding(filename);

  extractPDFOperation.setInput(source);

  // Build extractPDF options
  const options = new PDFToolsSdk.ExtractPDF.options.ExtractPdfOptions.Builder().addElementsToExtract(PDFToolsSdk.ExtractPDF.options.ExtractElementType.TEXT, PDFToolsSdk.ExtractPDF.options.ExtractElementType.TABLES).build();

  extractPDFOperation.setOptions(options);

  try {
    // do the extraction
    let result = await extractPDFOperation.execute(executionContext).then((result) => result.saveAsFile(`./parsedPDFs/uploads/${newFile}.zip`));

    // unzip the extracted data
    let zipped = new AdmZip(`./parsedPDFs/uploads/${newFile}.zip`);

    zipped.extractAllTo(`./unzipped/EXTRACTED${getDateString()}_${newFile}`, true);

    let zippedEntries = zipped.getEntries();
    let extractedExcelFileNames = [];

    for (let i = 0; i < zippedEntries.length; i++) {
      let entry = zippedEntries[i].entryName;
      if (entry.endsWith(".xls") || entry.endsWith(".xlsx")) {
        extractedExcelFileNames.push({ filename: entry });
      }
    }

    return extractedExcelFileNames;
  } catch (error) {
    throw error;
  }
}

// Function to parse excel files from the parsed PDFs/uploads folder
async function parseExcelFiles(files, orignalFileName) {
  let output = [];

  let newFile = removeFilenameEnding(orignalFileName);

  for (let i = 0; i < files.length; i++) {
    let excelFile = files[i].filename;

    let parsedExcelFile = parser.parse(`./unzipped/EXTRACTED${getDateString()}_${newFile}/${excelFile}`);

    output.push(parsedExcelFile);
  }

  return output;
}

// do a GPT Request
async function doGPTRequest(promptText) {
  try {
    const response = await axios.post(
      openAIEndpoint,
      {
        max_tokens: 2500,
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: promptText,
          },
        ],
        temperature: 1,
      },
      {
        headers: {
          Authorization: `Bearer ${openAISecret}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Error sending prompt to ChatGPT:", error);
  }
}
// HELPERS
function removeFilenameEnding(filename) {
  const extensions = [".jpg", ".jpeg", ".png", ".gif", ".txt", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".mp3", ".mp4", ".wav"];

  for (const ext of extensions) {
    if (filename.endsWith(ext)) {
      return filename.slice(0, -ext.length);
    }
  }

  return filename;
}

String.prototype.endsWith = function (search, this_len) {
  if (this_len === undefined || this_len > this.length) {
    this_len = this.length;
  }
  return this.substring(this_len - search.length, this_len) === search;
};

function getDateString() {
  let date = new Date();

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear());

  return month + day + year;
}

// PROMPTS
let gptPrompts = [
  {
    prompt: `Please pretend to be a JavaScript expert who is proficient in speaking and writing English. Respond to the question below in English: Some of the following JSON is structured as a table with its data as the table structure, and some of it is structured as paragraphs that have the header and body seperated. Make your best determination between the two from the JSON, then output it as the following structure: 
    
    Paragraphs (1)- the header (or what you deem to be the header) of the paragraph is typically gonna map to the theme of an overall paragraph, and the body is going to be any longer form text that has similar keywords and theme to the header that it was mapped to. The output will be JSON formatted, with a "name" key and "paragraph" value, then a key of "data" with the outputted JSON stucuture as the value. Make seperate key values in the data value to seperate the body from the header, and do that for every entry.

    Table (2)- the table (or what you deem to be the table) is going to be any data that appears to be in a table format from the JSON. You will construct a seperate JSON structure that extracts the table data from the orignal JSON into this structure. We will use this structure later to build a HTML table. The output will be JSON formatted, with a "name" key and "table" value, then a key of "data" with the outputted JSON stucuture as the value.

    Additional notes: if you deem any data within the json to have no data or content assoicated with it, then exclude it from the response. THE FINAL OUTPUT IS THE COMBINATION OF THE 2 JSON STRUCTURES AS A JSON   STRUCTURE, SEPERATED BY THE NAME KEY (EITHER "paragraph" or "table"). 
    
    Example output data format (look at the (1) & (2) mappings from the formatting paragraphs above): [{"name": "paragraph", "data": (1) }, {"name": "table", "data" : (2)}]
      
    The JSON to reformat is as follows: `,
  },
  {
    prompt: `Please pretend to be a content specialist with complete knowledge of SEO and the best SEO practices within, having over 20 years in the business of Search Engine Optimization. You have also have the expert knowledge of the english language from a grammar, spelling, and language perspective. Use this information to rewrite, refine, and lengthen the content that I provide at the end of this prompt. 

    There will be many paragraphs with headers that will be apart of the content that is passed in that you will rewrite. You will identify the theme, main idea, key points, and other data/keywords from each paragraph. Using these keywords, you then will rewrite each paragraph (do not combine the content of 2 different paragraphs) with perfect SEO practices and perfect English language in mind. You have the right to extend the content length of each paragraph, but do make it more than 6-7 long sentences in length; 3-5 sentences is going to be the ideal length based on the length of each paragraph that is passed in.

    The content that is passed in will be in JSON format. When you complete the rewriting of all the content, you will format the output as a JSON string that has the new header name (it may be the saem as the orignal passed in header or an ammended one based on your updates to the paragraph content) as the value of the "header" key, and the newly written paragraph will be in the "content" key.
    
    The JSON input to rewrite is as follows: `,
  },
];
