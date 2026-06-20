#!/usr/bin/env node
/* =============================================================
   scripts/build.js — Verifikasi build produksi
   Memeriksa:
     1. Semua file wajib ada
     2. Syntax file JS server-side valid (node --check)
     3. Dependensi npm terinstall
     4. Referensi antar-file konsisten (CSS & JS di-link dari HTML)
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
  'index.html',
  'css/style.css',
  'js/main.js',
  'server.js',
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
const jsFiles = ['server.js', 'api/send-ticket.js', 'scripts/build.js'];
for (const f of jsFiles) {
  const full = path.join(ROOT, f);
  if (!fs.existsSync(full)) { fail(`${f} tidak ditemukan`); continue; }
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
info('Memeriksa referensi CSS & JS di index.html');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const refs  = [
  { pattern: 'href="css/style.css"', file: 'css/style.css' },
  { pattern: 'src="js/main.js"',     file: 'js/main.js'    },
];
for (const { pattern, file } of refs) {
  if (!html.includes(pattern)) {
    fail(`index.html tidak me-link ${file} (pattern: ${pattern})`);
  } else if (!fs.existsSync(path.join(ROOT, file))) {
    fail(`${file} di-link di HTML tapi file-nya tidak ada`);
  } else {
    ok(`index.html → ${file}`);
  }
}

/* ── 5. ENDPOINT KONSISTEN ── */
info('Memeriksa konsistensi URL endpoint email');
const mainJs   = fs.readFileSync(path.join(ROOT, 'js/main.js'), 'utf8');
const serverJs = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const apiPath  = '/api/send-ticket';

mainJs.includes(apiPath)
  ? ok(`js/main.js memanggil ${apiPath}`)
  : fail(`js/main.js tidak memanggil ${apiPath} — URL endpoint tidak cocok`);

serverJs.includes(apiPath)
  ? ok(`server.js mendefinisikan ${apiPath}`)
  : fail(`server.js tidak mendefinisikan ${apiPath}`);

fs.existsSync(path.join(ROOT, 'api/send-ticket.js'))
  ? ok(`api/send-ticket.js (Vercel function) ada`)
  : fail(`api/send-ticket.js tidak ditemukan`);

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
