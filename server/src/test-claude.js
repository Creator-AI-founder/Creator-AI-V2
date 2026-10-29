const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { chat } = require("./services/llm/LLMService");

async function main() {
  try {
    console.log("Testing Creator AI V2 → FreeLLMAPI → claude-sonnet-4-5...");

    const result = await chat([
      {
        role: "system",
        content: "You are Creator AI, an AI video editing assistant."
      },
      {
        role: "user",
        content: "Reply with exactly: CREATOR AI V2 CONNECTED VIA CLAUDE"
      }
    ], { model: "claude-sonnet-4-5" });

    const output = result?.choices?.[0]?.message?.content;

    if (!output) {
      throw new Error("LLM returned no message content");
    }

    console.log("\nAI RESPONSE:");
    console.log(output);
    console.log("\nAI CONNECTION TEST PASSED");
  } catch (error) {
    console.error("\nAI CONNECTION TEST FAILED:");
    console.error(error.message);
    process.exit(1);
  }
}

main();
