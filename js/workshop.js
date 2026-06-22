// --- Konfigurasi ---
const TICKET_PRICE = 50000; // harga per tiket dalam Rupiah
const TICKET_MAX   = 5;

// --- Referensi elemen DOM ---
const form         = document.getElementById('registrationForm');
const nameInput    = document.getElementById('name');
const emailInput   = document.getElementById('email');
const ticketInput  = document.getElementById('tickets');
const totalEl      = document.getElementById('totalPrice');
const submitBtn    = document.getElementById('submitBtn');
const formBody     = document.getElementById('formBody');
const successMsg   = document.getElementById('successMsg');

// --- Kalkulasi harga ---
function formatRupiah(amount) {
  return 'Rp ' + amount.toLocaleString('id-ID');
}

function updateTotal() {
  const qty = parseInt(ticketInput.value, 10);
  // Hanya tampilkan harga jika nilai valid; selain itu tampilkan tanda tanya
  totalEl.textContent = (Number.isInteger(qty) && qty >= 1 && qty <= TICKET_MAX)
    ? formatRupiah(qty * TICKET_PRICE)
    : '—';
}

ticketInput.addEventListener('input', updateTotal);
updateTotal(); // tampilkan harga awal saat halaman dimuat

// --- Validasi field ---
function validateField(input) {
  const errorEl = input.closest('.field').querySelector('.field-error');
  let valid = true;
  let msg   = '';

  input.classList.remove('invalid', 'valid');

  const value = input.value.trim();

  if (input.id === 'name') {
    if (!value)              { msg = 'Nama wajib diisi.'; valid = false; }
    else if (value.length < 2) { msg = 'Nama minimal 2 karakter.'; valid = false; }
  }

  if (input.id === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value)                   { msg = 'Email wajib diisi.'; valid = false; }
    else if (!emailRegex.test(value)) { msg = 'Format email tidak valid.'; valid = false; }
  }

  if (input.id === 'tickets') {
    const raw = input.value;
    const num = Number(raw);

    if (raw === '' || isNaN(num)) {
      // Huruf atau kosong — browser otomatis kosongkan value saat huruf diketik di number input
      msg = 'Jumlah tiket tidak valid. Ketik angka antara 1 dan ' + TICKET_MAX + '.';
      valid = false;
    } else if (!Number.isInteger(num)) {
      msg = 'Jumlah tiket harus angka bulat, bukan desimal (contoh: 1, 2, 3).';
      valid = false;
    } else if (num <= 0) {
      msg = 'Jumlah tiket tidak boleh nol atau negatif. Minimal 1 tiket.';
      valid = false;
    } else if (num > TICKET_MAX) {
      msg = 'Maksimal ' + TICKET_MAX + ' tiket per pendaftaran. Kamu memasukkan ' + num + '.';
      valid = false;
    }
  }

  if (errorEl) {
    errorEl.textContent = msg;
    errorEl.classList.toggle('show', !valid);
  }
  input.classList.add(valid ? 'valid' : 'invalid');
  return valid;
}

// Validasi saat field ditinggal (blur) atau dikoreksi setelah error (input)
document.querySelectorAll('#registrationForm input').forEach(input => {
  input.addEventListener('blur',  () => validateField(input));
  input.addEventListener('input', () => { if (input.classList.contains('invalid')) validateField(input); });
});

// --- Submit form ---
form.addEventListener('submit', function (e) {
  e.preventDefault();

  const nameOk   = validateField(nameInput);
  const emailOk  = validateField(emailInput);
  const ticketOk = validateField(ticketInput);
  if (!nameOk || !emailOk || !ticketOk) return;

  const qty = parseInt(ticketInput.value, 10);

  // Tampilkan animasi loading pada tombol
  submitBtn.classList.add('loading');
  submitBtn.disabled = true;

  // Kirim data ke endpoint backend
  fetch('/api/daftar', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nama:        nameInput.value.trim(),
      email:       emailInput.value.trim(),
      jumlahTiket: qty,
      total:       qty * TICKET_PRICE,
    }),
  })
  .then(r => r.json())
  .then(data => {
    submitBtn.classList.remove('loading');

    if (data.ok) {
      // Redirect ke halaman e-tiket dengan semua data di query params
      const params = new URLSearchParams({
        kode:  data.kodeTiket,
        nama:  nameInput.value.trim(),
        email: emailInput.value.trim(),
        qty,
        total: qty * TICKET_PRICE,
      });
      window.location.href = '/etiket.html?' + params.toString();
    } else {
      // Server menolak — kembalikan tombol agar pengguna bisa coba lagi
      submitBtn.disabled = false;
      alert('Pendaftaran gagal: ' + (data.pesan || 'Terjadi kesalahan di server.'));
    }
  })
  .catch(() => {
    // Tidak bisa terhubung ke server
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
    alert('Tidak dapat terhubung ke server. Pastikan server berjalan dan coba lagi.');
  });
});
