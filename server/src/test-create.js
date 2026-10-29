const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { analyzeVideoProject } = require("./services/analysisService");

async function testCreate() {
  console.log("=== TESTING CREATOR AI CREATE ENDPOINT ===");
  try {
    const mockProj = {
      title: "Viral Tech Review",
      mode: "create",
      prompt: "Create a 30s fast-paced tech review about the latest AI features",
      style: "bold",
      aspectRatio: "9:16"
    };

    console.log("Generating AI Blueprint via claude-sonnet-4-5...");
    const result = await analyzeVideoProject(mockProj, { duration: 30.0 });

    if (result && result.blueprint) {
      console.log("✓ Success: Structured blueprint generated.");
      console.log("Summary:", result.summary);
      console.log("Actions count:", result.blueprint.actions.length);
      process.exit(0);
    } else {
      throw new Error("No blueprint returned in result");
    }
  } catch (err) {
    console.error("✗ Failed:", err.message);
    process.exit(1);
  }
}

testCreate();
