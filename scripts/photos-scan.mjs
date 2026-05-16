#!/usr/bin/env node
// Local photo scanner — reads photos/inbox/[ORDER_ID]/, strips metadata,
// flags suspicious EXIF (GPS / AI software / pro camera without Artist /
// copyright / large file), writes clean files to photos/processed/[ORDER_ID]/
// and a JSON audit report to photos/reports/[ORDER_ID].json.
//
// Dla flag wymagających kontaktu z klientem (PRO_CAMERA_NO_ARTIST,
// COPYRIGHT_PRESENT, LARGE_FILE) generuje draft maila do
// photos/drafts/[ORDER_ID]/mail-[plik].json. Wysyłka osobno przez
// `npm run photos:send` (Resend).
//
// Wariant (a) manual z PHOTO_PIPELINE_PLAN.md. Pełni rolę warstwy 3
// (technicznej) z PHOTO_LIABILITY_SAFEGUARDS.md.

import 'dotenv/config';
import { readdir, readFile, mkdir, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, resolve, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import exifr from 'exifr';
import sharp from 'sharp';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const INBOX = join(ROOT, 'photos', 'inbox');
const PROCESSED = join(ROOT, 'photos', 'processed');
const REPORTS = join(ROOT, 'photos', 'reports');
const DRAFTS = join(ROOT, 'photos', 'drafts');

const EMAIL_PLACEHOLDER = '<EMAIL_KLIENTA>';
const DEADLINE_HOURS = 72;
const FLAGS_REQUIRING_LICENSE_MAIL = new Set([
  'PRO_CAMERA_NO_ARTIST',
  'COPYRIGHT_PRESENT',
  'LARGE_FILE',
]);

const SUPPORTED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']);
const MAX_DIMENSION = 2000;
const JPEG_QUALITY = 85;
const LARGE_FILE_BYTES = 8 * 1024 * 1024;
const LARGE_PIXEL_COUNT = 24_000_000;

const AI_SOFTWARE_PATTERNS = [
  /midjourney/i,
  /dall.?e|openai|gpt.?image/i,
  /stable.?diffusion|sdxl|automatic1111|comfyui|invokeai/i,
  /adobe\s*firefly|^firefly/i,
  /nano.?banana|gemini.?image|imagen/i,
  /\bflux\b|black.?forest/i,
  /ideogram|recraft|leonardo\.ai|playground.?ai/i,
  /runway|kling|\bsora\b|google.?veo|hailuo|minimax/i,
  /lumalabs|pika.?labs|gen-?[23]/i,
];

const PRO_CAMERA_MATCHERS = [
  { make: /canon/i,     model: /EOS\s*(R[136578]|R6\s*Mark\s*II|1D\s*X|5D\s*Mark\s*(IV|V))/i },
  { make: /sony/i,      model: /(ILCE-)?(A1|A7R\s*[VIM]+|A7\s*IV|A9\s*[VIM]+|A7S\s*III|FX3|FX6)/i },
  { make: /nikon/i,     model: /(Z\s*[986]|Z\s*7\s*II|D850|D6|D780)/i },
  { make: /fujifilm/i,  model: /(GFX\s*(100|50)|X-H2|X-T5)/i },
  { make: /panasonic/i, model: /(S1H|S1R|GH6|GH7)/i },
  { make: /hasselblad/i, model: /.*/ },
  { make: /leica/i,     model: /.*/ },
];

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function formatGPS(lat, lon) {
  if (lat == null || lon == null) return null;
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}°${ns} ${Math.abs(lon).toFixed(2)}°${ew}`;
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function isProCamera(make, model) {
  if (!make || !model) return false;
  return PRO_CAMERA_MATCHERS.some(({ make: mRe, model: modRe }) =>
    mRe.test(make) && modRe.test(model)
  );
}

function detectAISoftware(software) {
  if (!software) return null;
  const hit = AI_SOFTWARE_PATTERNS.find((re) => re.test(software));
  return hit ? software.trim() : null;
}

function determineFlags(exif, fileSize, dims) {
  const flags = [];

  const aiSoftware = detectAISoftware(exif.Software);
  if (aiSoftware) {
    // Informacyjny sygnał, nie blocker — AI zdjęcia fikcyjnych osób są legalne
    // i to wybór klienta. Flaga służy do: (a) wykrycia sprzeczności z oświadczeniem
    // klienta, (b) sygnału o ewentualnym AI Act art. 50(4) disclosure (deepfake
    // realnej osoby od 2026-08-02).
    flags.push({ code: 'AI_SOFTWARE', severity: 'orange', detail: aiSoftware });
  }

  if (exif.GPSLatitude != null && exif.GPSLongitude != null) {
    flags.push({
      code: 'GPS_PRESENT',
      severity: 'orange',
      detail: formatGPS(exif.GPSLatitude, exif.GPSLongitude),
    });
  }

  if (isProCamera(exif.Make, exif.Model)) {
    const artist = (exif.Artist || '').trim();
    if (!artist) {
      flags.push({
        code: 'PRO_CAMERA_NO_ARTIST',
        severity: 'orange',
        detail: `${exif.Make} ${exif.Model}`,
      });
    }
  }

  const copyright = (exif.Copyright || '').trim();
  if (copyright) {
    flags.push({ code: 'COPYRIGHT_PRESENT', severity: 'orange', detail: copyright });
  }

  const pixelCount = (dims.width || 0) * (dims.height || 0);
  if (fileSize > LARGE_FILE_BYTES || pixelCount > LARGE_PIXEL_COUNT) {
    flags.push({
      code: 'LARGE_FILE',
      severity: 'orange',
      detail: `${formatBytes(fileSize)} · ${dims.width}×${dims.height}`,
    });
  }

  return flags;
}

function severityIcon(severity) {
  if (severity === 'red') return '🔴';
  if (severity === 'orange') return '🟠';
  return '🟡';
}

function formatDeadlinePL(date) {
  const formatter = new Intl.DateTimeFormat('pl-PL', {
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Warsaw',
  });
  const parts = formatter.formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value;
  return `${get('weekday')}, ${get('year')}-${get('month')}-${get('day')}, ${get('hour')}:${get('minute')}`;
}

async function fetchClientFromSupabase(orderId) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { source: 'env_missing', email: null, name: null };

  try {
    const response = await fetch(
      `${url}/rest/v1/leads?order_id=eq.${encodeURIComponent(orderId)}&select=email,name`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    if (!response.ok) {
      return { source: 'http_error', email: null, name: null, http_status: response.status };
    }
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return { source: 'no_match', email: null, name: null };
    }
    return { source: 'supabase', email: rows[0].email || null, name: rows[0].name || null };
  } catch (err) {
    return { source: 'fetch_error', email: null, name: null, error: err.message };
  }
}

function flagObservationSentence(flags) {
  const fragments = [];
  const byCode = Object.fromEntries(flags.map((f) => [f.code, f]));

  if (byCode.PRO_CAMERA_NO_ARTIST) {
    fragments.push(
      `ślady profesjonalnego aparatu (${byCode.PRO_CAMERA_NO_ARTIST.detail}) bez wskazania autora`
    );
  }
  if (byCode.COPYRIGHT_PRESENT) {
    fragments.push(
      `wypełnione pole właściciela praw autorskich (${byCode.COPYRIGHT_PRESENT.detail})`
    );
  }
  if (byCode.LARGE_FILE) {
    fragments.push(`bardzo dużą rozdzielczość pliku (${byCode.LARGE_FILE.detail})`);
  }

  if (fragments.length === 0) return null;
  if (fragments.length === 1) return fragments[0];
  if (fragments.length === 2) return `${fragments[0]} oraz ${fragments[1]}`;
  return `${fragments.slice(0, -1).join(', ')} oraz ${fragments[fragments.length - 1]}`;
}

function generateMailBody({ orderId, filename, observation, deadlineFormatted }) {
  return `Dzień dobry,

Dziękujemy za przesłane zdjęcia do Państwa zaproszenia (zamówienie ${orderId}).

Przy weryfikacji jednego z plików — ${filename} — widzimy w informacjach zapisanych w pliku ${observation}. To wygląda na zdjęcie od fotografa zawodowego.

Żebyśmy mogli to konkretne zdjęcie umieścić w Państwa zaproszeniu, potrzebujemy potwierdzenia, że Państwa umowa z fotografem obejmuje publikację na stronie internetowej (§ 8c Regulaminu).

Wystarczy odpowiedź jednym zdaniem, np.:
  • "Tak, umowa obejmuje publikację online"
  • albo skan / zdjęcie fragmentu umowy z fotografem
  • albo email od fotografa z potwierdzeniem licencji

Co się dzieje z Państwa zaproszeniem w międzyczasie:
Standardowy czas realizacji to 24 godziny od otrzymania kompletu danych. Brakująca licencja zatrzymuje ten zegar tylko dla tego jednego pliku — pozostałe zdjęcia oraz cała reszta projektu (plan dnia, RSVP, mapa, treści) idą do realizacji normalnie.

Termin Państwa odpowiedzi: 72 godziny od tego maila (do ${deadlineFormatted}).

Jeśli odpowiedź nie dotrze w tym czasie, zrealizujemy zaproszenie bez tego konkretnego zdjęcia. Gdyby przesłali Państwo potwierdzenie później — dodamy je w jednej z 2 rund poprawek bez dodatkowej opłaty.

Dziękujemy,
Zespół zaproszeniaonline.com
kontakt@zaproszeniaonline.com
`;
}

async function generateDraftIfNeeded({ orderId, fileResult, clientData, draftsDir, now }) {
  const licenseFlags = fileResult.flags.filter((f) => FLAGS_REQUIRING_LICENSE_MAIL.has(f.code));
  if (licenseFlags.length === 0) return null;

  const observation = flagObservationSentence(licenseFlags);
  if (!observation) return null;

  const deadline = new Date(now.getTime() + DEADLINE_HOURS * 60 * 60 * 1000);
  const deadlineFormatted = formatDeadlinePL(deadline);
  const filename = fileResult.filename_in;
  const body = generateMailBody({ orderId, filename, observation, deadlineFormatted });

  const fromAddress = process.env.RESEND_FROM || 'kontakt@zaproszeniaonline.com';
  const replyTo = process.env.RESEND_REPLY_TO || fromAddress;
  const toAddress = clientData?.email || EMAIL_PLACEHOLDER;

  const draft = {
    draft_id: `${orderId}-${filename.replace(/\.[^.]+$/, '')}-${now.getTime()}`,
    order_id: orderId,
    filename_flagged: filename,
    flags: licenseFlags,
    generated_at: now.toISOString(),
    deadline_at: deadline.toISOString(),
    deadline_formatted_pl: deadlineFormatted,
    client_email_source: clientData?.source || 'unknown',
    client_name: clientData?.name || null,
    to: toAddress,
    from: fromAddress,
    reply_to: replyTo,
    bcc: replyTo,
    subject: `[${orderId}] Pytanie o licencję — zdjęcie ${filename}`,
    body,
    status: 'draft',
  };

  const safeFilenameSegment = filename.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const draftPath = join(draftsDir, `mail-${safeFilenameSegment}.json`);
  await mkdir(draftsDir, { recursive: true });
  await writeFile(draftPath, JSON.stringify(draft, null, 2), 'utf8');
  return { draftPath, draft };
}

async function scanFile(inboxPath, processedPath) {
  const inputBuffer = await readFile(inboxPath);
  const fileStat = await stat(inboxPath);
  const hashIn = sha256(inputBuffer);

  let exif = {};
  try {
    exif = (await exifr.parse(inputBuffer, {
      tiff: true,
      ifd0: true,
      exif: true,
      gps: true,
      iptc: true,
      xmp: true,
      icc: false,
    })) || {};
  } catch (err) {
    exif = { _parseError: err.message };
  }

  const meta = await sharp(inputBuffer).metadata();
  const dims = { width: meta.width, height: meta.height };
  const flags = determineFlags(exif, fileStat.size, dims);

  const outputBuffer = await sharp(inputBuffer)
    .rotate()
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer();

  await writeFile(processedPath, outputBuffer);
  const hashOut = sha256(outputBuffer);
  const outMeta = await sharp(outputBuffer).metadata();

  return {
    filename_in: basename(inboxPath),
    filename_out: basename(processedPath),
    size_in: fileStat.size,
    size_out: outputBuffer.length,
    dimensions_in: dims,
    dimensions_out: { width: outMeta.width, height: outMeta.height },
    sha256_in: hashIn,
    sha256_out: hashOut,
    exif_summary: {
      Make: exif.Make || null,
      Model: exif.Model || null,
      Software: exif.Software || null,
      Artist: exif.Artist || null,
      Copyright: exif.Copyright || null,
      DateTimeOriginal: exif.DateTimeOriginal || null,
      GPSLatitude: exif.GPSLatitude ?? null,
      GPSLongitude: exif.GPSLongitude ?? null,
      Orientation: exif.Orientation || null,
      _parseError: exif._parseError || null,
    },
    flags,
    // Publikacja: każdy plik wymaga explicit approve w `photos:publish` przed
    // wysłaniem do Supabase Storage. Nawet `clean` (bez flag EXIF) — bo trzeba
    // sprawdzić okiem znaki wodne, osoby na zdjęciu, dokumenty (SOP kroki 1/4/5).
    publication_status: 'pending_review',
    publication_notes: null,
    publication_decided_at: null,
    mail_state: null,
    upload_state: null,
  };
}

async function main() {
  const orderId = process.argv[2];
  if (!orderId) {
    console.error('Usage: npm run photos:scan -- ORDER_ID');
    console.error('Example: npm run photos:scan -- KOW-MAZ-A1B2');
    process.exit(1);
  }

  if (!/^[A-Z0-9-]{3,32}$/.test(orderId)) {
    console.error(`✗ Invalid ORDER_ID: "${orderId}"`);
    console.error('  Expected: uppercase letters, digits, dashes (3-32 chars)');
    process.exit(1);
  }

  const inboxDir = join(INBOX, orderId);
  const processedDir = join(PROCESSED, orderId);
  const reportPath = join(REPORTS, `${orderId}.json`);

  let entries;
  try {
    entries = await readdir(inboxDir);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(`✗ Folder nie istnieje: ${inboxDir}`);
      console.error(`  Utwórz folder i wgraj zdjęcia z maila przed odpaleniem skanu.`);
      process.exit(1);
    }
    throw err;
  }

  const files = entries
    .filter((name) => SUPPORTED_EXTS.has(extname(name).toLowerCase()))
    .sort();

  if (files.length === 0) {
    console.log(`Brak wspieranych plików w ${inboxDir}`);
    console.log(`Wspierane: ${[...SUPPORTED_EXTS].join(', ')}`);
    process.exit(0);
  }

  await mkdir(processedDir, { recursive: true });
  await mkdir(REPORTS, { recursive: true });

  console.log(`\n📸 Skan: ${orderId}`);
  console.log(`   ${files.length} ${files.length === 1 ? 'plik' : 'pliki'} w ${inboxDir}\n`);

  const results = [];
  let totalIn = 0;
  let totalOut = 0;
  const errors = [];

  for (const filename of files) {
    const inboxPath = join(inboxDir, filename);
    const ext = extname(filename).toLowerCase();
    const outName = filename.replace(new RegExp(`${ext}$`, 'i'), '.jpg');
    const processedPath = join(processedDir, outName);

    try {
      const result = await scanFile(inboxPath, processedPath);
      results.push(result);
      totalIn += result.size_in;
      totalOut += result.size_out;

      const flagStr =
        result.flags.length === 0
          ? '✅ czyste'
          : result.flags
              .map((f) => `${severityIcon(f.severity)} ${f.code}${f.detail ? ': ' + f.detail : ''}`)
              .join('  ');

      const sizeStr = `${formatBytes(result.size_in).padStart(7)} → ${formatBytes(result.size_out).padStart(7)}`;
      console.log(`  ${filename.padEnd(34)} ${flagStr}`);
      console.log(`  ${''.padEnd(34)} ${sizeStr}\n`);
    } catch (err) {
      errors.push({ filename, error: err.message });
      console.log(`  ${filename.padEnd(34)} ❌ ERROR: ${err.message}\n`);
    }
  }

  const flaggedFiles = results.filter((r) => r.flags.length > 0);
  console.log('───');
  console.log(
    `   ${results.length} przetworzonych · ${formatBytes(totalIn)} → ${formatBytes(totalOut)}` +
      (totalIn > 0 ? ` (-${Math.round(((totalIn - totalOut) / totalIn) * 100)}%)` : '')
  );

  if (flaggedFiles.length > 0) {
    console.log(`\n🚩 ${flaggedFiles.length} ${flaggedFiles.length === 1 ? 'plik wymaga' : 'pliki wymagają'} sprawdzenia:`);
    for (const r of flaggedFiles) {
      const codes = r.flags.map((f) => f.code).join(', ');
      console.log(`   - ${r.filename_in}: ${codes}`);
    }
  }

  if (errors.length > 0) {
    console.log(`\n❌ ${errors.length} błędów:`);
    for (const e of errors) console.log(`   - ${e.filename}: ${e.error}`);
  }

  // Generowanie draftów mailowych dla plików flagowanych licencyjnie
  const draftsDir = join(DRAFTS, orderId);
  const filesNeedingMail = results.filter((r) =>
    r.flags.some((f) => FLAGS_REQUIRING_LICENSE_MAIL.has(f.code))
  );

  let clientData = null;
  let draftsCreated = [];
  if (filesNeedingMail.length > 0) {
    clientData = await fetchClientFromSupabase(orderId);
    const now = new Date();
    for (const fileResult of filesNeedingMail) {
      const created = await generateDraftIfNeeded({
        orderId,
        fileResult,
        clientData,
        draftsDir,
        now,
      });
      if (created) draftsCreated.push(created);
    }

    if (draftsCreated.length > 0) {
      console.log(`\n📧 ${draftsCreated.length} ${draftsCreated.length === 1 ? 'draft maila wygenerowany' : 'drafty maila wygenerowane'}:`);
      for (const { draftPath, draft } of draftsCreated) {
        const toStr = draft.to === EMAIL_PLACEHOLDER ? `${draft.to} (uzupełnij ręcznie)` : draft.to;
        console.log(`   - ${basename(draftPath)} → do: ${toStr}`);
      }
      console.log(`\n   Wyślij komendą: npm run photos:send -- ${orderId}`);

      if (clientData?.source === 'env_missing') {
        console.log(`\n   ⚠ Brak SUPABASE_URL/SERVICE_ROLE_KEY w .env — adres "To" jako placeholder.`);
        console.log(`     Wpisz email ręcznie w draftach przed wysłaniem, albo uzupełnij .env.`);
      } else if (clientData?.source === 'no_match') {
        console.log(`\n   ⚠ Supabase: brak leada z order_id="${orderId}".`);
        console.log(`     Sprawdź ORDER_ID albo wpisz email ręcznie w draftach.`);
      } else if (clientData?.source === 'http_error' || clientData?.source === 'fetch_error') {
        console.log(`\n   ⚠ Supabase: problem z fetch (${clientData.source}). Adres jako placeholder.`);
      }
    }
  }

  const report = {
    order_id: orderId,
    scanned_at: new Date().toISOString(),
    inbox_dir: inboxDir,
    processed_dir: processedDir,
    drafts_dir: draftsCreated.length > 0 ? draftsDir : null,
    file_count: results.length,
    total_size_in: totalIn,
    total_size_out: totalOut,
    flag_count: flaggedFiles.reduce((sum, r) => sum + r.flags.length, 0),
    drafts_created: draftsCreated.length,
    client_email_source: clientData?.source || null,
    files: results,
    errors,
  };

  await writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n📄 Raport: ${reportPath}`);
  console.log(`✅ Czyste pliki: ${processedDir}\n`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
