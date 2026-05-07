// Edge Function: notify-payment-success
// Wywoływana przez Supabase Database Webhook na UPDATE leads gdy payment_status='paid'
// Wysyła:
//   1. Mail do operatora — "OPŁACONE: Lead #xxx (699 zł)"
//   2. Mail do klienta — "Płatność potwierdzona, lecę z robotą"
//
// Wymaga secretu: RESEND_API_KEY
//
// Database Webhook setup:
//   Database → Webhooks → Create webhook
//   Name: notify-payment-success
//   Table: leads
//   Events: UPDATE
//   Conditions: payment_status = 'paid' (Postgres trigger filter)
//   Type: Supabase Edge Functions
//   Method: POST
//   Edge Function: notify-payment-success

// @ts-ignore
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = "Zaproszenia Online <kontakt@zaproszeniaonline.com>";
const OPERATOR_EMAILS = [
  "nicolasworoszylo@gmail.com",
  "dominikakus333@gmail.com",
];

interface Lead {
  id: string;
  created_at: string;
  name: string;
  email: string;
  payment_status: string;
  payment_amount_pln?: number;
  payment_id?: string;
  event_date?: string;
  package?: string;
}

interface WebhookPayload {
  type: "UPDATE";
  table: string;
  schema: string;
  record: Lead;
  old_record: Lead;
}

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
      reply_to: "kontakt@zaproszeniaonline.com",
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return res.json();
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]!));
}

function operatorPaidHTML(lead: Lead): string {
  const amount = lead.payment_amount_pln ? (lead.payment_amount_pln / 100).toFixed(2) : "—";
  return `<!DOCTYPE html><html lang="pl"><body style="margin:0;padding:32px 16px;background:#FAFAF8;font-family:-apple-system,sans-serif;">
<div style="max-width:520px;margin:0 auto;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(44,62,45,0.08);">
  <div style="background:linear-gradient(135deg,#2C3E2D,#243325);color:#FAF6EF;padding:32px;text-align:center;">
    <p style="margin:0;font-size:0.78rem;letter-spacing:0.14em;text-transform:uppercase;opacity:0.8;">Płatność potwierdzona</p>
    <h1 style="margin:8px 0 0;font-family:Georgia,serif;font-style:italic;font-weight:400;font-size:2rem;">${amount} zł</h1>
    <p style="margin:6px 0 0;font-size:0.95rem;opacity:0.85;">Lead #${lead.id.slice(0,8)} — ${escapeHtml(lead.name)}</p>
  </div>
  <div style="padding:28px 32px;font-size:0.95rem;line-height:1.6;color:#0A0A0A;">
    <p style="margin:0 0 16px;"><strong>Akcja:</strong> Para czeka na link do podglądu w ciągu 24 h. Klient właśnie dostał potwierdzenie wpłaty.</p>
    <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
      <tr><td style="padding:8px 0;color:#4A4A4A;width:40%;">E-mail klienta</td><td style="padding:8px 0;"><a href="mailto:${escapeHtml(lead.email)}" style="color:#2C3E2D;">${escapeHtml(lead.email)}</a></td></tr>
      <tr><td style="padding:8px 0;color:#4A4A4A;border-top:1px solid #EBEBEB;">Data wydarzenia</td><td style="padding:8px 0;border-top:1px solid #EBEBEB;font-weight:500;">${escapeHtml(lead.event_date || "—")}</td></tr>
      <tr><td style="padding:8px 0;color:#4A4A4A;border-top:1px solid #EBEBEB;">Stripe payment_intent</td><td style="padding:8px 0;border-top:1px solid #EBEBEB;font-family:monospace;font-size:0.78rem;">${escapeHtml(lead.payment_id || "—")}</td></tr>
    </table>
    <a href="https://supabase.com/dashboard/project/kuyniyyieejvambyjnxy/editor" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#0A0A0A;color:#FFFFFF;text-decoration:none;border-radius:100px;font-size:0.9rem;font-weight:500;">Otwórz w Supabase →</a>
    <a href="https://dashboard.stripe.com/payments/${escapeHtml(lead.payment_id || "")}" style="display:inline-block;margin:20px 0 0 8px;padding:12px 24px;background:#635BFF;color:#FFFFFF;text-decoration:none;border-radius:100px;font-size:0.9rem;font-weight:500;">Stripe →</a>
  </div>
</div>
</body></html>`;
}

function customerPaidHTML(lead: Lead): string {
  const firstName = lead.name.split(/[ &]+/)[0] || "Państwo";
  const amount = lead.payment_amount_pln ? (lead.payment_amount_pln / 100).toFixed(2) : "699.00";
  return `<!DOCTYPE html><html lang="pl"><body style="margin:0;padding:0;background:#FAFAF8;font-family:-apple-system,sans-serif;color:#0A0A0A;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">
  <div style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 12px 32px rgba(44,62,45,0.06);">
    <div style="background:linear-gradient(135deg,#2C3E2D,#243325);color:#FAF6EF;padding:36px 32px;text-align:center;">
      <div style="display:inline-block;width:64px;height:64px;border-radius:50%;background:rgba(201,169,110,0.2);border:2px solid #C9A96E;margin-bottom:16px;line-height:64px;font-size:1.8rem;color:#C9A96E;">✓</div>
      <p style="margin:0;font-size:0.78rem;letter-spacing:0.14em;text-transform:uppercase;opacity:0.7;">Płatność potwierdzona</p>
      <h1 style="margin:10px 0 6px;font-family:Georgia,serif;font-style:italic;font-weight:400;font-size:1.85rem;letter-spacing:-0.02em;">Dziękujemy ${escapeHtml(firstName)}!</h1>
      <p style="margin:0;font-size:1rem;opacity:0.85;">Wpłata ${amount} zł zarejestrowana.</p>
    </div>
    <div style="padding:32px;font-size:0.95rem;line-height:1.65;">
      <p style="margin:0 0 16px;">Mamy wszystko czego potrzeba żeby zacząć projekt Waszej strony ślubnej.</p>
      <p style="margin:0 0 20px;"><strong>Kolejny krok:</strong> w ciągu 24 godzin wyślę link do podglądu Waszej strony — z imionami, datą, wybraną paletą i wszystkimi informacjami z briefu. Sprawdzicie i odpiszecie z uwagami (3 rundy poprawek w cenie).</p>

      <div style="margin:24px 0;padding:20px;background:rgba(201,169,110,0.08);border-radius:10px;border-left:3px solid #C9A96E;">
        <p style="margin:0 0 10px;font-size:0.8rem;letter-spacing:0.06em;text-transform:uppercase;color:#999999;font-weight:500;">Jeśli wybraliście zdjęcia lub historię</p>
        <p style="margin:0;font-size:0.95rem;line-height:1.55;">Wyślijcie 2-3 ulubione zdjęcia pary i kilka zdań Waszej historii na <strong><a href="mailto:zamowienia@zaproszeniaonline.com" style="color:#2C3E2D;">zamowienia@zaproszeniaonline.com</a></strong>. Im wcześniej, tym lepiej — ale możecie też dorzucić w trakcie poprawek.</p>
      </div>

      <p style="margin:24px 0 0;color:#4A4A4A;">Faktura zostanie wysłana w osobnym mailu w ciągu 24 godzin. W razie pytań — odpiszcie na tego maila.</p>

      <p style="margin:18px 0 0;">Do zobaczenia za ~24h,<br/><strong style="font-family:Georgia,serif;font-style:italic;font-weight:400;font-size:1.1rem;color:#2C3E2D;">Nicolas i Dominika</strong></p>
    </div>
    <div style="padding:20px 32px;background:#FAFAF8;border-top:1px solid #EBEBEB;text-align:center;font-size:0.8rem;color:#999999;line-height:1.55;">
      Zaproszenia Online · <a href="https://zaproszeniaonline.com/" style="color:#2C3E2D;text-decoration:none;">zaproszeniaonline.com</a><br/>
      Numer zamówienia: ${lead.id.slice(0,8)} · Stripe: ${escapeHtml((lead.payment_id || "").slice(0,16))}…
    </div>
  </div>
</div>
</body></html>`;
}

function customerPaidText(lead: Lead): string {
  const firstName = lead.name.split(/[ &]+/)[0] || "Państwo";
  const amount = lead.payment_amount_pln ? (lead.payment_amount_pln / 100).toFixed(2) : "699.00";
  return `Dziękujemy ${firstName}! Płatność ${amount} zł potwierdzona.

Kolejny krok: w ciągu 24 godzin wyślę link do podglądu Waszej strony — z imionami, datą, wybraną paletą i wszystkimi informacjami. Sprawdzicie i odpiszecie z uwagami (3 rundy poprawek w cenie).

Jeśli zaznaczyliście zdjęcia lub historię — wyślijcie 2-3 ulubione zdjęcia i kilka zdań na zamowienia@zaproszeniaonline.com.

Faktura zostanie wysłana w osobnym mailu.

Do zobaczenia za 24h,
Nicolas i Dominika
Zaproszenia Online · https://zaproszeniaonline.com/

Numer zamówienia: ${lead.id.slice(0,8)}`;
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // Tylko UPDATE z transition na 'paid' (idempotent — nie spamujemy)
  if (payload.type !== "UPDATE" || payload.table !== "leads") {
    return new Response(JSON.stringify({ skipped: true, reason: `${payload.type} on ${payload.table}` }), { status: 200 });
  }
  if (payload.record.payment_status !== "paid") {
    return new Response(JSON.stringify({ skipped: true, reason: `payment_status=${payload.record.payment_status}` }), { status: 200 });
  }
  if (payload.old_record?.payment_status === "paid") {
    return new Response(JSON.stringify({ skipped: true, reason: "already paid (no transition)" }), { status: 200 });
  }

  const lead = payload.record;
  const errors: string[] = [];

  // 1. Operator alert: OPŁACONE
  try {
    const amount = lead.payment_amount_pln ? (lead.payment_amount_pln / 100).toFixed(0) : "699";
    await sendEmail(
      OPERATOR_EMAILS,
      `💰 OPŁACONE ${amount} zł — Lead #${lead.id.slice(0,8)} (${lead.name})`,
      operatorPaidHTML(lead),
      `OPŁACONE ${amount} zł\nLead #${lead.id.slice(0,8)}\nPara: ${lead.name}\nE-mail: ${lead.email}\nData: ${lead.event_date || "—"}\nStripe: ${lead.payment_id}\n\nSupabase: https://supabase.com/dashboard/project/kuyniyyieejvambyjnxy/editor`,
    );
    console.log(`✓ Operator paid alert dla ${lead.id}`);
  } catch (err) {
    console.error("Operator paid email failed:", err);
    errors.push(`operator: ${(err as Error).message}`);
  }

  // 2. Customer payment confirmation
  try {
    await sendEmail(
      lead.email,
      `Płatność potwierdzona — startujemy z projektem ✓`,
      customerPaidHTML(lead),
      customerPaidText(lead),
    );
    console.log(`✓ Customer paid confirmation do ${lead.email}`);
  } catch (err) {
    console.error("Customer paid email failed:", err);
    errors.push(`customer: ${(err as Error).message}`);
  }

  return new Response(JSON.stringify({
    received: true,
    lead_id: lead.id,
    errors: errors.length > 0 ? errors : undefined,
  }), { status: errors.length > 0 ? 207 : 200, headers: { "Content-Type": "application/json" } });
});
