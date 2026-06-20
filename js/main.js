/* =============================================================
   main.js — Logika interaktif form pendaftaran
   Fungsi utama:
     - updateTotal()   : hitung & tampilkan total harga secara live
     - formatRupiah()  : format angka ke format mata uang Rupiah
     - validate()      : cek semua field sebelum submit
     - showError()     : tampilkan pesan error pada field tertentu
     - clearError()    : hapus pesan error pada field tertentu
     - generateKode()  : buat kode tiket unik
     - tampilkanEtiket(): isi & tampilkan kartu e-tiket + QR code
   ============================================================= */


// Harga satuan tiket (ubah di sini jika harga berubah)
const HARGA_PER_TIKET = 50000;

// Referensi elemen DOM yang dipakai berulang
const form         = document.getElementById('registrationForm');
const btnSubmit    = document.getElementById('btnSubmit');
const totalHarga   = document.getElementById('totalHarga');
const etiketWrapper = document.getElementById('etiketWrapper');

// Pasangan: elemen input ↔ elemen pesan error
const fields = {
  nama:  { el: document.getElementById('nama'),  err: document.getElementById('err-nama') },
  email: { el: document.getElementById('email'), err: document.getElementById('err-email') },
  tiket: { el: document.getElementById('tiket'), err: document.getElementById('err-tiket') },
};


/* Ubah angka ke format "Rp 50.000" */
function formatRupiah(angka) {
  return 'Rp ' + angka.toLocaleString('id-ID');
}

/* Buat kode tiket unik: WCC-XXXX-XXXX (huruf + angka, tanpa karakter mirip) */
function generateKode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let segmen1 = '', segmen2 = '';
  for (let i = 0; i < 4; i++) segmen1 += chars[Math.floor(Math.random() * chars.length)];
  for (let i = 0; i < 4; i++) segmen2 += chars[Math.floor(Math.random() * chars.length)];
  return `WCC-${segmen1}-${segmen2}`;
}

/* Isi semua elemen e-tiket lalu tampilkan, termasuk QR code dari API gratis */
function tampilkanEtiket(nama, jumlah, total, kode) {
  document.getElementById('tiket-nama').textContent   = nama;
  document.getElementById('tiket-jumlah').textContent = jumlah + ' tiket';
  document.getElementById('tiket-total').textContent  = total;
  document.getElementById('tiket-kode').textContent   = kode;

  // Tanggal pembelian (format lokal Indonesia)
  const now = new Date();
  document.getElementById('tiket-tanggal-beli').textContent =
    'Dibeli: ' + now.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

  // QR code — API gratis tanpa key: https://api.qrserver.com
  const qrData = encodeURIComponent(`${kode} | ${nama} | ${jumlah} tiket`);
  document.getElementById('tiket-qr-img').src =
    `https://api.qrserver.com/v1/create-qr-code/?size=148x148&data=${qrData}&margin=8`;

  // Sembunyikan form, tampilkan e-tiket
  document.querySelector('.form-wrapper').style.display = 'none';
  etiketWrapper.style.display = 'block';
  etiketWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* Kirim data tiket ke backend untuk diteruskan ke email via Resend */
async function kirimEmail(nama, email, jumlah, total, kode) {
  const notif = document.getElementById('email-notif');
  notif.className = 'email-notif loading';
  notif.textContent = '📨 Mengirim e-tiket ke email kamu…';
  notif.style.display = 'block';

  try {
    const resp = await fetch('/send-ticket', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ nama, email, jumlah, total, kode }),
    });
    const data = await resp.json();

    if (data.ok) {
      notif.className = 'email-notif success';
      notif.textContent = `✅ E-tiket dikirim ke ${email}`;
    } else if (data.alasan === 'no_key') {
      // API key belum diisi — tampilkan petunjuk tanpa mengganggu e-tiket
      notif.className = 'email-notif info';
      notif.textContent = '💡 Untuk kirim email otomatis, isi RESEND_API_KEY di file .env (lihat petunjuk di file tersebut).';
    } else {
      notif.className = 'email-notif error';
      notif.textContent = `⚠️ Email gagal terkirim: ${data.alasan}`;
    }
  } catch {
    // Jika server tidak jalan (mode Python statis), diam saja — e-tiket tetap tampil
    notif.style.display = 'none';
  }
}

/* Hitung total dan perbarui tampilan kotak total */
function updateTotal() {
  const raw    = fields.tiket.el.value.trim();
  const jumlah = Number(raw);
  // Hanya hitung jika angka bulat yang wajar; selain itu tampilkan harga satuan
  const valid  = raw !== '' && Number.isInteger(jumlah) && jumlah >= 1 && jumlah <= 5;
  totalHarga.textContent = formatRupiah(valid ? jumlah * HARGA_PER_TIKET : HARGA_PER_TIKET);
}

/* Tampilkan border merah + teks error pada field yang gagal validasi */
function showError(key, pesan) {
  fields[key].el.classList.add('invalid');
  fields[key].err.textContent = pesan;
  fields[key].err.style.display = 'block';
}

/* Kembalikan field ke kondisi normal (hapus error) */
function clearError(key) {
  fields[key].el.classList.remove('invalid');
  fields[key].err.style.display = 'none';
}

/* Validasi semua field; kembalikan true jika semua lolos */
function validate() {
  let lolos = true;

  const nama = fields.nama.el.value.trim();
  if (!nama) {
    showError('nama', 'Nama tidak boleh kosong.');
    lolos = false;
  } else {
    clearError('nama');
  }

  const email = fields.email.el.value.trim();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailValid) {
    showError('email', 'Masukkan alamat email yang valid.');
    lolos = false;
  } else {
    clearError('email');
  }

  const rawTiket = fields.tiket.el.value.trim();
  const jumlah   = Number(rawTiket);

  if (rawTiket === '' || isNaN(jumlah)) {
    showError('tiket', 'Jumlah tiket harus berupa angka, bukan huruf atau simbol.');
    lolos = false;
  } else if (!Number.isInteger(jumlah)) {
    showError('tiket', 'Masukkan angka bulat saja (contoh: 1, 2, atau 3) — tidak bisa pakai angka desimal.');
    lolos = false;
  } else if (jumlah <= 0) {
    showError('tiket', 'Jumlah tiket tidak boleh nol atau negatif. Minimal 1 tiket.');
    lolos = false;
  } else if (jumlah > 5) {
    showError('tiket', `Maksimal 5 tiket per transaksi — kamu memasukkan ${jumlah} tiket.`);
    lolos = false;
  } else {
    clearError('tiket');
  }

  return lolos;
}


/* ── EVENT LISTENERS ── */

// Perbarui total & hapus error setiap kali jumlah tiket diubah
fields.tiket.el.addEventListener('input', () => {
  clearError('tiket');
  updateTotal();
});

// Hapus error segera setelah pengguna mulai mengetik pada field lain
['nama', 'email'].forEach(key => {
  fields[key].el.addEventListener('input', () => clearError(key));
});

// Tangani submit form
form.addEventListener('submit', function (e) {
  e.preventDefault();

  if (!validate()) return;

  const nama   = fields.nama.el.value.trim();
  const jumlah = parseInt(fields.tiket.el.value, 10);
  const total  = formatRupiah(jumlah * HARGA_PER_TIKET);
  const kode   = generateKode();

  // Nonaktifkan tombol agar tidak bisa diklik dua kali
  btnSubmit.disabled    = true;
  btnSubmit.textContent = 'Memproses…';

  // Simulasi jeda pengiriman ke server (1.2 detik), lalu tampilkan e-tiket + kirim email
  setTimeout(() => {
    tampilkanEtiket(nama, jumlah, total, kode);
    kirimEmail(nama, fields.email.el.value.trim(), jumlah, total, kode);
  }, 1200);
});
