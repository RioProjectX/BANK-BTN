# BTN Tracker Nasabah

Aplikasi manajemen, pembukuan, statistik pendaftaran nasabah, dan pelacakan pencapaian target bulanan bagi Sales Perbankan yang dirancang dengan performa tinggi, antarmuka responsif, dan sistem retensi data ganda yang sangat aman.

---

### Built with ❤️ by **RioProjectX**

---

## 🌟 Fitur Utama

- **📊 Dashboard Statistik Real-time**:
  - Pelacakan jumlah pendaftaran baru untuk rentang waktu: Hari Ini, Bulan Ini, Tahun Ini, dan Total Keseluruhan.
  - Kalkulator **Omset Harian Otomatis** berdasarkan pendaftaran berhasil hari ini dengan parameter dinamis.

- **⚙️ Pengaturan Rate Rekening Fleksibel**:
  - Penyesuaian nilai rate per akun untuk bank **BTN** dan **SeaBank** secara langsung melalui kartu statistik omset.
  - Penyimpanan nilai rate kustom secara instan di penyimpanan lokal.

- **📝 Manajemen Data Nasabah**:
  - Formulir pendaftaran nasabah dengan dukungan input data terperinci.
  - Unggah foto dokumen/lampiran instan dengan fitur kompresi otomatis berbasis *HTML5 Canvas* di sisi klien untuk menghemat ruang memori browser tanpa menurunkan keterbacaan data.
  - Pengaturan status transaksi (*Berhasil*, *Proses*, *Gagal*) untuk transparansi pelacakan.

- **🎯 Target Bulanan Tracker**:
  - Sistem pemantauan progres bulanan yang menampilkan persentase pencapaian target secara visual dan elegan.
  - Target bulanan dapat diubah sesuai kebijakan target masing-masing periode.

- **💾 Sistem Penyimpanan Ganda Terjamin (Dual Storage Architecture)**:
  - **Firebase Firestore**: Database cloud real-time untuk sinkronisasi multi-perangkat.
  - **Local Storage Backup**: Pencadangan data otomatis di browser pengguna dengan perlindungan kegagalan kuota (*quota-exceeded protection*). Lampiran gambar besar dipisahkan dan dikompresi otomatis untuk menjaga fungsionalitas aplikasi tetap stabil.

- **👤 Profil Sales Mandiri**:
  - Kustomisasi identitas lengkap sales (Nama, NIP, Divisi, Nomor Telepon, dan Foto Profil).
  - Foto profil dikompresi menjadi avatar ukuran ringan (200px JPEG) untuk efisiensi penyimpanan lokal browser.

---

## 🛠️ Tech Stack

- **Frontend**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (Utility-first styling)
- **Animasi**: [Motion](https://motion.dev/) (sebelumnya Framer Motion) untuk interaksi visual yang halus
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database / Cloud Service**: [Firebase Firestore & Firebase Auth](https://firebase.google.com/)

---

## 🚀 Instalasi dan Panduan Penggunaan Lokal

### Prasyarat
Pastikan Anda telah menginstal **Node.js** (versi 18+) dan **npm** di komputer Anda.

### Langkah-langkah Menjalankan Proyek:

1. **Clone repositori ini atau ekstrak file ZIP**:
   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```

2. **Instal seluruh dependensi proyek**:
   ```bash
   npm install
   ```

3. **Salin file konfigurasi environment**:
   ```bash
   cp .env.example .env
   ```
   *Isi `.env` dengan kredibel Firebase Anda jika ingin mengaktifkan sinkronisasi database cloud.*

4. **Jalankan aplikasi di mode pengembangan**:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan secara lokal di alamat `http://localhost:3000` (atau port default yang dikonfigurasi).

5. **Membuat build produksi**:
   ```bash
   npm run build
   ```
   Output build produksi akan diletakkan di dalam folder `dist/` untuk siap dideploy ke platform web hosting pilihan Anda.

---

### Dikembangkan dan Dikelola oleh **RioProjectX**
