// Supabase Edge Function — powiadomienie e-mail przy nowym leadzie z formularza
//
// DEPLOY (gdy będziesz gotowy):
//   1. Załóż konto na https://resend.com (3000 maili/m-c gratis)
//   2. Zweryfikuj domenę zaproszeniaonline.com (DNS records w panelu rejestratora)
//   3. Wygeneruj API key (Settings → API Keys)
//   4. Ustaw secret w Supabase:
//        supabase secrets set RESEND_API_KEY=re_xxxxxxxxxx
//        supabase secrets set NOTIFY_EMAIL_TO=nicolasworoszylo@gmail.com
//   5. Deploy:
//        supabase functions deploy notify-on-new-lead --no-verify-jwt
//   6. Skonfiguruj webhook w Supabase Database → Webhooks:
//        - tabela: leads
//        - event: INSERT
//        - URL: https://kuyniyyieejvambyjnxy.supabase.co/functions/v1/notify-on-new-lead
//        - method: POST
//
// PO DEPLOY: każdy nowy lead → mail do Ciebie w 1-2s.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const NOTIFY_EMAIL_TO = Deno.env.get("NOTIFY_EMAIL_TO") ?? "";
const FROM_EMAIL = "Zaproszenia Online <kontakt@zaproszeniaonline.com>";

interface LeadRow {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  event_type: string | null;
  event_date: string | null;
  message: string | null;
  source: string | null;
  affiliate_code: string | null;
  affiliate_discount_pct: number | null;
}

interface WebhookPayload {
  type: "INSERT";
  table: "leads";
  schema: "public";
  record: LeadRow;
  old_record: null;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!RESEND_API_KEY || !NOTIFY_EMAIL_TO) {
    console.error("RESEND_API_KEY or NOTIFY_EMAIL_TO not configured");
    return new Response(JSON.stringify({ error: "config_missing" }), { status: 500 });
  }

  let payload: WebhookPayload;
  try { payload = await req.json(); } catch { return new Response("Invalid JSON", { status: 400 }); }

  const lead = payload.record;
  if (!lead?.email || !lead?.name) return new Response("Missing lead fields", { status: 400 });

  const subject = `Nowy lead — ${lead.name} (${lead.event_type ?? "wydarzenie"})`;
  const affiliateLine = lead.affiliate_code
    ? `<tr><td style="padding:6px 12px;color:#888;">Kod afiliacji</td><td style="padding:6px 12px;color:#C9A96E;font-weight:600;">${lead.affiliate_code} (${lead.affiliate_discount_pct ?? 0}%)</td></tr>`
    : "";
  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;background:#FAF6EF;padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:white;padding:32px;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.08);">
      <h2 style="font-family:Georgia,serif;font-style:italic;color:#2C3E2D;margin:0 0 8px;">Nowy lead z zaproszeniaonline.com</h2>
      <p style="color:#6B5D4F;margin:0 0 24px;">${new Date(lead.created_at).toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" })}</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 12px;color:#888;">Imię</td><td style="padding:6px 12px;font-weight:600;">${lead.name}</td></tr>
        <tr><td style="padding:6px 12px;color:#888;">E-mail</td><td style="padding:6px 12px;"><a href="mailto:${lead.email}" style="color:#C9A96E;">${lead.email}</a></td></tr>
        ${lead.phone ? `<tr><td style="padding:6px 12px;color:#888;">Telefon</td><td style="padding:6px 12px;"><a href="tel:${lead.phone}" style="color:#C9A96E;">${lead.phone}</a></td></tr>` : ""}
        ${lead.event_type ? `<tr><td style="padding:6px 12px;color:#888;">Wydarzenie</td><td style="padding:6px 12px;">${lead.event_type}</td></tr>` : ""}
        ${lead.event_date ? `<tr><td style="padding:6px 12px;color:#888;">Data</td><td style="padding:6px 12px;">${lead.event_date}</td></tr>` : ""}
        ${affiliateLine}
        ${lead.message ? `<tr><td style="padding:6px 12px;color:#888;vertical-align:top;">Wiadomość</td><td style="padding:6px 12px;white-space:pre-wrap;">${lead.message}</td></tr>` : ""}
        <tr><td style="padding:6px 12px;color:#888;">Źródło</td><td style="padding:6px 12px;">${lead.source ?? "—"}</td></tr>
      </table>
      <p style="margin-top:24px;font-size:12px;color:#888;">
        Pełny rekord: <a href="https://supabase.com/dashboard/project/kuyniyyieejvambyjnxy/editor" style="color:#C9A96E;">Otwórz w Supabase Studio</a>
      </p>
    </div>
  </body></html>`;

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [NOTIFY_EMAIL_TO],
      reply_to: lead.email,
      subject,
      html,
    }),
  });

  if (!resendRes.ok) {
    const errBody = await resendRes.text();
    console.error("Resend API error:", resendRes.status, errBody);
    return new Response(JSON.stringify({ error: "send_failed", detail: errBody }), { status: 502 });
  }

  const result = await resendRes.json();
  return new Response(JSON.stringify({ ok: true, id: result.id }), {
    headers: { "Content-Type": "application/json" },
  });
});
