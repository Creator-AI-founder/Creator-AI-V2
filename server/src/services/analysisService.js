const { chat } = require("./llm/LLMService");
const { generateDirector, validateDirectorJson } = require("./director/directorService");
const { validateActions } = require("../blueprint/schema");

/**
 * Perform AI analysis on a video/project draft.
 * Uses the AI Director to generate a structured project plan from the user's idea.
 * Constructs a structured Edit Blueprint from the Director output.
 * Throws error if AI fails or output is invalid.
 */
async function analyzeVideoProject(project, videoMetadata = {}) {
  const model = process.env.LLM_MODEL || "gpt-oss-120b";

  // Step 1: Use the AI Director to generate a structured project plan from the user's idea
  let directorResult;
  try {
    directorResult = await generateDirector(project.prompt || project.title || "Creator AI video", {
      model,
      style: project.style || "Cinematic",
      language: project.language || "English",
      duration: Number(project.duration) > 0 ? Number(project.duration) : 30,
    });
  } catch (err) {
    throw new Error(`AI Director generation failed: ${err.message}`);
  }

  // Step 2: Validate the Director output schema
  const validationErrors = validateDirectorJson(directorResult);
  if (validationErrors.length > 0) {
    throw new Error(`AI Director output failed schema validation: ${validationErrors.join(", ")}`);
  }

  // Step 3: Convert Director output into the internal project model
  // - title, hook, script come from Director
  // - scenes are transformed into blueprint actions
  // - audio/captions info is preserved

  const scenes = directorResult.scenes || [];

  // Build an edit blueprint from the scenes with full compilation
  const { actions, sceneDetails } = compileBlueprintFromScenes(scenes);

  try {
    validateActions(actions);
  } catch (err) {
    throw new Error(`Compiled blueprint failed action validation: ${err.message}`);
  }

  console.log(`[Director] Compiled ${actions.length} validated blueprint actions from ${scenes.length} scenes`);

  // Build summary and detected topic from the script / hook
  const script = directorResult.script || project.prompt || "Creator AI video";
  const detectedTopic = directorResult.title || project.prompt || "Video creation";

  const summary = `${detectedTopic}: ${script.substring(0, 80)}${script.length > 80 ? "..." : ""}`;

  // Build the blueprint object
  const blueprint = {
    targetDuration: directorResult.duration || (scenes.reduce((sum, s) => sum + (s.end - s.start), 0) || 30),
    pacing: "balanced",
    tracks: {
      video: true,
      audio: true,
      captions: directorResult.captions?.enabled === false ? false : true,
      music: directorResult.audio?.music === true,
    },
    actions,
  };

  // Return a combined result: director data + blueprint + analysis insights
  return {
    // Director fields (exposed for frontend/UI)
    director: directorResult,

    // Internal blueprint (used by videoEngine)
    blueprint,

    // Analysis insights derived from script / Director output
    insights: {
      transcript: directorResult.script || project.prompt || "User-provided idea",
      speakers: ["Narrator"],
      silenceSections: [],
      sceneChanges: scenes.map((s) => s.start).concat(scenes.map((s) => s.end)),
      audioQuality: "good",
      framing: directorResult.style || "9:16",
    },
  };
}

/**
 * Compile director scenes into executable blueprint actions.
 * Maps scene-level intent into engine-executable instructions.
 */
function compileBlueprintFromScenes(scenes) {
  const actions = [];
  const sceneDetails = [];

  for (const scene of scenes) {
    // 0. Media action from the Director visual plan.
    // The actual asset is resolved later by the Media Asset Resolver.
    if (scene.visualPlan && typeof scene.visualPlan === "object") {
      const plan = scene.visualPlan;

      let mediaType = null;

      if (plan.type === "IMAGE") {
        mediaType = plan.factuality === "creative" ? "IMAGE" : "IMAGE";
      } else if (plan.type === "VIDEO") {
        mediaType = plan.factuality === "factual"
          ? "VIDEO"
          : "BROLL";
      }

      if (mediaType) {
        actions.push({
          id: `media_${scene.id}`,
          type: mediaType,
          start: scene.start,
          end: scene.end,
          note: `Media plan for ${scene.id}`,
          params: {
            assetId: scene.assetId || null,
            visualPlan: {
              mode: plan.mode,
              type: plan.type,
              query: plan.query,
              prompt: plan.prompt,
              factuality: plan.factuality || "illustrative",
            },
          },
        });
      }
    }

    // 1. Main KEEP action for the scene duration
    actions.push({
      id: `keep_${scene.id}`,
      type: "KEEP",
      start: scene.start,
      end: scene.end,
      note: `Keep scene ${scene.id}`,
      params: {
        visualQuery: scene.visualQuery,
        visualType: scene.visualType,
      },
    });

    // 2. Add ZOOM action if specified
    if (scene.editing && scene.editing.zoom && scene.editing.zoom !== 1.0) {
      actions.push({
        id: `zoom_${scene.id}`,
        type: "ZOOM",
        start: scene.start,
        end: scene.end,
        note: `Zoom to ${scene.editing.zoom}`,
        params: {
          scaleFrom: 1.0,
          scaleTo: scene.editing.zoom,
        },
      });
    }

    // 3. Add CAPTION action if specified
    if (scene.caption && scene.caption.trim().length > 0) {
      actions.push({
        id: `caption_${scene.id}`,
        type: "CAPTION",
        start: scene.start,
        end: scene.end,
        note: scene.caption,
        params: {
          text: scene.caption,
        },
      });
    }

    sceneDetails.push({
      id: scene.id,
      start: scene.start,
      end: scene.end,
      voiceover: scene.voiceover,
      visualQuery: scene.visualQuery,
      visualType: scene.visualType,
      caption: scene.caption,
      editing: scene.editing || { zoom: 1.0, transition: "cut" },
    });
  }

  return { actions, sceneDetails };
}

module.exports = { analyzeVideoProject, compileBlueprintFromScenes };
