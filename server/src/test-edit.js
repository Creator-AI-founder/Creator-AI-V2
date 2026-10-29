const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { processEditBlueprint } = require("./services/videoEngine");
const { createProject, updateProject, deleteProject } = require("./services/projectService");

async function testEditPipeline() {
  console.log("=== TESTING CREATOR AI EDIT PIPELINE ===");

  const testRenderDir = path.join(__dirname, "../renders/test");
  if (!fs.existsSync(testRenderDir)) fs.mkdirSync(testRenderDir, { recursive: true });

  const dummyVideoPath = path.join(testRenderDir, "dummy_input.mp4");
  const outputPath = path.join(testRenderDir, "test_edit_output.mp4");

  // 1. Create a dummy input video if it doesn't exist
  if (!fs.existsSync(dummyVideoPath)) {
    const { exec } = require("child_process");
    const util = require("util");
    const execAsync = util.promisify(exec);
    console.log("Creating dummy input video...");
    await execAsync(`ffmpeg -y -f lavfi -i testsrc=duration=5:size=1280x720:rate=30 -f lavfi -i anullsrc=r=44100:cl=stereo -c:v libx264 -c:a aac -shortest "${dummyVideoPath}"`);
  }

  try {
    const project = createProject({
      title: "Test Edit Project",
      mode: "edit",
      sourceVideo: { path: dummyVideoPath }
    });

    // Mock actions: Zoom and Caption
    project.blueprint = {
      actions: [
        {
          type: "ZOOM",
          start: 0,
          end: 5,
          params: { to: 1.5 }
        },
        {
          type: "CAPTION",
          start: 1,
          end: 4,
          params: { text: "Testing Zoom + Caption" }
        }
      ]
    };

    console.log("Starting render with Zoom and Caption...");
    const result = await processEditBlueprint(project, outputPath);

    if (result && result.validation && result.validation.valid) {
      console.log("✓ SUCCESS: Video rendered and validated!");
      console.log("Output Path:", result.outputPath);
      console.log("Duration:", result.validation.duration);
    } else {
      throw new Error("Validation failed for rendered video");
    }

  } catch (err) {
    console.error("✗ FAILED:", err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  } finally {
    // Cleanup
    // if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  }
}

testEditPipeline();
