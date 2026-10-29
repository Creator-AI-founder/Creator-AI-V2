const { exec } = require("child_process");
const util = require("util");
const path = require("path");
const fs = require("fs");

const { LocalFallbackMediaProvider } = require("./media/mediaProvider");
const { EspeakVoiceProvider } = require("./voice/voiceProvider");
const { CaptionEngine } = require("./captions/captionEngine");

const execAsync = util.promisify(exec);

/**
 * Safely parse FPS string from ffprobe (e.g., "30/1", "30000/1001").
 */
function parseFps(fpsStr) {
  if (!fpsStr || typeof fpsStr !== "string") return 30;
  const parts = fpsStr.split("/");
  if (parts.length === 2) {
    const num = parseFloat(parts[0]);
    const den = parseFloat(parts[1]);
    if (den !== 0 && !isNaN(num) && !isNaN(den)) {
      return num / den;
    }
  }
  const val = parseFloat(fpsStr);
  return isNaN(val) ? 30 : val;
}

async function checkFFmpegAvailability() {
  try {
    const { stdout: ffmpegOut } = await execAsync("ffmpeg -version");
    const { stdout: ffprobeOut } = await execAsync("ffprobe -version");
    return {
      ffmpeg: true,
      ffprobe: true,
      version: ffmpegOut.split("\n")[0],
    };
  } catch (err) {
    return {
      ffmpeg: false,
      ffprobe: false,
      error: "FFmpeg/FFprobe binary not found in PATH",
    };
  }
}

/**
 * Inspect video file metadata using ffprobe.
 */
async function inspectVideoFile(filePath) {
  const envCheck = await checkFFmpegAvailability();

  if (!envCheck.ffprobe) {
    const stat = fs.statSync(filePath);
    return {
      available: false,
      duration: 15.0,
      sizeBytes: stat.size,
      mimeType: "video/mp4",
    };
  }

  try {
    const cmd = `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`;
    const { stdout } = await execAsync(cmd);
    const data = JSON.parse(stdout);

    const videoStream = data.streams?.find((s) => s.codec_type === "video");
    const audioStream = data.streams?.find((s) => s.codec_type === "audio");

    return {
      available: true,
      duration: parseFloat(data.format?.duration || 0),
      sizeBytes: parseInt(data.format?.size || 0, 10),
      width: videoStream?.width || 1080,
      height: videoStream?.height || 1920,
      fps: parseFps(videoStream?.r_frame_rate),
      videoCodec: videoStream?.codec_name,
      audioCodec: audioStream?.codec_name,
      hasAudio: !!audioStream,
    };
  } catch (err) {
    return {
      available: false,
      error: err.message,
    };
  }
}

/**
 * Run ffprobe validation on a rendered MP4 file.
 * Returns validation report or throws error if invalid.
 */
async function validateRenderedMp4(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error("Rendered file does not exist on disk");
  }

  const stat = fs.statSync(filePath);
  if (stat.size === 0) {
    throw new Error("Rendered file size is 0 bytes");
  }

  const meta = await inspectVideoFile(filePath);
  if (!meta.available) {
    throw new Error("ffprobe inspection failed on rendered output");
  }

  if (meta.duration <= 0) {
    throw new Error(`Invalid video duration: ${meta.duration}s`);
  }

  if (!meta.width || !meta.height) {
    throw new Error("Video stream missing width or height");
  }

  return {
    valid: true,
    path: filePath,
    sizeBytes: stat.size,
    duration: meta.duration,
    width: meta.width,
    height: meta.height,
    videoCodec: meta.videoCodec,
    hasAudio: meta.hasAudio,
  };
}

/**
 * Master VideoEngine rendering pipeline for EDIT and CREATE modes.
 */
async function processEditBlueprint(project, outputPath) {
  const envCheck = await checkFFmpegAvailability();
  if (!envCheck.ffmpeg) {
    throw new Error("FFmpeg is not installed in PATH. Cannot render video.");
  }

  const renderDir = path.dirname(outputPath);
  if (!fs.existsSync(renderDir)) {
    fs.mkdirSync(renderDir, { recursive: true });
  }

  const mode = project.mode || "edit";
  const blueprint = project.blueprint || {};
  const actions = blueprint.actions || [];

  console.log(`[VideoEngine] Starting render for project ${project.id} (${mode} mode)...`);

  if (mode === "create") {
    // --- CREATE MODE PIPELINE ---
    const mediaProvider = new LocalFallbackMediaProvider({ outputDir: renderDir });
    const voiceProvider = new EspeakVoiceProvider({ outputDir: renderDir });
    const captionEngine = new CaptionEngine();

    // 1. Synthesize voiceover from Director script (or project prompt fallback)
    const scriptText = project.director?.script || project.analysis?.insights?.transcript || project.prompt || "Creator AI production.";
    console.log(`[VideoEngine] Synthesizing voiceover (espeak-ng): "${scriptText.substring(0, 60)}..."`);
    let voiceResult = null;
    try {
      voiceResult = await voiceProvider.synthesize(scriptText);
    } catch (err) {
      console.warn("Voice synthesis warning:", err.message);
    }

    // 2. Generate visual scenes from Director scenes or blueprint actions
    // Use Director scenes if available, otherwise blueprint actions
    const scenesToGenerate = project.director?.scenes || actions.filter((a) => a.type === "KEEP" || a.type === "TEXT" || a.type === "ZOOM");
    const sceneClips = [];

    if (scenesToGenerate.length > 0) {
      for (const [idx, scene] of scenesToGenerate.entries()) {
        const duration = Math.max(2, (scene.end - scene.start) || 4);
        // Use visualQuery or caption from Director, otherwise note or title
        const text = scene.caption || scene.visualQuery || scene.note || project.title || `Scene ${idx + 1}`;
        console.log(`[VideoEngine] Generating scene ${idx + 1}: "${text}" (${duration}s)`);
        const clip = await mediaProvider.generateScene(
          {
            text,
            color: idx % 2 === 0 ? "#111827" : "#1f1f2e",
            query: scene.visualQuery || text
          },
          { duration }
        );
        sceneClips.push(clip.path);
      }
    } else {
      // Default 3 scene sequence
      console.log(`[VideoEngine] Generating default 3-scene sequence...`);
      const clip1 = await mediaProvider.generateScene({ text: project.title || "Creator AI", color: "#0f172a" }, { duration: 4 });
      const clip2 = await mediaProvider.generateScene({ text: project.prompt || "Viral Video", color: "#1e1b4b" }, { duration: 4 });
      const clip3 = await mediaProvider.generateScene({ text: "Made with Creator AI V2", color: "#31103d" }, { duration: 4 });
      sceneClips.push(clip1.path, clip2.path, clip3.path);
    }

    // 3. Concatenate video clips if multiple
    let videoSourcePath = sceneClips[0];
    if (sceneClips.length > 1) {
      const concatListPath = path.join(renderDir, `concat_${project.id}.txt`);
      const concatContent = sceneClips.map((p) => `file '${path.resolve(p)}'`).join("\n");
      fs.writeFileSync(concatListPath, concatContent, "utf-8");

      const mergedVideoPath = path.join(renderDir, `merged_${project.id}.mp4`);
      const concatCmd = `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c:v libx264 -pix_fmt yuv420p -an "${mergedVideoPath}"`;
      await execAsync(concatCmd, { timeout: 60000 });
      videoSourcePath = mergedVideoPath;
    }

    // 4. Determine total video duration for audio padding
    let totalDuration = 0;
    if (actions.length > 0) {
      totalDuration = Math.max(...actions.map((a) => a.end || 0));
    } else {
      totalDuration = sceneClips.reduce((sum, c) => sum + 4, 0);
    }

    // 5. Pad/stretch voiceover to match video duration if needed
    if (voiceResult && fs.existsSync(voiceResult.path)) {
      const paddedVoicePath = path.join(renderDir, `voice_padded_${project.id}.wav`);
      const padCmd = `ffmpeg -y -i "${voiceResult.path}" -filter_complex "[0:a]apad=whole_dur=${totalDuration}[a]" -map "[a]" "${paddedVoicePath}"`;
      try {
        await execAsync(padCmd, { timeout: 15000 });
        voiceResult.path = paddedVoicePath;
      } catch (padErr) {
        console.warn("Audio padding warning:", padErr.message);
      }
    }

    // 6. Build final filter complex with captions & audio mixing
    const captionFilterPath = path.join(renderDir, `captions_${project.id}.txt`);
    const hasCaptions = captionEngine.writeFilterScript(actions, captionFilterPath);

    let cmdArgs = `ffmpeg -y -i "${videoSourcePath}"`;
    let mapArgs = `-map 0:v -map 1:a`;

    if (voiceResult && fs.existsSync(voiceResult.path)) {
      cmdArgs += ` -i "${voiceResult.path}"`;
      mapArgs = `-map 1:a -shortest`;
    } else {
      cmdArgs += ` -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100`;
    }

    if (hasCaptions) {
      cmdArgs += ` -filter_complex_script "${captionFilterPath}"`;
      mapArgs = `-map "[outv]" -map 1:a -shortest`;
    }

    cmdArgs += ` ${mapArgs} -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -r 30 -c:a aac -b:a 128k "${outputPath}"`;
    console.log(`[VideoEngine] Executing final composition: ${cmdArgs}`);
    await execAsync(cmdArgs, { timeout: 90000 });

  } else {
    // --- EDIT MODE PIPELINE ---
    const sourcePath = project.sourceVideo?.path;
    if (!sourcePath || !fs.existsSync(sourcePath)) {
      throw new Error("Source video file not found for edit pipeline");
    }

    // Add TRIM/CUT
    const trimAction = actions.find(a => a.type === "TRIM" || a.type === "CUT");
    let ssFlag = "";
    let durationFlag = "";
    if (trimAction) {
      const start = trimAction.start !== undefined ? trimAction.start : (trimAction.params?.sourceStart || 0);
      const end = trimAction.end !== undefined ? trimAction.end : (trimAction.params?.sourceEnd || 0);
      if (end > start) {
        ssFlag = `-ss ${start}`;
        durationFlag = `-t ${end - start}`;
      }
    }

    // Assemble filters
    let cmdArgs = `ffmpeg -y ${ssFlag} -i "${sourcePath}" ${durationFlag}`;
    let vfChain = [];

    // Add ZOOM (respecting start, end, scaleFrom, scaleTo)
    const zoomActions = actions.filter(a => a.type === "ZOOM");
    if (zoomActions.length > 1) {
      throw new Error("Multiple ZOOM actions are not supported simultaneously in this version");
    }
    const zoomAction = zoomActions[0];
    if (zoomAction) {
      const scaleTo = zoomAction.params?.scaleTo || zoomAction.params?.to || 1.15;
      const start = zoomAction.start || 0;
      const end = zoomAction.end || 5;
      const enableExpr = `between(t,${start},${end})`;
      vfChain.push(`zoompan=z='if(between(in_time,${start},${end}),min(max(zoom,1)+0.001,${scaleTo}),1)':d=1:x=iw/2-(iw/zoom/2):y=ih/2-(ih/zoom/2):fps=30`);
    }

    // Add CAPTIONS
    const captionEng = new CaptionEngine();
    const capFilterPath = path.join(renderDir, `captions_${project.id}.txt`);
    const hasCaps = captionEng.writeFilterScript(actions, capFilterPath);

    if (hasCaps) {
        if (vfChain.length > 0) {
            const zoomFilter = vfChain.join(",");
            const captionChain = captionEng.generateFilterChain(actions);
            const patchedCaptionChain = captionChain.replace(/\[0:v\]/g, "[v1]");
            const script = `[0:v]${zoomFilter}[v1];${patchedCaptionChain}`;
            fs.writeFileSync(capFilterPath, script, "utf-8");
            cmdArgs += ` -filter_complex_script "${capFilterPath}"`;
            cmdArgs += ` -map "[outv]" -map 0:a`;
        } else {
            cmdArgs += ` -filter_complex_script "${capFilterPath}"`;
            cmdArgs += ` -map "[outv]" -map 0:a`;
        }
    } else if (vfChain.length > 0) {
        cmdArgs += ` -vf "${vfChain.join(",")}"`;
    }

    cmdArgs += ` -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 128k "${outputPath}"`;

    console.log(`[VideoEngine] Executing edit render: ${cmdArgs}`);
    await execAsync(cmdArgs, { timeout: 90000 });
  }

  // 5. Validate rendered MP4 with ffprobe
  console.log(`[VideoEngine] Validating rendered output with ffprobe...`);
  const validation = await validateRenderedMp4(outputPath);
  console.log(`[VideoEngine] Render validated successfully:`, validation);

  return {
    status: "rendered",
    outputPath,
    validation,
    actionsProcessed: actions.length,
  };
}

module.exports = {
  checkFFmpegAvailability,
  inspectVideoFile,
  validateRenderedMp4,
  processEditBlueprint,
};
