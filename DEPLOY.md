# 🚀 Panduan Deployment: Local → GitHub → Produksi

Dokumen ini menjelaskan alur kerja untuk mengunggah proyek ke GitHub dan cara men-deploy-nya ke VPS (Backend) serta Vercel (Frontend) dari satu repositori yang sama (Monorepo).

---

## 📂 Strategi Unggah GitHub: Monorepo

**Rekomendasi Utama**: Gunakan **Satu (1) Folder Induk** (`Whatsapp-ReportDetect`) sebagai satu repositori GitHub.

**Mengapa?**
- **Sinkronisasi**: Versi backend dan frontend selalu sejalan.
- **Kemudahan**: Cukup satu kali `git push` untuk seluruh perubahan sistem.
- **Dukungan Vercel**: Vercel mendukung penuh struktur monorepo (bisa memilih sub-folder).

---

## 📤 Tahap 1: Mengunggah ke GitHub

Pastikan kamu berada di folder root `Whatsapp-ReportDetect` di terminal kamu.

1. **Inisialisasi Git**:
   ```bash
   git init
   ```
2. **Tambahkan semua file** (File rahasia seperti `.env` dan `sessions/` akan otomatis diabaikan karena `.gitignore` sudah saya buat):
   ```bash
   git add .
   ```
3. **Commit pertama**:
   ```bash
   git commit -m "Initial commit: WhatsApp Report System"
   ```
4. **Hubungkan ke repositori GitHub baru kamu**:
   ```bash
   # Buat repo kosong di github.com, lalu jalankan:
   git remote add origin https://github.com/username-kamu/Whatsapp-ReportDetect.git
   git branch -M main
   git push -u origin main
   ```

---

## 💻 Tahap 2: Deploy Backend ke VPS

Alur: **GitHub → VPS (Git Clone)**

1. **SSH ke VPS kamu**.
2. **Clone repositori**:
   ```bash
   git clone https://github.com/username-kamu/Whatsapp-ReportDetect.git
   cd Whatsapp-ReportDetect/backend
   ```
3. **Install & Setup**:
   ```bash
   npm install
   cp .env.example .env
   nano .env # Masukkan Config Supabase + ALLOWED_LOGIN_EMAIL
   ```
4. **Jalankan dengan PM2**:
   ```bash
   pm2 start ecosystem.config.cjs
   pm2 save
   ```
5. **Update di Masa Depan**: Jika ada perubahan kode di local, kamu tekan `git push` di local, lalu di VPS cukup:
   ```bash
   git pull origin main
   pm2 restart wa-reportdetect
   pm2 stop all #untuk menonaktifkan session
   ```

---

## 🌐 Tahap 3: Deploy Frontend ke Vercel

Alur: **GitHub → Vercel (Auto Connect)**

1. Login ke [Vercel](https://vercel.com).
2. Klik **New Project** → Connect ke repositori `Whatsapp-ReportDetect`.
3. **KONFIGURASI PENTING**:
   - **Root Directory**: Klik Edit, lalu pilih folder `frontend`.
   - **Framework Preset**: Pilih `Next.js`.
4. **Environment Variables**: Masukkan semua `NEXT_PUBLIC_...` yang diperlukan (Cek `DEPLOY.md` atau `SETUP.md`).
5. Klik **Deploy**.
6. **Update di Masa Depan**: Setiap kali kamu `git push` ke GitHub, Vercel akan otomatis meng-update website kamu (Auto Deployment).

---

## 🔑 Ringkasan Auth & Endpoint

| Komponen | Kegunaan | Lokasi |
|---|---|---|
| **Supabase Access Token (Bearer)** | Autentikasi request Frontend ke Backend | Session login user (otomatis dari Supabase) |
| **SUPABASE_URL** | Koneksi Database | Keduanya |
| **NEXT_PUBLIC_API_URL** | Alamat Backend di VPS (wajib HTTPS) | Vercel Env (Contoh: `https://api.domainkamu.com`) |

---

## 🔒 Update Keamanan Media (Private Storage)

Project ini menggunakan pendekatan media privat:

- Bucket `whatsapp-media` harus diset **private** (bukan public).
- Akses media dilakukan via **signed URL** dengan masa berlaku pendek.
- Backend menyimpan `media_storage_path` dan menghasilkan signed URL saat diperlukan.
- Hindari penggunaan public URL permanen untuk file media sensitif.

### Checklist Produksi (Wajib)

1. Terapkan SQL RLS terbaru untuk mode single-admin.
2. Terapkan policy storage terbaru yang membatasi akses ke user admin terautentikasi.
3. Verifikasi bahwa `NEXT_PUBLIC_API_URL` memakai HTTPS.
4. Restart backend setelah update konfigurasi keamanan.
5. Rotasi key sensitif jika sebelumnya pernah memakai konfigurasi storage public.


### Tips Keamanan 🛡️
- Jangan pernah menghapus `.gitignore`.
- Jangan pernah membagikan `SUPABASE_SERVICE_KEY` ke orang lain.
- Jika deploy di VPS, wajib menggunakan Domain + SSL (Nginx Reverse Proxy) agar koneksi API selalu HTTPS.
- Jangan gunakan URL API berbasis IP + HTTP di environment production.
- Pastikan endpoint backend hanya diakses dari origin frontend yang valid (CORS terkontrol).
