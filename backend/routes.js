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
const wipeFolders = require("./clearfiles.js");
const fs = require("fs");

// GLOBAL VARIABLES
let articleModelName;
var uploadURL = "";
let PDE_Filename = "";

// url for pdf test: https://i.postimg.cc/G3fmqnY5/TM21-MWD005-ST-DRIVER-CORE-Sell-Sheet-v6-HI.jpg
// MUST BE JPG

//#region PAGE LOADS
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../index.html"));
});

// load home page
app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/html/home.html"));
});

// load article create page
app.get("/contentrewrite", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/html/contentrewrite.html"));
});

// description rewrite
app.get("/descriptionrewrite", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/html/descriptionrewrite.html"));
});

// load article display
app.get("/articledisplay", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/html/articledisplay.html"));
});

// load product data extraction page
app.get("/productextractdata", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/html/productextractdata.html"));
});

//#endregion

// login
app.post("/login", (req, res) => {
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

//#region Article Create

// update model name used throughout backend
app.post("/updateModelName", (req, res) => {
  let modelName = req.body.value;
  if (modelName && modelName.length > 0) {
    articleModelName = req.body.value;
    res.json({ updated: true });
  }
});

// article pdf uploads
app.post("/uploads", pdf.upload("article").single("pdf"), (req, res) => {
  if (req.file) {
    uploadURL = req.file.filename;
    if (uploadURL.length > 0) {
      res.json({
        message: "File uploaded successfully.",
        file: req.file.filename,
      });
    }
  } else {
    res.json({ message: "Please upload a valid PDF." });
  }
});

// url uploads
app.post("/uploadURL", async (req, res) => {
  uploadURL = req.body.url;

  if (uploadURL.length > 0) {
    res.json({ message: "URL uploaded successfully.", url: req.body.url });
  } else {
    res.json({ message: "URL upload failed.", url: req.body.url });
  }
});

// pdf parsing based on url
app.get("/parsePDF", async (req, res) => {
  try {
    let settings = {
      imageURL: path.resolve(__dirname, "files", "uploads", "article", uploadURL),
      isResponseJSONFormat: true,
      useExampleImg: true,
    };

    let pdfContentFromUrl = await doGPTRequest(gptPrompts(importHelpers.GPTPrompt.gptImage), settings);

    let pdfJSON = JSON.parse(pdfContentFromUrl);

    let pdfPara = pdfJSON.paragraph;
    let pdfTable = pdfJSON.table;

    if (pdfPara != undefined && pdfTable != undefined) {
      res.json({
        success: true,
        parsedData: pdfPara,
        parsedTable: pdfTable,
      });
    }
  } catch (err) {
    res.json({
      message: err.message,
    });
  }
});

// content rewriting
app.post("/rewrittenContent", async (req, res) => {
  const contentObj = req.body.content;

  if (!contentObj) {
    return res.status(400).json({ success: false, message: "No content provided." });
  }

  try {
    // do gpt call to rewrite the content, focusing on paragraph structure
    let content = JSON.stringify(contentObj);

    let settings = {
      isResponseJSONFormat: true,
    };

    let rewrite = await doGPTRequest(gptPrompts(importHelpers.GPTPrompt.gptSEO, content, articleModelName), settings);

    res.json({ success: true, rewrittenContent: rewrite });
  } catch (error) {
    res.status(500).json({ success: false, message: error });
  }
});

// article building
app.post("/buildarticle", async (req, res) => {
  const content = req.body.content;
  const table = req.body.table;

  let contentJSON = JSON.stringify(content);
  let tableJSON = JSON.stringify(table);

  try {
    let settings = {
      isResponseJSONFormat: true,
    };

    let jsonContent = await doGPTRequest(gptPrompts(importHelpers.GPTPrompt.gptJSON, contentJSON + tableJSON), settings);

    // DO NOT move this. seperates code in GPT request based on that setting
    settings.useExampleHTML = true;

    let article = await doGPTRequest(gptPrompts(importHelpers.GPTPrompt.gptHTML, jsonContent, articleModelName), settings);

    let parsedArticle = JSON.parse(article);

    res.json({ success: true, data: parsedArticle.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err });
  }
});

// send email notification of article creation
app.post("/confirmArticle", async (req, res) => {
  let article = req.body.content;
  let user = req.body.user;
  let title = req.body.title;
  let comments = req.body.comments;
  if (await email(article, title, comments, user)) {
    // reset the files folder
    if (await wipeFolders()) {
      res.json({ success: true, alert: "cleared" });
    } else {
      res.json({ success: true, alert: "email" });
    }
  } else {
    res.json({ success: false });
  }
});

app.post("/wipefolders", async (req, res) => {
  if (await wipeFolders()) {
    res.json({ wiped: true });
  } else {
    res.json({ wiped: false });
  }
});

//#endregion Article Create

//#region Rewrite Description

app.post("/rewritedescription", async (req, res) => {
  let description = req.body.description;

  try {
    let rewritten_descriptions = await doGPTRequest(gptPrompts(importHelpers.GPTPrompt.gptDescription, description));
    let parsed_descriptions = JSON.parse(rewritten_descriptions);

    if (parsed_descriptions) {
      res.json({ success: true, descriptions: parsed_descriptions });
    }
  } catch (err) {
    res.status(500).json({ error: err.message, success: false });
  }
});

//#endregion Rewrite Description

//#region Product Data Extraction

app.post("/uploadPDF_PDE", pdf.upload("dataextract").single("pdf"), (req, res) => {
  if (req.file) {
    PDE_Filename = req.file.filename;
    if (PDE_Filename.length > 0) {
      res.json({
        message: "File uploaded successfully.",
        success: true,
        file: PDE_Filename,
      });
    }
  } else {
    res.json({ message: "Please upload a valid PDF.", success: false });
  }
});

app.get("/extractProductData", async (req, res) => {
  if (PDE_Filename.length > 0) {
    let settings = {
      imageURL: path.resolve(__dirname, "files", "uploads", "dataextract", PDE_Filename),
      isResponseJSONFormat: true,
      useExampleProductDataImg: true,
    };

    let extractedJSONData = await doGPTRequest(gptPrompts(importHelpers.GPTPrompt.gptProductDataExtract), settings);

    res.json({ success: true, data: extractedJSONData });
  } else {
  }
});

//#endregion Product Data Extraction

module.exports = app;
