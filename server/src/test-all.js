const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const { chat } = require("./services/llm/LLMService");
const { getProjects, createProject, deleteProject } = require("./services/projectService");
const { analyzeVideoProject } = require("./services/analysisService");
const { checkFFmpegAvailability } = require("./services/videoEngine");

async function runTests() {
  console.log("=== CREATOR AI V2 BACKEND TEST SUITE ===");
  let passed = 0;
  let failed = 0;

  // Test 1: Project Service
  try {
    const testProj = createProject({
      title: "Test Suite Project",
      mode: "edit",
      prompt: "Testing edit flow",
    });
    if (testProj && testProj.id && testProj.title === "Test Suite Project") {
      console.log("✓ Test 1 Passed: Project creation and storage");
      deleteProject(testProj.id);
      passed++;
    } else {
      throw new Error("Invalid project structure returned");
    }
  } catch (err) {
    console.error("✗ Test 1 Failed:", err.message);
    failed++;
  }

  // Test 2: FFmpeg Check
  try {
    const ffmpegRes = await checkFFmpegAvailability();
    console.log(`✓ Test 2 Passed: FFmpeg status checked (Installed: ${ffmpegRes.ffmpeg})`);
    passed++;
  } catch (err) {
    console.error("✗ Test 2 Failed:", err.message);
    failed++;
  }

  // Test 3: LLM Connection & Edit Blueprint Generation
  try {
    console.log("Testing FreeLLMAPI Connection and Blueprint Generation...");
    const mockProj = {
      id: "mock_123",
      title: "Test Viral Hook",
      mode: "edit",
      prompt: "Make a high energy short with hook and silence removal",
      style: "bold",
      aspectRatio: "9:16",
    };

    const analysis = await analyzeVideoProject(mockProj, { duration: 20.0 });
    if (analysis && analysis.blueprint && Array.isArray(analysis.blueprint.actions)) {
      console.log("✓ Test 3 Passed: FreeLLMAPI generated valid structured Edit Blueprint");
      console.log(`   Blueprint actions count: ${analysis.blueprint.actions.length}`);
      passed++;
    } else {
      throw new Error("LLM returned incomplete blueprint structure");
    }
  } catch (err) {
    console.error("✗ Test 3 Failed:", err.message);
    failed++;
  }

  console.log(`\nTEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runTests();
