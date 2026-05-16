// Edge Function: notify-new-lead
// Wywoływana przez Supabase Database Webhook na INSERT do tabeli `leads`
// Wysyła:
//   1. Mail do operatora (Nicolas + Dominika) → "Nowe zamówienie"
//   2. Mail auto-confirmation do klienta → "Dziękujemy za zamówienie"
//
// Wymaga secretu: RESEND_API_KEY (https://resend.com/api-keys)
//
// HTML templates v2 (2026-05-09): brand-aligned z landing zaproszeniaonline.com
// - preheader, monogramowy logo "Z", forest gradient, gold accents, dimensional shadows,
//   responsive 600px max-width, polskie ligatures w body, footer z legal info

// @ts-ignore: Deno deps
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = "Zaproszenia Online <kontakt@zaproszeniaonline.com>";
const REPLY_TO = "kontakt@zaproszeniaonline.com";
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
      reply_to: REPLY_TO,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return res.json();
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]!));
}

// ─── Brand-aligned email shell (preheader + monogramowy logo Z + dimensional) ───
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
    .h1{font-size:1.65rem!important;}
    .num{width:30px!important;height:30px!important;font-size:0.88rem!important;}
    .step-row{padding:0!important;}
  }
  a{text-decoration:none;}
  body{margin:0!important;padding:0!important;}
</style>
</head>
<body style="margin:0;padding:0;background:#FAFAF8;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">
<!-- Preheader (preview text w Gmail Inbox, ukryty po otwarciu) -->
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
        <span style="color:#BBBBBB;">Sprzedaż w ramach działalności nieewidencjonowanej (art. 5 ust. 1 PrzedsU)</span>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

// ─── Reusable: monogramowy logo Z (forest circle + cream "Z" italic) ───
const BRAND_MARK_SVG = `<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 18px;">
  <tr><td style="background:#FAF6EF;border:1.5px solid #FAF6EF;border-radius:50%;width:54px;height:54px;text-align:center;vertical-align:middle;line-height:54px;">
    <span style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:1.85rem;color:#2C3E2D;letter-spacing:-0.02em;line-height:54px;">Z</span>
  </td></tr>
</table>`;

// ─── Eyebrow z gold dot prefix (jak section-eyebrow na stronie) ───
function eyebrow(text: string, color = "#FAF6EF", dotColor = "#C9A96E"): string {
  return `<p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;font-size:0.74rem;letter-spacing:0.16em;text-transform:uppercase;color:${color};opacity:0.85;font-weight:500;">
    <span style="display:inline-block;width:5px;height:5px;background:${dotColor};border-radius:50%;margin-right:8px;vertical-align:2px;"></span>${escapeHtml(text)}
  </p>`;
}

function operatorEmailHTML(lead: Lead): string {
  const eventDate = lead.event_date ? new Date(lead.event_date).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" }) : "-";
  const phone = lead.phone || "-";
  const createdLocal = new Date(lead.created_at).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const bodyHtml = `
  <!-- HERO: forest gradient + monogramowy Z + krótki info -->
  <div class="hero" style="background:linear-gradient(135deg,#2C3E2D 0%,#243325 100%);color:#FAF6EF;padding:36px 36px 32px;text-align:center;">
    ${BRAND_MARK_SVG.replace('background:#FAF6EF', 'background:rgba(250,246,239,0.12)').replace('border:1.5px solid #FAF6EF', 'border:1.5px solid rgba(201,169,110,0.4)').replace('color:#2C3E2D', 'color:#FAF6EF')}
    ${eyebrow("Nowe zamówienie")}
    <h1 class="h1" style="margin:10px 0 6px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:400;font-size:1.85rem;letter-spacing:-0.018em;line-height:1.18;color:#FAF6EF;">
      ${escapeHtml(lead.name)}
    </h1>
    <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;font-size:0.92rem;color:rgba(250,246,239,0.78);letter-spacing:-0.005em;">
      Lead #${lead.id.slice(0,8)} · ${escapeHtml(createdLocal)}
    </p>
  </div>

  <!-- BODY: tabela danych z subtle dividers -->
  <div class="body" style="padding:32px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;color:#0A0A0A;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;font-size:0.95rem;line-height:1.55;">
      <tr><td style="padding:10px 0;color:#999999;width:38%;font-size:0.82rem;letter-spacing:0.04em;text-transform:uppercase;font-weight:500;">E-mail</td>
          <td style="padding:10px 0;"><a href="mailto:${escapeHtml(lead.email)}" style="color:#2C3E2D;font-weight:500;">${escapeHtml(lead.email)}</a></td></tr>
      <tr><td style="padding:10px 0;color:#999999;border-top:1px solid #EBEBEB;font-size:0.82rem;letter-spacing:0.04em;text-transform:uppercase;font-weight:500;">Telefon</td>
          <td style="padding:10px 0;border-top:1px solid #EBEBEB;color:#0A0A0A;">${escapeHtml(phone)}</td></tr>
      <tr><td style="padding:10px 0;color:#999999;border-top:1px solid #EBEBEB;font-size:0.82rem;letter-spacing:0.04em;text-transform:uppercase;font-weight:500;">Data wydarzenia</td>
          <td style="padding:10px 0;border-top:1px solid #EBEBEB;color:#0A0A0A;font-weight:500;">${escapeHtml(eventDate)}</td></tr>
      <tr><td style="padding:10px 0;color:#999999;border-top:1px solid #EBEBEB;font-size:0.82rem;letter-spacing:0.04em;text-transform:uppercase;font-weight:500;">Pakiet / paleta</td>
          <td style="padding:10px 0;border-top:1px solid #EBEBEB;color:#0A0A0A;">${escapeHtml(lead.package || "-")}</td></tr>
      <tr><td style="padding:10px 0;color:#999999;border-top:1px solid #EBEBEB;font-size:0.82rem;letter-spacing:0.04em;text-transform:uppercase;font-weight:500;">Źródło</td>
          <td style="padding:10px 0;border-top:1px solid #EBEBEB;color:#0A0A0A;">${escapeHtml(lead.source || "landing")}</td></tr>
    </table>

    ${lead.message ? `
    <div style="margin-top:24px;padding:18px 20px;background:rgba(201,169,110,0.07);border-left:3px solid #C9A96E;border-radius:6px;">
      <p style="margin:0 0 8px;font-size:0.74rem;letter-spacing:0.12em;text-transform:uppercase;color:#999999;font-weight:500;">Wiadomość od pary</p>
      <p style="margin:0;font-size:0.96rem;line-height:1.6;color:#0A0A0A;white-space:pre-wrap;">${escapeHtml(lead.message)}</p>
    </div>` : ""}

    <!-- CTA: dwa przyciski (Supabase + szybka odpowiedź) -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;">
      <tr>
        <td style="padding-right:8px;">
          <a href="https://supabase.com/dashboard/project/kuyniyyieejvambyjnxy/editor" style="display:inline-block;padding:13px 24px;background:#0A0A0A;color:#FFFFFF;border-radius:100px;font-size:0.92rem;font-weight:500;letter-spacing:-0.005em;">Otwórz w Supabase →</a>
        </td>
        <td>
          <a href="mailto:${escapeHtml(lead.email)}?subject=${encodeURIComponent('Re: zaproszeniaonline.com - Wasza strona ślubna')}" style="display:inline-block;padding:13px 24px;background:#FFFFFF;color:#0A0A0A;border:1px solid #EBEBEB;border-radius:100px;font-size:0.92rem;font-weight:500;letter-spacing:-0.005em;">Odpisz parze →</a>
        </td>
      </tr>
    </table>
  </div>

  <!-- FOOTER STATUS -->
  <div style="padding:18px 36px;background:#FAFAF8;border-top:1px solid #EBEBEB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;font-size:0.78rem;color:#999999;line-height:1.55;">
    Status: <strong style="color:#0A0A0A;">Oczekujemy na wpłatę Stripe (699 zł)</strong>
  </div>
  `;

  return emailShell({
    preheader: `Nowe zamówienie od ${lead.name} · ${eventDate} · ${lead.package || 'pakiet kompletny'}`,
    title: `Nowe zamówienie #${lead.id.slice(0,8)}`,
    bodyHtml,
  });
}

function operatorEmailText(lead: Lead): string {
  return `NOWE ZAMÓWIENIE - Lead #${lead.id.slice(0,8)}

Para: ${lead.name}
E-mail: ${lead.email}
Telefon: ${lead.phone || "-"}
Data wydarzenia: ${lead.event_date || "-"}
Pakiet: ${lead.package || "-"}
Źródło: ${lead.source || "landing"}

${lead.message ? `Wiadomość od pary:\n${lead.message}\n\n` : ""}Otwórz w Supabase: https://supabase.com/dashboard/project/kuyniyyieejvambyjnxy/editor
Odpisz parze: ${lead.email}

Lead utworzony: ${new Date(lead.created_at).toLocaleString("pl-PL")}
Status: Oczekujemy na wpłatę Stripe (699 zł)

-
Zaproszenia Online · zaproszeniaonline.com`;
}

function customerEmailHTML(lead: Lead): string {
  const firstName = lead.name.split(/[ &]+/)[0] || "Państwo";
  const package_ = lead.package ? ` (paleta: ${escapeHtml(lead.package)})` : "";

  const bodyHtml = `
  <!-- HERO: forest gradient + monogramowy Z + powitanie -->
  <div class="hero" style="background:linear-gradient(135deg,#2C3E2D 0%,#243325 100%);color:#FAF6EF;padding:48px 36px 40px;text-align:center;">
    ${BRAND_MARK_SVG}
    ${eyebrow("Zaproszenia Online")}
    <h1 class="h1" style="margin:14px 0 10px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:400;font-size:2.1rem;letter-spacing:-0.022em;line-height:1.12;color:#FAF6EF;">
      Cześć ${escapeHtml(firstName)} -<br/>mamy Wasz brief.
    </h1>
    <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;font-size:1.02rem;color:rgba(250,246,239,0.85);line-height:1.55;letter-spacing:-0.005em;max-width:440px;margin-left:auto;margin-right:auto;">
      Cieszymy się że wybraliście naszą stronę dla Waszego ślubu${package_}.
    </p>
  </div>

  <!-- BODY: kroki + callout + signature -->
  <div class="body" style="padding:36px 36px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;font-size:0.98rem;line-height:1.65;color:#0A0A0A;">

    <p style="margin:0 0 20px;color:#0A0A0A;font-size:1rem;">
      Otrzymaliśmy Wasze zamówienie i już zaczynamy przygotowywać projekt. Oto co dzieje się dalej:
    </p>

    <!-- 3 KROKI (jak how-it-works na stronie) -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;">
      <tr><td class="step-row" style="padding:0 0 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td valign="top" style="width:46px;padding-right:14px;">
              <div class="num" style="width:36px;height:36px;border-radius:50%;background:#2C3E2D;color:#FAF6EF;text-align:center;line-height:36px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:0.98rem;">I</div>
            </td>
            <td valign="top" style="padding-top:5px;">
              <strong style="color:#0A0A0A;font-weight:600;font-size:0.98rem;">W ciągu 48 godzin</strong> od dostarczenia kompletu danych dostaniecie link do podglądu Waszej strony - z imionami, datą, wybraną paletą i wszystkimi sekcjami.
            </td>
          </tr>
        </table>
      </td></tr>

      <tr><td class="step-row" style="padding:0 0 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td valign="top" style="width:46px;padding-right:14px;">
              <div class="num" style="width:36px;height:36px;border-radius:50%;background:#2C3E2D;color:#FAF6EF;text-align:center;line-height:36px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:0.98rem;">II</div>
            </td>
            <td valign="top" style="padding-top:5px;">
              <strong style="color:#0A0A0A;font-weight:600;font-size:0.98rem;">Dwie rundy poprawek w cenie</strong> - odpisujecie na tego maila z uwagami: kolory, teksty, układ, zdjęcia. Wszystko ustalamy mailowo, bez calls.
            </td>
          </tr>
        </table>
      </td></tr>

      <tr><td class="step-row" style="padding:0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td valign="top" style="width:46px;padding-right:14px;">
              <div class="num" style="width:36px;height:36px;border-radius:50%;background:#2C3E2D;color:#FAF6EF;text-align:center;line-height:36px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:0.98rem;">III</div>
            </td>
            <td valign="top" style="padding-top:5px;">
              <strong style="color:#0A0A0A;font-weight:600;font-size:0.98rem;">Dostajecie własny URL i kod QR</strong> do druku. Wysyłacie linki gościom - potwierdzenia obecności trafiają od razu na Waszej skrzynce.
            </td>
          </tr>
        </table>
      </td></tr>
    </table>

    <!-- GOLD CALLOUT -->
    <div style="margin:28px 0 24px;padding:20px 22px;background:rgba(201,169,110,0.08);border-left:3px solid #C9A96E;border-radius:8px;">
      <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;font-size:0.74rem;letter-spacing:0.12em;text-transform:uppercase;color:#999999;font-weight:600;">
        <span style="display:inline-block;width:5px;height:5px;background:#C9A96E;border-radius:50%;margin-right:8px;vertical-align:2px;"></span>Co warto przygotować
      </p>
      <p style="margin:0;font-size:0.96rem;line-height:1.6;color:#0A0A0A;">
        Jeśli zaznaczyliście „tak" przy zdjęciach pary lub sekcji „Nasza historia" - wyślijcie nam materiały na adres
        <strong><a href="mailto:kontakt@zaproszeniaonline.com" style="color:#2C3E2D;text-decoration:underline;text-underline-offset:2px;">kontakt@zaproszeniaonline.com</a></strong>.
        Zdjęcia w pełnej rozdzielczości (do 7 ujęć w cenie) + kilka zdań Waszej historii w wolnej formie. Reszta poczeka - odezwiemy się sami.
      </p>
    </div>

    <!-- DEMO LINK CTA -->
    <div style="text-align:center;margin:28px 0 8px;">
      <a href="https://zaproszeniaonline.com/demo" style="display:inline-block;padding:14px 28px;background:#2C3E2D;color:#FAF6EF;border-radius:100px;font-size:0.95rem;font-weight:500;letter-spacing:-0.005em;">Zobacz przykład gotowej strony →</a>
    </div>

    <p style="margin:28px 0 0;color:#4A4A4A;font-size:0.95rem;">
      Macie pytania? Po prostu odpowiedzcie na tego maila - czytamy każdą wiadomość.
    </p>

    <!-- SIGNATURE -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:24px;">
      <tr>
        <td style="padding-right:14px;">
          <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#2C3E2D,#1E2B1F);color:#FAF6EF;text-align:center;line-height:44px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:0.98rem;">
            N
          </div>
        </td>
        <td>
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:1.15rem;color:#2C3E2D;letter-spacing:-0.012em;">Zespół Zaproszenia Online</p>
          <p style="margin:1px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;font-size:0.82rem;color:#999999;letter-spacing:0.005em;">Zaproszenia Online</p>
        </td>
      </tr>
    </table>
  </div>

  <!-- FOOTER LINKS -->
  <div style="padding:20px 36px;background:#FAFAF8;border-top:1px solid #EBEBEB;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;font-size:0.78rem;color:#999999;line-height:1.6;">
    <a href="https://zaproszeniaonline.com/" style="color:#2C3E2D;text-decoration:none;font-weight:500;">zaproszeniaonline.com</a>
    &nbsp;·&nbsp;
    <a href="https://zaproszeniaonline.com/demo" style="color:#999999;text-decoration:none;">Demo</a>
    &nbsp;·&nbsp;
    <a href="https://zaproszeniaonline.com/blog" style="color:#999999;text-decoration:none;">Blog</a>
    &nbsp;·&nbsp;
    <a href="https://zaproszeniaonline.com/privacy" style="color:#999999;text-decoration:none;">Prywatność</a>
    <br/><br/>
    <span style="color:#BBBBBB;">Numer zamówienia: ${lead.id.slice(0,8)} · ${new Date(lead.created_at).toLocaleDateString("pl-PL")}</span>
  </div>
  `;

  return emailShell({
    preheader: `Cześć ${firstName} - mamy Wasz brief. Link do podglądu w 48 h od dostarczenia kompletu danych.`,
    title: `Dziękujemy za zamówienie - Zaproszenia Online`,
    bodyHtml,
  });
}

function customerEmailText(lead: Lead): string {
  const firstName = lead.name.split(/[ &]+/)[0] || "Państwo";
  return `Cześć ${firstName} - mamy Wasz brief.

Otrzymaliśmy Wasze zamówienie i już zaczynamy przygotowywać projekt strony.

Co dalej:
I.   W ciągu 48 godzin od dostarczenia kompletu danych dostaniecie link do podglądu strony - z imionami, datą, wybraną paletą.
II.  Dwie rundy poprawek w cenie - odpisujecie na tego maila z uwagami.
III. Dostajecie własny URL i kod QR do druku. Wysyłacie linki gościom - potwierdzenia obecności trafiają na Waszej skrzynce.

Co warto przygotować:
Jeśli wybraliście zdjęcia pary lub sekcję „Nasza historia" - wyślijcie materiały na kontakt@zaproszeniaonline.com (zdjęcia w pełnej rozdzielczości + kilka zdań Waszej historii).

Zobacz przykład gotowej strony: https://zaproszeniaonline.com/demo

Macie pytania? Odpowiedzcie na tego maila - czytamy każdą wiadomość.

Do usłyszenia,
Zespół Zaproszenia Online
Zaproszenia Online · https://zaproszeniaonline.com/

Numer zamówienia: ${lead.id.slice(0,8)} · ${new Date(lead.created_at).toLocaleDateString("pl-PL")}`;
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
    console.error("Lead bez emaila - pomijam");
    return new Response(JSON.stringify({ skipped: true, reason: "no email" }), { status: 200 });
  }

  const errors: string[] = [];

  // 1. Operator alert
  try {
    await sendEmail(
      OPERATOR_EMAILS,
      `Nowe zamówienie · ${lead.name} · ${lead.event_date || 'brak daty'}`,
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
      `Dziękujemy za zamówienie - mamy Wasz brief`,
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
