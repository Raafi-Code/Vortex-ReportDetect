# 📋 Panduan Setup - WhatsApp ReportDetect

Panduan lengkap untuk men-deploy sistem WhatsApp ReportDetect.

---

## 📌 Prasyarat

| Komponen | Versi Minimum | Keterangan |
|----------|--------------|------------|
| Node.js | 18+ | Runtime backend & frontend |
| npm | 9+ | Package manager |
| Supabase Account | - | [supabase.com](https://supabase.com) |
| VPS (Ubuntu) | 20.04+ | Untuk backend + Baileys |
| Vercel Account | - | Untuk deploy frontend |

---

## 🗄️ Step 1: Setup Supabase

### 1.1 Buat Proyek Baru
1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Klik **New Project**
3. Isi nama proyek, password database, dan pilih region terdekat (Singapore)
4. Tunggu hingga proyek selesai dibuat

### 1.2 Jalankan SQL Schema
1. Di Supabase Dashboard, buka **SQL Editor**
2. Klik **New Query**
3. Copy-paste isi file `database/schema.sql` dan klik **Run**
4. Copy-paste isi file `database/storage-policies.sql` dan klik **Run**

### 1.3 Buat Storage Bucket
1. Buka **Storage** di sidebar
2. Klik **New Bucket**
3. Nama: `whatsapp-media`
4. Centang **Public bucket** → klik **Create**

### 1.4 Aktifkan Realtime
1. Buka **Database** → **Replication**
2. Di bagian **Supabase Realtime**, klik **Source**
3. Pastikan tabel `messages` sudah ter-enable (seharusnya sudah dari schema.sql)

### 1.5 Catat API Keys
Buka **Settings** → **API**, catat:
- **Project URL**: `https://xxxxx.supabase.co`
- **anon (public) key**: untuk frontend
- **service_role key**: untuk backend (RAHASIA!)

---

## 🖥️ Step 2: Setup Backend (VPS)

### 2.1 SSH ke VPS dan Siapkan Environment

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Verifikasi
node -v  # v20.x.x
npm -v   # 10.x.x
```

### 2.2 Clone/Upload Project

```bash
# Via Git (jika menggunakan repo)
git clone <your-repo-url>
cd Whatsapp-ReportDetect/backend

# Atau upload via SCP/SFTP
# Hanya upload folder backend/
```

### 2.3 Install Dependencies

```bash
cd backend
npm install
```

### 2.4 Konfigurasi Environment

```bash
# Copy template
cp .env.example .env

# Edit file .env
nano .env
```

Isi `.env`:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIs....(service_role key)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs....(anon key)
ALLOWED_LOGIN_EMAIL=xxx@gmail.com

API_PORT=3001
FRONTEND_URL=https://your-frontend.vercel.app
TRUST_PROXY=1

SESSION_NAME=wa-session

STORAGE_BUCKET=whatsapp-media
MEDIA_RETENTION_DAYS=30
MEDIA_SIGNED_URL_EXPIRES_IN=900

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=300
RATE_LIMIT_AUTH_MAX_REQUESTS=60
```

> 💡 Untuk deployment di belakang reverse proxy (mis. Zeabur/Nginx), gunakan `TRUST_PROXY=1` agar backend membaca IP client dan protocol (http/https) dengan benar dari proxy pertama.

> ⚠️ **Penting**: Backend sekarang memvalidasi `Authorization: Bearer <Supabase access token>` dari user login, jadi tidak perlu `NEXT_PUBLIC_API_KEY` lagi di frontend.

### 2.5 Jalankan dengan PM2

```bash
# Start dengan PM2
pm2 start ecosystem.config.cjs

# Lihat logs
pm2 logs wa-reportdetect

# Lihat status
pm2 status

# Auto-start saat reboot
pm2 startup
pm2 save
```

### 2.6 Scan QR Code

Saat pertama kali jalan, akan muncul QR Code di terminal:
1. Jalankan `pm2 logs wa-reportdetect`
2. QR Code akan muncul di terminal
3. Buka WhatsApp → Menu (⋮) → **Perangkat Tertaut** → **Tautkan Perangkat**
4. Scan QR Code di terminal
5. Tunggu hingga muncul "✅ WhatsApp connected successfully!"

> 💡 Alternatif: Akses QR Code dari dashboard web di halaman Settings.

### 2.7 Firewall (Opsional)

```bash
# Buka port API
sudo ufw allow 3001/tcp
```

---

## 🌐 Step 3: Deploy Frontend (Vercel)

### 3.1 Push ke GitHub

```bash
# Pastikan hanya push folder frontend
cd frontend
git init
git add .
git commit -m "Initial frontend commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 3.2 Deploy ke Vercel

1. Login ke [Vercel](https://vercel.com)
2. Klik **New Project** → Import dari GitHub
3. Pilih repository frontend
4. **Root Directory**: `frontend` (jika monorepo) atau `.` (jika repo sendiri)
5. **Framework Preset**: Next.js (auto-detect)

### 3.3 Konfigurasi Environment Variables di Vercel

Di Vercel project **Settings** → **Environment Variables**, tambahkan:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project-id.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (anon key dari Supabase) |
| `NEXT_PUBLIC_ALLOWED_LOGIN_EMAIL` | `vortex.admin@gmail.com` |
| `NEXT_PUBLIC_API_URL` | `http://your-vps-ip:3001` |

6. Klik **Deploy**

### 3.4 Update Backend CORS

Setelah deploy, update `FRONTEND_URL` di backend `.env`:

```env
FRONTEND_URL=https://your-app.vercel.app
```

Restart backend:
```bash
pm2 restart wa-reportdetect
```

---

## ⚙️ Step 4: Konfigurasi Awal

Setelah semua terdeploy:

### 4.1 Tambahkan Grup Monitor
1. Buka dashboard web → **Groups**
2. Klik **Tambah Grup** → pilih grup WhatsApp
3. Aktifkan toggle monitoring

### 4.2 Tambahkan Keywords
1. Buka **Keywords**
2. Ketik keyword dan klik Tambah (contoh: laporan, urgent, penting)

### 4.3 Buat Forwarding Rules
1. Buka **Forwarding**
2. Klik **Tambah Rule**
3. Pilih grup sumber → pilih grup/kontak tujuan
4. Pastikan **Auto Forward** aktif

### 4.4 Verifikasi
Kirim pesan di grup yang dimonitor dengan salah satu keyword. Pesan harus:
- Muncul di **Inbox** dashboard
- Diteruskan ke grup/kontak tujuan (jika forwarding aktif)

---

## 🔧 Troubleshooting

| Masalah | Solusi |
|---------|--------|
| QR Code tidak muncul | Cek `pm2 logs`, pastikan Supabase env benar |
| Koneksi terputus | Baileys auto-reconnect. Jika logout, hapus folder `sessions/` dan restart |
| Pesan tidak terdeteksi | Cek apakah grup sudah di-monitor dan keyword aktif |
| Media tidak terupload | Cek apakah bucket `whatsapp-media` ada dan public |
| Frontend error API | Cek `NEXT_PUBLIC_API_URL`, session login Supabase, dan `SUPABASE_ANON_KEY` backend |
| CORS error | Pastikan `FRONTEND_URL` di backend `.env` sesuai URL Vercel |

---

## 🛡️ Tips Keamanan

1. Gunakan **HTTPS** untuk backend (pasang Nginx reverse proxy + Let's Encrypt)
2. Jangan expose `SUPABASE_SERVICE_KEY` ke frontend
3. Pastikan backend hanya menerima `Bearer token` Supabase yang valid
4. Batasi akses ke port 3001 hanya dari IP Vercel jika memungkinkan

### Contoh Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Kemudian pasang SSL:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

## 📂 Perintah Berguna

```bash
# Backend
pm2 start ecosystem.config.cjs     # Start
pm2 restart wa-reportdetect     # Restart
pm2 logs wa-reportdetect        # Lihat logs
pm2 stop wa-reportdetect        # Stop
pm2 delete wa-reportdetect      # Hapus

# Frontend (Development)
cd frontend
npm run dev                          # Dev server
npm run build                        # Build production

# Hapus session WhatsApp (jika bermasalah)
rm -rf backend/sessions/
pm2 restart wa-reportdetect
```
