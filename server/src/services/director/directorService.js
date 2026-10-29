const { chat } = require("../llm/LLMService");

/**
 * Director JSON schema validation.
 * Ensures required fields are present and correctly typed.
 */
function validateDirectorJson(data) {
  const errors = [];

  if (typeof data.title !== "string" || data.title.trim().length === 0) {
    errors.push("title: required non-empty string");
  }
  if (typeof data.hook !== "string") {
    errors.push("hook: required string");
  }
  if (typeof data.script !== "string" || data.script.trim().length === 0) {
    errors.push("script: required non-empty string");
  }
  if (typeof data.duration !== "number" || data.duration <= 0) {
    errors.push("duration: required positive number");
  }
  if (typeof data.language !== "string") {
    errors.push("language: required string");
  }
  if (typeof data.style !== "string") {
    errors.push("style: required string");
  }

  // Validate scenes array
  if (!Array.isArray(data.scenes)) {
    errors.push("scenes: required array");
  } else {
    for (let i = 0; i < data.scenes.length; i++) {
      const scene = data.scenes[i];
      if (typeof scene.id !== "string") {
        errors.push(`scenes[${i}].id: required string`);
      }
      if (typeof scene.start !== "number" || scene.start < 0) {
        errors.push(`scenes[${i}].start: required positive number`);
      }
      if (typeof scene.end !== "number" || scene.end <= scene.start) {
        errors.push(`scenes[${i}].end: required number > start`);
      }
      if (typeof scene.voiceover !== "string") {
        errors.push(`scenes[${i}].voiceover: required string`);
      }
      if (typeof scene.visualQuery !== "string") {
        errors.push(`scenes[${i}].visualQuery: required string`);
      }
      if (typeof scene.caption !== "string") {
        errors.push(`scenes[${i}].caption: required string`);
      }
      if (scene.editing) {
        if (typeof scene.editing.zoom !== "number") {
          errors.push(`scenes[${i}].editing.zoom: optional positive number`);
        }
        if (scene.editing.transition && typeof scene.editing.transition !== "string") {
          errors.push(`scenes[${i}].editing.transition: optional string`);
        }
      }
    }
  }

  // Validate audio object
  if (data.audio && typeof data.audio !== "object") {
    errors.push("audio: optional object");
  }

  // Validate captions object
  if (data.captions && typeof data.captions !== "object") {
    errors.push("captions: optional object");
  }

  // Validate editActions array
  if (data.editActions && !Array.isArray(data.editActions)) {
    errors.push("editActions: optional array");
  }

  return errors;
}

/**
 * AI Director – generates a structured video project plan from a user idea.
 * Uses the Creator AI runtime model (gpt-oss-120b) through FreeLLMAPI.
 *
 * The output is strict JSON matching a defined schema. If the LLM output
 * cannot be parsed or validated, a hard error is thrown – no silent fallback.
 */
async function generateDirector(projectIdea, options = {}) {
  const model = options.model || process.env.LLM_MODEL || "gpt-oss-120b";
  const systemPrompt = `You are Creator AI V2, an expert video editing AI Director.

Create a structured video project plan from the user's idea.

The output MUST be valid JSON matching this exact schema. Do NOT include any reasoning, apologies, or extra text outside the JSON.

{
  "title": "A concise, engaging title for the video",
  "hook": "A strong hook statement (1-2 sentences) that grabs attention at the start",
  "script": "The full spoken script for the entire video, natural and conversational",
  "duration": 30,          // total target duration in seconds
  "language": "English",
  "style": "Shorts",     // e.g. Shorts, Documentary, Tutorial, etc.
  "scenes": [
    {
      "id": "scene_1",           // unique scene identifier
      "start": 0,              // start time in seconds
      "end": 4,                // end time in seconds
      "voiceover": "Exact text to be spoken by the voiceover for this scene",
      "visualQuery": "A brief description of the visual content for this scene (used by the media provider)",
      "visualType": "REAL_VIDEO",     // or "GENERATED_IMAGE", "STOCK_VIDEO"
      "caption": "Overlay caption text for this scene (may be empty if no caption)",
      "editing": {
        "zoom": 1.0,           // 1.0 = no zoom, >1.0 = punch-in, <1.0 = zoom-out
        "transition": "cut"    // e.g. "cut", "fade", "wipe"
      }
    }
  ],
  "audio": {
    "voiceover": "Whether voiceover is included (true/false)",
    "music": "Whether background music is included (true/false)",
    "musicDuck": -6            // dB reduction under voiceover, e.g. -6, -12, 0
  },
  "captions": {
    "enabled": true,         // whether captions are generated
    "style": "standard"      // e.g. "standard", "emphasized", "kinetic"
  },
  "editActions": []        // list of pre-computed editing actions for the video engine
}

IMPORTANT RULES:
- All strings must be properly escaped JSON strings (no trailing commas, no unescaped quotes).
- duration must be a positive integer (seconds).
- Each scene must have start < end.
- Scenes must be in chronological order (scene[i].end <= scene[i+1].start is allowed but overlapping is OK if justified).
- visualType should reflect what the media provider should aim for.
- Keep it concise. Do not overwrite.
- Output ONLY the JSON block. No surrounding text, no markdown fences, no explanations.
`;

  const requestedStyle = options.style || "Cinematic";
  const requestedLanguage = options.language || "English";
  const requestedDuration =
    Number(options.duration) > 0 ? Number(options.duration) : 30;

  const userPrompt = `Create the video DIRECTLY from this exact user request.

USER REQUEST:
${projectIdea}

REQUIRED SETTINGS:
- style: ${requestedStyle}
- language: ${requestedLanguage}
- duration: ${requestedDuration} seconds

These settings are HARD CONSTRAINTS.
The JSON output MUST use:
- "style": "${requestedStyle}"
- "language": "${requestedLanguage}"
- "duration": ${requestedDuration}

The final scene MUST end at ${requestedDuration} seconds.
Do not silently replace these settings with defaults such as Shorts.

STRICT REQUIREMENTS:
- The user's requested topic/idea is the source of truth.
- Do NOT replace the topic with another topic.
- Do NOT invent a different subject just because it is easier.
- Preserve the requested language, style, and duration when they are provided.
- Every scene must directly support the user's requested topic.
- The hook must be about the user's requested topic.
- The spoken script must be about the user's requested topic.
- Visual queries must visually represent the requested topic.
- If the request says "sky looks blue", the video must explain why the sky looks blue.
- Output ONLY the JSON object matching the schema. No markdown or explanations.`;

  try {
    const result = await chat([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    const content = result?.choices?.[0]?.message?.content || "";

    // Extract JSON block if the model wraps it (some models add ```json```)
    let jsonStr = content.trim();
    // Remove markdown fences if present
    if (jsonStr.startsWith("```")) {
      const lines = jsonStr.split("\n");
      // Find the lines between the first and last ```
      const startIdx = lines.findIndex((l) => l.startsWith("```"));
      const endIdx = lines.lastIndexOf("```");
      if (startIdx >= 0 && endIdx > startIdx) {
        jsonStr = lines.slice(startIdx + 1, endIdx).join("\n").trim();
      }
    }

    // Parse the JSON
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      // Try extracting just the JSON object portion if there's leading/trailing text
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch (e2) {
          throw new Error(`Failed to parse AI Director JSON: ${parseErr.message}`);
        }
      } else {
        throw new Error(`AI Director did not return valid JSON. Response: ${content.substring(0, 200)}`);
      }
    }

    // Validate the parsed structure
    const validationErrors = validateDirectorJson(parsed);
    if (validationErrors.length > 0) {
      throw new Error(`AI Director returned invalid schema: ${validationErrors.join(", ")}`);
    }

    // Ensure default values for optional fields
    if (parsed.audio === undefined) {
      parsed.audio = { voiceover: true, music: false, musicDuck: -6 };
    }
    if (parsed.captions === undefined) {
      parsed.captions = { enabled: true, style: "standard" };
    }
    if (parsed.editActions === undefined) {
      parsed.editActions = [];
    }

    // Validate scene timing consistency
    for (let i = 0; i < parsed.scenes.length - 1; i++) {
      const currentEnd = parsed.scenes[i].end;
      const nextStart = parsed.scenes[i + 1].start;
      // Allow scenes to overlap or have gaps; just log if gap is very large
      if (nextStart > currentEnd + 5) {
        // Gap larger than 5 seconds – note but don't error
      }
    }

    return parsed;
  } catch (err) {
    // Re-throw with clear message – no fake fallback
    throw new Error(`AI Director failed: ${err.message}`);
  }
}

module.exports = { generateDirector, validateDirectorJson };