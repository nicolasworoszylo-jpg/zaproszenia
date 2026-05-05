// Stripe webhook handler — odbiera checkout.session.completed + payment_intent.succeeded
// Aktualizuje payment_status w tabeli `leads`
//
// Deploy: `supabase functions deploy stripe-webhook --no-verify-jwt`
// Set secrets:
//   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
//   supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx (lub sk_test_xxx)
//
// W Stripe Dashboard → Developers → Webhooks → Add endpoint:
//   URL: https://kuyniyyieejvambyjnxy.supabase.co/functions/v1/stripe-webhook
//   Events: checkout.session.completed, payment_intent.succeeded, charge.refunded
//   Stripe wygeneruje signing secret (whsec_...) → wklej do STRIPE_WEBHOOK_SECRET

// @ts-ignore: Deno deps (runtime Supabase Edge)
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-ignore
import Stripe from "https://esm.sh/stripe@16.7.0?target=denonext";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4?target=denonext";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-09-30.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } }
);

const cryptoProvider = Stripe.createSubtleCryptoProvider();
const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      sig,
      WEBHOOK_SECRET,
      undefined,
      cryptoProvider
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", (err as Error).message);
    return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 });
  }

  console.log(`✓ Stripe event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const customerEmail = session.customer_details?.email || session.customer_email;
        const amount = session.amount_total; // w groszach
        const paymentIntentId = session.payment_intent as string;

        // Match po e-mailu — najnowszy lead z tym e-mailem
        const { data: lead, error: findErr } = await supabase
          .from("leads")
          .select("id")
          .eq("email", customerEmail)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (findErr || !lead) {
          console.warn(`⚠ Brak leada dla email: ${customerEmail}. Tworzę orphan record.`);
          // Tworzymy orphan record żeby śledzić płatność bez leada
          await supabase.from("leads").insert({
            name: session.customer_details?.name || "Klient Stripe",
            email: customerEmail,
            source: "stripe-direct",
            payment_status: "paid",
            payment_provider: "stripe",
            payment_id: paymentIntentId,
            payment_amount_pln: amount,
            message: "Płatność przyszła bezpośrednio przez Stripe Payment Link bez wcześniejszego leada.",
          });
          break;
        }

        const { error: updErr } = await supabase
          .from("leads")
          .update({
            payment_status: "paid",
            payment_provider: "stripe",
            payment_id: paymentIntentId,
            payment_amount_pln: amount,
          })
          .eq("id", lead.id);

        if (updErr) console.error("Update failed:", updErr);
        else console.log(`✓ Lead ${lead.id} oznaczony jako paid (${amount/100} PLN)`);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as any;
        const paymentIntentId = charge.payment_intent as string;
        const { error: updErr } = await supabase
          .from("leads")
          .update({ payment_status: "refunded" })
          .eq("payment_id", paymentIntentId);
        if (updErr) console.error("Refund update failed:", updErr);
        else console.log(`✓ Płatność ${paymentIntentId} oznaczona jako refunded`);
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as any;
        const { error: updErr } = await supabase
          .from("leads")
          .update({ payment_status: "cancelled" })
          .eq("payment_id", pi.id);
        if (updErr) console.error("Failed update failed:", updErr);
        break;
      }

      default:
        console.log(`Nieobsługiwany event: ${event.type}`);
    }
  } catch (err) {
    console.error("Handler error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
