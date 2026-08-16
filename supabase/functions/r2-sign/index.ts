// Supabase Edge Function: r2-sign
// Mints presigned Cloudflare R2 (S3-compatible) URLs for the gallery admin.
//
// - POST { action: "upload", filename, contentType } -> { uploadUrl, key, publicUrl }
// - POST { action: "delete", key }                   -> { ok }
//
// Auth: verified manually (verify_jwt = false in config.toml so the CORS
// preflight isn't rejected). Only a logged-in Supabase user may call this.
//
// Required function secrets (set with `supabase secrets set ...`):
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL
//   (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.)

import { AwsClient } from "https://esm.sh/aws4fetch@1.0.20";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID")!;
const ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID")!;
const SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY")!;
const BUCKET = Deno.env.get("R2_BUCKET")!;
const PUBLIC_URL = (Deno.env.get("R2_PUBLIC_URL") || "").replace(/\/$/, "");

const ENDPOINT = `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`;

const aws = new AwsClient({
  accessKeyId: ACCESS_KEY_ID,
  secretAccessKey: SECRET_ACCESS_KEY,
  region: "auto",
  service: "s3",
});

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

// Build an R2 object URL keeping "/" path separators unescaped.
function objectUrl(key: string) {
  const encoded = key.split("/").map(encodeURIComponent).join("/");
  return `${ENDPOINT}/${BUCKET}/${encoded}`;
}

function safeName(name: string) {
  return (name || "file")
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(-60) || "file";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // --- Authenticate the caller ---
  const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
  if (!token) return json({ error: "Unauthorized" }, 401);
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return json({ error: "Unauthorized" }, 401);

  try {
    const { action, filename, key } = await req.json();

    if (action === "upload") {
      const id = crypto.randomUUID().slice(0, 8);
      const objectKey = `gallery/${Date.now()}-${id}-${safeName(filename)}`;
      const signed = await aws.sign(`${objectUrl(objectKey)}?X-Amz-Expires=600`, {
        method: "PUT",
        aws: { signQuery: true },
      });
      return json({
        uploadUrl: signed.url,
        key: objectKey,
        publicUrl: PUBLIC_URL ? `${PUBLIC_URL}/${objectKey}` : null,
      });
    }

    if (action === "delete") {
      if (!key) return json({ error: "Missing key" }, 400);
      const res = await aws.fetch(objectUrl(key), { method: "DELETE" });
      return json({ ok: res.ok, status: res.status });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
