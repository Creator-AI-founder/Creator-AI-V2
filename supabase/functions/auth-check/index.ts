import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer"
    }
  });

Deno.serve(async (request: Request) => {
  if (request.method !== "GET") {
    return json({ ok: false, error: { code: "METHOD_NOT_ALLOWED" } }, 405);
  }

  const authorization = request.headers.get("Authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  const publishableKey = request.headers.get("apikey");
  if (!match || !publishableKey) {
    return json({ ok: false, error: { code: "UNAUTHORIZED" } }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) {
    return json({ ok: false, error: { code: "AUTH_SERVICE_UNAVAILABLE" } }, 503);
  }

  try {
    const supabase = createClient(supabaseUrl, publishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      global: {
        headers: { Authorization: `Bearer ${match[1]}` }
      }
    });

    const { data, error } = await supabase.auth.getUser(match[1]);
    if (error || !data.user) {
      return json({ ok: false, error: { code: "UNAUTHORIZED" } }, 401);
    }

    if (!data.user.email_confirmed_at) {
      return json({ ok: false, error: { code: "EMAIL_NOT_CONFIRMED" } }, 403);
    }

    return json({
      ok: true,
      user: {
        id: data.user.id,
        email: data.user.email ?? null,
        email_confirmed_at: data.user.email_confirmed_at
      }
    });
  } catch {
    return json({ ok: false, error: { code: "AUTH_SERVICE_UNAVAILABLE" } }, 503);
  }
});