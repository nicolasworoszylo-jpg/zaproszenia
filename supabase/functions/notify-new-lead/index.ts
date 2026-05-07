// Edge Function: notify-new-lead
// Wywoływana przez Supabase Database Webhook na INSERT do tabeli `leads`
// Wysyła:
//   1. Mail do operatora (Nicolas + Dominika) → "Nowe zamówienie"
//   2. Mail auto-confirmation do klienta → "Dostałem Wasz brief, lecę z robotą"
//
// Wymaga secretu: RESEND_API_KEY (https://resend.com/api-keys)
//
// Deploy:  supabase functions deploy notify-new-lead --no-verify-jwt
// Secret:  supabase secrets set RESEND_API_KEY=re_xxx
//
// Database Webhook setup w Supabase Dashboard:
//   Database → Webhooks → Create webhook
//   Name: notify-new-lead
//   Table: leads
//   Events: INSERT
//   Type: Supabase Edge Functions
//   Method: POST
//   Edge Function: notify-new-lead

// @ts-ignore: Deno deps
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
  phone?: string;
  event_type?: string;
  event_date?: string;
  package?: string;
  message?: string;
  source?: string;
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: Lead;
  old_record?: Lead;
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
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend ${res.status}: ${body}`);
  }
  return res.json();
}

function operatorEmailHTML(lead: Lead): string {
  const eventDate = lead.event_date ? new Date(lead.event_date).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" }) : "—";
  const phone = lead.phone || "—";
  return `<!DOCTYPE html><html lang="pl"><head><meta charset="utf-8"><title>Nowe zamówienie</title></head>
<body style="margin:0;padding:32px 16px;background:#FAFAF8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0A0A0A;">
<div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #EBEBEB;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(44,62,45,0.06);">
  <div style="background:linear-gradient(135deg,#2C3E2D,#243325);color:#FAF6EF;padding:28px 32px;">
    <p style="margin:0;font-size:0.78rem;letter-spacing:0.12em;text-transform:uppercase;opacity:0.8;">Nowe zamówienie</p>
    <h1 style="margin:6px 0 0;font-family:Georgia,serif;font-style:italic;font-weight:400;font-size:1.6rem;letter-spacing:-0.015em;">Lead #${lead.id.slice(0,8)}</h1>
  </div>
  <div style="padding:28px 32px;">
    <table style="width:100%;border-collapse:collapse;font-size:0.95rem;line-height:1.55;">
      <tr><td style="padding:8px 0;color:#4A4A4A;width:35%;">Para</td><td style="padding:8px 0;font-weight:500;">${escapeHtml(lead.name)}</td></tr>
      <tr><td style="padding:8px 0;color:#4A4A4A;border-top:1px solid #EBEBEB;">E-mail</td><td style="padding:8px 0;border-top:1px solid #EBEBEB;"><a href="mailto:${escapeHtml(lead.email)}" style="color:#2C3E2D;">${escapeHtml(lead.email)}</a></td></tr>
      <tr><td style="padding:8px 0;color:#4A4A4A;border-top:1px solid #EBEBEB;">Telefon</td><td style="padding:8px 0;border-top:1px solid #EBEBEB;">${escapeHtml(phone)}</td></tr>
      <tr><td style="padding:8px 0;color:#4A4A4A;border-top:1px solid #EBEBEB;">Data wydarzenia</td><td style="padding:8px 0;border-top:1px solid #EBEBEB;font-weight:500;">${escapeHtml(eventDate)}</td></tr>
      <tr><td style="padding:8px 0;color:#4A4A4A;border-top:1px solid #EBEBEB;">Pakiet / paleta</td><td style="padding:8px 0;border-top:1px solid #EBEBEB;">${escapeHtml(lead.package || "—")}</td></tr>
      <tr><td style="padding:8px 0;color:#4A4A4A;border-top:1px solid #EBEBEB;">Źródło</td><td style="padding:8px 0;border-top:1px solid #EBEBEB;">${escapeHtml(lead.source || "landing")}</td></tr>
    </table>
    ${lead.message ? `
    <div style="margin-top:20px;padding:16px 18px;background:#FAFAF8;border-left:3px solid #C9A96E;border-radius:6px;">
      <p style="margin:0 0 6px;font-size:0.78rem;letter-spacing:0.08em;text-transform:uppercase;color:#999999;">Wiadomość od pary</p>
      <p style="margin:0;font-size:0.95rem;line-height:1.55;color:#0A0A0A;white-space:pre-wrap;">${escapeHtml(lead.message)}</p>
    </div>` : ""}
    <a href="https://supabase.com/dashboard/project/kuyniyyieejvambyjnxy/editor" style="display:inline-block;margin-top:24px;padding:12px 24px;background:#0A0A0A;color:#FFFFFF;text-decoration:none;border-radius:100px;font-size:0.9rem;font-weight:500;">Otwórz w Supabase →</a>
  </div>
  <div style="padding:18px 32px;background:#FAFAF8;border-top:1px solid #EBEBEB;font-size:0.78rem;color:#999999;line-height:1.55;">
    Status płatności: <strong style="color:#0A0A0A;">${lead.message?.includes("paid") ? "OPŁACONE" : "Oczekujemy na wpłatę Stripe"}</strong> · Lead utworzony ${new Date(lead.created_at).toLocaleString("pl-PL")}
  </div>
</div>
</body></html>`;
}

function operatorEmailText(lead: Lead): string {
  return `NOWE ZAMÓWIENIE — Lead #${lead.id.slice(0,8)}

Para: ${lead.name}
E-mail: ${lead.email}
Telefon: ${lead.phone || "—"}
Data wydarzenia: ${lead.event_date || "—"}
Pakiet: ${lead.package || "—"}
Źródło: ${lead.source || "landing"}

${lead.message ? `Wiadomość:\n${lead.message}\n\n` : ""}Otwórz w Supabase: https://supabase.com/dashboard/project/kuyniyyieejvambyjnxy/editor

Lead utworzony: ${new Date(lead.created_at).toLocaleString("pl-PL")}`;
}

function customerEmailHTML(lead: Lead): string {
  const firstName = lead.name.split(/[ &]+/)[0] || "Państwo";
  return `<!DOCTYPE html><html lang="pl"><head><meta charset="utf-8"><title>Dziękujemy za zamówienie</title></head>
<body style="margin:0;padding:0;background:#FAFAF8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0A0A0A;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">
  <div style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 12px 32px rgba(44,62,45,0.06);">
    <div style="background:linear-gradient(135deg,#2C3E2D,#243325);color:#FAF6EF;padding:36px 32px 32px;text-align:center;">
      <p style="margin:0;font-size:0.78rem;letter-spacing:0.14em;text-transform:uppercase;opacity:0.7;">Zaproszenia Online</p>
      <h1 style="margin:14px 0 8px;font-family:Georgia,serif;font-style:italic;font-weight:400;font-size:1.85rem;letter-spacing:-0.02em;line-height:1.15;">Cześć ${escapeHtml(firstName)} —<br/>mamy Wasz brief.</h1>
      <p style="margin:0;font-size:1rem;opacity:0.85;line-height:1.55;">Cieszymy się że wybraliście naszą stronę dla Waszego ślubu.</p>
    </div>
    <div style="padding:32px;font-size:0.95rem;line-height:1.65;color:#0A0A0A;">
      <p style="margin:0 0 16px;">Otrzymaliśmy Wasze zamówienie i już zaczynamy przygotowywać projekt strony. Oto co dzieje się dalej:</p>

      <div style="margin:24px 0;padding:0;">
        <div style="display:flex;gap:14px;margin-bottom:16px;">
          <div style="flex-shrink:0;width:32px;height:32px;border-radius:50%;background:#2C3E2D;color:#FAF6EF;display:inline-flex;align-items:center;justify-content:center;font-family:Georgia,serif;font-style:italic;font-size:0.92rem;">1</div>
          <div><strong style="color:#0A0A0A;">W ciągu 24 godzin</strong> wyślę Wam link do podglądu strony z Waszymi imionami, datą i wybraną paletą.</div>
        </div>
        <div style="display:flex;gap:14px;margin-bottom:16px;">
          <div style="flex-shrink:0;width:32px;height:32px;border-radius:50%;background:#2C3E2D;color:#FAF6EF;display:inline-flex;align-items:center;justify-content:center;font-family:Georgia,serif;font-style:italic;font-size:0.92rem;">2</div>
          <div><strong style="color:#0A0A0A;">Trzy rundy poprawek w cenie</strong> — odpisujecie na ten mail z uwagami: kolory, teksty, układ, zdjęcia. Wszystko ustalamy mailowo.</div>
        </div>
        <div style="display:flex;gap:14px;">
          <div style="flex-shrink:0;width:32px;height:32px;border-radius:50%;background:#2C3E2D;color:#FAF6EF;display:inline-flex;align-items:center;justify-content:center;font-family:Georgia,serif;font-style:italic;font-size:0.92rem;">3</div>
          <div><strong style="color:#0A0A0A;">Dostajecie własny URL i kod QR</strong> do druku. Wysyłacie linki gościom — potwierdzenia obecności trafiają od razu na Waszą skrzynkę.</div>
        </div>
      </div>

      <div style="margin-top:28px;padding:18px 20px;background:rgba(201,169,110,0.08);border-left:3px solid #C9A96E;border-radius:6px;">
        <p style="margin:0 0 8px;font-size:0.85rem;letter-spacing:0.06em;text-transform:uppercase;color:#999999;">Co warto przygotować</p>
        <p style="margin:0;font-size:0.95rem;line-height:1.55;color:#0A0A0A;">Jeśli zaznaczyliście "tak" przy zdjęciach pary lub sekcji "Nasza historia" — wyślijcie nam materiały <strong>na adres <a href="mailto:zamowienia@zaproszeniaonline.com" style="color:#2C3E2D;">zamowienia@zaproszeniaonline.com</a></strong>. Dwa-trzy ulubione zdjęcia + kilka zdań Waszej historii w wolnej formie. Reszta poczeka — odezwiemy się sami.</p>
      </div>

      <p style="margin:28px 0 0;color:#4A4A4A;">Macie pytania? Po prostu odpowiedzcie na tego maila — czytamy każdą wiadomość.</p>
      <p style="margin:14px 0 0;">Do usłyszenia,<br/><strong style="font-family:Georgia,serif;font-style:italic;font-weight:400;font-size:1.1rem;color:#2C3E2D;">Nicolas i Dominika</strong></p>
    </div>
    <div style="padding:20px 32px;background:#FAFAF8;border-top:1px solid #EBEBEB;text-align:center;font-size:0.8rem;color:#999999;line-height:1.55;">
      Zaproszenia Online · <a href="https://zaproszeniaonline.com/" style="color:#2C3E2D;text-decoration:none;">zaproszeniaonline.com</a><br/>
      Lead #${lead.id.slice(0,8)} · ${new Date(lead.created_at).toLocaleDateString("pl-PL")}
    </div>
  </div>
</div>
</body></html>`;
}

function customerEmailText(lead: Lead): string {
  const firstName = lead.name.split(/[ &]+/)[0] || "Państwo";
  return `Cześć ${firstName} — mamy Wasz brief.

Otrzymaliśmy Wasze zamówienie i już zaczynamy przygotowywać projekt strony.

Co dalej:
1. W ciągu 24 godzin wyślę Wam link do podglądu strony z Waszymi imionami, datą i wybraną paletą.
2. Trzy rundy poprawek w cenie — odpisujecie na ten mail z uwagami.
3. Dostajecie własny URL i kod QR do druku. Wysyłacie linki gościom — potwierdzenia obecności trafiają na Waszą skrzynkę.

Co warto przygotować:
Jeśli chcieliście zdjęcia pary lub sekcję "Nasza historia" — wyślijcie nam materiały na zamowienia@zaproszeniaonline.com. Dwa-trzy ulubione zdjęcia + kilka zdań Waszej historii.

Macie pytania? Odpowiedzcie na tego maila.

Do usłyszenia,
Nicolas i Dominika
Zaproszenia Online · https://zaproszeniaonline.com/

Lead #${lead.id.slice(0,8)} · ${new Date(lead.created_at).toLocaleDateString("pl-PL")}`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]!));
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (payload.type !== "INSERT" || payload.table !== "leads") {
    return new Response(JSON.stringify({ skipped: true, reason: `${payload.type} on ${payload.table}` }), { status: 200 });
  }

  const lead = payload.record;
  if (!lead?.email) {
    console.error("Lead bez emaila — pomijam");
    return new Response(JSON.stringify({ skipped: true, reason: "no email" }), { status: 200 });
  }

  const errors: string[] = [];

  // 1. Operator alert
  try {
    await sendEmail(
      OPERATOR_EMAILS,
      `🎉 Nowe zamówienie #${lead.id.slice(0,8)} — ${lead.name}`,
      operatorEmailHTML(lead),
      operatorEmailText(lead),
    );
    console.log(`✓ Operator alert wysłany dla ${lead.id}`);
  } catch (err) {
    console.error("Operator email failed:", err);
    errors.push(`operator: ${(err as Error).message}`);
  }

  // 2. Customer auto-confirmation
  try {
    await sendEmail(
      lead.email,
      `Dziękujemy za zamówienie — Zaproszenia Online`,
      customerEmailHTML(lead),
      customerEmailText(lead),
    );
    console.log(`✓ Customer confirmation wysłana do ${lead.email}`);
  } catch (err) {
    console.error("Customer email failed:", err);
    errors.push(`customer: ${(err as Error).message}`);
  }

  return new Response(JSON.stringify({
    received: true,
    lead_id: lead.id,
    errors: errors.length > 0 ? errors : undefined,
  }), { status: errors.length > 0 ? 207 : 200, headers: { "Content-Type": "application/json" } });
});
