// This is all the get routes used in the app
const express = require("express");
const app = express.Router();
const path = require("path");

const pdf = require("./pdf.js");
const gptPrompts = require("./prompts.js");
const doGPTRequest = require("./gpt.js");
const importHelpers = require("./helpers.js");
const Helpers = new importHelpers();
const loginCredentials = require("./credentials.js");
const email = require("./email.js");
const { exec } = require("child_process");

// GLOBAL VARIABLES
let articleModelName;

// GETS

// load login
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../index.html"));
});

// load home page
app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "./frontend/html/home.html"));
});

// load article display
app.get("/articledisplay", (req, res) => {
  res.sendFile(path.join(__dirname, "./frontend/html/articledisplay.html"));
});

// POSTS

// update model name used throughout backend
app.post("../updateModelName", (req, res) => {
  let modelName = req.body.value;
  if (modelName && modelName.length > 0 && modelName != articleModelName) {
    articleModelName = req.body.value;
    res.json({ updated: true });
  }
});

// login
app.post("./login/", (req, res) => {
  let username = req.body.username;
  let password = req.body.password;

  if (username.length > 0 && password.length > 0) {
    let usernameCheck = Helpers.checkUserNameValue(username);
    let passwordCheck = password === Helpers.generatePassword();
    if (usernameCheck && passwordCheck) {
      let name = Helpers.findNameByUsername(loginCredentials, username);
      let role = Helpers.findRoleByUsername(loginCredentials, username);
      if (name && role) {
        res.json({ loggedIn: true, username: name });
      }
    } else {
      res.json({ loggedIn: false });
    }
  }
});

// pdf uploads
app.post("../uploads", pdf.upload.single("pdf"), (req, res) => {
  if (req.file) {
    res.json({ message: "File uploaded successfully.", file: req.file.filename });
  } else {
    res.json({ message: "Please upload a valid PDF." });
  }
});

// pdf parsing
app.post("../parsedPDFs", async (req, res) => {
  const filename = req.body.filename;

  if (!filename) {
    return res.status(400).json({ success: false, message: "No filename provided" });
  }

  try {
    // parse the PDF file and return the excel file names
    const parsedData = await pdf.parsePDF(filename);

    // read and extract the data from the excel files into string of json
    let parsedExcel = await pdf.parseExcelFiles(parsedData, filename);

    // Convert each parsed file to a json string
    let excel2JSONParagraph = JSON.stringify(parsedExcel[0]);
    let excel2JSONTable = JSON.stringify(parsedExcel[1]);

    // send gpt request for paragraph data
    const gptParagraphResp = await doGPTRequest(gptPrompts(0, excel2JSONParagraph));

    // send gpt request for table data
    const gptTableResp = await doGPTRequest(gptPrompts(1, excel2JSONTable));

    if (gptParagraphResp.length > 0 && gptTableResp.length > 0) {
      res.json({
        success: true,
        parsedData: gptParagraphResp,
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

// content rewriting
app.post("../rewrittenContent", async (req, res) => {
  const content = req.body.content;

  if (!content) {
    return res.status(400).json({ success: false, message: "No content provided." });
  }

  try {
    // do gpt call to rewrite the content, focusing on paragraph structure
    let rewrite = await doGPTRequest(gptPrompts(2, content, articleModelName));

    res.json({ success: true, rewrittenContent: rewrite });
  } catch (error) {
    res.status(500).json({ success: false, message: error });
  }
});

// article building
app.post("../buildarticle", async (req, res) => {
  const content = req.body.content;
  const table = req.body.table;

  try {
    let jsonContent = await doGPTRequest(gptPrompts(3, content + table));
    let article = await doGPTRequest(gptPrompts(4, jsonContent, articleModelName));

    let parsedArticle = JSON.parse(article);

    res.json({ success: true, data: parsedArticle.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err });
  }
});

// send email notification of article creation
app.post("../confirmArticle", async (req, res) => {
  let article = req.body.content;
  let user = req.body.user;
  let title = req.body.title;
  let comments = req.body.comments;
  if (await email(article, title, comments, user)) {
    // reset the files folder (NOT WORKING)
    let batchFile = `.\\resetfiles.bat`;
    exec(`${batchFile}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing batch file: ${error}`);
        return;
      }

      res.json({ success: true });
    });
  } else {
    res.json({ success: false });
  }
});

module.exports = app;
