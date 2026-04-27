/**
 * Vercel Edge Function: dynamiczny Open Graph image per zaproszenie.
 *
 * Endpoint: /api/og?slug=anna-michal&names=Anna%20%26%20Micha%C5%82&date=20%20czerwca%202026
 *
 * Generuje obrazek 1200x630 PNG na żywo używając @vercel/og (satori + resvg).
 * Cache HTTP 1 godzina + s-maxage 24 godziny → szybkie ładowanie unfurl
 * w FB/LinkedIn/Messenger/WhatsApp/iMessage.
 *
 * UŻYCIE w przyszłości (po multi-tenant):
 *   <meta property="og:image" content="https://zaproszeniaonline.com/api/og?slug=anna-michal&names=Anna%20i%20Micha%C5%82&date=20%20czerwca%202026">
 *
 * Para wysyła link `zaproszeniaonline.com/anna-michal` na Messenger →
 * unfurl pokazuje JEJ zaproszenie, nie generic og-image.png.
 *
 * DEPLOY:
 *   1. Wgraj `package.json` z dependencją:  "@vercel/og": "^0.6.5"
 *   2. Push - Vercel automatycznie wykryje Edge Function w /api/og.ts
 *   3. Test: https://zaproszeniaonline.com/api/og?names=Anna%20%26%20Micha%C5%82&date=20%20czerwca%202026
 *
 * Aktualnie: kod gotowy ale NIEAKTYWNY do czasu wdrożenia multi-tenant
 * + dodania @vercel/og do package.json. Static og-image.png z brand-em
 * pełni rolę dla landing+demo (HTTP 200 z głównego pliku).
 */

import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

export default function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const names = searchParams.get("names") ?? "Twoje Imiona";
  const date = searchParams.get("date") ?? "Wkrótce";
  const eyebrow = searchParams.get("eyebrow") ?? "ZAPROSZENIE ŚLUBNE";

  return new ImageResponse(
    {
      type: "div",
      props: {
        style: {
          height: "100%", width: "100%",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "linear-gradient(170deg, #1E2B1F 0%, #2C3E2D 50%, #1E2B1F 100%)",
          color: "#FAF6EF", padding: 60, position: "relative",
        },
        children: [
          // gold corners
          { type: "div", props: { style: { position: "absolute", top: 50, left: 50, width: 80, height: 1, background: "#C9A96E" } } },
          { type: "div", props: { style: { position: "absolute", top: 50, left: 50, width: 1, height: 80, background: "#C9A96E" } } },
          { type: "div", props: { style: { position: "absolute", top: 50, right: 50, width: 80, height: 1, background: "#C9A96E" } } },
          { type: "div", props: { style: { position: "absolute", top: 50, right: 50, width: 1, height: 80, background: "#C9A96E" } } },
          { type: "div", props: { style: { position: "absolute", bottom: 50, left: 50, width: 80, height: 1, background: "#C9A96E" } } },
          { type: "div", props: { style: { position: "absolute", bottom: 50, left: 50, width: 1, height: 80, background: "#C9A96E" } } },
          { type: "div", props: { style: { position: "absolute", bottom: 50, right: 50, width: 80, height: 1, background: "#C9A96E" } } },
          { type: "div", props: { style: { position: "absolute", bottom: 50, right: 50, width: 1, height: 80, background: "#C9A96E" } } },

          // eyebrow
          {
            type: "div",
            props: {
              style: { fontSize: 22, letterSpacing: 8, color: "#C9A96E", marginBottom: 20, fontFamily: "sans-serif" },
              children: eyebrow,
            },
          },

          // names (italic serif)
          {
            type: "div",
            props: {
              style: { fontSize: 110, fontStyle: "italic", color: "#FAF6EF", lineHeight: 1.05, textAlign: "center", fontFamily: "serif" },
              children: names,
            },
          },

          // gold divider line
          { type: "div", props: { style: { width: 120, height: 1, background: "#C9A96E", margin: "30px 0 20px" } } },

          // date
          {
            type: "div",
            props: {
              style: { fontSize: 28, color: "rgba(250,246,239,0.75)", letterSpacing: 4, textTransform: "uppercase", fontFamily: "sans-serif" },
              children: date,
            },
          },

          // domain at bottom
          {
            type: "div",
            props: {
              style: { position: "absolute", bottom: 70, fontSize: 18, color: "#C9A96E", letterSpacing: 3, fontFamily: "sans-serif" },
              children: "zaproszeniaonline.com",
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    }
  );
}
