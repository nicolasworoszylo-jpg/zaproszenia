// Edge Function: notify-payment-success
// Wywoływana przez Supabase Database Webhook na UPDATE leads gdy payment_status='paid'
// Wysyła:
//   1. Mail do operatora - "OPŁACONE: Lead #xxx (699 zł)"
//   2. Mail do klienta - "Płatność potwierdzona - startujemy z projektem"
//
// Wymaga secretu: RESEND_API_KEY
//
// HTML templates v2 (2026-05-09): brand-aligned z landing zaproszeniaonline.com

// @ts-ignore
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
      reply_to: REPLY_TO,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return res.json();
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]!));
}

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
    .amount{font-size:2.4rem!important;}
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
        Cyfrowe zaproszenia ślubne premium · 699 zł, gotowe w 24 h<br/>
        <span style="color:#BBBBBB;">Sprzedaż w ramach działalności nieewidencjonowanej (art. 5 ust. 1 PrzedsU)</span>
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

// Animowane checkmark badge - gold ring + cream tick (jak demo na stronie)
const PAID_BADGE = `<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 18px;">
  <tr><td style="background:rgba(201,169,110,0.18);border:2px solid #C9A96E;border-radius:50%;width:64px;height:64px;text-align:center;vertical-align:middle;line-height:60px;">
    <span style="font-family:Georgia,'Times New Roman',serif;font-size:2rem;color:#C9A96E;line-height:60px;">✓</span>
  </td></tr>
</table>`;

function operatorPaidHTML(lead: Lead): string {
  const amount = lead.payment_amount_pln ? (lead.payment_amount_pln / 100).toFixed(0) : "699";
  const eventDate = lead.event_date ? new Date(lead.event_date).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" }) : "-";
  const stripeUrl = lead.payment_id ? `https://dashboard.stripe.com/payments/${escapeHtml(lead.payment_id)}` : 'https://dashboard.stripe.com/payments';

  const bodyHtml = `
  <!-- HERO: forest gradient + GOLD AMOUNT (focal point) -->
  <div class="hero" style="background:linear-gradient(135deg,#2C3E2D 0%,#243325 100%);color:#FAF6EF;padding:40px 36px 36px;text-align:center;">
    ${PAID_BADGE}
    ${eyebrow("Płatność potwierdzona")}
    <h1 class="amount h1" style="margin:12px 0 4px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:400;font-size:2.8rem;letter-spacing:-0.025em;line-height:1;color:#C9A96E;">
      ${amount} zł
    </h1>
    <p style="margin:8px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;font-size:1.02rem;color:rgba(250,246,239,0.92);letter-spacing:-0.005em;">
      ${escapeHtml(lead.name)}
    </p>
    <p style="margin:4px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;font-size:0.86rem;color:rgba(250,246,239,0.6);">
      Lead #${lead.id.slice(0,8)}
    </p>
  </div>

  <!-- BODY: action call + dane -->
  <div class="body" style="padding:32px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;color:#0A0A0A;">
    <div style="margin:0 0 22px;padding:14px 18px;background:rgba(44,62,45,0.05);border-left:3px solid #2C3E2D;border-radius:6px;">
      <p style="margin:0;font-size:0.95rem;line-height:1.55;color:#0A0A0A;">
        <strong>Akcja:</strong> Klient właśnie dostał potwierdzenie wpłaty + brief co dalej.
        Wy macie 24 h na link do podglądu.
      </p>
    </div>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;font-size:0.95rem;line-height:1.55;">
      <tr><td style="padding:9px 0;color:#999999;width:40%;font-size:0.78rem;letter-spacing:0.04em;text-transform:uppercase;font-weight:500;">E-mail klienta</td>
          <td style="padding:9px 0;"><a href="mailto:${escapeHtml(lead.email)}" style="color:#2C3E2D;font-weight:500;">${escapeHtml(lead.email)}</a></td></tr>
      <tr><td style="padding:9px 0;color:#999999;border-top:1px solid #EBEBEB;font-size:0.78rem;letter-spacing:0.04em;text-transform:uppercase;font-weight:500;">Data wydarzenia</td>
          <td style="padding:9px 0;border-top:1px solid #EBEBEB;font-weight:500;">${escapeHtml(eventDate)}</td></tr>
      <tr><td style="padding:9px 0;color:#999999;border-top:1px solid #EBEBEB;font-size:0.78rem;letter-spacing:0.04em;text-transform:uppercase;font-weight:500;">Pakiet / paleta</td>
          <td style="padding:9px 0;border-top:1px solid #EBEBEB;">${escapeHtml(lead.package || "-")}</td></tr>
      <tr><td style="padding:9px 0;color:#999999;border-top:1px solid #EBEBEB;font-size:0.78rem;letter-spacing:0.04em;text-transform:uppercase;font-weight:500;">Stripe payment_intent</td>
          <td style="padding:9px 0;border-top:1px solid #EBEBEB;font-family:'SF Mono',Menlo,Monaco,monospace;font-size:0.78rem;color:#4A4A4A;">${escapeHtml(lead.payment_id || "-")}</td></tr>
    </table>

    <!-- CTAs: 3 przyciski -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;">
      <tr>
        <td style="padding-right:8px;">
          <a href="https://supabase.com/dashboard/project/kuyniyyieejvambyjnxy/editor" style="display:inline-block;padding:13px 22px;background:#0A0A0A;color:#FFFFFF;border-radius:100px;font-size:0.92rem;font-weight:500;letter-spacing:-0.005em;">Supabase →</a>
        </td>
        <td style="padding-right:8px;">
          <a href="${stripeUrl}" style="display:inline-block;padding:13px 22px;background:#635BFF;color:#FFFFFF;border-radius:100px;font-size:0.92rem;font-weight:500;letter-spacing:-0.005em;">Stripe →</a>
        </td>
        <td>
          <a href="mailto:${escapeHtml(lead.email)}?subject=${encodeURIComponent('Re: Wasza strona ślubna - link do podglądu')}" style="display:inline-block;padding:13px 22px;background:#FFFFFF;color:#0A0A0A;border:1px solid #EBEBEB;border-radius:100px;font-size:0.92rem;font-weight:500;letter-spacing:-0.005em;">Odpisz →</a>
        </td>
      </tr>
    </table>
  </div>
  `;

  return emailShell({
    preheader: `OPŁACONE ${amount} zł · ${lead.name} · Klient czeka 24 h na link do podglądu`,
    title: `OPŁACONE ${amount} zł - Lead #${lead.id.slice(0,8)}`,
    bodyHtml,
  });
}

function operatorPaidText(lead: Lead): string {
  const amount = lead.payment_amount_pln ? (lead.payment_amount_pln / 100).toFixed(0) : "699";
  return `OPŁACONE ${amount} zł - Lead #${lead.id.slice(0,8)}

Para: ${lead.name}
E-mail: ${lead.email}
Data wydarzenia: ${lead.event_date || "-"}
Pakiet: ${lead.package || "-"}
Stripe payment_intent: ${lead.payment_id || "-"}

AKCJA: Klient dostał potwierdzenie wpłaty + brief co dalej. Wy macie 24h na link do podglądu.

Supabase: https://supabase.com/dashboard/project/kuyniyyieejvambyjnxy/editor
Stripe:   https://dashboard.stripe.com/payments/${lead.payment_id || ""}
Odpisz:   ${lead.email}

-
Zaproszenia Online · zaproszeniaonline.com`;
}

function customerPaidHTML(lead: Lead): string {
  const firstName = lead.name.split(/[ &]+/)[0] || "Państwo";
  const amount = lead.payment_amount_pln ? (lead.payment_amount_pln / 100).toFixed(2) : "699.00";

  const bodyHtml = `
  <!-- HERO: forest gradient + animated check + amount -->
  <div class="hero" style="background:linear-gradient(135deg,#2C3E2D 0%,#243325 100%);color:#FAF6EF;padding:48px 36px 40px;text-align:center;">
    ${PAID_BADGE}
    ${eyebrow("Płatność potwierdzona")}
    <h1 class="h1" style="margin:14px 0 8px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:400;font-size:2.1rem;letter-spacing:-0.022em;line-height:1.12;color:#FAF6EF;">
      Dziękujemy ${escapeHtml(firstName)}!
    </h1>
    <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;font-size:1.02rem;color:rgba(250,246,239,0.85);line-height:1.55;letter-spacing:-0.005em;">
      Wpłata ${amount} zł zarejestrowana.
    </p>
  </div>

  <!-- BODY: confirmation + next step + materials reminder -->
  <div class="body" style="padding:36px 36px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;font-size:0.98rem;line-height:1.65;color:#0A0A0A;">

    <p style="margin:0 0 18px;font-size:1rem;">
      Mamy wszystko czego potrzeba żeby zacząć projekt Waszej strony ślubnej.
    </p>

    <!-- KOLEJNY KROK (highlighted) -->
    <div style="margin:24px 0;padding:22px 24px;background:rgba(44,62,45,0.04);border-radius:12px;border-left:3px solid #2C3E2D;">
      <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;font-size:0.74rem;letter-spacing:0.12em;text-transform:uppercase;color:#2C3E2D;font-weight:600;">
        <span style="display:inline-block;width:5px;height:5px;background:#C9A96E;border-radius:50%;margin-right:8px;vertical-align:2px;"></span>Kolejny krok
      </p>
      <p style="margin:0;font-size:1rem;line-height:1.6;color:#0A0A0A;">
        W ciągu <strong>24 godzin</strong> wyślę link do podglądu Waszej strony - z imionami, datą, wybraną paletą i wszystkimi sekcjami z briefu. Sprawdzicie i odpiszecie z uwagami (3 rundy poprawek w cenie).
      </p>
    </div>

    <!-- GOLD CALLOUT: zdjęcia + historia -->
    <div style="margin:24px 0;padding:20px 22px;background:rgba(201,169,110,0.08);border-left:3px solid #C9A96E;border-radius:8px;">
      <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;font-size:0.74rem;letter-spacing:0.12em;text-transform:uppercase;color:#999999;font-weight:600;">
        <span style="display:inline-block;width:5px;height:5px;background:#C9A96E;border-radius:50%;margin-right:8px;vertical-align:2px;"></span>Jeśli wybraliście zdjęcia lub historię
      </p>
      <p style="margin:0;font-size:0.96rem;line-height:1.6;color:#0A0A0A;">
        Wyślijcie 2-3 ulubione zdjęcia pary i kilka zdań Waszej historii na
        <strong><a href="mailto:zamowienia@zaproszeniaonline.com" style="color:#2C3E2D;text-decoration:underline;text-underline-offset:2px;">zamowienia@zaproszeniaonline.com</a></strong>.
        Im wcześniej, tym lepiej - ale możecie też dorzucić podczas poprawek.
      </p>
    </div>

    <!-- INFO RACHUNEK -->
    <p style="margin:24px 0 0;color:#4A4A4A;font-size:0.93rem;line-height:1.6;">
      Rachunek (działalność nieewidencjonowana - bez VAT) zostanie wysłany w osobnym mailu w ciągu 24 godzin. W razie pytań - odpiszcie na tego maila.
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
    <a href="https://zaproszeniaonline.com/terms" style="color:#999999;text-decoration:none;">Regulamin</a>
    &nbsp;·&nbsp;
    <a href="https://zaproszeniaonline.com/returns" style="color:#999999;text-decoration:none;">Polityka zwrotów</a>
    <br/><br/>
    <span style="color:#BBBBBB;">Numer zamówienia: ${lead.id.slice(0,8)} · Stripe: ${escapeHtml((lead.payment_id || "").slice(0,16))}…</span>
    <br/><br/>
    <span style="color:#BBBBBB;font-size:0.72rem;line-height:1.5;display:block;">Potwierdzamy rozpoczęcie świadczenia usługi. Zasady i gwarancje: <a href="https://zaproszeniaonline.com/terms#paragraf-10" style="color:#999999;text-decoration:underline;">§ 10 Regulaminu</a>.</span>
  </div>
  `;

  return emailShell({
    preheader: `Dziękujemy ${firstName}! Wpłata ${amount} zł potwierdzona. W 24h dostaniecie link do podglądu.`,
    title: `Płatność potwierdzona - Zaproszenia Online`,
    bodyHtml,
  });
}

function customerPaidText(lead: Lead): string {
  const firstName = lead.name.split(/[ &]+/)[0] || "Państwo";
  const amount = lead.payment_amount_pln ? (lead.payment_amount_pln / 100).toFixed(2) : "699.00";
  return `Dziękujemy ${firstName}!

Wpłata ${amount} zł potwierdzona. Mamy wszystko czego potrzeba żeby zacząć projekt Waszej strony ślubnej.

KOLEJNY KROK:
W ciągu 24 godzin wyślę link do podglądu Waszej strony - z imionami, datą, wybraną paletą i wszystkimi sekcjami z briefu. Sprawdzicie i odpiszecie z uwagami (3 rundy poprawek w cenie).

JEŚLI WYBRALIŚCIE ZDJĘCIA LUB HISTORIĘ:
Wyślijcie 2-3 ulubione zdjęcia pary i kilka zdań Waszej historii na zamowienia@zaproszeniaonline.com. Im wcześniej, tym lepiej - ale możecie też dorzucić podczas poprawek.

Rachunek (działalność nieewidencjonowana - bez VAT) zostanie wysłany w osobnym mailu w ciągu 24 godzin. W razie pytań - odpiszcie na tego maila.

Do zobaczenia za ~24h,
Zespół Zaproszenia Online
Zaproszenia Online · https://zaproszeniaonline.com/

Numer zamówienia: ${lead.id.slice(0,8)}

Potwierdzamy rozpoczęcie świadczenia usługi. Zasady i gwarancje: § 10 Regulaminu — zaproszeniaonline.com/terms#paragraf-10`;
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (payload.type !== "UPDATE" || payload.table !== "leads") {
    return new Response(JSON.stringify({ skipped: true, reason: `${payload.type} on ${payload.table}` }), { status: 200 });
  }
  if (payload.record.payment_status !== "paid") {
    return new Response(JSON.stringify({ skipped: true, reason: `payment_status=${payload.record.payment_status}` }), { status: 200 });
  }
  if (payload.old_record?.payment_status === "paid") {
    return new Response(JSON.stringify({ skipped: true, reason: "already paid" }), { status: 200 });
  }

  const lead = payload.record;
  const errors: string[] = [];

  try {
    const amount = lead.payment_amount_pln ? (lead.payment_amount_pln / 100).toFixed(0) : "699";
    await sendEmail(
      OPERATOR_EMAILS,
      `OPŁACONE ${amount} zł · ${lead.name}`,
      operatorPaidHTML(lead),
      operatorPaidText(lead),
    );
  } catch (err) {
    errors.push(`operator: ${(err as Error).message}`);
  }

  try {
    await sendEmail(
      lead.email,
      `Płatność potwierdzona - startujemy z projektem`,
      customerPaidHTML(lead),
      customerPaidText(lead),
    );
  } catch (err) {
    errors.push(`customer: ${(err as Error).message}`);
  }

  return new Response(JSON.stringify({
    received: true,
    lead_id: lead.id,
    errors: errors.length > 0 ? errors : undefined,
  }), { status: errors.length > 0 ? 207 : 200, headers: { "Content-Type": "application/json" } });
});
