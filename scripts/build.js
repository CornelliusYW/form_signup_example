#!/usr/bin/env node
/* =============================================================
   scripts/build.js — Verifikasi build produksi
   Memeriksa:
     1. Semua file wajib ada
     2. Syntax file JS server-side valid (node --check)
     3. Dependensi npm terinstall
     4. Referensi antar-file konsisten (CSS & JS di-link dari HTML)
     5. Endpoint konsisten antara workshop.js dan api/daftar.js
   ============================================================= */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT  = path.join(__dirname, '..');
let errors  = 0;
let checks  = 0;

function ok(msg)   { checks++; console.log(`  ✅ ${msg}`); }
function fail(msg) { checks++; errors++; console.error(`  ❌ ${msg}`); }
function info(msg) { console.log(`\n── ${msg}`); }

/* ── 1. FILE WAJIB ADA ── */
info('Memeriksa file wajib');
const wajib = [
  'workshop.html',
  'etiket.html',
  'css/workshop.css',
  'js/workshop.js',
  'api/daftar.js',
  'api/send-ticket.js',
  'package.json',
  'vercel.json',
  '.gitignore',
  '.vercelignore',
];
for (const f of wajib) {
  const full = path.join(ROOT, f);
  fs.existsSync(full) ? ok(f) : fail(`${f} — TIDAK ADA`);
}

/* ── 2. SYNTAX JS SERVER-SIDE ── */
info('Memeriksa syntax JavaScript (server-side)');
// server.js opsional — ada di lokal, tidak ada di Vercel (dikecualikan .vercelignore)
const jsFiles = ['server.js', 'api/daftar.js', 'api/send-ticket.js', 'scripts/build.js'];
for (const f of jsFiles) {
  const full = path.join(ROOT, f);
  if (!fs.existsSync(full)) { ok(`${f} tidak ada (environment Vercel) — dilewati`); continue; }
  try {
    execSync(`node --check "${full}"`, { stdio: 'pipe' });
    ok(`Syntax ${f} valid`);
  } catch (e) {
    fail(`Syntax error di ${f}:\n     ${e.stderr?.toString().trim() || e.message}`);
  }
}

/* ── 3. DEPENDENSI TERINSTALL ── */
info('Memeriksa dependensi npm');
const pkg      = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const depNames = Object.keys(pkg.dependencies || {});
for (const dep of depNames) {
  const modPath = path.join(ROOT, 'node_modules', dep);
  fs.existsSync(modPath) ? ok(`${dep} terinstall`) : fail(`${dep} BELUM terinstall — jalankan npm install`);
}

/* ── 4. REFERENSI FILE DI HTML ── */
info('Memeriksa referensi CSS & JS di workshop.html');
const html = fs.readFileSync(path.join(ROOT, 'workshop.html'), 'utf8');
const refs  = [
  { pattern: 'css/workshop.css', file: 'css/workshop.css' },
  { pattern: 'js/workshop.js',   file: 'js/workshop.js'   },
];
for (const { pattern, file } of refs) {
  if (!html.includes(pattern)) {
    fail(`workshop.html tidak me-link ${file}`);
  } else if (!fs.existsSync(path.join(ROOT, file))) {
    fail(`${file} di-link di HTML tapi file-nya tidak ada`);
  } else {
    ok(`workshop.html → ${file}`);
  }
}

/* ── 5. ENDPOINT KONSISTEN ── */
info('Memeriksa konsistensi URL endpoint /api/daftar');
const workshopJs = fs.readFileSync(path.join(ROOT, 'js/workshop.js'), 'utf8');
const daftarPath = '/api/daftar';

workshopJs.includes(daftarPath)
  ? ok(`js/workshop.js memanggil ${daftarPath}`)
  : fail(`js/workshop.js tidak memanggil ${daftarPath} — URL endpoint tidak cocok`);

fs.existsSync(path.join(ROOT, 'api/daftar.js'))
  ? ok(`api/daftar.js (Vercel function) ada`)
  : fail(`api/daftar.js tidak ditemukan`);

/* ── RINGKASAN ── */
console.log('\n' + '─'.repeat(44));
if (errors === 0) {
  console.log(`✅ Build BERSIH — ${checks} pemeriksaan, 0 error`);
  console.log('   Proyek siap di-deploy ke Vercel.\n');
  process.exit(0);
} else {
  console.error(`❌ Build GAGAL — ${errors} dari ${checks} pemeriksaan error`);
  console.error('   Perbaiki error di atas sebelum deploy.\n');
  process.exit(1);
}
