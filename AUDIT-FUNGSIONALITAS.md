# Audit Fungsionalitas - Kinetic CRM

## Ringkasan Project

- **Frontend:** React 19 + Vite 6 (SPA)
- **Backend:** NestJS 10 + Prisma ORM
- **Database:** MySQL/PostgreSQL
- **Status:** Ongoing Development

## 1. Modul & Fitur yang Sudah Berfungsi

### 1.1 Manajemen Prospek (Prospect)
- [x] Pipeline Kanban (Lead → Potensial → Waiting Supervisor → Revision → Approved)
- [x] Kualifikasi prospek dengan dynamic questionnaire
- [x] Review prospek (multi-round)
- [x] Visit management
- [x] Follow-up tasks
- [x] Timeline event
- [x] Konversi prospek ke project

### 1.2 Manajemen Project
- [x] Full lifecycle: Prospecting → RKS → LPHS/SIOS → Pricing → Tender → Delivery
- [x] 11 tab detail project (Overview, RKS, Review RKS, LPHS/SIOS, Harga, Kompetitor, Pemenang, Target/Delivery, Dokumen, Tasks, Timeline)
- [x] Project members & departments
- [x] Timeline events
- [x] Status & phase tracking

### 1.3 Modul RKS (Rencana Kerja dan Syarat)
- [x] Upload file RKS (PDF, DOCX, DOC)
- [x] Dynamic questionnaire (berdasarkan master question context: rks/both)
- [x] Auto-save jawaban (Zustand store + debounce backend)
- [x] Review RKS oleh PM (approve/revision)
- [x] Multi-round review notes
- [x] Delete file RKS

### 1.4 Modul LPHS/SIOS
- [x] Upload file LPHS (PDF, DOCX, XLSX, ZIP)
- [x] Upload file SIOS (PDF, DOCX)
- [x] External URL support (Google Docs, OneDrive)
- [x] Multi-department parallel review
- [x] PM approval → Management approval → Final approval
- [x] Targeted revision per department
- [x] Revision round tracking

### 1.5 Modul Harga & Kompetitor
- [x] Input harga (our price, margin percentage)
- [x] Reference link
- [x] Add/remove competitors
- [x] Competitor price tracking

### 1.6 Modul Tender & Delivery
- [x] Hasil tender (won/lost)
- [x] Contract value tracking
- [x] SPK document upload
- [x] Loss reason categorization
- [x] Delivery target scheduling

### 1.7 Manajemen Dokumen
- [x] 5 kelompok dokumen (RKS, LPHS, SIOS, Harga, MISC)
- [x] Versioned document upload
- [x] Upload policy configuration (MIME type, max size)
- [x] Configurable max file size (default 10MB)

### 1.8 Pengadaan (Procurement)
- [x] Full cycle: PR → Vendor Selection → PO → Delivery → Close
- [x] RFQ management
- [x] Supplier management (evaluations, rating)
- [x] Item/BOM management

### 1.9 Approval Engine
- [x] Generic parallel review workflow
- [x] SLA-based deadlines
- [x] Escalation
- [x] Reassignment

### 1.10 Target & KPI
- [x] KPI definitions
- [x] Period management
- [x] Traffic-light status (red/yellow/green)
- [x] Progress snapshots

### 1.11 Sistem Lainnya
- [x] Auth (JWT + Passport)
- [x] RBAC (role, permission, scope)
- [x] Organisasi hierarki (company → division → branch → department)
- [x] Notifikasi in-app
- [x] Audit trail (before/after dengan actor)
- [x] Integrasi Google Gemini AI
- [x] Chat per project
- [x] Task management per project
- [x] Dashboard & reports
- [x] Konfigurasi sistem (14 sub-modul)
- [x] Google Forms webhook integration
- [x] Responsive design (mobile support)

## 2. Catatan Fungsionalitas yang Perlu Ditinjau

### 2.1 Upload File
- **Batas ukuran file:** Default 10MB (via UploadConfig). Catatan user menyebut perlunya batas >50MB untuk file RKS.
- **Belum ada** progress bar upload untuk file besar.
- **Belum ada** chunked upload untuk file >50MB.

### 2.2 Google Forms Integration
- [x] Webhook endpoint sudah ada (`POST /gform/webhook`)
- [x] Mapping field sudah dikonfigurasi (nama_customer, pic, level, dll)
- [x] Auto-create Customer + Prospect
- [x] Mendukung level (hot/medium/low)
- Yang perlu diperiksa: koneksi real-time, error handling, duplicate detection

### 2.3 Prospek & Customer
- **Customer Level (hot/medium/low):** Sudah ada di model Customer (`level` field) dan di webhook mapping.
- **Belum ada** mekanisme "jika hot/medium maka munculkan detail project" (conditional flow berdasarkan kategori).
- **Detail prospek terlalu spesifik:** Sesuai catatan, prospek saat ini menangkap banyak detail di tahap awal.

### 2.4 Review & Question System
- **Template question:** Sudah ada master question dengan context (rks/both/prospect).
- **Fleksibilitas per role:** Question saat ini statis per context, belum bisa dibedakan per role/divisi.
- **Review bersama divisi:** LPHS sudah support multi-department review, tapi RKS review hanya oleh PM.

### 2.5 UX & Alur
- **Panjang step:** Project memiliki 11 tab yang harus diisi secara berurutan.
- **Standarisasi:** Belum ada template standar yang konsisten di semua cabang.
- **Beban birokrasi:** Approval engine memiliki banyak tahap yang bisa memperlambat tender.

### 2.6 LPHS Flow Issue
- **Lama upload LPHS:** Tidak ada optimasi upload (kompresi, paralel upload).
- **Lama ke customer:** Tidak ada integrasi langsung ke customer setelah LPHS selesai.

## 3. Arsitektur & Teknis

### 3.1 Frontend
- **State management:** 25 Zustand stores (cukup banyak, perlu konsolidasi)
- **Routing:** React Router v7 dengan guards (ProtectedRoute, RoleRoute, PermissionRoute)
- **API calls:** Axios + TanStack React Query (caching baik)
- **Forms:** React Hook Form + Zod (validasi baik)
- **Kompleksitas:** Beberapa file komponen sangat besar (LphsSiosTab.tsx: 1001 line, RksTab.tsx: 677 line)

### 3.2 Backend
- **Modular:** 18 feature modules di NestJS
- **Database:** 46+ model Prisma (schema 2242 line)
- **Keamanan:** JWT auth, RBAC, audit log
- **Integrasi:** Google Forms webhook, Google Gemini AI

### 3.3 Potensi Masalah Teknis
- File besar >50MB belum di-handle (timeout, memory limit)
- Single file upload tanpa resume untuk file besar
- Belum ada mekanisme anti-duplicate submission dari Google Form
- Komponen frontend terlalu besar (perlu di-split)
- Belum ada caching untuk master data yang sering diakses
