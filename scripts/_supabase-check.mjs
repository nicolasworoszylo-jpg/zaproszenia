#!/usr/bin/env node
// Jednorazowy test connectivity Supabase — verify czy SERVICE_ROLE_KEY działa
// i czy bucket `lead-attachments` jest public. NIE wyświetla klucza w outpucie.
// Po teście można usunąć ten plik.

import 'dotenv/config';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('✗ Brak SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY w .env');
  process.exit(1);
}

console.log(`URL: ${url}`);
console.log(`Klucz: ${key.length} znaków, format ${key.startsWith('eyJ') ? 'JWT ✓' : 'inny ⚠'}`);
console.log('');

// Bucket invitation-photos — kiedy utworzony, kto owner
const rb = await fetch(`${url}/storage/v1/bucket/invitation-photos`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
if (rb.ok) {
  const b = await rb.json();
  console.log(`[META] Bucket invitation-photos:`);
  console.log(`       created_at: ${b.created_at}`);
  console.log(`       updated_at: ${b.updated_at}`);
  console.log(`       owner: ${b.owner || '(brak — utworzony przez UI/Studio jako admin)'}`);
  console.log(`       public: ${b.public}, file_size_limit: ${b.file_size_limit || 'brak'}, allowed_mime: ${(b.allowed_mime_types || []).join(',') || 'brak'}`);
}

// Najstarszy i najnowszy lead - kiedy tabela jest w użyciu
const rl1 = await fetch(`${url}/rest/v1/leads?select=id,created_at,name&order=created_at.asc&limit=1`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
const rl2 = await fetch(`${url}/rest/v1/leads?select=id,created_at,name&order=created_at.desc&limit=1`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
const rl3 = await fetch(`${url}/rest/v1/leads?select=count`, { headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'count=exact' } });
if (rl1.ok && rl2.ok) {
  const oldest = await rl1.json();
  const newest = await rl2.json();
  const count = rl3.headers.get('content-range');
  console.log(`[META] Tabela leads:`);
  console.log(`       najstarszy: ${oldest[0]?.created_at || 'pusto'} ${oldest[0]?.name ? '(' + oldest[0].name + ')' : ''}`);
  console.log(`       najnowszy:  ${newest[0]?.created_at || 'pusto'} ${newest[0]?.name ? '(' + newest[0].name + ')' : ''}`);
  console.log(`       count: ${count}`);
}
console.log('');

const headers = { apikey: key, Authorization: `Bearer ${key}` };

// Test 1: REST API auth (czy klucz w ogóle działa)
const r1 = await fetch(`${url}/rest/v1/leads?select=order_id&limit=1`, { headers });
const t1 = await r1.text();
console.log(`[1/3] REST API /leads: ${r1.status} ${r1.ok ? '✓ OK' : '✗ FAIL'}`);
if (!r1.ok) console.log(`      ${t1.slice(0, 200)}`);

// Test 2: Storage bucket exists + public flag
const r2 = await fetch(`${url}/storage/v1/bucket/lead-attachments`, { headers });
if (r2.ok) {
  const b = await r2.json();
  const publicIcon = b.public ? '✓ public' : '⚠ PRIVATE (URL-e public_url nie zadziałają na stronie klienta)';
  console.log(`[2/3] Bucket "lead-attachments": ✓ istnieje, ${publicIcon}`);
  console.log(`      created: ${b.created_at}, file_size_limit: ${b.file_size_limit || 'none'}`);
} else {
  const t2 = await r2.text();
  console.log(`[2/3] Bucket "lead-attachments": ${r2.status} ${t2.slice(0, 200)}`);
}

// Test 3: Lista wszystkich buckets (informacyjnie)
const r3 = await fetch(`${url}/storage/v1/bucket`, { headers });
if (r3.ok) {
  const buckets = await r3.json();
  console.log(`[3/4] Wszystkie buckets: ${buckets.map(b => `${b.name}${b.public ? '(public)' : '(private)'}`).join(', ')}`);
} else {
  console.log(`[3/4] List buckets: ${r3.status}`);
}

// Test 3b: Co jest w bucket invitation-photos (konwencja nazewnictwa folderów)
const r3b = await fetch(`${url}/storage/v1/object/list/invitation-photos`, {
  method: 'POST',
  headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify({ prefix: '', limit: 50, offset: 0 }),
});
if (r3b.ok) {
  const items = await r3b.json();
  if (items.length === 0) {
    console.log(`[3b]  invitation-photos: PUSTY bucket`);
  } else {
    console.log(`[3b]  invitation-photos top-level (${items.length}):`);
    for (const it of items.slice(0, 20)) {
      console.log(`        - ${it.name} ${it.id ? '(file)' : '(folder)'}`);
    }
  }
} else {
  console.log(`[3b]  invitation-photos list: ${r3b.status}`);
}

// Test 4: Schema tabeli leads (jakie kolumny tak naprawde sa)
const r4 = await fetch(`${url}/rest/v1/leads?select=*&limit=1`, { headers });
if (r4.ok) {
  const rows = await r4.json();
  if (rows.length > 0) {
    console.log(`[4/4] leads columns (${Object.keys(rows[0]).length}): ${Object.keys(rows[0]).join(', ')}`);
  } else {
    console.log(`[4/4] leads: pusta tabela — sprawdzam przez OPTIONS`);
    const r4b = await fetch(`${url}/rest/v1/leads?limit=0`, { headers, method: 'HEAD' });
    console.log(`      HEAD ${r4b.status}, Content-Range: ${r4b.headers.get('content-range')}`);
  }
} else {
  console.log(`[4/4] leads schema: ${r4.status} ${(await r4.text()).slice(0,200)}`);
}
