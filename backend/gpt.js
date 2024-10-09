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
async function doGPTRequest(promptText, imageUrl = "", isResponseJSONFormat = false, useExampleImg = false, useExampleHTML = false) {
  try {
    const messages = [];

    if (useExampleHTML) {
      messages.push({
        role: "system",
        content: gptPrompts(importHelpers.GPTPrompt.gptHTMLEx, await exampleHTML()),
      });
    }

    messages.push({
      role: "user",
      content: [{ type: "text", text: promptText }],
    });

    if (imageUrl.length > 0) {
      if (useExampleImg) {
        let exImgBase64 = await Helpers.imagePathToBase64String(exampleProductExtractImg);

        messages[0].content.push({
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${exImgBase64}`,
          },
        });
      }

      const testImagePath = await Helpers.convertPdfToJpg(imageUrl, path.resolve(__dirname, "files", "uploads"))
        .then((response) => {
          return response;
        })
        .catch((err) => { });

      let inputBase64Img = await Helpers.imagePathToBase64String(testImagePath);

      messages[0].content.push({
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

    if (isResponseJSONFormat) {
      requestBody.response_format = { type: "json_object" };
    }

    let response = await axios.post(openAIEndpoint, requestBody, {
      headers: {
        Authorization: `Bearer ${openAISecret}`,
        "Content-Type": "application/json",
      },
    });

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
