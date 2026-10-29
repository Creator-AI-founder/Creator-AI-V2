const path = require("path");
const fs = require("fs");

// In-memory project store backed by disk persistence
const DATA_DIR = path.join(__dirname, "../../../data");
const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(PROJECTS_FILE)) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify([]), "utf-8");
  }
}

function getProjects() {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(PROJECTS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveProjects(projects) {
  ensureDataDir();
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), "utf-8");
}

function getProjectById(id) {
  const projects = getProjects();
  return projects.find((p) => p.id === id) || null;
}

function createProject(data) {
  const projects = getProjects();
  const newProject = {
    id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    title: data.title || "Untitled Project",
    mode: data.mode || "edit", // 'edit' or 'create'
    status: data.status || "draft", // 'draft', 'analyzing', 'ready', 'rendering', 'completed', 'error'
    aspectRatio: data.aspectRatio || "9:16",
    fps: data.fps || 30,
    duration: data.duration || 0,
    sourceVideo: data.sourceVideo || null, // { path, originalName, size, mimeType }
    prompt: data.prompt || "",
    style: data.style || "clean",
    analysis: data.analysis || null,
    blueprint: data.blueprint || null,
    renderedVideo: data.renderedVideo || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  projects.unshift(newProject);
  saveProjects(projects);
  return newProject;
}

function updateProject(id, updates) {
  const projects = getProjects();
  const index = projects.findIndex((p) => p.id === id);
  if (index === -1) return null;

  projects[index] = {
    ...projects[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveProjects(projects);
  return projects[index];
}

function deleteProject(id) {
  const projects = getProjects();
  const filtered = projects.filter((p) => p.id !== id);
  if (filtered.length === projects.length) return false;
  saveProjects(filtered);
  return true;
}

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
