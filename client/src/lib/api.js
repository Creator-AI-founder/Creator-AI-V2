import { supabase } from "./supabase.js";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

export async function apiFetch(path, options = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(options.headers || {});
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (publishableKey) headers.set("apikey", publishableKey);

  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  const url = /^https?:\/\//i.test(path)
    ? path
    : `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

  return fetch(url, { ...options, headers });
}
