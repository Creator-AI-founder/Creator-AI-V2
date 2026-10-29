require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} = require("./src/services/projectService");

const { analyzeVideoProject } = require("./src/services/analysisService");
const {
  checkFFmpegAvailability,
  inspectVideoFile,
  processEditBlueprint,
} = require("./src/services/videoEngine");
const { chat } = require("./src/services/llm/LLMService");

const app = express();
const PORT = process.env.PORT || 3001;

// Setup upload directory
const UPLOAD_DIR = path.join(__dirname, "uploads");
const RENDER_DIR = path.join(__dirname, "renders");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(RENDER_DIR)) fs.mkdirSync(RENDER_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `vid_${Date.now()}_${Math.random().toString(36).substr(2, 6)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 250 * 1024 * 1024 }, // 250MB limit
});

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(UPLOAD_DIR));
app.use("/renders", express.static(RENDER_DIR));

/* ===== API ROUTES ===== */

// Health & System capabilities check
app.get("/api/health", async (req, res) => {
  const ffmpegInfo = await checkFFmpegAvailability();
  res.json({
    status: "ok",
    name: "Creator AI V2",
    version: "0.2.0",
    ffmpeg: ffmpegInfo,
    llmConfigured: !!process.env.LLM_API_KEY,
  });
});

// List all projects
app.get("/api/projects", (req, res) => {
  const projects = getProjects();
  res.json({ projects });
});

// Get single project
app.get("/api/projects/:id", (req, res) => {
  const project = getProjectById(req.params.id);
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }
  res.json({ project });
});

// Create new project
app.post("/api/projects", (req, res) => {
  const project = createProject(req.body);
  res.status(201).json({ project });
});

// Update project
app.patch("/api/projects/:id", (req, res) => {
  const updated = updateProject(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: "Project not found" });
  }
  res.json({ project: updated });
});

// Delete project
app.delete("/api/projects/:id", (req, res) => {
  const ok = deleteProject(req.params.id);
  if (!ok) {
    return res.status(404).json({ error: "Project not found" });
  }
  res.json({ success: true, message: "Project deleted" });
});

// Upload video for project
app.post("/api/projects/:id/upload", upload.single("video"), async (req, res) => {
  const project = getProjectById(req.params.id);
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  if (!req.file) {
    return res.status(400).json({ error: "No video file provided" });
  }

  const fileInfo = {
    path: req.file.path,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimeType: req.file.mimetype,
    url: `/uploads/${req.file.filename}`,
  };

  // Inspect video metadata with ffprobe
  const metadata = await inspectVideoFile(req.file.path);

  const updated = updateProject(project.id, {
    sourceVideo: fileInfo,
    duration: metadata.duration || project.duration,
    status: "ready",
  });

  res.json({
    project: updated,
    metadata,
  });
});

// AI Analyze project & generate Edit Blueprint
app.post("/api/projects/:id/analyze", async (req, res) => {
  const project = getProjectById(req.params.id);
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  const requestedDuration = Number(req.body?.duration);

  const analysisProject = updateProject(project.id, {
    status: "analyzing",
    prompt:
      typeof req.body?.prompt === "string" && req.body.prompt.trim()
        ? req.body.prompt.trim()
        : project.prompt,
    style:
      typeof req.body?.style === "string" && req.body.style.trim()
        ? req.body.style.trim()
        : project.style,
    language:
      typeof req.body?.language === "string" && req.body.language.trim()
        ? req.body.language.trim()
        : project.language || "English",
    duration:
      Number.isFinite(requestedDuration) && requestedDuration > 0
        ? requestedDuration
        : project.duration,
  });

  try {
    let metadata = {};
    if (analysisProject.sourceVideo?.path) {
      metadata = await inspectVideoFile(analysisProject.sourceVideo.path);
    }

    const analysisResult = await analyzeVideoProject(analysisProject, metadata);

    const updated = updateProject(project.id, {
      status: "ready",
      analysis: analysisResult,
      blueprint: analysisResult.blueprint || null,
      director: analysisResult.director || null,
    });

    res.json({
      projectId: updated.id,
      status: updated.status,
      director: updated.director,
      blueprint: updated.blueprint,
    });
  } catch (err) {
    updateProject(project.id, { status: "error" });
    res.status(500).json({ error: "Analysis failed: " + err.message });
  }
});

// Render / Export Video based on mode
app.post("/api/projects/:id/render", async (req, res) => {
  const project = getProjectById(req.params.id);
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  console.log(`[Render] START project=${project.id} mode=${project.mode} source=${project.sourceVideo?.path || "none"} blueprintActs=${project.blueprint?.actions?.length || 0}`);

  updateProject(project.id, { status: "rendering" });

  const renderFilename = `export_${project.id}.mp4`;
  const outputPath = path.join(RENDER_DIR, renderFilename);

  try {
    // --- CREATE mode: auto-generate video from blueprint / prompt ---
    if (project.mode === "create") {
      // Build a normalized project object matching what processEditBlueprint expects
      // Use persisted director and analysis data if available
      const normalizeProject = {
        id: project.id,
        title: project.title,
        mode: project.mode,
        prompt: project.prompt || "Creator AI video",
        director: project.director || null,
        analysis: project.analysis || null,
        blueprint: { actions: project.blueprint?.actions || [] }
      };

      const renderResult = await processEditBlueprint(normalizeProject, outputPath);

      const updated = updateProject(project.id, {
        status: "completed",
        renderedVideo: {
          url: `/renders/${renderFilename}`,
          filename: renderFilename,
          renderedAt: new Date().toISOString(),
          duration: renderResult.validation?.duration,
          width: renderResult.validation?.width,
          height: renderResult.validation?.height,
          details: renderResult,
        },
      });

      console.log(`[Render] SUCCESS project=${project.id} mode=create file=${outputPath} duration=${renderResult.validation?.duration}s size=${renderResult.validation?.sizeBytes}b`);

      res.json({
        status: "completed",
        projectId: project.id,
        videoUrl: `/renders/${renderFilename}`,
        duration: renderResult.validation?.duration,
        width: renderResult.validation?.width,
        height: renderResult.validation?.height,
        project: updated,
        renderResult,
      });
      return;
    }

    // --- EDIT mode: render from existing source video ---
    try {
      const renderResult = await processEditBlueprint(project, outputPath);

      const updated = updateProject(project.id, {
        status: "completed",
        renderedVideo: {
          url: `/renders/${renderFilename}`,
          filename: renderFilename,
          renderedAt: new Date().toISOString(),
          duration: renderResult.validation?.duration,
          width: renderResult.validation?.width,
          height: renderResult.validation?.height,
          details: renderResult,
        },
      });

      console.log(`[Render] SUCCESS project=${project.id} mode=edit file=${outputPath} duration=${renderResult.validation?.duration}s size=${renderResult.validation?.sizeBytes}b`);

      res.json({
        status: "completed",
        projectId: project.id,
        videoUrl: `/renders/${renderFilename}`,
        duration: renderResult.validation?.duration,
        width: renderResult.validation?.width,
        height: renderResult.validation?.height,
        project: updated,
        renderResult,
      });
    } catch (err) {
      console.error(`[Render] EDIT FAILED project=${project.id}`);
      console.error(err.stack || err.message);

      try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch (_) {}
      updateProject(project.id, { status: "error", lastRenderError: err.message });

      res.status(500).json({
        status: "error",
        message: err.message,
        code: "RENDER_FAILED",
        projectId: project.id,
      });
    }
  } catch (err) {
    console.error(`[Render] CRITICAL FAILED project=${project.id} mode=${project.mode}`);
    console.error(err.stack || err.message);

    try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch (_) {}
    updateProject(project.id, { status: "error", lastRenderError: err.message });

    res.status(500).json({
      status: "error",
      message: err.message,
      code: "RENDER_FAILED",
      projectId: project.id,
    });
  }
});

// Start Server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Creator AI V2 backend running on http://localhost:${PORT}`);
});
