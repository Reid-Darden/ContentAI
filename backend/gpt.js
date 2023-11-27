// GPT related requests
const axios = require("axios");

// CHATGPT AI
const openAISecret = "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";
const openAIEndpoint = "https://api.openai.com/v1/chat/completions";

// do a GPT Request
async function doGPTRequest(promptText) {
  try {
    const response = await axios.post(
      openAIEndpoint,
      {
        max_tokens: 2000,
        model: "gpt-4-1106-preview",
        messages: [
          {
            role: "user",
            content: promptText,
          },
        ],
        temperature: 0.5,
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
    console.error("Error sending prompt to ChatGPT:", error);
  }
}

module.exports = doGPTRequest;
