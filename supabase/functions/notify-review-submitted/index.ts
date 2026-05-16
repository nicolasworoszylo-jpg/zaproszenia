// Edge Function: notify-review-submitted
// Wywoływana przez DB trigger reviews_notify_submitted AFTER INSERT ON reviews.
// Wysyła:
//   1. Mail do operatora (Nicolas+Dominika): "Nowa opinia ★★★★★ · Anna i Michał"
//   2. Mail do klienta: "Dziękujemy za opinię" + (jeśli rating <= 3) dodatkowy info "odezwiemy się"
//
// Honeypot guard: jeśli review.honeypot_triggered=true → nic nie wysyłamy.
// Idempotency: payload.type=INSERT + review.id sprawdzamy w request (jeden mail per row).
//
// Wymaga: RESEND_API_KEY

// @ts-ignore: Deno deps
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-ignore: Deno deps
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FROM_EMAIL = "Zaproszenia Online <kontakt@zaproszeniaonline.com>";
const REPLY_TO = "kontakt@zaproszeniaonline.com";
const SITE_URL = "https://zaproszeniaonline.com";
const SUPABASE_DASHBOARD = "https://supabase.com/dashboard/project/kuyniyyieejvambyjnxy/editor";
const OPERATOR_EMAILS = ["nicolasworoszylo@gmail.com", "dominikakus333@gmail.com"];

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

interface Review {
  id: string;
  lead_id: string;
  rating: number;
  comment?: string;
  best_part?: string;
  consent_publish: boolean;
  display_name?: string;
  honeypot_triggered: boolean;
  recommend_to_others?: boolean | null;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  event_date?: string;
  event_type?: string;
  package?: string;
}

interface WebhookPayload {
  type: "INSERT";
  table: string;
  schema: string;
  record: Review;
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
      subject, html, text,
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

function ratingStars(n: number): string {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

// ─── Email shell brand ──────────────────────────────────────────────────────

function emailShell(opts: { preheader: string; title: string; bodyHtml: string; footerNote?: string }): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pl"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<meta name="color-scheme" content="light"/>
<meta name="supported-color-schemes" content="light"/>
<title>${escapeHtml(opts.title)}</title>
<style>
  @media only screen and (max-width:600px){
    .container{padding:16px 8px!important;}
    .card{border-radius:14px!important;}
    .hero{padding:32px 24px 28px!important;}
    .body{padding:24px 22px!important;}
    .h1{font-size:1.6rem!important;}
    .stars{font-size:2rem!important;}
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
        ${opts.footerNote || "Cyfrowe zaproszenia ślubne premium · 699 zł, gotowe w 24 h"}<br/>
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

// ─── Template: mail do operatora ────────────────────────────────────────────

function operatorHTML(review: Review, lead: Lead): string {
  const stars = ratingStars(review.rating);
  const comment = review.comment ? escapeHtml(review.comment).replace(/\n/g, "<br/>") : "<em style='color:#999;'>(brak komentarza)</em>";
  const bestPart = review.best_part ? escapeHtml(review.best_part).replace(/\n/g, "<br/>") : "<em style='color:#999;'>(nie podane)</em>";
  const consent = review.consent_publish ? "TAK - można publikować" : "NIE - prywatne";
  const consentColor = review.consent_publish ? "#2C3E2D" : "#999";
  const recommend = review.recommend_to_others === true ? "TAK" : review.recommend_to_others === false ? "NIE" : "-";

  const heroColor = review.rating >= 4 ? "linear-gradient(135deg,#2C3E2D 0%,#243325 100%)" :
                    review.rating === 3 ? "linear-gradient(135deg,#5D4037 0%,#4A2E26 100%)" :
                    "linear-gradient(135deg,#7A1F1F 0%,#5C1717 100%)";
  const heroEmoji = review.rating >= 4 ? "" : review.rating === 3 ? " (do follow-up)" : " (PILNE - kontakt 24h)";

  const bodyHtml = `
  <div class="hero" style="background:${heroColor};color:#FAF6EF;padding:40px 36px 36px;text-align:center;">
    ${eyebrow("Nowa opinia" + heroEmoji)}
    <p class="stars" style="margin:14px 0 8px;font-family:Georgia,serif;font-size:2.4rem;color:#C9A96E;letter-spacing:0.1em;line-height:1;">
      ${stars}
    </p>
    <h1 class="h1" style="margin:8px 0 4px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:400;font-size:1.8rem;letter-spacing:-0.022em;line-height:1.15;color:#FAF6EF;">
      ${escapeHtml(lead.name)}
    </h1>
    <p style="margin:4px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;font-size:0.86rem;color:rgba(250,246,239,0.6);">
      Lead #${lead.id.slice(0,8)} · review #${review.id.slice(0,8)}
    </p>
  </div>

  <div class="body" style="padding:32px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;color:#0A0A0A;font-size:0.96rem;line-height:1.6;">

    <div style="margin:0 0 22px;padding:18px 20px;background:rgba(44,62,45,0.04);border-radius:10px;border-left:3px solid #2C3E2D;">
      <p style="margin:0 0 6px;font-size:0.72rem;letter-spacing:0.12em;text-transform:uppercase;color:#999;font-weight:600;">Komentarz</p>
      <p style="margin:0;font-size:0.97rem;line-height:1.6;color:#0A0A0A;">${comment}</p>
    </div>

    <div style="margin:0 0 22px;padding:18px 20px;background:rgba(201,169,110,0.08);border-radius:10px;border-left:3px solid #C9A96E;">
      <p style="margin:0 0 6px;font-size:0.72rem;letter-spacing:0.12em;text-transform:uppercase;color:#999;font-weight:600;">Co najbardziej zaskoczyło</p>
      <p style="margin:0;font-size:0.97rem;line-height:1.6;color:#0A0A0A;">${bestPart}</p>
    </div>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;font-size:0.93rem;line-height:1.5;">
      <tr><td style="padding:9px 0;color:#999;width:42%;font-size:0.74rem;letter-spacing:0.04em;text-transform:uppercase;font-weight:500;">Publikacja</td>
          <td style="padding:9px 0;color:${consentColor};font-weight:500;">${consent}</td></tr>
      <tr><td style="padding:9px 0;color:#999;border-top:1px solid #EBEBEB;font-size:0.74rem;letter-spacing:0.04em;text-transform:uppercase;font-weight:500;">Poleciłby znajomym</td>
          <td style="padding:9px 0;border-top:1px solid #EBEBEB;font-weight:500;">${recommend}</td></tr>
      <tr><td style="padding:9px 0;color:#999;border-top:1px solid #EBEBEB;font-size:0.74rem;letter-spacing:0.04em;text-transform:uppercase;font-weight:500;">Display name</td>
          <td style="padding:9px 0;border-top:1px solid #EBEBEB;">${escapeHtml(review.display_name || firstName(lead.name))}</td></tr>
      <tr><td style="padding:9px 0;color:#999;border-top:1px solid #EBEBEB;font-size:0.74rem;letter-spacing:0.04em;text-transform:uppercase;font-weight:500;">E-mail klienta</td>
          <td style="padding:9px 0;border-top:1px solid #EBEBEB;"><a href="mailto:${escapeHtml(lead.email)}" style="color:#2C3E2D;">${escapeHtml(lead.email)}</a></td></tr>
    </table>

    ${review.rating <= 3 ? `
    <div style="margin:24px 0 0;padding:16px 18px;background:#FFF4E5;border-left:3px solid #F59E0B;border-radius:6px;">
      <p style="margin:0;font-size:0.92rem;line-height:1.55;color:#0A0A0A;">
        <strong>AKCJA (24h):</strong> Niska ocena - zadzwoń lub odpisz. Cel: zrozumieć co poszło źle, naprawić, NIE prosić jeszcze raz o opinię. Jeśli klient ma rację - rabat/zwrot. Jeśli nie - empatyczne wyjaśnienie.
      </p>
    </div>
    ` : ""}

    ${review.consent_publish ? `
    <div style="margin:24px 0 0;padding:16px 18px;background:rgba(201,169,110,0.1);border-radius:6px;text-align:center;">
      <p style="margin:0 0 12px;font-size:0.92rem;line-height:1.55;color:#0A0A0A;">
        <strong>Następny krok:</strong> Wyślij kod rabatowy 50 zł + opublikuj w sekcji „Co mówią pary".
      </p>
      <a href="${SUPABASE_DASHBOARD}" style="display:inline-block;padding:11px 20px;background:#0A0A0A;color:#FFFFFF;border-radius:100px;font-size:0.88rem;font-weight:500;">Otwórz Supabase →</a>
    </div>
    ` : ""}
  </div>
  `;

  return emailShell({
    preheader: `${stars} ${escapeHtml(lead.name)} · ${review.consent_publish ? "zgoda na publikację" : "prywatne"}`,
    title: `Nowa opinia ${stars} · ${lead.name}`,
    bodyHtml,
    footerNote: "Wewnętrzna notyfikacja · Zaproszenia Online",
  });
}

function operatorText(review: Review, lead: Lead): string {
  return `NOWA OPINIA: ${ratingStars(review.rating)} (${review.rating}/5)
Para: ${lead.name}
E-mail: ${lead.email}
Lead: #${lead.id.slice(0,8)}

Komentarz:
${review.comment || "(brak)"}

Co najbardziej zaskoczyło:
${review.best_part || "(nie podane)"}

Publikacja: ${review.consent_publish ? "TAK - można publikować" : "NIE - prywatne"}
Poleciłby: ${review.recommend_to_others === true ? "TAK" : review.recommend_to_others === false ? "NIE" : "-"}

${review.rating <= 3 ? `\nAKCJA (24h): Niska ocena - zadzwoń lub odpisz. Zrozumieć, naprawić.\n` : ""}
${review.consent_publish ? `\nNastępny krok: kod rabatowy 50 zł + publikacja w „Co mówią pary"\n` : ""}

Supabase: ${SUPABASE_DASHBOARD}
`;
}

// ─── Template: mail dziękujemy do klienta ──────────────────────────────────

function customerThanksHTML(review: Review, lead: Lead): string {
  const fn = firstName(lead.name);
  const stars = ratingStars(review.rating);

  // Mail różni się dla rating <=3 (oferujemy rozmowę) vs >=4 (rabat/publikacja jeśli zgoda)
  const isLow = review.rating <= 3;

  const heroLabel = isLow ? "Dziękujemy za szczerość" : "Dziękujemy!";
  const heroBig = isLow ? "Każde słowo się liczy." : "Wasza opinia ma znaczenie.";

  const middleSection = isLow ? `
    <div style="margin:24px 0;padding:22px 24px;background:rgba(44,62,45,0.04);border-radius:12px;border-left:3px solid #2C3E2D;">
      <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;font-size:0.74rem;letter-spacing:0.12em;text-transform:uppercase;color:#2C3E2D;font-weight:600;">
        <span style="display:inline-block;width:5px;height:5px;background:#C9A96E;border-radius:50%;margin-right:8px;vertical-align:2px;"></span>Odezwę się w 24 godziny
      </p>
      <p style="margin:0;font-size:1rem;line-height:1.6;color:#0A0A0A;">
        Wasza ocena to znak, że coś poszło inaczej niż chcieliśmy. Odpiszę osobiście w ciągu 24 godzin - chcę zrozumieć co i czy mogę to naprawić. Jeśli wolicie rozmowę telefoniczną, dajcie znać kiedy i pod jakim numerem.
      </p>
    </div>
  ` : review.consent_publish ? `
    <div style="margin:24px 0;padding:22px 24px;background:rgba(201,169,110,0.08);border-radius:12px;border-left:3px solid #C9A96E;">
      <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;font-size:0.74rem;letter-spacing:0.12em;text-transform:uppercase;color:#999999;font-weight:600;">
        <span style="display:inline-block;width:5px;height:5px;background:#C9A96E;border-radius:50%;margin-right:8px;vertical-align:2px;"></span>Kod rabatowy 50 zł
      </p>
      <p style="margin:0 0 10px;font-size:1rem;line-height:1.6;color:#0A0A0A;">
        Zgodnie z obietnicą - kod <strong>POLEC50</strong> dla znajomych pary. Mogą go użyć przy zamówieniu własnej strony ślubnej. Kod ważny 6 miesięcy.
      </p>
      <p style="margin:0;font-size:0.94rem;line-height:1.6;color:#4A4A4A;">
        Waszą opinię opublikujemy w sekcji „Co mówią pary" w ciągu 7 dni (po krótkim sprawdzeniu literówek). Dam znać mailem, gdy będzie live.
      </p>
    </div>
  ` : `
    <div style="margin:24px 0;padding:22px 24px;background:rgba(44,62,45,0.04);border-radius:12px;border-left:3px solid #2C3E2D;">
      <p style="margin:0;font-size:1rem;line-height:1.6;color:#0A0A0A;">
        Wasza opinia pomoże mi się rozwijać - nawet jeśli nie zgodziliście się na publikację. Każde słowo ma znaczenie.
      </p>
    </div>
  `;

  const bodyHtml = `
  <div class="hero" style="background:linear-gradient(135deg,#2C3E2D 0%,#243325 100%);color:#FAF6EF;padding:44px 36px 38px;text-align:center;">
    ${eyebrow(heroLabel)}
    <p class="stars" style="margin:14px 0 10px;font-family:Georgia,serif;font-size:2.2rem;color:#C9A96E;letter-spacing:0.1em;line-height:1;">
      ${stars}
    </p>
    <h1 class="h1" style="margin:6px 0 0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:400;font-size:2rem;letter-spacing:-0.022em;line-height:1.15;color:#FAF6EF;">
      ${heroBig}
    </h1>
  </div>

  <div class="body" style="padding:36px 36px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;font-size:0.98rem;line-height:1.65;color:#0A0A0A;">

    <p style="margin:0 0 16px;font-size:1rem;">
      Cześć ${escapeHtml(fn)},
    </p>

    <p style="margin:0 0 18px;">
      ${isLow
        ? "Dzięki, że napisaliście. Wiem, że zostawienie szczerej krytyki kosztuje więcej niż 5 gwiazdek - i właśnie dlatego jest cenniejsze."
        : "Dzięki za czas, który poświęciliście na formularz. Wasze 2 minuty pomogą kolejnym parom zdecydować się na zamówienie strony - i pomogą mi pracować lepiej z każdym kolejnym projektem."
      }
    </p>

    ${middleSection}

    <p style="margin:24px 0 0;color:#4A4A4A;font-size:0.93rem;line-height:1.6;">
      W razie czego - po prostu odpiszcie na tego maila. Wszystko czytam osobiście.
    </p>

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

  <div style="padding:20px 36px;background:#FAFAF8;border-top:1px solid #EBEBEB;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;font-size:0.78rem;color:#999999;line-height:1.6;">
    <a href="${SITE_URL}/" style="color:#2C3E2D;text-decoration:none;font-weight:500;">zaproszeniaonline.com</a>
    &nbsp;·&nbsp;
    <a href="mailto:${REPLY_TO}" style="color:#999999;text-decoration:none;">Odezwij się</a>
  </div>
  `;

  return emailShell({
    preheader: isLow
      ? `Dzięki za szczerość, ${fn}. Odezwę się w 24h żeby zrozumieć.`
      : (review.consent_publish ? `Dzięki ${fn}! Kod rabatowy 50 zł w środku.` : `Dzięki za opinię, ${fn}. Każde słowo ma znaczenie.`),
    title: isLow ? "Dziękujemy za szczerość" : "Dziękujemy za opinię",
    bodyHtml,
  });
}

function customerThanksText(review: Review, lead: Lead): string {
  const fn = firstName(lead.name);
  const isLow = review.rating <= 3;
  if (isLow) {
    return `Cześć ${fn},

Dzięki, że napisaliście. Wiem, że zostawienie szczerej krytyki kosztuje więcej niż 5 gwiazdek - i właśnie dlatego jest cenniejsze.

ODEZWĘ SIĘ W 24 GODZINY:
Wasza ocena to znak, że coś poszło inaczej niż chcieliśmy. Odpiszę osobiście w ciągu 24 godzin - chcę zrozumieć co i czy mogę to naprawić. Jeśli wolicie rozmowę telefoniczną, dajcie znać kiedy i pod jakim numerem.

W razie czego - po prostu odpiszcie na tego maila.

Nicolas
Zespół Zaproszenia Online · ${SITE_URL}/
`;
  }
  if (review.consent_publish) {
    return `Cześć ${fn},

Dzięki za czas, który poświęciliście na formularz. Wasze 2 minuty pomogą kolejnym parom zdecydować się na zamówienie strony - i pomogą mi pracować lepiej z każdym kolejnym projektem.

KOD RABATOWY 50 ZŁ:
Zgodnie z obietnicą - kod POLEC50 dla znajomych pary. Mogą go użyć przy zamówieniu własnej strony ślubnej. Kod ważny 6 miesięcy.

Waszą opinię opublikujemy w sekcji „Co mówią pary" w ciągu 7 dni (po krótkim sprawdzeniu literówek). Dam znać mailem, gdy będzie live.

Nicolas
Zespół Zaproszenia Online · ${SITE_URL}/
`;
  }
  return `Cześć ${fn},

Dzięki za czas, który poświęciliście na formularz. Wasza opinia pomoże mi się rozwijać - nawet jeśli nie zgodziliście się na publikację. Każde słowo ma znaczenie.

W razie czego - po prostu odpiszcie na tego maila. Wszystko czytam osobiście.

Nicolas
Zespół Zaproszenia Online · ${SITE_URL}/
`;
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (payload.type !== "INSERT" || payload.table !== "reviews") {
    return new Response(JSON.stringify({ skipped: true, reason: `${payload.type} on ${payload.table}` }), { status: 200 });
  }

  const review = payload.record;

  // Honeypot - nic nie wysyłamy (bot)
  if (review.honeypot_triggered) {
    return new Response(JSON.stringify({ skipped: true, reason: "honeypot" }), { status: 200 });
  }

  // Fetch full lead data
  const { data: lead, error: leadErr } = await sb
    .from("leads")
    .select("id, name, email, event_date, event_type, package")
    .eq("id", review.lead_id)
    .maybeSingle();

  if (leadErr || !lead) {
    return new Response(JSON.stringify({ error: `lead fetch: ${leadErr?.message || "not found"}` }), { status: 500 });
  }

  const errors: string[] = [];

  try {
    const stars = ratingStars(review.rating);
    await sendEmail(
      OPERATOR_EMAILS,
      `Nowa opinia ${stars} · ${lead.name}`,
      operatorHTML(review, lead),
      operatorText(review, lead),
    );
  } catch (err) {
    errors.push(`operator: ${(err as Error).message}`);
  }

  try {
    await sendEmail(
      lead.email,
      review.rating <= 3 ? "Dziękujemy za szczerość" : "Dziękujemy za opinię",
      customerThanksHTML(review, lead),
      customerThanksText(review, lead),
    );
  } catch (err) {
    errors.push(`customer: ${(err as Error).message}`);
  }

  return new Response(
    JSON.stringify({
      received: true,
      review_id: review.id,
      lead_id: review.lead_id,
      rating: review.rating,
      errors: errors.length > 0 ? errors : undefined,
    }),
    { status: errors.length > 0 ? 207 : 200, headers: { "Content-Type": "application/json" } },
  );
});
