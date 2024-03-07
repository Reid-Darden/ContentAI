// GPT related requests
const axios = require("axios");

// CHATGPT AI
const openAIEndpoint = "https://api.openai.com/v1/chat/completions";
const openAISecret = process.env.API_KEY || "";

// do a GPT Request
async function doGPTRequest(promptText) {
  try {
    let response = await axios.post(
      openAIEndpoint,
      {
        model: "gpt-4-1106-preview",
        messages: [
          {
            role: "user",
            content: promptText,
          },
        ],
        response_format: {
          type: "json_object",
        },
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
    error.message = promptText;
    throw error;
  }
}

module.exports = doGPTRequest;
