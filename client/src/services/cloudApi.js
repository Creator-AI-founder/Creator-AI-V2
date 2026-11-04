const SUPABASE_URL = "https://gnqxzdnxepvrmflnspml.supabase.co";
const SUPABASE_KEY = "sb_publishable_NJjSiBLfpf2vFzrewcGftQ_VZZYVMBp";
const EDGE_API = SUPABASE_URL + "/functions/v1/creator-api";
const SESSION_KEY = "creator-ai-session-v1";

export const isLocalEngine = ["localhost", "127.0.0.1"].includes(window.location.hostname);

export function getSession() {
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) return JSON.parse(saved);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");
    if (!access_token) return null;
    const expires_in = Number(hash.get("expires_in") || 3600);
    const session = { access_token, refresh_token, token_type: hash.get("token_type") || "bearer", expires_in, expires_at: Math.floor(Date.now() / 1000) + expires_in };
    saveSession(session);
    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    return session;
  } catch { return null; }
}
function saveSession(session) {
  if (session?.access_token) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}
async function authRequest(path, body) {
  const response = await fetch(SUPABASE_URL + "/auth/v1/" + path, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
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
  const data = await authRequest("signup", { email, password, options: { emailRedirectTo: window.location.origin } });
  if (data.access_token) saveSession(data);
  return data;
}
export async function signOut() {
  const session = getSession();
  try {
    if (session?.access_token) await fetch(SUPABASE_URL + "/auth/v1/logout", {
      method: "POST", headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + session.access_token }
    });
  } finally { saveSession(null); }
}
async function validSession() {
  let session = getSession();
  if (!session?.access_token) throw new Error("Please sign in to continue.");
  if (session.expires_at && session.expires_at * 1000 < Date.now() + 60000) {
    if (!session.refresh_token) { saveSession(null); throw new Error("Your session expired. Please sign in again."); }
    const refreshed = await authRequest("token?grant_type=refresh_token", { refresh_token: session.refresh_token });
    saveSession(refreshed); session = refreshed;
  }
  return session;
}
export async function currentUser(session) {
  const active = await validSession().catch(() => session || null);
  if (!active?.access_token) return null;
  const response = await fetch(SUPABASE_URL + "/auth/v1/user", {
    headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + active.access_token }
  });
  if (!response.ok) return null;
  return response.json();
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
  return { ...project, aspectRatio: project.aspectRatio || project.aspect_ratio || "9:16", sourceVideo: project.sourceVideo || project.source_video || null, renderedVideo: project.renderedVideo || project.rendered_video || null };
}
