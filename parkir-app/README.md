# Aplikasi Parkir

Aplikasi pengelolaan parkir berbasis web yang dibuat untuk tugas **UKK RPL**. Aplikasi ini memiliki tiga peran pengguna (admin, petugas, owner) dengan hak akses yang dipisahkan, transaksi masuk/keluar kendaraan, cetak struk, rekap pendapatan, dan log aktivitas.

**Stack:** React + Vite + Tailwind CSS + Recharts + Axios + JsBarcode + ZXing · Express + MySQL (mysql2) + JWT + bcryptjs · MySQL/MariaDB (XAMPP)

---

## Daftar Isi

1. [Fitur Utama](#fitur-utama)
2. [Struktur Folder](#struktur-folder)
3. [Prasyarat](#prasyarat)
4. [Instalasi](#instalasi)
5. [Menjalankan Aplikasi](#menjalankan-aplikasi)
6. [Akun Demo](#akun-demo)
7. [Aturan Bisnis](#aturan-bisnis)
8. [Dokumentasi API](#dokumentasi-api)
9. [User Database & Hak Akses](#user-database--hak-akses)
10. [Known Bugs / Keterbatasan](#known-bugs--keterbatasan)
11. [Rencana Pengembangan](#rencana-pengembangan)
12. [Troubleshooting](#troubleshooting)

---

## Fitur Utama

### Admin

- Dashboard statistik: jumlah user, kendaraan, kapasitas/okupansi area, pendapatan hari ini, transaksi aktif, grafik pendapatan 7 hari, dan transaksi terbaru.
- **Kelola User**: tambah, ubah, aktif/nonaktifkan, hapus akun; pencarian, filter role, sorting, paginasi. Admin tidak dapat menghapus akun sendiri, menonaktifkan akun sendiri, atau mengubah role akun sendiri.
- **Tarif Parkir**: CRUD tarif per jenis kendaraan (motor, mobil, lainnya).
- **Area Parkir**: CRUD area beserta kapasitas dan jumlah terisi.
- **Kendaraan**: CRUD data kendaraan dan pemilik, serta cetak label barcode kendaraan untuk scan masuk.
- **Log Aktivitas**: seluruh aktivitas penting tercatat (login/logout, CRUD, transaksi, cetak struk) dengan filter tanggal dan pencarian.

### Petugas

- Dashboard operasional: kendaraan masuk/keluar hari ini, pendapatan hari ini, transaksi aktif, dan okupansi tiap area.
- **Scan Barcode**: halaman khusus untuk scanner USB (mode keyboard) dan **kamera/webcam**. Scan barcode kendaraan → transaksi masuk otomatis (area dipilih sesuai jenis kendaraan dan kapasitas). Scan barcode tiket pada struk → transaksi keluar otomatis, biaya dihitung stored procedure, dan struk dapat langsung dicetak. Kamera juga bisa dipilih jika perangkat memiliki lebih dari satu kamera.
- **Transaksi Masuk**: pilih kendaraan dan area; tarif ditentukan otomatis dari jenis kendaraan; kapasitas area dan duplikasi kendaraan aktif divalidasi.
- **Kendaraan Aktif**: daftar kendaraan yang masih parkir, dengan aksi keluar dan lihat struk.
- **Proses Keluar**: memanggil stored procedure `sp_parkir_keluar` untuk menghitung durasi, biaya, memperbarui area, dan mencatat log dalam satu transaksi database.
- **Cetak Struk**: pencarian struk berdasarkan ID parkir, lalu cetak melalui dialog print browser (`window.print()`); aksi cetak dicatat ke log.

### Alur Barcode

1. Admin membuka **Kendaraan**, menekan ikon barcode pada baris kendaraan, lalu mencetak label.
2. Label barcode berisi **plat nomor** dan ditempelkan pada kendaraan atau kartu parkir.
3. Petugas membuka **Scan Barcode**, lalu memindai label kendaraan dengan scanner USB, mengetik kode, atau menekan tombol **Kamera** untuk memindai lewat webcam. Sistem langsung membuat transaksi masuk, memilih area otomatis, dan menampilkan struk.
4. Struk memuat barcode tiket dengan format **`PKR-000001`**.
5. Saat kendaraan keluar, petugas memindai barcode tiket dengan scanner/kamera. Sistem memanggil `sp_parkir_keluar`, menyimpan biaya, mengurangi kapasitas area, mencatat log, dan menampilkan struk akhir.
6. Barcode yang sama tidak dapat dipakai dua kali; tiket yang sudah digunakan akan ditolak dengan pesan yang jelas.

> Scanner yang didukung adalah **USB barcode scanner mode keyboard** (langsung mengetik kode + Enter) dan **kamera/webcam** melalui browser. Kode juga dapat diketik manual pada kolom scan. Barcode kendaraan dibuat dari plat nomor, sehingga jika plat diubah, label perlu dicetak ulang.

> **Akses kamera:** gunakan `http://localhost:5173` atau HTTPS. Browser memblokir kamera pada alamat HTTP biasa (misalnya `http://192.168.1.10:5173`). Saat pertama membuka kamera, pilih **Izinkan** pada dialog browser dan pastikan izin kamera Windows aktif.

### Owner

- Dashboard ringkasan pendapatan dan transaksi.
- **Rekap Transaksi**: filter rentang tanggal (default awal bulan s/d hari ini, maksimal 366 hari), ringkasan pendapatan/transaksi/durasi rata-rata, grafik pendapatan harian, tabel rekap dengan pencarian, sorting, dan paginasi.
- **Export CSV** sesuai rentang tanggal (maksimal 10.000 baris, sudah ber-BOM agar terbaca baik di Excel).

### Umum

- Login JWT, password ter-hash bcrypt, akun nonaktif tidak bisa login.
- Protected route per role di frontend dan middleware role di backend.
- Akses lintas role diarahkan ke halaman **403 / Tidak Berhak Akses**.
- UI responsif: sidebar dapat diciutkan, drawer di mobile, dark mode (tersimpan di `localStorage`), tabel dengan pencarian/sorting/paginasi, badge status, skeleton loading, empty state, modal, konfirmasi hapus, dan toast.
- Format Rupiah dan tanggal Indonesia.

---

## Struktur Folder

```text
parkir-app/
├─ client/                     # Frontend React + Vite
│  ├─ src/
│  │  ├─ components/           # Layout, tabel, modal, struk, chart, UI primitives
│  │  ├─ contexts/             # Auth, Theme, Toast
│  │  ├─ hooks/                # useDataTable
│  │  ├─ lib/                  # api, format, navigasi
│  │  └─ pages/
│  │     ├─ admin/             # Dashboard, User, Tarif, Area, Kendaraan, Log
│  │     ├─ petugas/           # Dashboard, Scan Barcode, Transaksi Masuk, Aktif, Cetak Struk
│  │     └─ owner/             # Dashboard, Rekap
│  ├─ public/
│  └─ vite.config.js
├─ server/                     # Backend Express
│  ├─ scripts/seed.js          # Seed akun demo (bcrypt)
│  ├─ src/
│  │  ├─ config/               # Env & connection pool
│  │  ├─ controllers/
│  │  ├─ middleware/           # Auth/JWT, role, validasi, error handler
│  │  ├─ routes/
│  │  └─ utils/
│  ├─ .env.example
│  └─ package.json
├─ database/
│  └─ parkir.sql               # Schema, data contoh, view, procedure, user DB
├─ package.json                # npm workspaces + script root
└─ README.md
```

---

## Prasyarat

- **XAMPP** (Apache & MySQL/MariaDB) — MySQL 5.7+/MariaDB 10.3+.
- **Node.js 18+** dan npm (diuji dengan Node 24 dan npm 11).
- Browser modern (Chrome, Edge, Firefox). Untuk scan via kamera, gunakan Chrome/Edge terbaru dan akses melalui `http://localhost:5173` atau HTTPS.
- **Webcam/kamera** (opsional) untuk pemindaian barcode tanpa alat scanner USB.

---

## Instalasi

### 1. Jalankan MySQL

Buka **XAMPP Control Panel** lalu klik **Start** pada modul **MySQL**. Apache tidak wajib karena frontend dijalankan dengan Vite.

### 2. Import database

**Cara A — phpMyAdmin (disarankan):**

1. Buka `http://localhost/phpmyadmin`.
2. Pilih tab **Import**.
3. Pilih file `database/parkir.sql`, lalu klik **Import**.
4. Script akan membuat database `parkir`, seluruh tabel InnoDB, data contoh, view, stored procedure, dan user database.

**Cara B — terminal (Windows PowerShell):**

```powershell
cd C:\xampp\htdocs\aplikasi_parkir\parkir-app
Get-Content database\parkir.sql -Raw | & C:\xampp\mysql\bin\mysql.exe -u root --default-character-set=utf8mb4
```

> **Peringatan:** script SQL melakukan `DROP TABLE` terlebih dahulu. Jangan diimpor ulang jika sudah ada data produksi. Impor ulang hanya untuk mengembalikan data demo.

### 3. Install dependensi

Dari folder `parkir-app`:

```bash
npm install
```

Perintah ini menginstall dependensi root, server, dan client sekaligus (npm workspaces).

### 4. Konfigurasi environment

Salin template lalu sesuaikan:

```bash
# Windows
copy server\.env.example server\.env

# macOS / Linux
cp server/.env.example server/.env
```

Isi `server/.env`:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=parkir
JWT_SECRET=ganti-dengan-secret-acak-yang-panjang-dan-aman
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
```

- Default XAMPP: user `root` tanpa password.
- Untuk produksi, gunakan user database terbatas (mis. `admin_parkir`) dan `JWT_SECRET` acak yang kuat.
- Jika Vite berjalan di port lain (mis. 5174), server tetap mengizinkan origin `localhost` pada mode development. Untuk produksi, sesuaikan `CLIENT_ORIGIN`.

### 5. (Opsional) Seed ulang akun demo

Data contoh di SQL sudah berisi hash password akun demo. Jika ingin memastikan ulang hash bcrypt dibuat ulang:

```bash
npm run seed
```

---

## Menjalankan Aplikasi

Dari folder `parkir-app`:

```bash
npm run dev
```

Perintah menjalankan backend dan frontend sekaligus:

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173` (Vite otomatis memilih port lain jika 5173 terpakai)
- Health check: `http://localhost:5000/api/health`

Script lain:

```bash
npm run dev:server   # backend saja
npm run dev:client   # frontend saja
npm run build        # build frontend ke client/dist
npm start            # jalankan backend (production)
npm run seed         # seed akun demo
```

> Frontend memakai proxy Vite `/api` → `http://localhost:5000`, sehingga tidak perlu mengubah URL API saat development. Untuk build produksi, set `VITE_API_URL` bila API berada di domain/port berbeda.

---

## Akun Demo

| Role | Username | Password | Halaman awal |
|------|----------|----------|--------------|
| Admin | `admin1` | `admin123` | `/admin` |
| Petugas | `petugas1` | `petugas123` | `/petugas` |
| Owner | `owner1` | `owner123` | `/owner` |

Akun di atas adalah **akun login aplikasi**. Akun user MySQL berbeda (lihat bagian [User Database & Hak Akses](#user-database--hak-akses)).

Data contoh awal: 3 user, 3 tarif, 2 area, 5 kendaraan, dan 5 transaksi (2 masih aktif di area).

---

## Aturan Bisnis

1. **Login & status akun** — password diverifikasi dengan bcrypt; akun dengan `status_aktif = 0` ditolak dengan pesan jelas.
2. **Transaksi masuk**
   - Kendaraan dan area harus ada.
   - Kendaraan yang masih memiliki transaksi `status = 'masuk'` tidak boleh masuk lagi.
   - Area dengan `terisi >= kapasitas` ditolak.
   - Tarif dipilih otomatis berdasarkan `jenis_kendaraan` kendaraan.
   - Insert transaksi, increment `terisi`, dan log dilakukan dalam satu database transaction.
3. **Transaksi keluar**
   - Hanya transaksi berstatus `masuk` yang dapat diproses.
   - Perhitungan dilakukan di stored procedure `sp_parkir_keluar` dengan row lock (`FOR UPDATE`).
   - Durasi dibulatkan ke atas per jam dengan **minimum 1 jam**; biaya = durasi × tarif per jam.
   - `terisi` area dikurangi dan log aktivitas dicatat dalam transaksi database yang sama.
4. **Hak akses**
   - Backend memvalidasi JWT dan role pada setiap endpoint.
   - Frontend menyembunyikan menu dan memblokir route sesuai role; akses langsung ke route role lain menampilkan halaman 403.
5. **Admin**
   - Tidak dapat menghapus akun sendiri.
   - Tidak dapat menonaktifkan akun sendiri.
   - Tidak dapat mengubah role akun sendiri.
6. **Foreign key** — penghapusan data yang masih direferensikan (user, tarif, area, kendaraan) ditolak dan ditampilkan sebagai pesan yang mudah dipahami, bukan error mentah.
7. **Log aktivitas** — login/logout, CRUD, transaksi masuk/keluar, dan cetak struk dicatat di `tb_log_aktivitas`.
8. **Rekap owner** — hanya membaca view `v_rekap_transaksi`; rentang tanggal maksimal 366 hari.

---

## Dokumentasi API

Base URL: `http://localhost:5000/api`

Semua endpoint selain login dan health memerlukan header:

```http
Authorization: Bearer <token>
```

Format respons sukses:

```json
{
  "success": true,
  "message": "...",
  "data": {},
  "meta": { "page": 1, "limit": 10, "total": 0, "total_pages": 0 }
}
```

Format respons error:

```json
{
  "success": false,
  "message": "Pesan error",
  "code": "ERROR_CODE"
}
```

### Auth

| Method | Endpoint | Akses | Keterangan |
|--------|----------|-------|------------|
| POST | `/auth/login` | Publik | Body: `username`, `password`; mengembalikan token + user |
| POST | `/auth/logout` | Login | Mencatat logout ke log aktivitas |
| GET | `/auth/me` | Login | Data user dari token |

### Dashboard

| Method | Endpoint | Akses | Keterangan |
|--------|----------|-------|------------|
| GET | `/dashboard/admin` | Admin | Statistik, user per role, grafik 7 hari, transaksi terbaru |
| GET | `/dashboard/petugas` | Petugas | Statistik harian, okupansi area, kendaraan aktif |

### User (Admin)

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/users?page=&limit=&search=&role=&sort=&order=` | Daftar user |
| POST | `/users` | Body: `nama_lengkap`, `username`, `password`, `role`, `status_aktif` |
| PUT | `/users/:id` | Ubah user; `password` opsional |
| DELETE | `/users/:id` | Hapus user (tidak boleh akun sendiri / yang masih direferensikan) |

### Tarif (Admin)

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/tarif?page=&limit=&search=&sort=&order=` | Daftar tarif |
| POST | `/tarif` | Body: `jenis_kendaraan`, `tarif_per_jam` |
| PUT | `/tarif/:id` | Ubah tarif |
| DELETE | `/tarif/:id` | Hapus tarif |

### Area (Admin)

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/area?page=&limit=&search=&sort=&order=` | Daftar area |
| POST | `/area` | Body: `nama_area`, `kapasitas`, `terisi` |
| PUT | `/area/:id` | Ubah area |
| DELETE | `/area/:id` | Hapus area |

### Kendaraan (Admin)

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/kendaraan?page=&limit=&search=&jenis_kendaraan=&sort=&order=` | Daftar kendaraan |
| POST | `/kendaraan` | Body: `plat_nomor`, `jenis_kendaraan`, `warna`, `pemilik`, `id_user` |
| PUT | `/kendaraan/:id` | Ubah kendaraan |
| DELETE | `/kendaraan/:id` | Hapus kendaraan |

### Log Aktivitas (Admin)

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/log?page=&limit=&search=&dari=&sampai=&sort=&order=` | Log dengan filter tanggal |

### Transaksi (Petugas)

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/transaksi/opsi` | Opsi area, tarif, dan kendaraan + status parkir |
| GET | `/transaksi/aktif` | Kendaraan yang masih parkir |
| POST | `/transaksi/scan` | Body: `kode`; barcode kendaraan (plat) = masuk, barcode tiket (`PKR-000001`) = keluar |
| POST | `/transaksi/masuk` | Body: `id_kendaraan`, `id_area` (opsional; kosong = area otomatis) |
| POST | `/transaksi/keluar/:id` | Proses keluar via `sp_parkir_keluar` |
| GET | `/transaksi/:id/struk` | Detail struk |
| POST | `/transaksi/:id/cetak` | Catat aktivitas cetak struk |

### Rekap (Owner)

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/rekap?dari=YYYY-MM-DD&sampai=YYYY-MM-DD&page=&limit=&search=&sort=&order=` | Ringkasan, grafik harian, tabel rekap |
| GET | `/rekap/export?dari=YYYY-MM-DD&sampai=YYYY-MM-DD` | Unduh CSV |

### Health

| Method | Endpoint | Akses | Keterangan |
|--------|----------|-------|------------|
| GET | `/health` | Publik | Cek koneksi database |

---

## User Database & Hak Akses

Script `database/parkir.sql` membuat tiga user MySQL contoh (least privilege):

| User | Password | Hak akses |
|------|----------|-----------|
| `admin_parkir` | `AdminParkir#2026` | Semua hak pada database `parkir` |
| `petugas_parkir` | `PetugasParkir#2026` | SELECT kendaraan/tarif/area, UPDATE `terisi`, SELECT/INSERT/UPDATE transaksi, INSERT log, EXECUTE `sp_parkir_keluar` |
| `owner_parkir` | `OwnerParkir#2026` | SELECT pada view `v_rekap_transaksi` saja |

Catatan:

- Password di atas hanya contoh lokal. Ganti di lingkungan produksi.
- Aplikasi default memakai `root` tanpa password agar langsung jalan di XAMPP. Untuk mencoba prinsip least privilege, ubah `DB_USER`/`DB_PASSWORD` di `.env` sesuai kebutuhan, misalnya `petugas_parkir`.
- `owner_parkir` tidak dapat membaca tabel dasar; seluruh rekap owner diambil dari view.
- View dibuat dengan `SQL SECURITY DEFINER` agar owner dapat membaca hasil join tanpa hak langsung ke tabel dasar.

---

## Known Bugs / Keterbatasan

1. **Logout bersifat stateless** — JWT tidak memiliki blacklist; token tetap valid sampai kedaluwarsa (default 12 jam) meskipun user sudah logout di browser. Logout hanya menghapus token di client dan mencatat aktivitas.
2. **Cetak struk bergantung pada browser** — menggunakan `window.print()` dan CSS print. Belum terintegrasi dengan printer thermal/ESC-POS.
3. **Pembulatan durasi** — setiap keterlambatan dihitung per jam penuh, minimum 1 jam (parkir 1 menit tetap dikenakan 1 jam). Belum ada tarif progresif atau tarif inap.
4. **Kolom `terisi` berupa counter** — bukan hasil hitung otomatis dari transaksi. Perubahan manual di database dapat membuat nilai tidak sinkron dengan transaksi aktif.
5. **Belum ada pembayaran digital** — biaya hanya dihitung dan ditampilkan; belum ada integrasi payment gateway atau status pembayaran terpisah.
6. **Tidak ada fitur lupa password / reset mandiri** — password hanya dapat diubah oleh admin melalui menu Kelola User.
7. **Belum ada rate limiting login** — percobaan login berulang belum dibatasi; disarankan ditambahkan sebelum produksi.
8. **Rekap dibatasi** — maksimal 366 hari per permintaan dan export CSV maksimal 10.000 baris.
9. **Barcode bergantung pada alat** — fitur scan mendukung USB barcode scanner mode keyboard dan kamera/webcam. Pemindaian kamera memerlukan izin browser, pencahayaan cukup, dan akses melalui localhost/HTTPS; kamera pada HTTP non-localhost diblokir browser. Barcode kendaraan memakai plat nomor, jadi label harus dicetak ulang bila plat berubah.
10. **Deployment produksi belum disiapkan** — belum ada konfigurasi serving frontend dari Express, reverse proxy, HTTPS, atau Docker. Saat ini dioptimalkan untuk development lokal XAMPP + Vite.
11. **Data contoh bergantung tanggal** — transaksi contoh memakai `CURDATE()`, sehingga angka "hari ini" pada dashboard berubah mengikuti tanggal import.

---

## Rencana Pengembangan

- Integrasi payment gateway (QRIS/kartu) dan status pembayaran.
- Integrasi gate otomatis, pemindaian kamera berkelanjutan, dan mode torch untuk kondisi minim cahaya.
- Tiket digital/QR yang dapat dikirim ke pengguna.
- Tarif bertingkat, tarif inap, serta aturan khusus akhir pekan.
- Manajemen shift petugas dan laporan per petugas.
- Export PDF/Excel selain CSV.
- Notifikasi kapasitas area dan monitoring real-time (WebSocket).
- Audit trail lebih rinci (data sebelum/sesudah perubahan).
- Reset password via email, verifikasi login, dan rate limiting.
- Unit/integration test otomatis dan pipeline CI.
- Dockerisasi dan panduan deployment produksi.

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| `ECONNREFUSED 127.0.0.1:3306` | Pastikan MySQL di XAMPP sudah Start. |
| `ER_ACCESS_DENIED_ERROR` | Periksa `DB_USER`/`DB_PASSWORD` di `server/.env`. Default XAMPP: `root` tanpa password. |
| `Unknown database 'parkir'` | Import ulang `database/parkir.sql` melalui phpMyAdmin. |
| Frontend tidak bisa memanggil API | Pastikan backend berjalan di port 5000 dan buka frontend lewat `http://localhost:5173` (bukan `file://`). |
| Port 5173 sudah dipakai | Vite otomatis pindah port; mode development mengizinkan origin localhost. Atau hentikan proses lain di port tersebut. |
| Port 5000 sudah dipakai | Ubah `PORT` di `server/.env`, lalu sesuaikan target proxy di `client/vite.config.js`. |
| Login gagal setelah import ulang | Jalankan `npm run seed` untuk membuat ulang hash akun demo. |
| Tabel/log kosong setelah import ulang | Import ulang bersifat reset; data lama terhapus sesuai peringatan di atas. |
| `ER_ROW_IS_REFERENCED_2` saat hapus | Data masih dipakai transaksi/kendaraan. Hapus relasi terkait terlebih dahulu; aplikasi menampilkan pesan yang lebih ramah. |
| Build gagal | Jalankan `npm install` di root proyek, lalu `npm run build`. |
