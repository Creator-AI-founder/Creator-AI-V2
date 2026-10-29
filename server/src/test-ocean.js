const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { analyzeVideoProject } = require("./services/analysisService");

async function testOceanIdea() {
  const mockProj = {
    title: "Facts about the Ocean",
    prompt: "Give me 3 fascinating facts about the deep ocean",
    mode: "create"
  };
  console.log("Generating Director plan...");
  const result = await analyzeVideoProject(mockProj);
  console.log(JSON.stringify(result, null, 2));
}
testOceanIdea();
