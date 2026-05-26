// Edge Function: send-review-request
// Wywoływana RĘCZNIE (przez Nicolasa) albo BATCHEM (cron / view query).
//
// Tryby:
//   A. Manual single:  POST { lead_id: "uuid" } albo { lead_email: "..." }
//   B. Batch:          POST { batch: true, limit?: 50 } - bierze z v_review_candidates
//   C. Manual force:   POST { lead_id: "...", force: true } - omija sprawdzanie review_requested_at
//
// Wymaga secretów:
//   - RESEND_API_KEY
//   - SUPABASE_URL (auto)
//   - SUPABASE_SERVICE_ROLE_KEY (auto)
//
// Auth: wymaga Authorization: Bearer <service_role_key> (verify_jwt=false ale my sami sprawdzamy)
// Zwraca: { ok, sent: number, skipped: number, errors: [] }

// @ts-ignore: Deno deps
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-ignore: Deno deps
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
// Migracja 2026-05-16: sb_secret_... → SUPABASE_SECRET_KEY (nowe API), fallback legacy
const SUPABASE_SECRET_KEY = Deno.env.get("SUPABASE_SECRET_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// Auth check używa OBU - klient (Nicolas) wkleja jeden z dwóch w Bearer header
const LEGACY_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const FROM_EMAIL = "Zaproszenia Online <kontakt@zaproszeniaonline.com>";
const REPLY_TO = "kontakt@zaproszeniaonline.com";
const SITE_URL = "https://zaproszeniaonline.com";
const OPERATOR_EMAILS = ["nicolasworoszylo@gmail.com", "dominikakus333@gmail.com"];

interface Lead {
  id: string;
  name: string;
  email: string;
  event_date?: string;
  event_type?: string;
  package?: string;
  payment_status?: string;
  review_request_token?: string | null;
  review_requested_at?: string | null;
  review_submitted_at?: string | null;
}

const sb = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function sendEmail(to: string | string[], subject: string, html: string, text: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      reply_to: REPLY_TO,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return res.json();
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]!));
}

function firstName(name: string): string {
  return (name.split(/[ &]+/)[0] || "Państwo").trim();
}

// ─── Email shell (identyczny token brand jak notify-*) ─────────────────────

function emailShell(opts: { preheader: string; title: string; bodyHtml: string }): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pl"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<meta name="format-detection" content="telephone=no,address=no,email=no,date=no"/>
<meta name="color-scheme" content="light"/>
<meta name="supported-color-schemes" content="light"/>
<title>${escapeHtml(opts.title)}</title>
<style>
  @media only screen and (max-width:600px){
    .container{padding:16px 8px!important;}
    .card{border-radius:14px!important;}
    .hero{padding:32px 24px 28px!important;}
    .body{padding:24px 22px!important;}
    .h1{font-size:1.55rem!important;}
    .stars{font-size:1.8rem!important;letter-spacing:0.08em!important;}
    .cta{padding:14px 22px!important;font-size:0.95rem!important;}
  }
  a{text-decoration:none;}
  body{margin:0!important;padding:0!important;}
</style>
</head>
<body style="margin:0;padding:0;background:#FAFAF8;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">
<div style="display:none;font-size:1px;color:#FAFAF8;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;mso-hide:all;">
  ${escapeHtml(opts.preheader)}
</div>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#FAFAF8;">
  <tr><td align="center" class="container" style="padding:32px 16px;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;">
      <tr><td class="card" style="background:#FFFFFF;border:1px solid #EBEBEB;border-radius:18px;overflow:hidden;box-shadow:0 1px 2px rgba(44,62,45,0.04),0 8px 24px rgba(44,62,45,0.06),0 32px 64px rgba(44,62,45,0.06);">
        ${opts.bodyHtml}
      </td></tr>
      <tr><td style="padding:18px 24px 0;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;font-size:0.72rem;color:#999999;line-height:1.6;">
        <span style="font-family:Georgia,'Times New Roman',serif;font-style:italic;color:#2C3E2D;font-size:0.95rem;letter-spacing:-0.01em;">zaproszeniaonline.com</span><br/>
        Cyfrowe zaproszenia ślubne premium · 699 zł, gotowe w 48 h<br/>
        <span style="color:#BBBBBB;">Dostałeś tego maila bo zakupiłeś naszą usługę. Klik w link otwiera formularz opinii (bez logowania).</span>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function eyebrow(text: string, color = "#FAF6EF", dotColor = "#C9A96E"): string {
  return `<p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;font-size:0.74rem;letter-spacing:0.16em;text-transform:uppercase;color:${color};opacity:0.85;font-weight:500;">
    <span style="display:inline-block;width:5px;height:5px;background:${dotColor};border-radius:50%;margin-right:8px;vertical-align:2px;"></span>${escapeHtml(text)}
  </p>`;
}

// ─── Template: prośba o opinię ──────────────────────────────────────────────

function reviewRequestHTML(lead: Lead, token: string): string {
  const fn = firstName(lead.name);
  const reviewUrl = `${SITE_URL}/opinia?t=${token}`;

  const bodyHtml = `
  <!-- HERO: forest gradient + 5 gold stars (focal point) -->
  <div class="hero" style="background:linear-gradient(135deg,#2C3E2D 0%,#243325 100%);color:#FAF6EF;padding:44px 36px 38px;text-align:center;">
    ${eyebrow("Jak Wam się spodobało?")}
    <p class="stars" style="margin:14px 0 12px;font-size:2.1rem;letter-spacing:0.12em;color:#C9A96E;line-height:1;">
      ★ ★ ★ ★ ★
    </p>
    <h1 class="h1" style="margin:8px 0 6px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:400;font-size:2rem;letter-spacing:-0.022em;line-height:1.15;color:#FAF6EF;">
      Macie 2 minuty?
    </h1>
    <p style="margin:6px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;font-size:1rem;color:rgba(250,246,239,0.82);letter-spacing:-0.005em;line-height:1.55;">
      Wasza opinia pomoże kolejnym parom zdecydować.
    </p>
  </div>

  <!-- BODY: powitanie + CTA + co dostają w zamian -->
  <div class="body" style="padding:36px 36px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;font-size:0.98rem;line-height:1.65;color:#0A0A0A;">

    <p style="margin:0 0 16px;font-size:1rem;">
      Cześć ${escapeHtml(fn)},
    </p>

    <p style="margin:0 0 18px;">
      Mam nadzieję, że strona ślubna spełniła Wasze oczekiwania i że dzień ślubu już za Wami (albo coraz bliżej). Chciałbym Was prosić o jedną rzecz - <strong>krótką opinię o naszej współpracy</strong>.
    </p>

    <p style="margin:0 0 22px;">
      Formularz zajmuje 2 minuty. Możecie dać 5 gwiazdek (mam taką nadzieję) albo szczerze - nawet 1, jeśli coś nie zagrało. To dla mnie najcenniejszy feedback.
    </p>

    <!-- PRIMARY CTA -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
      <tr><td style="background:#0A0A0A;border-radius:100px;">
        <a href="${reviewUrl}" class="cta" style="display:inline-block;padding:16px 32px;color:#FFFFFF;font-size:1rem;font-weight:500;letter-spacing:-0.005em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;">
          Zostaw opinię →
        </a>
      </td></tr>
    </table>

    <!-- GOLD CALLOUT: co Wam to da -->
    <div style="margin:24px 0;padding:20px 22px;background:rgba(201,169,110,0.08);border-left:3px solid #C9A96E;border-radius:8px;">
      <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;font-size:0.74rem;letter-spacing:0.12em;text-transform:uppercase;color:#999999;font-weight:600;">
        <span style="display:inline-block;width:5px;height:5px;background:#C9A96E;border-radius:50%;margin-right:8px;vertical-align:2px;"></span>Co Wam to da
      </p>
      <p style="margin:0;font-size:0.96rem;line-height:1.6;color:#0A0A0A;">
        Jeśli zgodzicie się na publikację Waszej opinii na <a href="${SITE_URL}/" style="color:#2C3E2D;text-decoration:underline;text-underline-offset:2px;">zaproszeniaonline.com</a>, dostaniecie ode mnie <strong>kod rabatowy POLEC50 (-50 zł)</strong> dla znajomych pary - mogą go użyć przy zamówieniu własnej strony.
      </p>
    </div>

    <p style="margin:24px 0 0;color:#4A4A4A;font-size:0.93rem;line-height:1.6;">
      Jeśli macie chwilę i wolicie odpisać tekstem zamiast formularzem - po prostu odpowiedzcie na tego maila. Wszystko czytam osobiście.
    </p>

    <!-- SIGNATURE -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;">
      <tr>
        <td style="padding-right:14px;">
          <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#2C3E2D,#1E2B1F);color:#FAF6EF;text-align:center;line-height:44px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:0.98rem;">
            N
          </div>
        </td>
        <td>
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:1.15rem;color:#2C3E2D;letter-spacing:-0.012em;">Nicolas</p>
          <p style="margin:1px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;font-size:0.82rem;color:#999999;letter-spacing:0.005em;">Zespół Zaproszenia Online</p>
        </td>
      </tr>
    </table>
  </div>

  <!-- FOOTER LINKS -->
  <div style="padding:20px 36px;background:#FAFAF8;border-top:1px solid #EBEBEB;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;font-size:0.78rem;color:#999999;line-height:1.6;">
    <a href="${SITE_URL}/" style="color:#2C3E2D;text-decoration:none;font-weight:500;">zaproszeniaonline.com</a>
    &nbsp;·&nbsp;
    <a href="${reviewUrl}" style="color:#999999;text-decoration:none;">Formularz opinii</a>
    &nbsp;·&nbsp;
    <a href="mailto:${REPLY_TO}" style="color:#999999;text-decoration:none;">Napisz do nas</a>
  </div>
  `;

  return emailShell({
    preheader: `2 minuty, ${fn}? Wasza opinia pomoże kolejnym parom + 50 zł rabatu dla znajomych.`,
    title: `Macie 2 minuty? Krótka opinia o naszej współpracy`,
    bodyHtml,
  });
}

function reviewRequestText(lead: Lead, token: string): string {
  const fn = firstName(lead.name);
  const reviewUrl = `${SITE_URL}/opinia?t=${token}`;
  return `Cześć ${fn},

Mam nadzieję, że strona ślubna spełniła Wasze oczekiwania i że dzień ślubu już za Wami (albo coraz bliżej).

Chciałbym Was prosić o jedną rzecz - krótką opinię o naszej współpracy. Formularz zajmuje 2 minuty. Możecie dać 5 gwiazdek (mam taką nadzieję) albo szczerze, nawet 1 jeśli coś nie zagrało. To dla mnie najcenniejszy feedback.

Link do formularza:
${reviewUrl}

CO WAM TO DA:
Jeśli zgodzicie się na publikację Waszej opinii na zaproszeniaonline.com, dostaniecie kod rabatowy POLEC50 (-50 zł) dla znajomych pary - mogą go użyć przy zamówieniu własnej strony.

Jeśli macie chwilę i wolicie odpisać tekstem zamiast formularzem - po prostu odpowiedzcie na tego maila. Wszystko czytam osobiście.

Dziękuję,
Nicolas
Zespół Zaproszenia Online · zaproszeniaonline.com
`;
}

// ─── Logic: select leady, generuj token, wyślij maile, zapisz w DB ─────────

async function processLead(lead: Lead, force: boolean): Promise<{ sent: boolean; reason?: string; error?: string }> {
  if (!force && lead.review_submitted_at) {
    return { sent: false, reason: "already_submitted" };
  }
  if (!force && lead.review_requested_at) {
    return { sent: false, reason: "already_requested" };
  }
  if (!lead.email) {
    return { sent: false, reason: "no_email" };
  }

  // Generuj nowy token (UUID v4) - albo zachowaj jeśli force i istnieje
  const token = lead.review_request_token || crypto.randomUUID();

  try {
    await sendEmail(
      lead.email,
      `Macie 2 minuty? Krótka opinia o naszej współpracy`,
      reviewRequestHTML(lead, token),
      reviewRequestText(lead, token),
    );
  } catch (err) {
    return { sent: false, error: `resend: ${(err as Error).message}` };
  }

  const { error: dbErr } = await sb
    .from("leads")
    .update({
      review_request_token: token,
      review_requested_at: new Date().toISOString(),
    })
    .eq("id", lead.id);

  if (dbErr) {
    return { sent: true, error: `db_update: ${dbErr.message}` };
  }

  return { sent: true };
}

// ─── Auth: prosta weryfikacja service_role_key w Authorization header ──────

function verifyAuth(req: Request): boolean {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  return token === SUPABASE_SECRET_KEY || (!!LEGACY_SERVICE_ROLE && token === LEGACY_SERVICE_ROLE);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!verifyAuth(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized - service_role required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { lead_id?: string; lead_email?: string; batch?: boolean; limit?: number; force?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const force = body.force === true;
  let leads: Lead[] = [];

  if (body.lead_id) {
    const { data, error } = await sb.from("leads").select("*").eq("id", body.lead_id).maybeSingle();
    if (error || !data) return new Response(JSON.stringify({ error: `lead not found: ${error?.message || body.lead_id}` }), { status: 404 });
    leads = [data as Lead];
  } else if (body.lead_email) {
    const { data, error } = await sb
      .from("leads")
      .select("*")
      .eq("email", body.lead_email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return new Response(JSON.stringify({ error: `lead not found by email: ${error?.message || body.lead_email}` }), { status: 404 });
    leads = [data as Lead];
  } else if (body.batch) {
    const limit = Math.max(1, Math.min(body.limit ?? 50, 200));
    const { data, error } = await sb.from("v_review_candidates").select("*").limit(limit);
    if (error) return new Response(JSON.stringify({ error: `candidates query: ${error.message}` }), { status: 500 });
    if (data && data.length > 0) {
      const ids = data.map((r: { id: string }) => r.id);
      const { data: full, error: fullErr } = await sb.from("leads").select("*").in("id", ids);
      if (fullErr) return new Response(JSON.stringify({ error: `full leads: ${fullErr.message}` }), { status: 500 });
      leads = (full || []) as Lead[];
    }
  } else {
    return new Response(JSON.stringify({ error: "Must provide lead_id, lead_email or batch:true" }), { status: 400 });
  }

  const results = await Promise.all(leads.map(l => processLead(l, force)));
  const sent = results.filter(r => r.sent && !r.error).length;
  const skipped = results.filter(r => !r.sent && r.reason).length;
  const errors = results.filter(r => r.error).map((r, i) => ({ lead_id: leads[i].id, lead_email: leads[i].email, error: r.error }));

  return new Response(
    JSON.stringify({
      ok: errors.length === 0,
      processed: leads.length,
      sent,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
      details: leads.map((l, i) => ({
        lead_id: l.id,
        email: l.email,
        ...results[i],
      })),
    }),
    {
      status: errors.length > 0 ? 207 : 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    },
  );
});
