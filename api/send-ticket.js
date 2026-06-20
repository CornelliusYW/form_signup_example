/* =============================================================
   api/send-ticket.js — Vercel Serverless Function
   Dipanggil oleh frontend saat pengguna klik "Beli Tiket".
   Vercel otomatis menjalankan file ini di /api/send-ticket.
   Tidak perlu Express — Vercel menyediakan req/res langsung.
   ============================================================= */

const { Resend } = require('resend');

module.exports = async (req, res) => {
  // Hanya terima metode POST
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, alasan: 'method_not_allowed' });
  }

  const { nama, email, jumlah, total, kode } = req.body || {};

  if (!nama || !email || !kode) {
    return res.status(400).json({ ok: false, alasan: 'data_tidak_lengkap' });
  }

  // Di Vercel, env vars diisi lewat dashboard — tidak perlu dotenv
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 'ISI_API_KEY_RESEND_KAMU_DI_SINI') {
    return res.json({ ok: false, alasan: 'no_key' });
  }

  try {
    const resend = new Resend(apiKey);

    await resend.emails.send({
      from   : 'Workshop Claude Code <onboarding@resend.dev>',
      to     : [email],
      subject: `E-Tiket Kamu — ${kode} | Workshop Claude Code`,
      html   : emailTemplate({ nama, jumlah, total, kode }),
    });

    res.json({ ok: true });

  } catch (err) {
    res.status(500).json({ ok: false, alasan: err.message });
  }
};

/* ── TEMPLATE HTML EMAIL (inline CSS untuk kompatibilitas email client) ── */
function emailTemplate({ nama, jumlah, total, kode }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`${kode} | ${nama} | ${jumlah} tiket`)}&margin=8`;

  return `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;">
    <tr><td>
      <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:16px 16px 0 0;padding:28px 32px;">
        <p style="margin:0 0 6px;font-size:0.75rem;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.1em;">E-Tiket Resmi</p>
        <h1 style="margin:0 0 12px;font-size:1.5rem;font-weight:800;color:#fff;">Workshop Claude Code</h1>
        <p style="margin:0;font-size:0.85rem;color:rgba(255,255,255,0.8);">
          📅 Sabtu, 12 Juli 2026 &nbsp;·&nbsp; 🕘 09.00–17.00 WIB<br>
          📍 Grand Indonesia Mall, Jakarta Pusat
        </p>
      </div>
      <div style="background:#1e1e30;padding:28px 32px;border:1px solid rgba(255,255,255,0.08);border-top:none;">
        <p style="margin:0 0 24px;font-size:1rem;color:#94a3b8;">
          Halo <strong style="color:#e2e8f0;">${nama}</strong>, pendaftaranmu telah dikonfirmasi! 🎉
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
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
            <td style="vertical-align:top;text-align:center;min-width:140px;">
              <img src="${qrUrl}" alt="QR Code" width="140" height="140"
                   style="border-radius:10px;border:3px solid rgba(255,255,255,0.08);display:block;margin:0 auto;" />
              <p style="margin:8px 0 0;font-size:0.72rem;color:#475569;">Scan untuk verifikasi</p>
            </td>
          </tr>
        </table>
        <hr style="border:none;border-top:1px dashed rgba(255,255,255,0.08);margin:24px 0;">
        <p style="margin:0;font-size:0.8rem;color:#475569;line-height:1.6;">
          Tunjukkan email ini atau screenshot e-tiket di website saat check-in.<br>
          Pertanyaan? Hubungi panitia di <a href="mailto:panitia@workshop.id" style="color:#818cf8;text-decoration:none;">panitia@workshop.id</a>
        </p>
      </div>
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
