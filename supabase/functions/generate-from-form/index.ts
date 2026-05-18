// Edge Function: generate-from-form
// Klient submituje wypełniony brief z /klient-start/?token=... -> ta funkcja:
//   1. Validate token (paid + not expired + status awaiting_brief)
//   2. Generate slug z bride+groom+date
//   3. Upload base64 photos -> Supabase Storage `client-photos/<slug>/`
//   4. Build full brief.json
//   5. POST GitHub API workflow_dispatch dla auto-client.yml
//   6. UPDATE briefs SET status='generating', slug, data, photos URLs, github_run_id
//   7. Return { slug, url } -> klient widzi gotowy URL
//
// Wymaga env:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-set przez Supabase)
//   GITHUB_TOKEN (PAT z workflow scope)
//   GITHUB_REPO (np. "nicolasworoszylo-jpg/zaproszenia")

// @ts-ignore
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN")!;
const GITHUB_REPO = Deno.env.get("GITHUB_REPO") || "nicolasworoszylo-jpg/zaproszenia";

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface FormBrief {
  bride: string;
  groom?: string;
  weddingDate: string;       // "2026-06-20"
  weddingTime: string;       // "15:00"
  ceremonyVenue: string;
  ceremonyAddress: string;
  receptionVenue: string;
  receptionAddress: string;
  palette: "forest" | "navy" | "bordo" | "terracotta";
  quote?: string;
  giftsText: string;
  accountHolder: string;
  accountIban: string;
  photos: string[];          // base64 dataURLs (max 5)
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function slugify(s: string): string {
  return s.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50);
}

// Build full brief.json zgodnie z formatem oczekiwanym przez scripts/new-client.py
function buildBriefJson(form: FormBrief, slug: string, photoUrls: string[]) {
  const date = form.weddingDate + "T" + form.weddingTime + ":00";
  const dateObj = new Date(date);
  const rsvpDate = new Date(dateObj.getTime() - 35 * 86400_000);
  const polishMonths = ['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia'];
  const rsvpDeadline = `${rsvpDate.getDate()} ${polishMonths[rsvpDate.getMonth()]} ${rsvpDate.getFullYear()}`;

  return {
    slug,
    bride: form.bride.trim(),
    groom: (form.groom || "").trim(),
    weddingDate: date,
    rsvpDeadline,
    quote: form.quote || "Każda wielka miłość zaczyna się od jednego spojrzenia",
    palette: form.palette,
    ceremony: {
      title: "Ceremonia ślubna",
      venue: form.ceremonyVenue,
      address: form.ceremonyAddress,
      time: form.weddingTime,
      mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.ceremonyVenue + " " + form.ceremonyAddress)}`,
    },
    reception: {
      title: "Przyjęcie weselne",
      venue: form.receptionVenue,
      address: form.receptionAddress,
      time: addHours(form.weddingTime, 2),
      mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.receptionVenue + " " + form.receptionAddress)}`,
    },
    timeline: defaultTimeline(form.weddingTime, form.ceremonyVenue, form.receptionVenue),
    ourStory: [],
    photos: {
      heart: photoUrls[0] || "",
      side: photoUrls.slice(1, 5),
    },
    dressCode: defaultDressCode(form.palette),
    gifts: form.giftsText || "Waszą obecność uważamy za największy prezent.",
    accounts: [
      { holder: form.accountHolder, iban: form.accountIban },
    ],
    guestsCount: 0,  // klient nie podaje teraz (mozna dodac w wizard pozniej)
    features: ["rsvp","countdown","timeline","maps","gifts","music","qr"],
  };
}

function addHours(time: string, h: number): string {
  const [hh, mm] = time.split(":").map(Number);
  return `${String((hh + h) % 24).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function defaultTimeline(time: string, ceremony: string, reception: string) {
  return [
    { time, event: "Ceremonia ślubna", desc: ceremony, icon: "church" },
    { time: addHours(time, 1), event: "Sesja & koktajl", desc: "Czas na zdjęcia i lampkę szampana", icon: "camera" },
    { time: addHours(time, 2), event: "Kolacja weselna", desc: reception, icon: "dinner" },
    { time: addHours(time, 5), event: "Tort & pierwszy taniec", desc: "Najsłodszy moment wieczoru", icon: "cake" },
    { time: addHours(time, 6), event: "Zabawa!", desc: "Parkiet czeka na Was", icon: "party" },
  ];
}

function defaultDressCode(palette: string) {
  const colors: Record<string, string[]> = {
    forest: ["#2C3E2D","#6B7B5E","#8B6F47","#C4A77D","#D4A373"],
    navy: ["#1B2838","#3E5266","#7B829E","#D4A0A0","#E8C5C5"],
    bordo: ["#4A1C2B","#7B2D3F","#A85B6E","#C8A87C","#D4B88E"],
    terracotta: ["#6B2F22","#A8482B","#D17C45","#E0A878","#F0E1C7"],
  };
  return {
    main: "Elegancko - garnitury i sukienki koktajlowe.",
    note: "Prosimy o unikanie bieli - ten kolor zarezerwowany dla Pary Młodej.",
    colors: colors[palette] || colors.bordo,
  };
}

async function uploadPhoto(slug: string, idx: number, dataUrl: string): Promise<string> {
  // dataUrl: "data:image/jpeg;base64,..."
  const m = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!m) throw new Error(`Invalid dataURL at idx ${idx}`);
  const ext = m[1] === "jpeg" ? "jpg" : m[1];
  const bytes = Uint8Array.from(atob(m[2]), c => c.charCodeAt(0));
  const path = `${slug}/photo-${String(idx + 1).padStart(2, "0")}.${ext}`;
  const { error } = await sb.storage.from("client-photos").upload(path, bytes, {
    contentType: `image/${m[1]}`,
    upsert: true,
  });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  const { data } = sb.storage.from("client-photos").getPublicUrl(path);
  return data.publicUrl;
}

async function triggerGithubWorkflow(slug: string, token: string) {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/auto-client.yml/dispatches`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GITHUB_TOKEN}`,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        ref: "main",
        inputs: { slug, token },
      }),
    }
  );
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GitHub API ${res.status}: ${txt}`);
  }
  return res.status === 204; // No Content = OK
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders() });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  try {
    const { token, brief } = await req.json() as { token: string; brief: FormBrief };
    if (!token || !brief) throw new Error("Missing token or brief");
    if (!brief.bride || !brief.weddingDate || !brief.palette) throw new Error("Missing required fields");

    // 1. Validate token
    const { data: existing, error: e1 } = await sb.from("briefs").select("*").eq("token", token).maybeSingle();
    if (e1) throw new Error(`DB read: ${e1.message}`);
    if (!existing) throw new Error("Invalid token");
    if (existing.status !== "awaiting_brief") throw new Error(`Brief już ${existing.status} (token uzyty)`);
    if (new Date(existing.expires_at) < new Date()) throw new Error("Token wygasł (>30 dni)");

    // 2. Generate slug
    let baseSlug = slugify(brief.bride + (brief.groom ? "-" + brief.groom : "") + "-" + brief.weddingDate.slice(0, 7));
    // Ensure unique
    let slug = baseSlug;
    let attempt = 0;
    while (attempt < 10) {
      const { data: exists } = await sb.from("briefs").select("id").eq("slug", slug).maybeSingle();
      if (!exists) break;
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    // 3. Upload photos
    const photoUrls: string[] = [];
    for (let i = 0; i < (brief.photos || []).length; i++) {
      try {
        const url = await uploadPhoto(slug, i, brief.photos[i]);
        photoUrls.push(url);
      } catch (e) {
        console.error(`Photo upload ${i} failed:`, e);
      }
    }

    // 4. Build brief.json
    const briefJson = buildBriefJson(brief, slug, photoUrls);

    // 5. UPDATE briefs (przed GH dispatch - jezeli dispatch padnie, mamy state)
    const { error: e2 } = await sb.from("briefs").update({
      slug,
      data: briefJson,
      photos: photoUrls,
      status: "generating",
      submitted_at: new Date().toISOString(),
    }).eq("token", token);
    if (e2) throw new Error(`DB update: ${e2.message}`);

    // 6. POST GitHub workflow_dispatch
    await triggerGithubWorkflow(slug, token);

    // 7. Return
    return new Response(JSON.stringify({
      slug,
      url: `https://${slug}.zaproszeniaonline.com/`,
      url_fallback: `https://zaproszeniaonline.com/${slug}/`,
    }), {
      status: 200,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("generate-from-form error:", e);
    return new Response(JSON.stringify({ error: e.message || "Internal error" }), {
      status: 400,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  }
});
