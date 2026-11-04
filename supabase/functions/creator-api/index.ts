import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer"
};

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
  });
}

function fail(code: string, message: string, status: number) {
  return reply({ ok: false, error: { code, message } }, status);
}

function cleanText(value: unknown, max: number, fallback = "") {
  return typeof value === "string" ? value.trim().slice(0, max) : fallback;
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  const authorization = request.headers.get("Authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  const apiKey = request.headers.get("apikey") || "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL");

  if (!token || !apiKey) return fail("UNAUTHORIZED", "A valid sign-in session is required.", 401);
  if (!supabaseUrl) return fail("SERVICE_UNAVAILABLE", "The database connection is not configured.", 503);

  const supabase = createClient(supabaseUrl, apiKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: "Bearer " + token } }
  });

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  const user = authData?.user;
  if (authError || !user) return fail("UNAUTHORIZED", "Your sign-in session is invalid or expired.", 401);
  if (!user.email_confirmed_at) return fail("EMAIL_NOT_CONFIRMED", "Confirm your email address before using Creator AI.", 403);

  const url = new URL(request.url);
  const routeParts = url.pathname.split("/").filter(Boolean);
  const functionIndex = routeParts.indexOf("creator-api");
  const parts = functionIndex >= 0
    ? routeParts.slice(functionIndex + 1)
    : routeParts;
  const method = request.method;

  try {
    if (parts.length === 1 && parts[0] === "projects" && method === "GET") {
      const { data, error } = await supabase
        .from("projects").select("*").eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return reply({ projects: data || [] });
    }

    if (parts.length === 1 && parts[0] === "projects" && method === "POST") {
      const body = await request.json().catch(() => null);
      if (!body || typeof body !== "object") return fail("INVALID_BODY", "A project payload is required.", 400);
      const title = cleanText(body.title, 100, "Untitled Project") || "Untitled Project";
      const mode = body.mode === "edit" ? "edit" : "create";
      const aspectRatio = cleanText(body.aspectRatio, 12, "9:16");
      const allowedRatios = new Set(["9:16", "16:9", "1:1", "4:5"]);
      const row = {
        id: crypto.randomUUID(),
        user_id: user.id,
        title,
        mode,
        status: "draft",
        aspect_ratio: allowedRatios.has(aspectRatio) ? aspectRatio : "9:16",
        duration: Math.max(0, Math.min(600, Number(body.duration) || 0)),
        prompt: cleanText(body.prompt, 5000),
        style: cleanText(body.style, 80, "clean"),
        language: cleanText(body.language, 40, "English")
      };
      const { data, error } = await supabase.from("projects").insert(row).select("*").single();
      if (error) throw error;
      return reply({ project: data }, 201);
    }

    if (parts.length >= 2 && parts[0] === "projects") {
      const projectId = parts[1];
      const { data: project, error: projectError } = await supabase
        .from("projects").select("*").eq("id", projectId).eq("user_id", user.id).maybeSingle();
      if (projectError) throw projectError;
      if (!project) return fail("PROJECT_NOT_FOUND", "Project not found.", 404);

      if (parts.length === 2 && method === "GET") {
        const responseProject = { ...project };
        const sourcePath = responseProject.source_video?.path;
        if (sourcePath) {
          const { data: signed, error: signedError } = await supabase.storage
            .from("creator-media").createSignedUrl(sourcePath, 3600);
          if (!signedError && signed?.signedUrl) {
            responseProject.source_video = { ...responseProject.source_video, url: signed.signedUrl };
          }
        }
        return reply({ project: responseProject });
      }

      if (parts.length === 2 && method === "PATCH") {
        const body = await request.json().catch(() => null);
        if (!body || typeof body !== "object") return fail("INVALID_BODY", "An update payload is required.", 400);
        const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (typeof body.title === "string") update.title = cleanText(body.title, 100);
        if (typeof body.prompt === "string") update.prompt = cleanText(body.prompt, 5000);
        if (typeof body.style === "string") update.style = cleanText(body.style, 80);
        if (typeof body.aspectRatio === "string") {
          const ratio = cleanText(body.aspectRatio, 12);
          if (["9:16", "16:9", "1:1", "4:5"].includes(ratio)) update.aspect_ratio = ratio;
        }
        const { data, error } = await supabase.from("projects").update(update)
          .eq("id", projectId).eq("user_id", user.id).select("*").single();
        if (error) throw error;
        return reply({ project: data });
      }

      if (parts.length === 2 && method === "DELETE") {
        const { data: assets, error: assetsReadError } = await supabase.from("assets")
          .select("path").eq("project_id", projectId).eq("user_id", user.id);
        if (assetsReadError) throw assetsReadError;
        const paths = (assets || []).map((x: { path: string | null }) => x.path).filter(Boolean) as string[];
        if (paths.length) {
          const { error } = await supabase.storage.from("creator-media").remove(paths);
          if (error) console.warn("Storage cleanup warning:", error.message);
        }
        const { error: assetDeleteError } = await supabase.from("assets").delete()
          .eq("project_id", projectId).eq("user_id", user.id);
        if (assetDeleteError) throw assetDeleteError;
        const { error: jobsDeleteError } = await supabase.from("render_jobs").delete()
          .eq("project_id", projectId).eq("user_id", user.id);
        if (jobsDeleteError) throw jobsDeleteError;
        const { error: projectDeleteError } = await supabase.from("projects").delete()
          .eq("id", projectId).eq("user_id", user.id);
        if (projectDeleteError) throw projectDeleteError;
        return reply({ ok: true, deleted: true });
      }

      if (parts.length === 3 && parts[2] === "assets" && method === "GET") {
        const { data, error } = await supabase.from("assets").select("*")
          .eq("project_id", projectId).eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return reply({ assets: data || [] });
      }

      if (parts.length === 3 && parts[2] === "render-jobs" && method === "POST") {
        const body = await request.json().catch(() => ({}));
        const { data, error } = await supabase.from("render_jobs").insert({
          project_id: projectId,
          user_id: user.id,
          status: "queued",
          progress: 0,
          result: body && typeof body === "object" ? { label: cleanText(body.label, 100, "Generation job") } : { label: "Generation job" }
        }).select("*").single();
        if (error) throw error;
        return reply({ job: data }, 201);
      }

      if (parts.length === 4 && parts[2] === "render-jobs" && method === "PATCH") {
        const jobId = parts[3];
        const body = await request.json().catch(() => null);
        if (!body || typeof body !== "object") return fail("INVALID_BODY", "A job update is required.", 400);
        const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (typeof body.status === "string" && ["queued", "running", "completed", "failed", "cancelled"].includes(body.status)) {
          update.status = body.status;
          if (body.status === "running") update.started_at = new Date().toISOString();
          if (["completed", "failed", "cancelled"].includes(body.status)) update.completed_at = new Date().toISOString();
        }
        if (Number.isInteger(body.progress) && body.progress >= 0 && body.progress <= 100) update.progress = body.progress;
        if (typeof body.error_code === "string") update.error_code = cleanText(body.error_code, 80);
        if (typeof body.error_message === "string") update.error_message = cleanText(body.error_message, 500);
        if (body.result && typeof body.result === "object" && !Array.isArray(body.result)) update.result = body.result;
        const { data, error } = await supabase.from("render_jobs").update(update)
          .eq("id", jobId).eq("project_id", projectId).eq("user_id", user.id).select("*").maybeSingle();
        if (error) throw error;
        if (!data) return fail("JOB_NOT_FOUND", "Generation job not found.", 404);
        return reply({ job: data });
      }

      if (parts.length === 3 && parts[2] === "render-jobs" && method === "GET") {
        const { data, error } = await supabase.from("render_jobs").select("*")
          .eq("project_id", projectId).eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return reply({ jobs: data || [] });
      }

      if (parts.length === 3 && parts[2] === "upload" && method === "POST") {
        const form = await request.formData();
        const file = form.get("video");
        if (!(file instanceof File)) return fail("VIDEO_REQUIRED", "Choose a video file to upload.", 400);
        if (file.size <= 0 || file.size > 100 * 1024 * 1024) {
          return fail("FILE_SIZE_INVALID", "Video must be between 1 byte and 100 MB.", 413);
        }
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100) || "video-upload";
        const storagePath = user.id + "/" + projectId + "/" + crypto.randomUUID() + "-" + safeName;
        const { error: uploadError } = await supabase.storage.from("creator-media")
          .upload(storagePath, file, { contentType: file.type || "application/octet-stream", upsert: false });
        if (uploadError) throw uploadError;
        const metadata = { filename: file.name, size: file.size, mimeType: file.type || null };
        const { data: asset, error: assetError } = await supabase.from("assets").insert({
          project_id: projectId, user_id: user.id, type: "source_video",
          provider: "supabase", path: storagePath, metadata
        }).select("*").single();
        if (assetError) {
          await supabase.storage.from("creator-media").remove([storagePath]);
          throw assetError;
        }
        const { error: updateError } = await supabase.from("projects").update({
          source_video: { path: storagePath, ...metadata },
          updated_at: new Date().toISOString()
        }).eq("id", projectId).eq("user_id", user.id);
        if (updateError) throw updateError;
        return reply({ ok: true, asset }, 201);
      }

      if (parts.length === 3 && parts[2] === "analyze" && method === "POST") {
        return fail("ENGINE_NOT_INCLUDED", "Analysis is not part of the cloud data API yet.", 501);
      }

      if (parts.length === 3 && parts[2] === "render" && method === "POST") {
        return fail("ENGINE_NOT_INCLUDED", "Rendering remains on the local engine and is not exposed by this cloud API.", 501);
      }
    }

    if (parts.length === 2 && parts[0] === "usage" && parts[1] === "consume" && method === "POST") {
      const { data, error } = await supabase.rpc("consume_daily_generation", { p_user_id: user.id });
      if (error) throw error;
      return reply(data || { allowed: false, error: "QUOTA_CHECK_FAILED" });
    }

    if (parts.length === 2 && parts[0] === "usage" && parts[1] === "daily" && method === "GET") {
      const today = new Date().toISOString().slice(0, 10);
      const [{ data: profile, error: profileError }, { data: usage, error: usageError }] = await Promise.all([
        supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle(),
        supabase.from("daily_usage").select("generations").eq("user_id", user.id).eq("usage_date", today).maybeSingle()
      ]);
      if (profileError) throw profileError;
      if (usageError) throw usageError;
      const plan = profile?.plan === "pro" ? "pro" : "free";
      const { data: limitRow, error: limitError } = await supabase.from("plan_limits")
        .select("daily_generations").eq("plan", plan).single();
      if (limitError) throw limitError;
      const dailyLimit = Number(limitRow.daily_generations);
      const used = Number(usage?.generations || 0);
      return reply({ plan, used, dailyLimit, remaining: Math.max(0, dailyLimit - used), date: today });
    }

    return fail("NOT_FOUND", "Route not found.", 404);
  } catch (error) {
    console.error("[creator-api]", error?.message || error);
    return fail("INTERNAL_ERROR", "The request could not be completed.", 500);
  }
});