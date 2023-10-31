const express = require("express");
const multer = require("multer");
const path = require("path");
var AdmZip = require("adm-zip");
const axios = require("axios");
const xlsx = require("xlsx");

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

// LOGIN CREDENTIALS
let loginCredentials = [
  {
    username: "rdarden",
    name: "Reid Darden",
  },
  {
    username: "mslock",
    name: "Mike Slock",
  },
  {
    username: "smargison",
    name: "Sean Margison",
  },
  {
    username: "tlarson",
    name: "TJ Larson",
  },
  {
    username: "mjohnson",
    name: "Marc Johnson",
  },
  {
    username: "aclloyd",
    name: "Alec Lloyd",
  },
  {
    username: "anlloyd",
    name: "Alan Lloyd",
  },
];

const app = express();

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
// LOGIN
app.post("/login", (req, res) => {
  let username = req.body.username;
  let password = req.body.password;

  if (username.length > 0 && password.length > 0) {
    let usernameCheck = checkUserNameValue(username);
    let passwordCheck = password === generatePassword();
    if (usernameCheck && passwordCheck) {
      let name = findNameByUsername(loginCredentials, username);
      if (name) {
        res.json({ loggedIn: true, name: name });
      }
    } else {
      res.json({ loggedIn: false });
    }
  }
});

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
  // look into adding a "caching" for the unzipped files based on the filename so we dont have to hit the gpt api everytime
  try {
    // parse the PDF file and return the excel file names
    const parsedData = await parsePDF(filename);

    // read and extract the data from the excel files into string of json
    let parsedExcel = await parseExcelFiles(parsedData, filename);

    // Convert each parsed file to a json string
    let excel2JSONParagraph = JSON.stringify(parsedExcel[0]);
    let excel2JSONTable = JSON.stringify(parsedExcel[1]);

    // send gpt request for paragraph data
    const gptParagraphResp = await doGPTRequest(gptPrompts[0].prompt + excel2JSONParagraph);

    // send gpt request for table data
    const gptTableResp = await doGPTRequest(gptPrompts[1].prompt + excel2JSONTable);

    // construct final output
    let excelJSON2Text;
    if (gptParagraphResp.length > 0 && gptTableResp.length > 0) {
      excelJSON2Text = await doGPTRequest(gptPrompts[2].prompt + gptParagraphResp + gptTableResp);
    }

    if (excelJSON2Text.length > 0) {
      res.json({
        success: true,
        parsedData: excelJSON2Text,
        parsedTable: gptTableResp,
      });
    } else {
      res.json({
        success: false,
      });
    }
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
    let rewrite = await doGPTRequest(gptPrompts[4].prompt + content);

    res.json({ success: true, rewrittenContent: rewrite });
  } catch (error) {
    res.status(500).json({ success: false, message: error });
  }
});

// ARTICLE BUILDING
app.post("/buildarticle", async (req, res) => {
  const content = req.body.content;
  const table = req.body.table;

  try {
    let article = await doGPTRequest(gptPrompts[4].prompt + content + table);

    res.json({ success: true, data: article });
  } catch (err) {
    res.status(500).json({ success: false, message: err });
  }
});
// SITE SETUP
app.use("/frontend", express.static("frontend"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/frontend/login/login.html"));
});

app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "/frontend/index.html"));
});

app.get("/articledisplay", (req, res) => {
  res.sendFile(path.join(__dirname, "/frontend/articledisplay.html"));
});

app.listen(3000, () => {
  console.log("Server started on port 3000.");
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

    let file = xlsx.readFile(`./unzipped/EXTRACTED${getDateString()}_${newFile}/${excelFile}`);

    let values = xlsx.utils.sheet_to_json(file.Sheets["Sheet1"]);

    output.push(values);
  }

  return output;
}

// do a GPT Request
async function doGPTRequest(promptText) {
  try {
    const response = await axios.post(
      openAIEndpoint,
      {
        max_tokens: 2000,
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: promptText,
          },
        ],
        temperature: 0.5,
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

// LOGIN HELPERS
function generatePassword() {
  const date = new Date();
  const month = (date.getMonth() + 1).toString().padStart(2, "0"); // months are 0-based in JS
  const year = date.getFullYear().toString().slice(-2); // get the last two digits of the year

  return `gvc${month}${year}`;
}

function findNameByUsername(arr, targetUsername) {
  const user = arr.find((user) => user.username === targetUsername);
  return user ? user.name : null;
}

function checkUserNameValue(user) {
  let check = loginCredentials.find((u) => u.username === user);
  if (check) {
    return true;
  } else {
    return false;
  }
}

// PROMPTS
let gptPrompts = [
  {
    prompt: `Please pretend to be a JavaScript expert who is proficient in speaking and writing English. Respond to the question below in JSON. Use the following criteria to anaylze, rewrite, and output the JSON content passed in.  

    CRITERIA: The header of the paragraph is typically gonna map to the theme of an overall paragraph, and the body is going to be any longer form text that has similar keywords and theme to the header that it was mapped to. The output will be JSON formatted, with a "name" key and "paragraph" value, then a key of "data" with the outputted JSON stucuture as the value. Make seperate key values in the data value to seperate the body from the header, and do that for every entry.

    ONLY OUTPUT THE JSON STRUCTURE. DO NOT ADD ANY ADDITIONAL TEXT TO THE RESPONSE. I ALSO NEED THE JSON MINIFIED INTO ITS SIMPLEST FORM; THAT IS TO SAY IT WOULD NOT HAVE ANY REGULAR EXPRESSION CHARACTERS. The JSON to reformat is as follows. Before operating any of the above commands, I also need the JSON "cleaned", that is to say remove any uneccessary characters or regular expression characters and fix spacing (some of the characters to watch out for are /r, //r, or /", but there may be others that are probably going to be regular expressions). The content within the JSON should still read in normal English characters and numbers at your discrection. Once you have cleaned the following JSON, then complete the commands above upon it. JSON IS AS FOLLOWS:
    `,
  },
  {
    prompt: `Please pretend to be a JSON expert who is proficient in speaking and writing English. Respond to the question below in JSON. Use the following criteria to analyze, rewrite, and output the JSON content passed in.

    CRITERIA: The table will be data that would be deemed to be found in a table format from the JSON. You will construct a JSON structure that extracts the table data from the orignal JSON into this structure.   There is a good chance that the data will be properly JSON formatted, but the content of the JSON itself may need manipulating. Make your best judgment with the data found in each array of objects within the JSON and determine the relevant numerical data in relation to the theme of that row of data. Then construct the final output structure with the updated content. Possible data structure in the table 
    [[{"GRIP (MENS) \\r":"Hand \\r","__EMPTY":"RH/LH \\r","__EMPTY_1":"RH/LH \\r","GRIP (WOMENS) \\r":"RH/LH \\r","__EMPTY_2":"RH/LH \\r","__EMPTY_3":"RH/LH \\r","__EMPTY_4":"RH/LH \\r","__EMPTY_5":"RH/LH \\r","__EMPTY_6":"RH/LH \\r","__EMPTY_7":"RH/LH \\r","__EMPTY_8":"RH \\r"}]]

    The following is an example of how the data should be outputted. Also note the removal of special characters (some maybe be double slashed (//) or some maybe be normal regular expressions (/r, etc.)) The "Values" property should be an array of strings containing all the data points and the "DataPoint" property should be the name surrounding what that data represents. This is the ideal output: 
    [[{"dataPoint": "Hand", "values": ["RH/LH", ..., "RH"]},... (other ojects)]]. All this would be within an overall object with "name" property of "table" and "data" property of the previous array of data.

    Additional notes: The goal is to seperate all textual/paragraph data from the numeric data. If numeric data is included in the paragraph response surrounded by text content, then you can leave it be. ONLY OUTPUT THE JSON STRUCTURE. DO NOT ADD ANY ADDITIONAL TEXT TO THE RESPONSE. I ALSO NEED THE JSON MINIFIED INTO ITS SIMPLEST FORM; THAT IS TO SAY IT WOULD NOT HAVE ANY REGULAR EXPRESSION CHARACTERS. Before operating any of the above commands, I also need the JSON "cleaned", that is to say remove any uneccessary characters or regular expression characters and fix spacing (some of the characters to watch out for are /r, //r, or /", but there may be others that are probably going to be regular expressions). Once you have cleaned the following JSON, then complete the commands above upon it. JSON IS AS FOLLOWS: `,
  },
  {
    prompt: `Please act as a JSON expert. The inputted JSON is a combination of 2 or more JSON strings. I need all the JSON strings combined into a single JSON string that is properly formatted. The only thing that should be outputted is the final JSON structure in a string format. The only thing I want returned is the JSON - no code, not text, not anything but JSON. The JSON to analyze, reformat, and output is as follows: `,
  },
  {
    prompt: `Please pretend to be a content specialist with complete knowledge of SEO and the best SEO practices within, having over 20 years in the business of Search Engine Optimization. You have also have the expert knowledge of the english language from a grammar, spelling, and language perspective. Use this information to rewrite, refine, and lengthen the content that I provide at the end of this prompt. 

    There will be many paragraphs with headers that will be apart of the content that is passed in that you will rewrite. You will identify the theme, main idea, key points, and other data/keywords from each paragraph. Using these keywords, you then will rewrite each paragraph (do not combine the content of 2 different paragraphs) with perfect SEO practices and perfect English language in mind. You have the right to extend the content length of each paragraph, but do make it more than 6-7 long sentences in length; 3-5 sentences is going to be the ideal length based on the length of each paragraph that is passed in. This is the minimum length that you can make an output paragraph.

    The content that is passed in will be in JSON format. When you complete the rewriting of all the content, you will format the output as a JSON string that has the new header name (it may be the same as the orignal passed in header or an ammended one based on your updates to the paragraph content) as the value of the "header" key, and the newly written paragraph will be in the "content" key.
    
    The JSON input to rewrite is as follows. You will only look at the JSON data under "name": "paragraph" for the rewrite; the other data is table data and can be appended to the end of the rewritten content as is(maintain perfect JSON). JSON TO REWRITE =  `,
  },
  {
    prompt: `You will act as a HTML expert and will create a HTML article given a "template" that you will repeat with the given JSON data provided. You will be replacing the inner text of each template piece with the content from the JSON (look for {} in (a)). For paragraph data in the JSON, you will use template (a) to fill in the data, repeating the template for the total paragraph content length in the JSON. Every pargraph will use this template. For table data in the JSON, you will use template (b) to replace the data within the template and fill in the data accordingly from the JSON. The (b) template provides what the output should be and how the data passed in maps to each value - replace the template data with data found in the inputted JSON as you see fit. Any <img> tags found in the template will be ignored in creation - we will add those later.
    
    (a)
    <div class="conseg outer s-fit"><div class=inner><img alt=""src=""></div><div class=inner><div class=innerText><h3>{Header value. Will map to shorter text in the JSON that describes a longer form of text. Remove keywords that may lead the sentence like Feature or benefit - this should be the overall theme of the paragraph}</h3><p class=fancyLine>{Paragraph value. Maps to longer text that relates to the header above.}</div></div></div>

    (b)
    <div class=table-content><table cellpadding=2 cellspacing=0><thead><tr><th colspan=5><tr><th>Loft<th>Dexterity<th>Lie Angle<th>Volume<th>Length<th>Swing Weight<th>Launch<th>Spin<tbody><tr><td>9°<td>RH/LH<td>56-60°<td>460cc<td>45.75"<td>D4/D5<td>Mid-High<td>Mid-Low<tr><td>10.5°<td>RH/LH<td>56-60°<td>460cc<td>45.75"<td>D4/D5<td>Mid-High<td>Mid-Low<tr><td>12°<td>RH Only<td>56-60°<td>460cc<td>45.75"<td>D4/D5<td>Mid-High<td>Mid-Low</table></div>

    Output the final article (as HTML) only. No other code or no other text in the output - just HTML. The JSON to build the article from is: `,
  },
];
