# 005 — SYSTEM ARCHITECTURE OVERVIEW
## KINETIC CRM — Arsitektur Sistem Tingkat Tinggi

**Modul:** Architecture
**Sumber Utama:** PRD §1 (Executive Summary), §9.3 (Scalability), Appendix A; FE Spec §1; Instruksi tambahan AI Integration
**Dependensi Dokumen:** 001, 002
**Dirujuk Oleh:** 006, 007, 008, 009, 010, 053, 054, 060

---

## 1. TUJUAN DOKUMEN

Memberikan gambaran arsitektur menyeluruh KINETIC CRM sebagai peta sebelum pembaca menyelami dokumen teknis spesifik (tech stack, security, data, integrasi, AI). Dokumen ini menjawab: **komponen apa yang ada, bagaimana mereka berkomunikasi, dan prinsip apa yang mengatur interaksi antar komponen.**

---

## 2. DIAGRAM KOMPONEN TINGKAT TINGGI

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                              │
│   Browser (Desktop/Tablet/Mobile) — React SPA                     │
└───────────────────────────────┬───────────────────────────────────┘
                                 │ HTTPS
┌────────────────────────────────▼───────────────────────────────────┐
│                    REVERSE PROXY / WEB SERVER                       │
│         Nginx — serve static build, proxy /api/ ke Backend          │
└────────────────────────────────┬───────────────────────────────────┘
                                 │
┌────────────────────────────────▼───────────────────────────────────┐
│                         BACKEND API LAYER                            │
│        PHP-FPM REST API — /api/v1/ — Auth, RBAC, Business Logic      │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────────────────┐ │
│  │ Core Modules │ │ Approval &   │ │      AI SERVICE LAYER         │ │
│  │ (Prospect,   │ │ Workflow     │ │  (Provider Abstraction)       │ │
│  │  Project,    │ │ Engine       │ │                                │ │
│  │  RKS, LPHS)  │ │              │ │                                │ │
│  └──────┬───────┘ └──────┬───────┘ └───────────────┬───────────────┘ │
└─────────┼────────────────┼─────────────────────────┼─────────────────┘
          │                │                         │
┌─────────▼────────────────▼───────┐   ┌─────────────▼─────────────┐
│         DATABASE LAYER             │   │     EXTERNAL AI PROVIDER    │
│   MySQL — fully normalized schema  │   │        Gemini API           │
│   (lihat 053, 054)                 │   │  (future: OpenAI/Claude/    │
└─────────────────────────────────────┘   │   Azure OpenAI)             │
                                           └─────────────────────────────┘
┌─────────────────────────────────────┐
│       FILE STORAGE LAYER              │
│  Local Volume (Fase 1) →              │
│  S3-compatible Object Storage         │
│  (Future Scalability)                 │
└─────────────────────────────────────┘
```

---

## 3. LAPISAN ARSITEKTUR (LAYER) DAN TANGGUNG JAWAB

| Layer | Teknologi | Tanggung Jawab | Dokumen Detail |
|---|---|---|---|
| Client Layer | React + TypeScript SPA | Rendering UI, validasi client-side, state management, pemanggilan API | 058 |
| Reverse Proxy | Nginx | Serve static build, terminasi TLS, proxy request `/api/` ke backend, gzip, caching aset statis | 060 |
| Backend API Layer | PHP-FPM REST API | Autentikasi, otorisasi (RBAC), validasi server-side, business logic, orkestrasi approval, audit logging | 056, 057 |
| AI Service Layer | PHP module/service class internal | Abstraksi provider AI, retry, rate limiting, prompt management | 010 |
| Database Layer | MySQL 8.0 | Penyimpanan data relasional ternormalisasi, integritas referensial | 053, 054, 055 |
| File Storage Layer | Docker Volume (Fase 1) | Penyimpanan dokumen upload, di luar webroot | 048, 049 |
| External AI Provider | Gemini API | Eksekusi permintaan AI generatif | 010, 011 |

---

## 4. PRINSIP ARSITEKTUR

1. **Separation of Concerns ketat antar layer.** Backend tidak pernah mempercayai validasi yang hanya dilakukan di Frontend; setiap business rule critical divalidasi ulang di backend.
2. **Stateless Backend.** Backend PHP didesain stateless (sesi disimpan via token JWT atau session store terpisah) agar dapat di-scale horizontal dengan menambah container tanpa session affinity.
3. **AI sebagai Service Layer terisolasi.** Modul bisnis (Prospect, Project, RKS, dst.) tidak pernah memanggil Gemini API secara langsung — seluruhnya melalui AI Service Layer (detail di 010).
4. **Single Source of Truth di Database.** Frontend tidak pernah menjadi sumber kebenaran state; setiap mutasi penting memicu re-fetch dari server (lihat 007 Data Architecture Principles).
5. **API-First.** Backend mengekspos REST API versioned (`/api/v1/`) yang sepenuhnya independen dari Frontend, membuka jalan bagi klien lain (mobile app Fase 3, integrasi ERP Fase 3) tanpa mengubah backend.
6. **Containerized by Default.** Setiap komponen (frontend, backend, database, AI service jika dipisah sebagai container sendiri di masa depan) berjalan dalam container Docker terisolasi (lihat 060).
7. **Defense in Depth untuk Keamanan.** Validasi dan otorisasi diterapkan berlapis: route guard di Frontend (UX), middleware di Backend (enforcement sesungguhnya), constraint di Database (lapisan terakhir).

---

## 5. ALUR REQUEST TIPIKAL (CONTOH: CABANG MENGAJUKAN RKS)

```
1. Frontend (RKS Form) → validasi client-side (React Hook Form + Zod)
2. Frontend → PUT /api/v1/projects/{id}/rks  (Axios, header Authorization: Bearer {token})
3. Nginx → proxy ke Backend container
4. Backend Middleware → verifikasi token, cek role (cabang), cek scope (proyek milik cabang user)
5. Backend Business Logic → validasi server-side (nomor tender unik, deadline tidak di masa lalu)
6. Backend → simpan ke tabel project_rks (transaksi DB)
7. Backend → catat audit_logs (payload before/after)
8. Backend → catat timeline_events
9. Backend → buat notifications untuk PM terkait
10. Backend → response 200 dengan data RKS terbaru
11. Frontend → invalidate React Query cache, re-fetch detail proyek
12. Frontend → tampilkan toast sukses
```

---

## 6. ALUR REQUEST AI (CONTOH: RINGKASAN RKS)

```
1. Frontend (tombol "Ringkas dengan AI" di Tab RKS) → POST /api/v1/ai/summarize/rks/{projectId}
2. Backend Middleware → verifikasi token & role (akses fitur AI dikontrol permission terpisah)
3. Backend Controller → ambil data RKS dari database (tidak ada akses langsung AI dari controller)
4. Backend Controller → panggil AI Service Layer: aiService->summarize(content, context: 'rks')
5. AI Service Layer → cek rate limit per user/hari
6. AI Service Layer → construct prompt dari Prompt Management (template tersimpan, tidak hardcode)
7. AI Service Layer → Provider Abstraction Layer → panggil Gemini API
8. Gemini API → response
9. AI Service Layer → retry jika gagal (max 3x, exponential backoff) atau tangkap error
10. AI Service Layer → log request (audit_logs: action=ai_request, feature=rks_summary)
11. Backend Controller → kembalikan hasil ringkasan ke Frontend
12. Frontend → tampilkan ringkasan dalam panel khusus (bukan menggantikan data asli)
```

> Detail lengkap retry strategy, rate limiting, cost control, dan prompt management ada di dokumen 010.

---

## 7. BATASAN ARSITEKTUR FASE 1

- Backend dan AI Service Layer berjalan dalam **proses/container yang sama** pada Fase 1 (AI Service Layer adalah modul kode, bukan microservice terpisah) — disederhanakan untuk kecepatan implementasi awal. Pemisahan menjadi microservice independen adalah opsi scalability masa depan (lihat 007 §7 Future Scalability).
- File storage Fase 1 menggunakan Docker volume lokal; migrasi ke object storage S3-compatible adalah jalur upgrade yang sudah diantisipasi dalam desain (path storage abstrak, tidak hardcode filesystem lokal di logic bisnis).
- Tidak ada API Gateway terpisah pada Fase 1; Nginx berperan sebagai titik masuk tunggal. API Gateway dedicated adalah opsi ketika jumlah service bertambah.

---

## 8. KESELARASAN DENGAN BUSINESS GOALS

| Business Goal | Bagaimana Arsitektur Mendukung |
|---|---|
| BG-02 (Approval < 2 hari kerja) | Backend stateless dan SLA Engine (041) memungkinkan eskalasi otomatis tanpa keterlambatan akibat infrastruktur |
| BG-06 (Skalabilitas 10x volume) | Stateless backend + indexing strategy (055) + opsi migrasi storage S3 |
| BG-08 (AI mempercepat pemahaman dokumen) *(Inferred)* | AI Service Layer terisolasi memungkinkan penambahan fitur AI tanpa mengubah modul bisnis inti, mempercepat iterasi fitur AI |
