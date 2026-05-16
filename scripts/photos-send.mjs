#!/usr/bin/env node
// Photo draft email sender — reads drafts from photos/drafts/[ORDER_ID]/,
// shows each one in terminal, asks [y]/n/[e]dit/[q]uit. On 'y' sends via
// Resend API from kontakt@zaproszeniaonline.com (with BCC and Reply-To
// to kontakt@), logs to photos/sent/[ORDER_ID]/[file].json.
//
// Requires .env with RESEND_API_KEY. See .env.example.

import 'dotenv/config';
import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { Resend } from 'resend';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const DRAFTS = join(ROOT, 'photos', 'drafts');
const SENT = join(ROOT, 'photos', 'sent');
const EMAIL_PLACEHOLDER = '<EMAIL_KLIENTA>';

function openInEditor(filePath) {
  return new Promise((resolveExit, rejectExit) => {
    const editor =
      process.env.VISUAL ||
      process.env.EDITOR ||
      (process.platform === 'win32' ? 'notepad' : 'vi');

    const child = spawn(editor, [filePath], {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    child.on('exit', (code) => {
      if (code === 0) resolveExit();
      else rejectExit(new Error(`Editor exited with code ${code}`));
    });
    child.on('error', rejectExit);
  });
}

function printDraftPreview(draft, index, total) {
  const sep = '━'.repeat(70);
  console.log(`\n${sep}`);
  console.log(`📧 Draft ${index}/${total} — ${draft.order_id}`);
  console.log('');
  console.log(`Do:       ${draft.to}${draft.to === EMAIL_PLACEHOLDER ? '  ⚠ PLACEHOLDER — uzupełnij przed wysłaniem' : ''}`);
  console.log(`Od:       ${draft.from}`);
  console.log(`Reply-To: ${draft.reply_to}`);
  console.log(`BCC:      ${draft.bcc}`);
  console.log(`Temat:    ${draft.subject}`);
  console.log(`Deadline: ${draft.deadline_formatted_pl}`);
  console.log(`Flagi:    ${draft.flags.map((f) => f.code).join(', ')}`);
  console.log(sep);
  console.log('');
  console.log(draft.body);
  console.log(sep);
}

async function sendViaResend(resend, draft) {
  const result = await resend.emails.send({
    from: draft.from,
    to: [draft.to],
    bcc: draft.bcc ? [draft.bcc] : undefined,
    replyTo: draft.reply_to,
    subject: draft.subject,
    text: draft.body,
  });
  if (result.error) {
    throw new Error(`Resend error: ${JSON.stringify(result.error)}`);
  }
  return result.data;
}

async function logSent(orderId, draft, resendResult) {
  const sentDir = join(SENT, orderId);
  await mkdir(sentDir, { recursive: true });
  const safeFilenameSegment = draft.filename_flagged
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  const logPath = join(sentDir, `mail-${safeFilenameSegment}.json`);
  const logEntry = {
    ...draft,
    status: 'sent',
    sent_at: new Date().toISOString(),
    resend_message_id: resendResult?.id || null,
  };
  await writeFile(logPath, JSON.stringify(logEntry, null, 2), 'utf8');
  return logPath;
}

async function main() {
  const orderId = process.argv[2];
  if (!orderId) {
    console.error('Usage: npm run photos:send -- ORDER_ID');
    console.error('Example: npm run photos:send -- KOW-MAZ-A1B2');
    process.exit(1);
  }

  if (!/^[A-Z0-9-]{3,32}$/.test(orderId)) {
    console.error(`✗ Invalid ORDER_ID: "${orderId}"`);
    process.exit(1);
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('✗ Brak RESEND_API_KEY w .env');
    console.error('  Skopiuj .env.example → .env i wypełnij. Klucz: https://resend.com/api-keys');
    process.exit(1);
  }

  const draftsDir = join(DRAFTS, orderId);
  let entries;
  try {
    entries = await readdir(draftsDir);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(`✗ Brak folderu draftów: ${draftsDir}`);
      console.error(`  Najpierw odpal: npm run photos:scan -- ${orderId}`);
      process.exit(1);
    }
    throw err;
  }

  const draftFiles = entries.filter((n) => n.startsWith('mail-') && n.endsWith('.json')).sort();
  if (draftFiles.length === 0) {
    console.log(`Brak draftów w ${draftsDir} (możliwe że żaden plik nie wymaga maila).`);
    process.exit(0);
  }

  const resend = new Resend(apiKey);
  const rl = createInterface({ input, output });

  console.log(`\n📬 Wysyłka draftów dla zamówienia ${orderId}`);
  console.log(`   ${draftFiles.length} ${draftFiles.length === 1 ? 'draft' : 'drafty'} do przejrzenia`);
  console.log(`   Komendy: [y]es=wyślij, [n]o=pomiń, [e]dit=edytuj, [q]uit=przerwij`);

  let sentCount = 0;
  let skippedCount = 0;
  let i = 0;

  for (const draftFile of draftFiles) {
    i++;
    const draftPath = join(draftsDir, draftFile);
    let draft;
    try {
      draft = JSON.parse(await readFile(draftPath, 'utf8'));
    } catch (err) {
      console.error(`\n✗ Nieczytelny draft ${draftFile}: ${err.message}`);
      skippedCount++;
      continue;
    }

    let action = null;
    while (action !== 'y' && action !== 'n') {
      printDraftPreview(draft, i, draftFiles.length);
      const answer = (await rl.question('Wysłać? [y/n/e/q]: ')).trim().toLowerCase();

      if (answer === 'q') {
        console.log('\nPrzerwane przez użytkownika.');
        await rl.close();
        printSummary(sentCount, skippedCount, draftFiles.length);
        process.exit(0);
      }

      if (answer === 'e') {
        try {
          await openInEditor(draftPath);
          draft = JSON.parse(await readFile(draftPath, 'utf8'));
          console.log('\n✓ Draft przeładowany po edycji.');
        } catch (err) {
          console.error(`\n✗ Edycja nieudana: ${err.message}`);
        }
        continue;
      }

      if (answer === 'y' || answer === 'yes' || answer === 't' || answer === 'tak') {
        if (draft.to === EMAIL_PLACEHOLDER || !draft.to || !draft.to.includes('@')) {
          console.error(`\n✗ Nie wyślę — adres "To" jest placeholderem lub nieprawidłowy: "${draft.to}"`);
          console.error(`  Użyj [e]dit żeby wpisać prawdziwy email, albo [n] żeby pominąć.`);
          continue;
        }
        action = 'y';
        break;
      }

      if (answer === 'n' || answer === 'no' || answer === 'nie') {
        action = 'n';
        break;
      }

      console.log('Nieznana komenda. Wpisz: y, n, e, lub q.');
    }

    if (action === 'n') {
      console.log(`⏭  Pominięto: ${draftFile}`);
      skippedCount++;
      continue;
    }

    try {
      const resendResult = await sendViaResend(resend, draft);
      const logPath = await logSent(orderId, draft, resendResult);
      console.log(`✅ Wysłano. Resend message ID: ${resendResult?.id || '(brak)'}`);
      console.log(`   Log: ${logPath}`);
      sentCount++;
    } catch (err) {
      console.error(`❌ Błąd wysyłki: ${err.message}`);
      skippedCount++;
    }
  }

  await rl.close();
  printSummary(sentCount, skippedCount, draftFiles.length);
}

function printSummary(sent, skipped, total) {
  console.log(`\n───`);
  console.log(`   Wysłane: ${sent} · Pominięte: ${skipped} · Razem: ${total}\n`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
