# Panduan Demo — Workshop Claude Code (Form Website)

Skrip prompt yang sudah dirapikan agar demo live berjalan mulus. Setiap prompt
dibuat spesifik supaya hasilnya bisa ditebak dan tidak menyimpang di depan penonton.

---

## ✅ Checklist SEBELUM demo (lakukan saat penonton belum datang)

- [ ] **Node.js 22.x** terpasang → cek: `node --version`
- [ ] **`npm install` sudah dijalankan** sekali (biar dependency ter-cache, tidak nunggu lama saat live)
- [ ] **File `.env` sudah ada**. Isi `RESEND_API_KEY` kalau mau demo kirim email betulan;
      kalau dibiarkan placeholder, e-tiket tetap muncul di layar tanpa error (aman untuk demo)
- [ ] **Vercel ↔ GitHub sudah tersambung**, repo sudah dibuat
- [ ] **Sudah deploy sukses minimal sekali** sebagai pemanasan (build cache hangat, yakin tidak error)
- [ ] **Font editor & browser diperbesar** supaya tulisan terbaca penonton
- [ ] **Punya cadangan**: simpan kode final yang sudah jalan di branch terpisah (mis. `demo-final`),
      jadi kalau live bermasalah tinggal `git checkout demo-final`

> 💡 Jam terbang LLM bersifat acak. Prompt di bawah dibuat spesifik untuk menekan variasi,
> tapi tetap **latih sekali** dengan prompt persis ini sebelum tampil.

---

## 🎬 Urutan prompt demo (siap salin-tempel)

> **11 langkah** (dari 13). Yang digabung karena memang satu tugas: **#1** (bangun + jalankan)
> dan **#9** (config deploy + script verify). Sisanya sengaja dipisah — tiap langkah adalah
> "beat" demo dengan payoff visual atau momen iterasi yang bagus ditonton.

### 1 — Bangun halaman & jalankan
> Buatkan satu halaman web untuk acara **"Workshop Claude Code"**. Tampilkan judul, tanggal
> (Sabtu, 12 Juli 2026), lokasi (Grand Indonesia Mall, Jakarta Pusat), dan deskripsi singkat
> yang menarik. Tambahkan form pendaftaran (Nama, Email, Jumlah Tiket) dan tombol "Beli Tiket".
> Pakai **HTML, CSS, dan JavaScript murni tanpa framework**, struktur rapi:
> `index.html`, `css/style.css`, `js/main.js`. Buat tampilan bersih, modern, **dark theme**, dan
> responsif untuk HP. **Lalu jalankan dan tunjukkan cara membukanya di browser.**

*Tunjukkan:* halaman muncul di preview — payoff visual pertama.

### 2 — Harga & tombol
> Buat tombol "Beli Tiket" berwarna **merah**. Tetapkan harga **Rp50.000 per tiket**, batasi
> **maksimal 5 tiket**, dan tampilkan total harga yang berubah otomatis mengikuti Jumlah Tiket.

### 3 — Jelaskan & rapikan struktur
> Tinjau struktur proyek lalu **jelaskan dengan bahasa sederhana** (untuk penonton non-teknis):
> ada file apa saja, peran masing-masing, dan bagaimana mereka saling terhubung. Kalau masih ada
> yang kurang rapi atau minim komentar, **rapikan & beri komentar berbahasa Indonesia seperlunya** —
> jangan over-engineer.

### 4 — Tes otomatis
> Tuliskan tes otomatis untuk form dengan skenario: (1) Nama/Email kosong → peringatan & data
> tidak terkirim; (2) Jumlah Tiket = 2 → total Rp100.000; (3) format email salah → pesan error
> jelas; (4) semua benar → konfirmasi berhasil. Pakai **test runner berbasis browser sederhana**
> (buka `tests/test.html`), **tanpa menambah dependency**. Jalankan semua tes dan tandai LULUS (hijau)/GAGAL (merah).

### 5 — Uji "pengguna iseng" (edge cases)
> Uji form seperti pengguna iseng: isi Jumlah Tiket dengan angka **minus**, **huruf**,
> **desimal (mis. 1.5)**, dan **angka sangat besar**. Tolak semua input tidak wajar dengan pesan
> ramah, lalu tambahkan tesnya. Pastikan desimal seperti 1.5 ikut ditolak
> (**gunakan `Number.isInteger`, bukan `parseInt`**).

*Catatan:* beat "anti-iseng" — tunjukkan Claude menolak input nakal (minus, huruf, `1.5`, angka raksasa)
dengan pesan ramah. Hint `Number.isInteger` menjaga desimal tetap ketolak saat live.

### 6 — E-tiket + QR code
> Setelah pendaftaran berhasil, tampilkan **e-tiket** di layar: nama, jumlah, total, **kode tiket
> unik**, status terkonfirmasi, dan **QR code** (pakai `api.qrserver.com`, tanpa API key).
> Desain seperti tiket dengan garis perforasi.

### 7 — Kirim e-tiket via email (Resend)
> Kirim e-tiket ke email pendaftar memakai **Resend** (paket gratis). Simpan API key di `.env`
> (**jangan di kode frontend**). Kalau API key belum diisi, cukup tampilkan e-tiket di layar tanpa
> error. Buat **endpoint serverless untuk Vercel di `api/send-ticket.js`** dan **server lokal**
> (`server.js`) untuk pengembangan. Frontend memanggil URL yang sama: `/api/send-ticket`.
> Pastikan **`.env` langsung masuk `.gitignore`** begitu dibuat, supaya kunci tidak mungkin ter-commit.
> Di `package.json`, taruh **`express` & `dotenv` sebagai devDependencies** (hanya `resend` di
> `dependencies`) dan **jangan tambahkan script `build`** — biar nanti Vercel langsung mengenalinya
> sebagai situs statis + serverless, bukan Node server. Jadi di #9 tinggal verifikasi, bukan membetulkan.

### 8 — Peta lokasi
> Tambahkan peta lokasi di bawah deskripsi memakai **OpenStreetMap (embed iframe)**, menunjuk ke
> Grand Indonesia Mall. Tanpa API key.

### 9 — Siap deploy Vercel: config + verify  ⭐ (langkah paling penting)
> Siapkan proyek agar siap deploy ke Vercel **sebagai situs statis + satu serverless function,
> BUKAN Node server**. Ketentuan:
> - `vercel.json` pakai konfigurasi **`builds` eksplisit**: `api/send-ticket.js` → `@vercel/node`;
>   `index.html`, `css/**`, `js/**` → `@vercel/static`; dengan route `/api/send-ticket` →
>   `/api/send-ticket.js`, lalu `filesystem`, lalu fallback ke `index.html`.
> - **Jangan ada script `build`** di `package.json` (agar Vercel tidak mengira ini Node server &
>   mencari entrypoint). Sebagai gantinya buat **`npm run verify`** yang mengecek: file wajib ada,
>   syntax JS valid, dependency terpasang, dan referensi antar-file konsisten.
> - `express` & `dotenv` → **devDependencies**; `resend` → **dependencies**.
> - `server.js` hanya untuk lokal → masukkan ke **`.vercelignore`** bersama `.env` dan `.claude/`.
> - Pin `engines.node` ke **`22.x`**.
>
> Jalankan `npm run verify`, pastikan bersih, lalu jelaskan singkat apa yang dikonfigurasi.

*Kenapa begini:* `builds` eksplisit membuat Vercel mengabaikan auto-deteksi & setting dashboard,
jadi error "No entrypoint found" tidak muncul. Ini hasil akhir yang sudah terbukti jalan.

### 10 — Keamanan kunci
> Pastikan tidak ada kunci rahasia / `.env` yang ikut ter-commit. Periksa & lengkapi `.gitignore`
> (semua varian `.env`, `node_modules`, file OS/editor). Sebutkan kunci apa yang perlu saya isi di
> Settings Vercel.

### 11 — Polish tampilan akhir
> Cek tampilan di layar lebar dan di HP, hilangkan teks contoh/placeholder & data uji yang tidak
> perlu. Beri tahu kalau masih ada yang perlu dirapikan.

---

## 🚀 Saat deploy live (lakukan SETELAH prompt #11 selesai)

1. **Push commit BARU** ke GitHub (jangan klik "Redeploy" commit lama — perubahan tidak ikut).
2. Pastikan baris `Commit:` di log Vercel menunjukkan **hash terbaru**, bukan commit sebelumnya.
3. Kunci di Vercel: **Settings → Environment Variables →** tambah `RESEND_API_KEY` (kalau pakai email),
   **lalu redeploy** agar kunci terbaca (env var baru tidak berlaku pada deploy yang sudah jalan).
4. Kalau ragu cache: **Redeploy → matikan "Use existing Build Cache"**.
5. **Verifikasi production** (ini penutup demo): buka URL `*.vercel.app`, daftar satu tiket uji →
   pastikan **e-tiket + QR muncul**; kalau kunci sudah diisi, **cek email masuk**. Inilah bukti
   "dari nol sampai live" yang paling meyakinkan penonton.

---

## 🆘 Rencana cadangan kalau ada yang gagal live

| Masalah | Langkah cepat |
|---------|---------------|
| Prompt menghasilkan output meleset | "Urungkan, kembalikan ke versi sebelumnya" lalu ulangi prompt |
| Preview tidak muncul | `git checkout demo-final` → tunjukkan versi jadi |
| Deploy Vercel error | Tunjukkan URL deploy pemanasan yang sudah sukses |
| Email tidak terkirim | Tetap lanjut — e-tiket di layar sudah cukup sebagai bukti |

---

## 🎤 Tips penyampaian

- **Ceritakan niatnya sebelum mengetik prompt** — penonton paham "apa" sebelum melihat "bagaimana".
- **Diam sebentar saat Claude bekerja** — biarkan penonton membaca perubahan yang berjalan.
- **Soroti momen iteratif** (tes gagal → diperbaiki → hijau) — itu kekuatan utama Claude Code.
- **Tutup dengan e-tiket + QR + situs live** — akhir yang konkret dan berkesan.
