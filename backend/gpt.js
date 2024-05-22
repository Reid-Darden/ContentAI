// GPT related requests
const axios = require("axios");

// CHATGPT AI
const openAIEndpoint = "https://api.openai.com/v1/chat/completions";
const openAISecret = process.env.API_KEY || "";

// do a GPT Request
async function doGPTRequest(promptText) {
  try {
    const messages = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: promptText,
          },
        ],
      },
    ];

    let response = await axios.post(
      openAIEndpoint,
      {
        model: "gpt-4o-2024-05-13",
        messages: messages,
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
    console.error("Error during API call:", error);
    error.message = promptText;
    throw error;
  }
}

module.exports = doGPTRequest;
