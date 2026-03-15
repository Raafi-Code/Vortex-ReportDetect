# BNI WhatsApp ReportDetect 📡

Sistem monitoring pesan WhatsApp & auto-forwarding. Mendengarkan pesan dari grup WhatsApp, memfilter berdasarkan keyword, menyimpan ke database, dan meneruskan otomatis ke grup/kontak tujuan.

## 🏗️ Arsitektur

```
Frontend (Vercel)  ←→  Backend (VPS)  ←→  Supabase (Database + Storage)
   Next.js 15           Node.js            PostgreSQL + Storage
   Dashboard            Baileys            Realtime
   Inbox                Express API
```

## ✨ Fitur Utama

- **📱 WhatsApp Monitoring** - Mendengarkan pesan dari banyak grup WhatsApp sekaligus
- **🔍 Keyword Filtering** - Filter pesan berdasarkan keyword tertentu (case-insensitive)
- **📨 Auto-Forward** - Teruskan pesan yang cocok ke grup/kontak tujuan (teks + gambar)
- **📧 Inbox Email-Style** - Lihat semua pesan yang terdeteksi dengan tampilan seperti email
- **⚙️ Dashboard Web** - Konfigurasi grup, keyword, dan forwarding rules tanpa sentuh kode
- **🗑️ Auto Cleanup** - Hapus media otomatis jika lebih dari 30 hari
- **⚡ Realtime** - Update pesan secara realtime menggunakan Supabase Realtime

## 📁 Struktur Proyek

```
BNI-Whatsapp-ReportDetect/
├── backend/          # Node.js + Baileys (deploy ke VPS)
├── frontend/         # Next.js 15 (deploy ke Vercel)
├── database/         # SQL migration scripts
├── SETUP.md          # Panduan setup lengkap
└── README.md
```

## 🚀 Quick Start

Lihat [SETUP.md](./SETUP.md) untuk panduan setup lengkap.

## 📄 Lisensi

Private - Ryurex Corp
