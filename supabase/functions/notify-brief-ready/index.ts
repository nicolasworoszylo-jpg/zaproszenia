// Edge Function: notify-brief-ready
// Wywolywana RECZNIE z notify-payment-success (po zaplaceniu) - tworzy token w briefs
// i wysyla email do klienta z linkiem do /klient-start/?token=<UUID>.
//
// Wywolanie z innych Edge Functions:
//   await fetch(`${SUPABASE_URL}/functions/v1/notify-brief-ready`, {
//     method: 'POST',
//     headers: { Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
//     body: JSON.stringify({ email, payment_id, name })
//   })

// @ts-ignore
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = "Zaproszenia Online <kontakt@zaproszeniaonline.com>";

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function buildEmail(name: string, token: string) {
  const briefUrl = `https://zaproszeniaonline.com/klient-start/?token=${token}`;
  return {
    subject: "Wypełnij swoje zaproszenie ślubne (3 minuty)",
    html: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
  body{font-family:Georgia,serif;background:#FBF7F0;margin:0;padding:0;color:#2A2424}
  .wrap{max-width:560px;margin:0 auto;padding:40px 24px}
  .card{background:white;border-radius:8px;padding:32px 24px;box-shadow:0 4px 20px rgba(74,28,43,0.06)}
  h1{font-family:'Playfair Display',Georgia,serif;font-size:28px;color:#4A1C2B;font-style:italic;margin:0 0 16px}
  p{font-size:16px;line-height:1.7;color:#5A4F4D;margin:0 0 16px}
  .btn{display:inline-block;background:#4A1C2B;color:white !important;padding:14px 32px;text-decoration:none;border-radius:4px;letter-spacing:2px;text-transform:uppercase;font-size:13px;font-weight:600;margin:8px 0 16px}
  .info{background:#F5EDE2;border-left:3px solid #C8A87C;padding:14px 18px;font-size:14px;color:#5A4F4D;margin:16px 0}
  .foot{text-align:center;font-size:12px;color:#A09888;margin-top:24px}
</style></head><body>
  <div class="wrap">
    <div class="card">
      <h1>Witaj ${name}!</h1>
      <p>Dziękujemy za zakup zaproszenia ślubnego online. Czas wypełnić swoje dane - zajmie Ci to <strong>~3-5 minut</strong>.</p>
      <p style="text-align:center"><a href="${briefUrl}" class="btn">Wypełnij swoje zaproszenie →</a></p>
      <div class="info">
        <strong>Co Cię czeka:</strong>
        <ul style="margin:8px 0 0 18px;padding:0">
          <li>4 proste kroki: para → miejsce → zdjęcia → paleta</li>
          <li>Wgrasz 5 zdjęć (drag&amp;drop)</li>
          <li>Twoje zaproszenie będzie LIVE w 90 sekund od submit</li>
        </ul>
      </div>
      <p style="font-size:13px;color:#A09888;margin-top:24px">Link wygasa za 30 dni. Masz pytania? Odpisz na tego maila.</p>
    </div>
    <div class="foot">
      zaproszeniaonline.com · Vidok Studio<br>
      Token: <code style="color:#A09888">${token.slice(0,8)}...</code>
    </div>
  </div>
</body></html>`,
    text: `Witaj ${name}!

Dziekujemy za zakup zaproszenia slubnego online. Czas wypelnic swoje dane - zajmie Ci to ~3-5 minut.

Wypelnij swoje zaproszenie: ${briefUrl}

Co Cie czeka:
- 4 proste kroki: para -> miejsce -> zdjecia -> paleta
- Wgrasz 5 zdjec (drag&drop)
- Twoje zaproszenie bedzie LIVE w 90 sekund od submit

Link wygasa za 30 dni. Masz pytania? Odpisz na tego maila.

zaproszeniaonline.com · Vidok Studio`,
  };
}

async function sendResend(to: string, subject: string, html: string, text: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
      text,
      reply_to: "kontakt@zaproszeniaonline.com",
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  try {
    const { email, payment_id, name } = await req.json();
    if (!email) throw new Error("Missing email");

    // 1. Sprawdz czy brief dla tego email/payment juz istnieje (idempotent)
    const { data: existing } = await sb.from("briefs")
      .select("token, status")
      .eq("email", email)
      .eq("payment_id", payment_id || "")
      .maybeSingle();

    let token: string;
    if (existing) {
      // Resend mail z istniejacym tokenem
      token = existing.token;
      console.log(`Brief exists for ${email}, resending mail with token ${token.slice(0,8)}...`);
    } else {
      // 2. INSERT nowy brief (token auto-generated przez DB)
      const { data: inserted, error } = await sb.from("briefs").insert({
        email,
        payment_id: payment_id || null,
        status: "awaiting_brief",
      }).select("token").single();
      if (error) throw new Error(`DB insert: ${error.message}`);
      token = inserted.token;
      console.log(`Created brief for ${email}, token ${token.slice(0,8)}...`);
    }

    // 3. Wyslij email
    const mail = buildEmail(name || "Pani Młoda", token);
    await sendResend(email, mail.subject, mail.html, mail.text);

    return new Response(JSON.stringify({ ok: true, token: token.slice(0, 8) + "..." }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("notify-brief-ready error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
