#!/usr/bin/env node
// Playwright smoke test dla strony klienta - sprawdza KAŻDĄ sekcję realnie w browserze.
// Wykrywa kategorie bugów których curl + meta-check NIE łapią:
//   - puste timeline icons (cocktail/dance/inne nie w TLIcons)
//   - Hotels schema mismatch (myślniki zamiast adresów)
//   - audio MEDIA_ELEMENT_ERROR (link do strony Pixabay zamiast pliku)
//   - JS exceptions, missing assets (404 vendor/*.js)
//   - React mount fail (splash nie znika)
//   - sekcje wycięte przez warunkowe rendery
//
// Uzycie: node scripts/smoke-browser-test.mjs <slug>
// Exit 0 = OK, exit 1 = FAIL (z konkretnym powodem)
// Wymagana: @playwright/test (auto-install przez npx jezeli brak)

import { chromium } from "playwright";

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node smoke-browser-test.mjs <slug>");
  console.error("Example: node smoke-browser-test.mjs maja-kuba-2026-10");
  process.exit(1);
}

const URL = `https://${slug}.zaproszeniaonline.com/?smoke=${Date.now()}`;
const TIMEOUT_MS = 30_000;

console.log(`→ Smoke test: ${URL}`);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

const consoleErrors = [];
const failedRequests = [];

page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (err) => consoleErrors.push(`PAGE: ${err.message}`));
page.on("response", (resp) => {
  if (resp.status() >= 400) {
    failedRequests.push(`${resp.status()} ${resp.url()}`);
  }
});

const fail = (msg) => {
  console.error(`\n❌ FAIL: ${msg}`);
  if (consoleErrors.length) {
    console.error(`   Console errors (${consoleErrors.length}):`);
    consoleErrors.slice(0, 5).forEach((e) => console.error(`     - ${e.slice(0, 200)}`));
  }
  if (failedRequests.length) {
    console.error(`   Failed requests (${failedRequests.length}):`);
    failedRequests.slice(0, 5).forEach((r) => console.error(`     - ${r}`));
  }
  process.exit(1);
};

try {
  await page.goto(URL, { waitUntil: "networkidle", timeout: TIMEOUT_MS });
  // Daj React czas na hydratacje sekcji
  await page.waitForTimeout(1500);

  // T1: Title niepusty z myślnikiem (format: "X i Y - DD MM YYYY")
  const title = await page.title();
  if (title.length < 10 || !title.includes("-")) {
    fail(`Bad title: "${title}" (expected format: "Imię i Imię - DD miesiąc YYYY")`);
  }
  console.log(`  ✓ Title: ${title}`);

  // T2: Splash hidden (React wystartowal)
  const splashOk = await page.evaluate(() => {
    const splash = document.getElementById("demo-loading");
    if (!splash) return true; // brak splasha = OK
    return splash.classList.contains("hidden") || getComputedStyle(splash).opacity === "0";
  });
  if (!splashOk) fail('Splash "Ładowanie zaproszenia…" NIE zniknął - React nie wystartował (vendor 404?)');
  console.log(`  ✓ Splash hidden (React mounted)`);

  // T3: Sekcje obecne - sprawdz po nagłówkach
  const headings = await page.evaluate(() =>
    Array.from(document.querySelectorAll("h1, h2, h3")).map((h) => h.innerText)
  );
  const expectedSections = [
    { name: "Gdzie i kiedy", required: true },
    { name: "Plan dnia", required: true },
    { name: "Nasza historia", required: false },
    { name: "Wszystko co musisz wiedzieć", required: true },
    { name: "Będziesz z nami", required: true },
  ];
  for (const { name, required } of expectedSections) {
    const found = headings.some((h) => h.includes(name));
    if (!found && required) fail(`Brakuje wymaganej sekcji: "${name}"`);
    console.log(`  ${found ? "✓" : "−"} Sekcja "${name}"${found ? "" : " (opcjonalna, brak)"}`);
  }

  // T4: Timeline icons - kazda .tl-icon ma SVG (nie puste kolko)
  const timeline = await page.evaluate(() => {
    const icons = Array.from(document.querySelectorAll(".tl-icon"));
    return {
      total: icons.length,
      withSvg: icons.filter((i) => !!i.querySelector("svg")).length,
    };
  });
  if (timeline.total > 0 && timeline.withSvg < timeline.total) {
    fail(`Timeline icons: ${timeline.withSvg}/${timeline.total} mają SVG - reszta to PUSTE kółka (icon spoza TLIcons)`);
  }
  console.log(`  ✓ Timeline icons: ${timeline.withSvg}/${timeline.total}`);

  // T5: Hotels (jezeli sekcja istnieje) - render content nie tylko myslniki
  const hotelsCheck = await page.evaluate(() => {
    const szcz = document.querySelector("#szczegoly");
    if (!szcz) return { skip: true };
    const noclegiBlock = szcz.innerText.match(/NOCLEGI[\s\S]{0,800}/)?.[0] || "";
    if (!noclegiBlock) return { skip: true };
    // Hotels render: jezeli widoczne nazwy hoteli (h.name), kolejne pola (h.address/distance/phone)
    // powinny dac >30 sensownych znakow (nie tylko " - " i " | ").
    const meaningful = noclegiBlock.replace(/NOCLEGI|[-|\s]/g, "").length;
    return { skip: false, meaningful, preview: noclegiBlock.slice(0, 150) };
  });
  if (!hotelsCheck.skip && hotelsCheck.meaningful < 40) {
    fail(`Hotels section render mismatch (tylko ${hotelsCheck.meaningful} znaków treści). Preview: ${hotelsCheck.preview}`);
  }
  console.log(`  ${hotelsCheck.skip ? "−" : "✓"} Hotels: ${hotelsCheck.skip ? "(brak sekcji)" : "render OK"}`);

  // T6: Audio - jezeli renderowany, NIE moze miec MEDIA_ELEMENT_ERROR
  const audioCheck = await page.evaluate(() => {
    const audio = document.querySelector("audio");
    if (!audio) return { skip: true };
    return {
      skip: false,
      src: audio.src,
      error: audio.error?.message,
      networkState: audio.networkState,
    };
  });
  if (!audioCheck.skip && audioCheck.error) {
    fail(`Audio ${audioCheck.error} dla src=${audioCheck.src} (bgMusicUrl prawdopodobnie link do strony, nie pliku audio)`);
  }
  console.log(`  ${audioCheck.skip ? "−" : "✓"} Audio: ${audioCheck.skip ? "(brak, OK)" : "playable"}`);

  // T7: Console errors threshold 0
  if (consoleErrors.length > 0) {
    fail(`${consoleErrors.length} console errors (oczekiwano 0)`);
  }
  console.log(`  ✓ Console errors: 0`);

  // T8: Failed network requests
  const criticalFails = failedRequests.filter((r) => !/favicon|robots\.txt|sitemap/.test(r));
  if (criticalFails.length > 0) {
    fail(`${criticalFails.length} failed network requests (vendor/photos/fonts 404?)`);
  }
  console.log(`  ✓ Network requests: 0 critical fails`);

  // T9: SSL - jezeli HTTPS connection OK, page response OK
  const response = await page.goto(URL.replace(/\?smoke=\d+/, "?ssl=" + Date.now()), {
    waitUntil: "domcontentloaded",
    timeout: 10_000,
  });
  if (!response.ok()) fail(`HTTP ${response.status()} na finalnej weryfikacji`);
  console.log(`  ✓ HTTPS response: ${response.status()}`);

  // T10: Body content threshold (klient nie widzi pustej strony)
  const bodyLen = await page.evaluate(() => document.body.innerText.length);
  if (bodyLen < 500) fail(`Body za krótki: ${bodyLen} znaków (oczekiwano >500 - klient widzi pustą stronę)`);
  console.log(`  ✓ Body content: ${bodyLen} znaków`);

  console.log(`\n✅ Smoke test PASS dla ${slug}`);
  process.exit(0);
} catch (e) {
  fail(`Exception: ${e.message}`);
} finally {
  await browser.close();
}
