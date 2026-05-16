// Edge Function: submit-review
// Publiczny endpoint (anon) - przyjmuje opinię z formularza /opinia?t=<token>.
// Walidacja: token musi istnieć w leads.review_request_token, review_submitted_at musi być NULL.
// Anti-spam: honeypot field, rate-limit-per-ip (hash w reviews.ip_hash), validacja długości.
//
// CORS: allow zaproszeniaonline.com + preview deploy + localhost.
//
// Po INSERT do reviews → DB trigger reviews_notify_submitted → notify-review-submitted EF
// wysyła 2 maile (operator + klient dziękujemy).

// @ts-ignore: Deno deps
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-ignore: Deno deps
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const IP_SALT = Deno.env.get("IP_SALT") || "zaproszenia-ip-salt-v1-2026";

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ALLOWED_ORIGINS = [
  "https://zaproszeniaonline.com",
  "https://www.zaproszeniaonline.com",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:4173",
];

function corsHeaders(origin: string | null): Record<string, string> {
  const allow = origin && (ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".vercel.app"))
    ? origin
    : "https://zaproszeniaonline.com";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Vary": "Origin",
  };
}

async function hashIp(ip: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(`${ip}|${IP_SALT}`));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

interface SubmitBody {
  token?: string;
  rating?: number;
  comment?: string;
  best_part?: string;
  recommend_to_others?: boolean;
  consent_publish?: boolean;
  display_name?: string;
  // honeypot
  website?: string;
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  let body: SubmitBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // ─── Walidacja inputu ────────────────────────────────────────────────────

  const token = (body.token || "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    return new Response(JSON.stringify({ error: "invalid_token" }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return new Response(JSON.stringify({ error: "invalid_rating" }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const comment = (body.comment || "").trim().slice(0, 2000);
  const bestPart = (body.best_part || "").trim().slice(0, 500);
  const displayName = (body.display_name || "").trim().slice(0, 80) || null;
  const consentPublish = body.consent_publish === true;
  const recommend = typeof body.recommend_to_others === "boolean" ? body.recommend_to_others : null;

  // Honeypot - jeśli wypełnione, bot
  const honeypotTriggered = !!(body.website && body.website.trim().length > 0);

  // ─── Sprawdź token i sprawdź czy nie podwojony submit ────────────────────

  const { data: lead, error: leadErr } = await sb
    .from("leads")
    .select("id, name, email, review_request_token, review_submitted_at")
    .eq("review_request_token", token)
    .maybeSingle();

  if (leadErr) {
    return new Response(JSON.stringify({ error: "db_error", detail: leadErr.message }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  if (!lead) {
    return new Response(JSON.stringify({ error: "token_not_found" }), {
      status: 404, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  if (lead.review_submitted_at) {
    return new Response(JSON.stringify({ error: "already_submitted", at: lead.review_submitted_at }), {
      status: 409, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // ─── Meta dla forensyki ──────────────────────────────────────────────────

  const xff = req.headers.get("x-forwarded-for") || "";
  const ip = xff.split(",")[0].trim() || "0.0.0.0";
  const ipHash = await hashIp(ip);
  const userAgent = (req.headers.get("user-agent") || "").slice(0, 500);
  const referrer = (req.headers.get("referer") || "").slice(0, 500);

  // ─── INSERT do reviews (jeśli honeypot - zapisuje ale flag, do logów) ───

  if (honeypotTriggered) {
    // Nie blokujemy - zapisujemy z flagą, nie odpalamy emaila (DB trigger fire ale notify ma się check honeypot)
    // Cel: bot nie wie że został wykryty.
    await sb.from("reviews").insert({
      lead_id: lead.id,
      rating,
      comment,
      best_part: bestPart,
      consent_publish: false,
      display_name: displayName,
      ip_hash: ipHash,
      user_agent: userAgent,
      referrer,
      honeypot_triggered: true,
      recommend_to_others: recommend,
    });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const { error: insertErr } = await sb.from("reviews").insert({
    lead_id: lead.id,
    rating,
    comment,
    best_part: bestPart,
    consent_publish: consentPublish,
    display_name: displayName,
    ip_hash: ipHash,
    user_agent: userAgent,
    referrer,
    honeypot_triggered: false,
    recommend_to_others: recommend,
  });

  if (insertErr) {
    // Conflict (unique lead_id) - klient próbuje 2x
    if (insertErr.code === "23505") {
      return new Response(JSON.stringify({ error: "already_submitted" }), {
        status: 409, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: "insert_failed", detail: insertErr.message }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // Update leads.review_submitted_at (token efektywnie zużyty)
  await sb
    .from("leads")
    .update({ review_submitted_at: new Date().toISOString() })
    .eq("id", lead.id);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
