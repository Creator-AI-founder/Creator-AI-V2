const SUPABASE_URL = "https://gnqxzdnxepvrmflnspml.supabase.co";
const SUPABASE_KEY = "sb_publishable_NJjSiBLfpf2vFzrewcGftQ_VZZYVMBp";
const EDGE_API = SUPABASE_URL + "/functions/v1/creator-api";
const SESSION_KEY = "creator-ai-session-v1";

export const isLocalEngine = ["localhost", "127.0.0.1"].includes(window.location.hostname);

export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
  catch { return null; }
}
function saveSession(session) {
  if (session?.access_token) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}
async function authRequest(path, body, token) {
  const response = await fetch(SUPABASE_URL + "/auth/v1/" + path, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
    body: JSON.stringify(body || {})
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.msg || data.message || data.error_description || data.error || "Authentication request failed.");
  return data;
}
export async function signIn(email, password) {
  const data = await authRequest("token?grant_type=password", { email, password });
  saveSession(data);
  return data;
}
export async function signUp(email, password) {
  const data = await authRequest("signup", { email, password });
  if (data.access_token) saveSession(data);
  return data;
}
export async function signOut() {
  const session = getSession();
  try {
    if (session?.access_token) {
      await fetch(SUPABASE_URL + "/auth/v1/logout", {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + session.access_token }
      });
    }
  } finally { saveSession(null); }
}
export async function currentUser(session = getSession()) {
  if (!session?.access_token) return null;
  const response = await fetch(SUPABASE_URL + "/auth/v1/user", {
    headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + session.access_token }
  });
  if (!response.ok) return null;
  return response.json();
}
async function validSession() {
  let session = getSession();
  if (!session?.access_token) throw new Error("Please sign in to continue.");
  if (session.expires_at && session.expires_at * 1000 < Date.now() + 60000) {
    if (!session.refresh_token) { saveSession(null); throw new Error("Your session expired. Please sign in again."); }
    const refreshed = await authRequest("token?grant_type=refresh_token", { refresh_token: session.refresh_token });
    saveSession(refreshed);
    session = refreshed;
  }
  return session;
}
export async function apiRequest(path, options = {}) {
  if (isLocalEngine) return fetch("/api" + path, options);
  const session = await validSession();
  const headers = new Headers(options.headers || {});
  headers.set("apikey", SUPABASE_KEY);
  headers.set("Authorization", "Bearer " + session.access_token);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(EDGE_API + path, { ...options, headers });
}
export function normalizeProject(project) {
  if (!project) return project;
  return {
    ...project,
    aspectRatio: project.aspectRatio || project.aspect_ratio || "9:16",
    sourceVideo: project.sourceVideo || project.source_video || null,
    renderedVideo: project.renderedVideo || project.rendered_video || null
  };
}
