/* =============================================================
   server.js — Backend Node.js untuk Workshop Claude Code
   Tugas:
     1. Melayani file statis (HTML, CSS, JS)
     2. Menyediakan endpoint POST /send-ticket
        → Mengirim e-tiket ke email pendaftar via Resend
        → Jika RESEND_API_KEY belum diisi, kembalikan { ok: false, alasan: 'no_key' }
          sehingga frontend tetap menampilkan e-tiket di layar
   ============================================================= */

require('dotenv').config();

const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3456;

// File penyimpanan data pendaftaran (dibuat otomatis jika belum ada)
const DATA_FILE = path.join(__dirname, 'data', 'pendaftaran.json');
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

// Parsing JSON body dari request frontend
app.use(express.json());

// Sajikan semua file statis dari folder ini (index.html, css/, js/, dll.)
app.use(express.static(path.join(__dirname)));

/* ── HELPER: generate kode tiket unik ── */
function buatKodeTiket() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // tanpa 0/O/I/1 agar tidak membingungkan
  let kode = 'WCC-';
  for (let i = 0; i < 6; i++) kode += chars[Math.floor(Math.random() * chars.length)];
  return kode;
}

/* ── ENDPOINT: simpan pendaftaran ke file lokal ── */
app.post('/api/daftar', (req, res) => {
  const { nama, email, jumlahTiket, total } = req.body;

  // Validasi input di sisi server
  if (!nama || !email || !jumlahTiket) {
    return res.status(400).json({ ok: false, pesan: 'Data tidak lengkap.' });
  }
  if (typeof jumlahTiket !== 'number' || jumlahTiket < 1 || jumlahTiket > 5) {
    return res.status(400).json({ ok: false, pesan: 'Jumlah tiket tidak valid.' });
  }

  const kodeTiket = buatKodeTiket();
  const entri = {
    kodeTiket,
    nama,
    email,
    jumlahTiket,
    total,
    waktu: new Date().toISOString(),
  };

  // Baca data yang sudah ada, tambahkan entri baru, simpan kembali
  try {
    const existing = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    existing.push(entri);
    fs.writeFileSync(DATA_FILE, JSON.stringify(existing, null, 2), 'utf8');
  } catch (err) {
    console.error('[Daftar] Gagal simpan data:', err.message);
    return res.status(500).json({ ok: false, pesan: 'Gagal menyimpan data.' });
  }

  console.log(`[Daftar] ✔ ${nama} (${email}) — ${jumlahTiket} tiket — kode: ${kodeTiket}`);
  res.json({ ok: true, kodeTiket });
});

/* ── ENDPOINT: kirim e-tiket via email ── */
app.post('/api/send-ticket', async (req, res) => {
  const { nama, email, jumlah, total, kode } = req.body;

  // Validasi sederhana di sisi server
  if (!nama || !email || !kode) {
    return res.status(400).json({ ok: false, alasan: 'data_tidak_lengkap' });
  }

  // Cek apakah API key sudah diisi
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 'ISI_API_KEY_RESEND_KAMU_DI_SINI') {
    console.log('[Email] API key belum diisi — e-tiket hanya ditampilkan di layar.');
    return res.json({ ok: false, alasan: 'no_key' });
  }

  try {
    const { Resend } = require('resend');
    const resend = new Resend(apiKey);

    await resend.emails.send({
      from   : 'Workshop Claude Code <onboarding@resend.dev>',
      to     : [email],
      subject: `E-Tiket Kamu — ${kode} | Workshop Claude Code`,
      html   : emailTemplate({ nama, jumlah, total, kode }),
    });

    console.log(`[Email] Terkirim ke ${email} (kode: ${kode})`);
    res.json({ ok: true });

  } catch (err) {
    console.error('[Email] Gagal kirim:', err.message);
    res.json({ ok: false, alasan: err.message });
  }
});

/* ── TEMPLATE HTML EMAIL ── */
function emailTemplate({ nama, jumlah, total, kode }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`${kode} | ${nama} | ${jumlah} tiket`)}&margin=8`;

  return `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;">
    <tr><td>

      <!-- Header ungu -->
      <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:16px 16px 0 0;padding:28px 32px;">
        <p style="margin:0 0 6px;font-size:0.75rem;color:rgba(255,255,255,0.7);letter-spacing:0.1em;text-transform:uppercase;">E-Tiket Resmi</p>
        <h1 style="margin:0 0 12px;font-size:1.5rem;font-weight:800;color:#fff;">Workshop Claude Code</h1>
        <p style="margin:0;font-size:0.85rem;color:rgba(255,255,255,0.8);">
          📅 Sabtu, 12 Juli 2026 &nbsp;·&nbsp; 🕘 09.00–17.00 WIB<br>
          📍 Grand Indonesia Mall, Jakarta Pusat
        </p>
      </div>

      <!-- Badan tiket -->
      <div style="background:#1e1e30;padding:28px 32px;border:1px solid rgba(255,255,255,0.08);border-top:none;">

        <!-- Greeting -->
        <p style="margin:0 0 24px;font-size:1rem;color:#94a3b8;">
          Halo <strong style="color:#e2e8f0;">${nama}</strong>, pendaftaranmu telah dikonfirmasi! 🎉
        </p>

        <!-- Data tiket dalam tabel 2 kolom -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <!-- Info kiri -->
            <td style="vertical-align:top;padding-right:24px;">
              ${infoRow('Nama', nama)}
              ${infoRow('Jumlah Tiket', jumlah + ' tiket')}
              ${infoRow('Total Bayar', total)}
              <div style="margin-top:16px;">
                <p style="margin:0 0 4px;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.08em;color:#475569;">Kode Tiket</p>
                <p style="margin:0;font-family:'Courier New',monospace;font-size:1.1rem;font-weight:700;color:#a5b4fc;letter-spacing:0.12em;">${kode}</p>
              </div>
              <div style="margin-top:16px;display:inline-block;background:rgba(74,222,128,0.12);border:1px solid rgba(74,222,128,0.3);color:#4ade80;font-size:0.78rem;font-weight:700;padding:4px 12px;border-radius:100px;">
                ✔ Terkonfirmasi
              </div>
            </td>
            <!-- QR kanan -->
            <td style="vertical-align:top;text-align:center;min-width:140px;">
              <img src="${qrUrl}" alt="QR Code" width="140" height="140"
                   style="border-radius:10px;border:3px solid rgba(255,255,255,0.08);display:block;margin:0 auto;" />
              <p style="margin:8px 0 0;font-size:0.72rem;color:#475569;">Scan untuk verifikasi</p>
            </td>
          </tr>
        </table>

        <!-- Divider -->
        <hr style="border:none;border-top:1px dashed rgba(255,255,255,0.08);margin:24px 0;">

        <p style="margin:0;font-size:0.8rem;color:#475569;line-height:1.6;">
          Tunjukkan email ini atau screenshot e-tiket di website saat check-in.<br>
          Pertanyaan? Hubungi panitia di <a href="mailto:panitia@workshop.id" style="color:#818cf8;text-decoration:none;">panitia@workshop.id</a>
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#13131f;border-radius:0 0 16px 16px;padding:16px 32px;text-align:center;">
        <p style="margin:0;font-size:0.72rem;color:#334155;">© 2026 Workshop Claude Code · Jakarta</p>
      </div>

    </td></tr>
  </table>
</body>
</html>`;
}

function infoRow(label, nilai) {
  return `
    <div style="margin-bottom:14px;">
      <p style="margin:0 0 3px;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.08em;color:#475569;">${label}</p>
      <p style="margin:0;font-size:0.95rem;font-weight:600;color:#e2e8f0;">${nilai}</p>
    </div>`;
}

app.listen(PORT, () => {
  console.log(`\n✅ Server berjalan di http://localhost:${PORT}`);
  console.log(`   Kirim email: ${process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'ISI_API_KEY_RESEND_KAMU_DI_SINI' ? '✔ API key ditemukan' : '✘ API key belum diisi (.env)'}\n`);
});
