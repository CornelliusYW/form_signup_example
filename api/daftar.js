/* =============================================================
   api/daftar.js — Vercel Serverless Function
   Menerima data form, menyimpan ke file, mengembalikan kode tiket.

   Catatan storage:
     - Lokal (dev) : data/pendaftaran.json
     - Vercel (prod): /tmp/pendaftaran.json
       /tmp bisa ditulis di serverless, tapi bersifat ephemeral
       (reset saat cold start). Untuk produksi nyata, gunakan DB.
   ============================================================= */

const fs   = require('fs');
const path = require('path');

const DATA_FILE = process.env.VERCEL
  ? '/tmp/pendaftaran.json'
  : path.join(__dirname, '..', 'data', 'pendaftaran.json');

function buatKodeTiket() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // tanpa 0/O/I/1
  let kode = 'WCC-';
  for (let i = 0; i < 6; i++) kode += chars[Math.floor(Math.random() * chars.length)];
  return kode;
}

function bacaData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function simpanData(arr) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2), 'utf8');
}

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, pesan: 'Method not allowed.' });
  }

  const { nama, email, jumlahTiket, total } = req.body || {};

  if (!nama || !email || !jumlahTiket) {
    return res.status(400).json({ ok: false, pesan: 'Data tidak lengkap.' });
  }
  if (typeof jumlahTiket !== 'number' || jumlahTiket < 1 || jumlahTiket > 5) {
    return res.status(400).json({ ok: false, pesan: 'Jumlah tiket tidak valid.' });
  }

  const kodeTiket = buatKodeTiket();
  const entri = { kodeTiket, nama, email, jumlahTiket, total, waktu: new Date().toISOString() };

  try {
    const existing = bacaData();
    existing.push(entri);
    simpanData(existing);
  } catch (err) {
    console.error('[Daftar] Gagal simpan:', err.message);
    return res.status(500).json({ ok: false, pesan: 'Gagal menyimpan data.' });
  }

  console.log(`[Daftar] ✔ ${nama} — kode: ${kodeTiket}`);
  res.json({ ok: true, kodeTiket });
};
