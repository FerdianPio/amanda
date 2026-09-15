# Amanda Group SFA (Sales Force Automation)

Sistem otomatisasi tenaga penjualan multi-bisnis unit Amanda Group (Amanda Bakery & Amanda Mart) dengan mesin database **PGlite** (PostgreSQL embedded berbasis WebAssembly).

---

## 🚀 Menjalankan Aplikasi Secara Lokal (Local Setup)

Aplikasi ini menggunakan **PGlite** secara default, sehingga **tidak memerlukan instalasi PostgreSQL eksternal**. Semua data tersimpan di direktori lokal `./data/postgres_db/`.

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Migrasi & Setup Database Sendiri (Manual Setup)
Sesuai permintaan Anda, **migrasi otomatis pada server telah dimatikan secara default**. Anda memiliki kontrol penuh untuk memigrasi dan melakukan setup database kapan pun Anda siap:

```bash
# Opsi 1 (Direkomendasikan): Setup lengkap (migrasi skema + isi data demo)
npm run db:setup

# Opsi 2: Migrasi skema tabel saja tanpa data demo
npm run db:migrate

# Opsi 3: Cek status tabel & pengguna kapan saja
npm run db:status

# Opsi 4: Isi data demo (setelah migrasi selesai)
npm run db:seed
```

### 3. Mode Server
Server development (`npm run dev`) **tidak akan memodifikasi atau meng-override** skema database Anda. Jika suatu saat Anda ingin server mengotomasi migrasi saat boot, Anda dapat menambahkan `AUTO_MIGRATE=true` di file `.env`. Tanpa variabel tersebut, migrasi tetap 100% manual di bawah kendali Anda.

### 4. Jalankan Server Pengembangan
```bash
npm run dev
```
Aplikasi akan aktif di `http://localhost:3000`.

---

## 🛠️ Daftar Perintah Database (PGlite)

| Perintah | Deskripsi |
| :--- | :--- |
| `npm run db:migrate` | Mengeksekusi DDL `schema.sql` dan memverifikasi tabel di PGlite |
| `npm run db:status` | Memeriksa tabel aktif, jumlah data pengguna, dan status kesiapan PGlite |
| `npm run db:seed` | Mengisi data demo baseline (Amanda Bakery & Amanda Mart) |
| `npm run db:setup` | Menjalankan migrasi kemudian seeding data demo |
| `npm run db:reset` | Membersihkan dan mengembalikan data ke baseline demo original |
| `npm run db:verify` | Menjalankan pengujian 15 skenario integritas database |
| `npm test` | Menjalankan automated integration test suite |

---

## 👥 Akun Demo Bawaan
Password untuk seluruh akun demo adalah: **`Demo123!`**

- **Andi Wijaya** (`andi.sales@demo.local`) — Sales, Amanda Bakery (Area Yogyakarta Selatan)
- **Siti Rahma** (`siti.sales@demo.local`) — Sales, Amanda Mart (Area Sleman)
- **Budi Santoso** (`budi.supervisor@demo.local`) — Supervisor, Amanda Bakery
- **Admin Amanda** (`admin@demo.local`) — Administrator Kantor Pusat
