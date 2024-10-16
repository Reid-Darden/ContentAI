const axios = require("axios");
const importHelpers = require("./helpers.js");
const Helpers = new importHelpers();
const path = require("path");
const gptPrompts = require("./prompts.js");
const fs = require("fs");

const exampleHTML = () => {
  return new Promise((resolve, reject) => {
    fs.readFile(path.resolve(__dirname, "./files/html/ex/example.html"), "utf8", (err, htmlContent) => {
      if (err) {
        reject("Error reading the file: " + err);
      } else {
        resolve(htmlContent);
      }
    });
  });
};

// this is the path to the example images used to give context to gpt calls
const exampleArticleImg = path.resolve(__dirname, "./files/img/testsellsheet_article.jpg");
const exampleProductExtractImg = path.resolve(__dirname, "./files/img/testsellsheet_pde.jpg");

// CHATGPT AI
const openAIEndpoint = "https://api.openai.com/v1/chat/completions";
const openAISecret = process.env.API_KEY || "sk-proj-Gepz49mZ6v661TWlmoUpT3BlbkFJIfWOrd5LhzFh3cTq6dc9";

// do a GPT Request
async function doGPTRequest(actualSettings = {}) {
  try {
    const messages = [];

    // default settings
    const defaultSettings = {
      prompt: "",
      pdfPath: "",
      imageConvertFolder: "",
      isResponseJSONFormat: false,
      useExampleImg: false,
      useExampleHTML: false,
      useExampleProductDataImg: false,
      useExampleProductDataRules: false,
    };

    // create current settings based on default and passed in settings
    const settings = { ...defaultSettings, ...actualSettings };

    // system instructions
    if (settings.useExampleHTML) {
      messages.push({
        role: "system",
        content: gptPrompts(importHelpers.GPTPrompt.gptHTMLEx, await exampleHTML()),
      });
    }

    if (settings.useExampleProductDataRules) {
      messages.push({
        role: "system",
        content: gptPrompts(importHelpers.GPTPrompt.gptProductDataExtractRules),
      });
    }

    // main prompt
    messages.push({
      role: "user",
      content: [{ type: "text", text: settings.prompt }],
    });

    // for making sure we are adding to the correct part of messages array
    const userIndex = messages.findIndex((msg) => msg.role == "user");

    // if we have an image to attach
    if (settings.pdfPath.length > 0 && settings.imageConvertFolder.length > 0) {
      if (settings.useExampleImg || settings.useExampleProductDataImg) {
        if (settings.useExampleImg) {
          // article creation example img
          let exImgBase64 = await Helpers.imagePathToBase64String(exampleArticleImg);

          messages[userIndex].content.push({
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${exImgBase64}`,
            },
          });
        }

        if (settings.useExampleProductDataImg) {
          // product data extraction example img
          let exImgBase64 = await Helpers.imagePathToBase64String(exampleProductExtractImg);

          messages[userIndex].content.push({
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${exImgBase64}`,
            },
          });
        }
      }

      // convert pdf to jpg for gpt api call
      const testImagePath = await Helpers.convertPdfToJpg(settings.pdfPath, path.resolve(__dirname, "files", "uploads", settings.imageConvertFolder))
        .then((response) => {
          return response;
        })
        .catch((err) => {});

      let inputBase64Img = await Helpers.imagePathToBase64String(testImagePath);

      messages[userIndex].content.push({
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${inputBase64Img}`,
        },
      });
    }

    const requestBody = {
      model: "gpt-4o-2024-08-06",
      messages: messages,
    };

    // ensures response is json formatted
    if (settings.isResponseJSONFormat) {
      requestBody.response_format = { type: "json_object" };
    }

    // main call
    let response = await axios.post(openAIEndpoint, requestBody, {
      headers: {
        Authorization: `Bearer ${openAISecret}`,
        "Content-Type": "application/json",
      },
    });

    // returns the gpt response
    return response.data.choices[0].message.content;
  } catch (error) {
    if (error.response) {
      console.error("Error response data:", error.response.data);
    }
    console.error("Error during API call:", error);
    throw error;
  }
}

module.exports = doGPTRequest;
