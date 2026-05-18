#!/usr/bin/env node
// Photos apply — generuje [SLUG]/index.html na bazie nicolas-test/ template,
// wstawia URL-e zdjęć z Supabase Storage (z photos/reports/[REF].json).
//
// MVP: wstawia tylko zdjęcia + URL slug. Personal data klienta (bride, groom,
// weddingDate, palette, transport, accounts, timeline...) NIE jest automatycznie
// wstawiana — Dominika edytuje ręcznie w wygenerowanym [SLUG]/index.html.
//
// Usage:
//   npm run photos:apply -- REF SLUG [--heart=N] [--force]
//
// REF    = nazwa folderu z photos:scan/publish (np. magda-tomek)
// SLUG   = nazwa katalogu strony klienta + subdomeny (np. magda-tomek-a1b2)
//          lowercase, dashes, 3-50 znaków
// --heart=N = index zdjęcia użytego jako heart (default: 0 = pierwsze published)
// --force   = nadpisuje istniejący katalog [SLUG]/

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const TEMPLATE_DIR = join(ROOT, 'nicolas-test');
const TEMPLATE_INDEX = join(TEMPLATE_DIR, 'index.html');
const REPORTS = join(ROOT, 'photos', 'reports');

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const flags = process.argv.slice(2).filter((a) => a.startsWith('--'));
  const ref = args[0];
  const slug = args[1];
  const heartFlag = flags.find((f) => f.startsWith('--heart='));
  const heartIndex = heartFlag ? parseInt(heartFlag.split('=')[1], 10) : 0;
  const force = flags.includes('--force');

  if (!ref || !slug) {
    console.error('Usage: npm run photos:apply -- REF SLUG [--heart=N] [--force]');
    console.error('Example: npm run photos:apply -- magda-tomek magda-tomek-a1b2');
    console.error('  REF    = nazwa folderu z photos:scan/publish');
    console.error('  SLUG   = nazwa katalogu + subdomeny (lowercase, dashes, 3-50)');
    console.error('  --heart=N = index zdjęcia na centerpiece (default 0)');
    console.error('  --force   = nadpisuje istniejący [SLUG]/');
    process.exit(1);
  }

  if (!/^[a-z0-9-]{3,50}$/.test(slug)) {
    console.error(`✗ Invalid SLUG: "${slug}"`);
    console.error('  Expected: lowercase litery, cyfry, myślniki (3-50 znaków)');
    console.error('  SLUG staje się katalogiem [SLUG]/ + subdomeną [SLUG].zaproszeniaonline.com');
    process.exit(1);
  }

  // Walidacja heart index
  if (isNaN(heartIndex) || heartIndex < 0) {
    console.error(`✗ Invalid --heart=${heartFlag?.split('=')[1]} (musi być nieujemny integer)`);
    process.exit(1);
  }

  // Load report
  const reportPath = join(REPORTS, `${ref}.json`);
  let report;
  try {
    report = JSON.parse(await readFile(reportPath, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(`✗ Brak raportu: ${reportPath}`);
      console.error(`  Odpal najpierw: npm run photos:scan -- ${ref}`);
      process.exit(1);
    }
    throw err;
  }

  // Filter published files
  const published = report.files.filter(
    (f) => f.publication_status === 'published' && f.upload_state?.public_url
  );
  if (published.length === 0) {
    console.error(`✗ Brak opublikowanych plików w raporcie ${ref}`);
    console.error(`  Pliki w raporcie: ${report.files.length} (status: ${[...new Set(report.files.map((f) => f.publication_status))].join(', ')})`);
    console.error(`  Odpal: npm run photos:publish -- ${ref}`);
    process.exit(1);
  }

  if (heartIndex >= published.length) {
    console.error(`✗ --heart=${heartIndex} poza zakresem (mamy ${published.length} published, index 0-${published.length - 1})`);
    process.exit(1);
  }

  // Check target dir
  const targetDir = join(ROOT, slug);
  let targetExists = false;
  try {
    await access(targetDir);
    targetExists = true;
  } catch {
    // OK, nie istnieje
  }
  if (targetExists && !force) {
    console.error(`✗ Katalog ${slug}/ już istnieje. Użyj --force żeby nadpisać.`);
    process.exit(1);
  }

  // Build URL list
  const heart = published[heartIndex];
  const sidePhotos = published.filter((_, i) => i !== heartIndex);
  const heartUrl = heart.upload_state.public_url;
  const sideUrls = sidePhotos.map((p) => p.upload_state.public_url);

  console.log(`\n📸 Photos apply: ${ref} → ${slug}/`);
  console.log(`   Published: ${published.length} pliki`);
  console.log(`   Heart (centerpiece): ${heart.filename_out}`);
  console.log(`   Side (galeria, ${sidePhotos.length}):`);
  for (const sp of sidePhotos) console.log(`     - ${sp.filename_out}`);
  console.log('');

  // Read template
  let html = await readFile(TEMPLATE_INDEX, 'utf8');

  // Patches (kolejność ma znaczenie — szczegółowe przed ogólnymi)
  const patches = [
    {
      name: 'og:image meta',
      re: /<meta property="og:image" content="[^"]*">/g,
      replacement: `<meta property="og:image" content="${heartUrl}">`,
    },
    {
      name: 'twitter:image meta',
      re: /<meta name="twitter:image" content="[^"]*">/g,
      replacement: `<meta name="twitter:image" content="${heartUrl}">`,
    },
    {
      name: 'canonical + og:url (subdomena)',
      re: /nicolas-test\.zaproszeniaonline\.com/g,
      replacement: `${slug}.zaproszeniaonline.com`,
    },
    {
      name: 'INVITATION_SLUG',
      re: /const INVITATION_SLUG = "nicolas-test"/,
      replacement: `const INVITATION_SLUG = "${slug}"`,
    },
    {
      name: 'ourStoryHeartPhoto',
      re: /ourStoryHeartPhoto:\s*"[^"]*"/,
      replacement: `ourStoryHeartPhoto: "${heartUrl}"`,
    },
    {
      name: 'ourStoryPhotos array',
      re: /ourStoryPhotos:\s*\[[\s\S]*?\]/,
      replacement:
        sideUrls.length > 0
          ? `ourStoryPhotos: [\n    ${sideUrls.map((u) => `"${u}"`).join(',\n    ')},\n  ]`
          : `ourStoryPhotos: []`,
    },
  ];

  let patchFailed = false;
  for (const p of patches) {
    const before = html;
    html = html.replace(p.re, p.replacement);
    if (before === html) {
      console.warn(`  ⚠ Patch "${p.name}" nic nie zmieniła — template mógł się zmienić`);
      patchFailed = true;
    } else {
      console.log(`  ✓ Patch "${p.name}"`);
    }
  }

  if (patchFailed) {
    console.error(`\n✗ Co najmniej jedna patch failed. Sprawdź nicolas-test/index.html czy template jest aktualny.`);
    process.exit(1);
  }

  // Write
  await mkdir(targetDir, { recursive: true });
  await writeFile(join(targetDir, 'index.html'), html, 'utf8');

  console.log(`\n✅ Wygenerowano: ${slug}/index.html`);
  console.log(`\nCo dalej (manualnie):`);
  console.log(`  1. Otwórz ${slug}/index.html i podmień PERSONAL DATA w CONFIG (~linia 74):`);
  console.log(`     bride, groom, weddingDate, palette index (PALETTES[0..3]),`);
  console.log(`     quote, transport, accounts, gifts, rsvpDeadline, timeline, ourStory`);
  console.log(`  2. Test lokalny: npx serve . -p 8765 → http://localhost:8765/${slug}/`);
  console.log(`  3. Nicolas: A record "${slug}" → 76.76.21.21 w OVH + Add Domain w Vercel UI`);
  console.log(`  4. git add ${slug}/ && git commit && git push → Vercel auto-deploy`);
  console.log(`     URL: https://${slug}.zaproszeniaonline.com\n`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
