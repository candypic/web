// Supabase Edge Function: send-crew-push
// Sends a real FCM (Firebase Cloud Messaging) push notification to one or
// more crew_profiles.push_token values, so crew members get a lock-screen
// alert even when the app/tab is closed. Complements the Supabase Realtime
// broadcast + postgres_changes channels used elsewhere, which only reach a
// device that already has an active connection.
//
// POST { tokens: string[], title: string, body: string, url?: string }
//   -> { ok: true, sent, total, results }
//
// Auth: verified manually (verify_jwt = false in config.toml so the CORS
// preflight isn't rejected). Only a logged-in Supabase user (studio admin)
// may call this.
//
// Reuses the FIREBASE_SERVICE_ACCOUNT secret already configured for the
// telegram-bot function (same Firebase project as the crew web push tokens).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { create } from "https://deno.land/x/djwt@v2.8/mod.ts";

const serviceAccount = JSON.parse(Deno.env.get("FIREBASE_SERVICE_ACCOUNT") || "{}");

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Placeholder value AdminLogin.jsx stores when the browser granted
// notification permission but Firebase couldn't mint a real FCM token.
const PLACEHOLDER_TOKENS = new Set(["web_push_granted"]);

async function getAccessToken(): Promise<string | null> {
  try {
    const pem = serviceAccount.private_key as string;
    const binaryKey = Uint8Array.from(
      atob(pem.replace(/-----BEGIN PRIVATE KEY-----|\n|-----END PRIVATE KEY-----/g, "")),
      (c) => c.charCodeAt(0),
    );

    const key = await crypto.subtle.importKey(
      "pkcs8",
      binaryKey,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const jwt = await create(
      { alg: "RS256", typ: "JWT" },
      {
        iss: serviceAccount.client_email,
        scope: "https://www.googleapis.com/auth/firebase.messaging",
        aud: "https://oauth2.googleapis.com/token",
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      },
      key,
    );

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    const data = await res.json();
    return data.access_token || null;
  } catch (err) {
    console.error("[send-crew-push] Error generating FCM access token:", err);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // --- Authenticate the caller (must be a signed-in studio admin) ---
  const authToken = (req.headers.get("Authorization") || "").replace("Bearer ", "");
  if (!authToken) return json({ error: "Unauthorized" }, 401);
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(authToken);
  if (authErr || !user) return json({ error: "Unauthorized" }, 401);

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const rawTokens = Array.isArray(payload.tokens) ? payload.tokens : [];
  const tokens = [
    ...new Set(
      rawTokens.filter(
        (t): t is string => typeof t === "string" && t.length > 0 && !PLACEHOLDER_TOKENS.has(t),
      ),
    ),
  ];
  const title = typeof payload.title === "string" && payload.title ? payload.title : "📸 Candy Pic Studio";
  const body = typeof payload.body === "string" ? payload.body : "";
  const url = typeof payload.url === "string" && payload.url ? payload.url : "/crew/calendar";

  if (tokens.length === 0) {
    return json({ ok: true, sent: 0, total: 0, results: [], note: "No valid push tokens supplied" });
  }

  if (!serviceAccount.private_key || !serviceAccount.client_email || !serviceAccount.project_id) {
    console.error("[send-crew-push] FIREBASE_SERVICE_ACCOUNT secret missing or malformed");
    return json({ error: "Push service is not configured" }, 500);
  }

  const accessToken = await getAccessToken();
  if (!accessToken) return json({ error: "Failed to authenticate with FCM" }, 502);

  const projectId = serviceAccount.project_id;

  const results = await Promise.all(
    tokens.map(async (token) => {
      try {
        const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            message: {
              token,
              notification: { title, body },
              // `data` is what our custom firebase-messaging-sw.js background handler
              // reads to know which URL to open on notification click.
              data: { url, click_action: url },
              webpush: {
                fcm_options: { link: url },
                notification: { icon: "/logo-nonsquare.png", badge: "/logo-nonsquare.png" },
              },
            },
          }),
        });
        const text = await res.text();

        // Dead/unregistered token — clear it so future sends stop retrying it.
        if (!res.ok && (res.status === 404 || text.includes("UNREGISTERED") || text.includes("NOT_FOUND"))) {
          await supabaseAdmin.from("crew_profiles").update({ push_token: null }).eq("push_token", token);
        }

        return { token: `${token.slice(0, 12)}…`, ok: res.ok, status: res.status };
      } catch (e) {
        return { token: `${token.slice(0, 12)}…`, ok: false, error: String(e) };
      }
    }),
  );

  const sent = results.filter((r) => r.ok).length;
  return json({ ok: true, sent, total: tokens.length, results });
});
