// ============================================================
// Edge Function: withdrawal-submit
// Cyfrowa funkcja odstąpienia od umowy (art. 11a CRD)
// Dyrektywa 2023/2673 - stosowanie od 19.06.2026
//
// Endpoint: POST /functions/v1/withdrawal-submit
// Body: { token: UUID, consumer_name, consumer_email, reason? }
//
// Deploy: supabase functions deploy withdrawal-submit --no-verify-jwt
// Secrets: SUPABASE_URL, SUPABASE_SECRET_KEY, RESEND_API_KEY,
//          STRIPE_SECRET_KEY (refund), NOTIFY_EMAIL_TO (Nicolas)
//
// ANTI-CORRUPTION-GOLDEN: nie usuwać/modyfikować logiki walidacji
//                         can_withdraw - to jest gate art. 11a CRD.
// ============================================================

// @ts-ignore deno
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4?target=denonext";
// @ts-ignore
import Stripe from "https://esm.sh/stripe@16.7.0?target=denonext";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SECRET_KEY =
  Deno.env.get("SUPABASE_SECRET_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const NOTIFY_EMAIL_TO = Deno.env.get("NOTIFY_EMAIL_TO") || "kontakt@zaproszeniaonline.com";
const FROM_EMAIL = "kontakt@zaproszeniaonline.com";

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-09-30.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

const CORS = {
  "Access-Control-Allow-Origin": "https://zaproszeniaonline.com",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: CORS });
}

async function sendResend(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: `zaproszeniaonline.com <${FROM_EMAIL}>`, to, subject, html }),
  });
  if (!res.ok) {
    console.error(`Resend ${res.status}:`, await res.text());
  }
}

function buildConsumerEmail(opts: {
  name: string;
  withdrawalId: string;
  submittedAt: string;
  amountPln: number | null;
  refundExpectedBy: string;
}) {
  const amount = opts.amountPln ? (opts.amountPln / 100).toFixed(2) + " PLN" : "wpłacona kwota";
  return `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;background:#FAFAF8;padding:32px;color:#0A0A0A;line-height:1.6;">
<div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #EBEBEB;border-radius:14px;padding:36px 28px;">
  <p style="font-size:0.78rem;letter-spacing:0.2em;text-transform:uppercase;color:#2C3E2D;margin-bottom:12px;">Potwierdzenie odstąpienia</p>
  <h1 style="font-family:Georgia,serif;font-style:italic;font-weight:400;font-size:2rem;line-height:1.2;margin-bottom:18px;color:#0A0A0A;">Otrzymaliśmy Twoje oświadczenie.</h1>
  <p style="color:#4A4A4A;font-size:1rem;margin-bottom:16px;">Cześć ${opts.name},</p>
  <p style="color:#4A4A4A;font-size:1rem;margin-bottom:16px;">Potwierdzamy odbiór oświadczenia o odstąpieniu od umowy złożonego przez cyfrową funkcję odstąpienia (art. 11a Dyrektywy 2023/2673 i art. 27a ustawy o prawach konsumenta).</p>
  <div style="background:#FAFAF8;border:1px solid #EBEBEB;border-radius:10px;padding:18px 20px;margin:20px 0;font-size:0.95rem;color:#4A4A4A;">
    <div style="margin-bottom:8px;"><strong style="color:#0A0A0A;">Identyfikator zgłoszenia:</strong> ${opts.withdrawalId}</div>
    <div style="margin-bottom:8px;"><strong style="color:#0A0A0A;">Data i godzina:</strong> ${opts.submittedAt}</div>
    <div><strong style="color:#0A0A0A;">Kwota do zwrotu:</strong> ${amount}</div>
  </div>
  <p style="color:#4A4A4A;font-size:1rem;margin-bottom:16px;"><strong style="color:#0A0A0A;">Co dalej:</strong> zwrot środków zostanie zrealizowany w terminie do 14 dni (art. 32 ustawy o prawach konsumenta) na rachunek, z którego dokonano płatności. Spodziewana data zaksięgowania zwrotu: do ${opts.refundExpectedBy}.</p>
  <p style="color:#4A4A4A;font-size:0.92rem;margin-bottom:8px;">Masz pytania? Napisz na <a href="mailto:kontakt@zaproszeniaonline.com" style="color:#2C3E2D;">kontakt@zaproszeniaonline.com</a>.</p>
  <hr style="border:none;border-top:1px solid #EBEBEB;margin:24px 0;">
  <p style="color:#999999;font-size:0.82rem;">zaproszeniaonline.com - Vidok Studio<br>kontakt@zaproszeniaonline.com</p>
</div>
</body></html>`;
}

function buildOwnerEmail(opts: {
  leadId: string;
  consumerName: string;
  consumerEmail: string;
  reason: string | null;
  amountPln: number | null;
  submittedAt: string;
}) {
  const amount = opts.amountPln ? (opts.amountPln / 100).toFixed(2) + " PLN" : "(brak)";
  return `
<!DOCTYPE html><html><body style="font-family:monospace;font-size:14px;line-height:1.5;padding:16px;">
<h2 style="font-family:Inter,sans-serif;">[ODSTĄPIENIE] Konsument odstąpił od umowy</h2>
<table cellpadding="6" style="border-collapse:collapse;">
<tr><td><b>Lead ID:</b></td><td>${opts.leadId}</td></tr>
<tr><td><b>Klient:</b></td><td>${opts.consumerName} &lt;${opts.consumerEmail}&gt;</td></tr>
<tr><td><b>Kwota:</b></td><td>${amount}</td></tr>
<tr><td><b>Powód:</b></td><td>${opts.reason || "(nie podany - opcjonalny)"}</td></tr>
<tr><td><b>Złożono:</b></td><td>${opts.submittedAt}</td></tr>
</table>
<p>Stripe refund auto-triggered. Status: leads.payment_status='cancelled'. Sprawdź withdrawals table.</p>
<p>Termin zwrotu (14 dni od dziś): <b>art. 32 ust. 1 ustawy o prawach konsumenta</b>.</p>
</body></html>`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const token: string = (body.token || "").trim();
  const consumerName: string = (body.consumer_name || "").trim();
  const consumerEmail: string = (body.consumer_email || "").trim().toLowerCase();
  const reason: string | null = body.reason ? String(body.reason).trim().slice(0, 2000) : null;

  // Walidacja inputu (art. 11a ust. 5 - nie więcej danych niż niezbędne)
  if (!UUID_RE.test(token)) return json(400, { error: "Nieprawidłowy identyfikator zamówienia." });
  if (!consumerName || consumerName.length < 2 || consumerName.length > 200)
    return json(400, { error: "Imię i nazwisko - pole wymagane (2-200 znaków)." });
  if (!consumerEmail || !consumerEmail.includes("@") || consumerEmail.length > 200)
    return json(400, { error: "Adres e-mail - pole wymagane i poprawne." });

  // 1. Sprawdź can_withdraw przez RPC (gate art. 11a)
  const { data: statusRows, error: statusErr } = await supabase
    .rpc("get_withdrawal_status", { p_token: token });

  if (statusErr || !statusRows || statusRows.length === 0) {
    console.error("Status check failed:", statusErr);
    return json(404, { error: "Nie znaleziono zamówienia o podanym identyfikatorze." });
  }

  const status = statusRows[0];

  if (status.already_withdrawn) {
    return json(409, {
      error: "Oświadczenie o odstąpieniu zostało już złożone wcześniej dla tego zamówienia.",
    });
  }

  if (!status.can_withdraw) {
    return json(403, {
      error:
        "Prawo odstąpienia od umowy wygasło. Świadczenie zostało rozpoczęte. Skorzystaj z gwarancji rozszerzonych z §10a Regulaminu lub skontaktuj się: kontakt@zaproszeniaonline.com",
      code: "withdrawal_window_closed",
      realization_started_at: status.realization_started_at,
    });
  }

  // 2. INSERT do withdrawals (atomowo, audit trail)
  const submittedIp =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    null;
  const userAgent = req.headers.get("user-agent") || null;

  const { data: withdrawal, error: insErr } = await supabase
    .from("withdrawals")
    .insert({
      lead_id: token,
      consumer_name: consumerName,
      consumer_email: consumerEmail,
      reason,
      submitted_ip: submittedIp,
      submitted_user_agent: userAgent,
      status: "received",
      consent_version: "terms-2026-05-21",
      audit_trail: {
        endpoint: "withdrawal-submit",
        timestamp: new Date().toISOString(),
        amount_pln: status.amount_pln,
        directive_2023_2673: "art. 11a CRD",
      },
    })
    .select("id, submitted_at")
    .single();

  if (insErr || !withdrawal) {
    console.error("Insert withdrawal failed:", insErr);
    return json(500, { error: "Błąd zapisu oświadczenia. Spróbuj ponownie lub napisz na kontakt@." });
  }

  // 3. UPDATE leads.payment_status = 'cancelled' (oznacz jako anulowane)
  await supabase
    .from("leads")
    .update({ payment_status: "cancelled" })
    .eq("id", token);

  // 4. Stripe refund (jeśli płatność była przez Stripe)
  let stripeRefundId: string | null = null;
  try {
    const { data: leadData } = await supabase
      .from("leads")
      .select("payment_id, payment_provider")
      .eq("id", token)
      .maybeSingle();

    if (leadData?.payment_provider === "stripe" && leadData.payment_id) {
      const refund = await stripe.refunds.create({
        payment_intent: leadData.payment_id,
        reason: "requested_by_customer",
        metadata: { withdrawal_id: withdrawal.id, lead_id: token },
      });
      stripeRefundId = refund.id;

      await supabase
        .from("withdrawals")
        .update({
          refund_stripe_id: stripeRefundId,
          refund_amount_pln: status.amount_pln,
          status: "processing",
        })
        .eq("id", withdrawal.id);
    }
  } catch (refundErr) {
    console.error("Stripe refund failed (zapisane jako pending - Nicolas obsłuży ręcznie):", refundErr);
    // NIE blokujemy - oświadczenie jest złożone, refund obsłuży się ręcznie
  }

  // 5. Emaile potwierdzające
  const submittedAtStr = new Date(withdrawal.submitted_at).toLocaleString("pl-PL", {
    timeZone: "Europe/Warsaw",
  });
  const refundExpected = new Date(Date.now() + 14 * 86400000).toLocaleDateString("pl-PL");

  try {
    await sendResend(
      consumerEmail,
      "Potwierdzenie odstąpienia od umowy | zaproszeniaonline.com",
      buildConsumerEmail({
        name: consumerName,
        withdrawalId: withdrawal.id,
        submittedAt: submittedAtStr,
        amountPln: status.amount_pln,
        refundExpectedBy: refundExpected,
      })
    );
    await sendResend(
      NOTIFY_EMAIL_TO,
      `[ODSTĄPIENIE] ${consumerName} (${status.amount_pln ? (status.amount_pln / 100).toFixed(2) : "?"} PLN)`,
      buildOwnerEmail({
        leadId: token,
        consumerName,
        consumerEmail,
        reason,
        amountPln: status.amount_pln,
        submittedAt: submittedAtStr,
      })
    );
  } catch (mailErr) {
    console.error("Resend send failed (audit zachowany w bazie):", mailErr);
  }

  // 6. Sukces
  return json(200, {
    success: true,
    withdrawal_id: withdrawal.id,
    submitted_at: withdrawal.submitted_at,
    refund_expected_by: refundExpected,
    stripe_refund_id: stripeRefundId,
  });
});
