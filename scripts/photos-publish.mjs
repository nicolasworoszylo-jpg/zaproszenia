#!/usr/bin/env node
// Photo publication — interactive review + upload to Supabase Storage.
// Reads photos/reports/[ORDER_ID].json, walks through each file asking
// [a]pproved / [r]ejected / [w]ait. After ALL files are resolved, asks
// final confirmation and uploads approved files to Supabase Storage
// bucket `lead-attachments/processed/[ORDER_ID]/`. Updates leads.notes
// with publication summary.
//
// Idempotent: re-run skips already-published files.
//
// Requires .env with SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
// See .env.example.

import 'dotenv/config';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, resolve, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const REPORTS = join(ROOT, 'photos', 'reports');
const PROCESSED = join(ROOT, 'photos', 'processed');

const SUPABASE_BUCKET = 'lead-attachments';
const SUPABASE_PATH_PREFIX = 'processed';

const STATUS_LABELS = {
  pending_review: '⏳ Czeka na decyzję',
  approved: '✅ Zatwierdzone',
  rejected: '❌ Odrzucone',
  published: '📤 Opublikowane',
};

function severityIcon(severity) {
  if (severity === 'red') return '🔴';
  if (severity === 'orange') return '🟠';
  return '🟡';
}

function contentTypeFor(filename) {
  const ext = extname(filename).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.heic' || ext === '.heif') return 'image/heic';
  return 'application/octet-stream';
}

async function saveReport(reportPath, report) {
  await writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
}

function printFileBlock(file) {
  const sep = '─'.repeat(70);
  console.log(`\n${sep}`);
  console.log(`📷 ${file.filename_in}  →  ${file.filename_out}`);
  console.log(`   Wymiary: ${file.dimensions_out?.width}×${file.dimensions_out?.height} px`);
  console.log(`   Status: ${STATUS_LABELS[file.publication_status] || file.publication_status}`);

  if (file.flags && file.flags.length > 0) {
    console.log(`   Flagi:`);
    for (const f of file.flags) {
      console.log(`     ${severityIcon(f.severity)} ${f.code}${f.detail ? ': ' + f.detail : ''}`);
    }
  } else {
    console.log(`   Flagi: brak (EXIF czysty — ale sprawdź okiem znaki wodne / osoby / dokumenty)`);
  }

  if (file.mail_state) {
    console.log(`   📧 Mail wysłany: ${file.mail_state.sent_at}`);
    console.log(`      Do: ${file.mail_state.to}`);
    console.log(`      Resend ID: ${file.mail_state.resend_message_id || '(brak)'}`);
  }

  if (file.publication_notes) {
    console.log(`   📝 Notatka: ${file.publication_notes}`);
  }

  console.log(sep);
}

async function uploadFileToStorage({ url, key, bucket, objectPath, body, contentType }) {
  const uploadUrl = `${url}/storage/v1/object/${bucket}/${objectPath}`;
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Supabase Storage ${response.status}: ${errText}`);
  }

  const data = await response.json().catch(() => ({}));
  return {
    object_path: objectPath,
    public_url: `${url}/storage/v1/object/public/${bucket}/${objectPath}`,
    storage_response: data,
  };
}

async function appendLeadNote(orderId, noteLine) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return { ok: false, reason: 'env_missing' };
  }

  try {
    const getRes = await fetch(
      `${url}/rest/v1/leads?order_id=eq.${encodeURIComponent(orderId)}&select=id,notes`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    if (!getRes.ok) return { ok: false, reason: 'get_failed', status: getRes.status };
    const rows = await getRes.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return { ok: false, reason: 'no_lead_match' };
    }
    const lead = rows[0];
    const prefix = lead.notes ? `${lead.notes}\n` : '';
    const newNotes = `${prefix}${noteLine}`;

    const patchRes = await fetch(`${url}/rest/v1/leads?id=eq.${lead.id}`, {
      method: 'PATCH',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ notes: newNotes }),
    });
    if (!patchRes.ok) {
      const errText = await patchRes.text();
      return { ok: false, reason: 'patch_failed', status: patchRes.status, detail: errText };
    }
    return { ok: true, lead_id: lead.id };
  } catch (err) {
    return { ok: false, reason: 'exception', error: err.message };
  }
}

async function reviewFile(rl, file, reportPath, report) {
  if (file.publication_status === 'published') {
    console.log(`\n📷 ${file.filename_in}  →  ✅ Już opublikowane (skip)`);
    return 'kept';
  }
  if (file.publication_status === 'rejected') {
    console.log(`\n📷 ${file.filename_in}  →  ❌ Wcześniej odrzucone (skip): ${file.publication_notes || '(brak notatki)'}`);
    return 'kept';
  }
  if (file.publication_status === 'approved') {
    console.log(`\n📷 ${file.filename_in}  →  ✅ Wcześniej zatwierdzone (skip)`);
    return 'kept';
  }

  printFileBlock(file);

  if (file.flags?.some((f) => ['PRO_CAMERA_NO_ARTIST', 'COPYRIGHT_PRESENT', 'LARGE_FILE'].includes(f.code))) {
    if (!file.mail_state) {
      console.log(`   ⚠ Ten plik ma flagę licencyjną, ale mail do klienta NIE został wysłany.`);
      console.log(`     Odpal najpierw: npm run photos:send -- ${report.order_id}`);
      console.log(`     Albo zaznacz "rejected" jeśli świadomie pomijasz ten plik.`);
    }
  }

  while (true) {
    const answer = (await rl.question('Decyzja? [a]pproved / [r]ejected / [w]ait: ')).trim().toLowerCase();

    if (answer === 'w' || answer === 'wait') {
      return 'wait';
    }

    if (answer === 'a' || answer === 'approved' || answer === 't' || answer === 'tak') {
      const note = (await rl.question('Krótka notatka (opcjonalna): ')).trim();
      file.publication_status = 'approved';
      file.publication_notes = note || null;
      file.publication_decided_at = new Date().toISOString();
      await saveReport(reportPath, report);
      console.log(`   ✓ Zatwierdzone.`);
      return 'approved';
    }

    if (answer === 'r' || answer === 'rejected' || answer === 'n' || answer === 'nie') {
      let note = (await rl.question('Powód odrzucenia (wymagane): ')).trim();
      while (!note) {
        note = (await rl.question('   Powód jest wymagany. Wpisz cokolwiek żeby było w audit logu: ')).trim();
      }
      file.publication_status = 'rejected';
      file.publication_notes = note;
      file.publication_decided_at = new Date().toISOString();
      await saveReport(reportPath, report);
      console.log(`   ✓ Odrzucone: ${note}`);
      return 'rejected';
    }

    console.log('   Nieznana odpowiedź. Wpisz: a, r, lub w.');
  }
}

async function main() {
  const orderId = process.argv[2];
  if (!orderId) {
    console.error('Usage: npm run photos:publish -- ORDER_ID');
    process.exit(1);
  }

  if (!/^[A-Z0-9-]{3,32}$/.test(orderId)) {
    console.error(`✗ Invalid ORDER_ID: "${orderId}"`);
    process.exit(1);
  }

  const reportPath = join(REPORTS, `${orderId}.json`);
  let report;
  try {
    report = JSON.parse(await readFile(reportPath, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(`✗ Brak raportu skanu: ${reportPath}`);
      console.error(`  Odpal najpierw: npm run photos:scan -- ${orderId}`);
      process.exit(1);
    }
    throw err;
  }

  if (!Array.isArray(report.files) || report.files.length === 0) {
    console.log(`Brak plików w raporcie ${reportPath}.`);
    process.exit(0);
  }

  console.log(`\n📋 Publikacja: ${orderId}`);
  console.log(`   ${report.files.length} ${report.files.length === 1 ? 'plik' : 'plików'} w raporcie skanu.`);

  const rl = createInterface({ input, output, terminal: process.stdin.isTTY });

  let waitedOut = false;
  for (const file of report.files) {
    const result = await reviewFile(rl, file, reportPath, report);
    if (result === 'wait') {
      console.log(`\n⏸  Przerwane (wait). Stan zapisany — wróć później przez:`);
      console.log(`     npm run photos:publish -- ${orderId}`);
      waitedOut = true;
      break;
    }
  }

  if (waitedOut) {
    await rl.close();
    process.exit(0);
  }

  // Wszystkie pliki rozstrzygnięte (approved / rejected / published)
  const toUpload = report.files.filter((f) => f.publication_status === 'approved');
  const alreadyPublished = report.files.filter((f) => f.publication_status === 'published');
  const rejected = report.files.filter((f) => f.publication_status === 'rejected');

  console.log(`\n───`);
  console.log(`   Podsumowanie:`);
  console.log(`     ✅ Do uploadu w tej rundzie:   ${toUpload.length}`);
  console.log(`     📤 Już wcześniej opublikowane: ${alreadyPublished.length}`);
  console.log(`     ❌ Odrzucone:                  ${rejected.length}`);

  if (toUpload.length === 0) {
    console.log(`\nNic do uploadu w tej rundzie. Stan zapisany.\n`);
    await rl.close();
    process.exit(0);
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error(`\n✗ Brak SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY w .env`);
    console.error(`  Stan publikacji zapisany — uzupełnij .env i uruchom ponownie.`);
    await rl.close();
    process.exit(1);
  }

  const confirm = (await rl.question(
    `\nUpload ${toUpload.length} ${toUpload.length === 1 ? 'pliku' : 'plików'} do Supabase Storage ` +
      `(${SUPABASE_BUCKET}/${SUPABASE_PATH_PREFIX}/${orderId}/)? [y/N]: `
  )).trim().toLowerCase();

  if (confirm !== 'y' && confirm !== 'yes' && confirm !== 't' && confirm !== 'tak') {
    console.log(`\nAnulowane. Stan zapisany.\n`);
    await rl.close();
    process.exit(0);
  }

  console.log(``);
  let uploadedCount = 0;
  let uploadErrors = [];
  for (const file of toUpload) {
    const localPath = join(PROCESSED, orderId, file.filename_out);
    try {
      const body = await readFile(localPath);
      const objectPath = `${SUPABASE_PATH_PREFIX}/${orderId}/${file.filename_out}`;
      const result = await uploadFileToStorage({
        url: supabaseUrl,
        key: serviceKey,
        bucket: SUPABASE_BUCKET,
        objectPath,
        body,
        contentType: contentTypeFor(file.filename_out),
      });

      file.publication_status = 'published';
      file.upload_state = {
        uploaded_at: new Date().toISOString(),
        bucket: SUPABASE_BUCKET,
        object_path: result.object_path,
        public_url: result.public_url,
      };
      await saveReport(reportPath, report);
      console.log(`  ✅ ${file.filename_out} → ${objectPath}`);
      uploadedCount++;
    } catch (err) {
      uploadErrors.push({ filename: file.filename_out, error: err.message });
      console.error(`  ❌ ${file.filename_out}: ${err.message}`);
    }
  }

  console.log(`\n   Upload: ${uploadedCount} OK · ${uploadErrors.length} błędów`);

  // Auto-notatka w leads.notes
  const totalPublished = report.files.filter((f) => f.publication_status === 'published').length;
  const totalRejected = report.files.filter((f) => f.publication_status === 'rejected').length;
  const ts = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const noteLine =
    `${ts} | photos:publish | ${uploadedCount} zdj opublikowane do ${SUPABASE_BUCKET}/${SUPABASE_PATH_PREFIX}/${orderId}/ ` +
    `(razem ${totalPublished}/${report.files.length}, odrzucone: ${totalRejected})`;

  console.log(`\n📝 Zapisuję notatkę do leads.notes...`);
  const noteResult = await appendLeadNote(orderId, noteLine);
  if (noteResult.ok) {
    console.log(`   ✓ Dopisano do leads.id=${noteResult.lead_id}`);
  } else {
    console.log(`   ⚠ Nie udało się: ${noteResult.reason}${noteResult.detail ? ' — ' + noteResult.detail : ''}`);
    console.log(`   Dopisz ręcznie w Supabase Studio (lead.order_id=${orderId}):`);
    console.log(`   "${noteLine}"`);
  }

  console.log(`\n✅ Gotowe. Nicolas zobaczy pliki w Supabase Studio przy leadzie ${orderId}.\n`);
  await rl.close();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
