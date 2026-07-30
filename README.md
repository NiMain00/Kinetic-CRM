<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
</div>

<br />

<h1 align="center">Kinetic CRM</h1>

<p align="center">
  <em>Approval governance platform untuk enterprise Indonesia — kelola prospecting, project delivery, procurement, dan approval dari satu tempat.</em>
</p>

<p align="center">
  <a href="#fitur">Fitur</a> ·
  <a href="#technology-stack">Tech Stack</a> ·
  <a href="#arsitektur-sistem">Arsitektur</a> ·
  <a href="#instalasi">Instalasi</a> ·
  <a href="#struktur-proyek">Struktur</a> ·
  <a href="#input-prospek-via-google-form">Google Form</a>
</p>

---

## Daftar Isi

- [Overview](#overview)
- [Fitur](#fitur)
- [Technology Stack](#technology-stack)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Struktur Proyek](#struktur-proyek)
- [Instalasi](#instalasi)
- [Konfigurasi](#konfigurasi)
- [Akun Default](#akun-default)
- [Input Prospek via Google Form](#input-prospek-via-google-form)
- [Perintah Berguna](#perintah-berguna)
- [Development Notes](#development-notes)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)
- [Lisensi](#lisensi)

---

## Overview

**Kinetic CRM** adalah platform manajemen CRM enterprise yang dirancang khusus untuk kebutuhan operasional perusahaan di Indonesia. Sistem ini mengelola siklus hidup penuh dari kualifikasi prospek hingga pengelolaan proyek dengan **approval governance** sebagai intinya.

### Masalah yang Diselesaikan

- Proses approval multi-level yang lambat dan tidak teraudit
- Data prospek dan proyek tersebar di banyak tempat (Excel, email, chat)
- Tidak ada SLA tracking untuk review dan persetujuan
- Laporan KPI yang harus dihitung manual
- Alur pengadaan yang tidak terstruktur dari purchase request hingga PO

### Target Pengguna

- **Sales & Marketing** — input prospek, tracking pipeline
- **Project Manager** — manage proyek, RKS, LPHS, tender
- **Procurement** — pengadaan barang/jasa, vendor selection
- **Finance** — pricing, budget tracking
- **Management** — approval, dashboard KPI

### Manfaat

- Approval workflow dengan SLA, eskalasi, dan delegasi approver
- Audit trail lengkap untuk setiap transaksi
- Integrasi Google Form untuk input prospek tanpa login
- KPI dashboard dengan traffic-light scoring otomatis
- Manajemen dokumen dengan versioning

---

## Fitur

### Manajemen Prospek

Pipeline prospek kanban-style dengan alur: Potensial → Waiting Supervisor → Revision → Approved / Non Potensial. Fitur kuesioner dinamis, review questions & notes per round, timeline event tracking, dan konversi prospek ke proyek. Prospek juga bisa masuk otomatis melalui Google Form.

### Manajemen Proyek

Siklus hidup proyek lengkap: Prospecting → RKS → LPHS/SIOS → Pricing → Tender → Won/Lost/Cancelled. Didukung anggota proyek dengan pembagian department, timeline events, dan task management.

### Modul RKS

Pembuatan RKS (Rencana Kerja dan Syarat) dengan dynamic answer-based fields, review rounds (questions & notes), dan alur status: draft → waiting PM approval → revision → approved.

### Modul LPHS / SIOS

Review multi-department secara paralel dengan PM approval, Management approval, dan Final approval. Mendukung targeted revision per department dan file upload tracking.

### Manajemen Pricing & Kompetitor

Price submission dengan margin tracking, perbandingan harga kompetitor per proyek, dan penyimpanan reference link.

### Tender Result & Delivery

Tracking win/loss dengan loss reasons, contract value & SPK document upload, dan delivery target scheduling.

### Modul Procurement

Siklus pengadaan dari Draft → Purchase Request → Vendor Selection → PO Process → Delivery → Progress → Closed/Cancelled. Dilengkapi manajemen supplier dengan rating, RFQ dengan supplier selection, item/BOM management, dan procurement allocation.

### Approval Engine

Alur kerja approval generik dengan review paralel, SLA-based deadlines dan eskalasi, approval chains dengan amount-based levels, delegasi backup approver, reassignment support, dan in-app approval inbox.

### Target & KPI

Definisi KPI dengan weighted scoring, target setting per scope (branch, division, company), period management (monthly, quarterly, semester, annual), dan progress snapshots dengan traffic-light scoring (red/yellow/green).

### Sistem Konfigurasi (14 Modul)

Konfigurasi struktur organisasi, status proyek, template notifikasi, kebijakan SLA, target settings, workflow stages, integration connectors, upload policies, periods, question types, access control, dan dynamic input config groups.

### Lainnya

- **Manajemen Dokumen** — upload dengan versioning, document types, resource-linked
- **Sistem Notifikasi** — in-app notification dengan template dan read receipts
- **Audit Trail** — logging lengkap dengan before/after payload, actor tracking, IP
- **AI Integration** — analisis Google Gemini untuk prospek, proyek, strategi, prediksi
- **Laporan & Dashboard** — win/loss report, pipeline report, KPI dashboard, calendar view

---

## Technology Stack

| Layer | Teknologi | Versi |
|---|---|---|
| **Frontend** | React + TypeScript + Vite | 19.0.1 / 5.8 / 6.2 |
| **Styling** | Tailwind CSS | 4.1 |
| **State Management** | Zustand + TanStack React Query | 4.x / 5.x |
| **Routing** | React Router | 7.18 |
| **Forms** | React Hook Form + Zod | 7.x / 3.x |
| **Backend** | NestJS | 10.x |
| **ORM** | Prisma | 5.22 |
| **Database** | PostgreSQL (Supabase) | 15.x |
| **Cache** | Redis (Upstash) | 7.x |
| **Auth** | Passport + JWT + bcrypt | — |
| **AI** | Google Gemini API (Gemini 2.5 Pro) | — |
| **Container** | Docker / Docker Compose (6 services) | — |
| **Testing** | Playwright | 1.61 |
| **Icons** | Lucide React | 0.546 |

---

## Arsitektur Sistem

```mermaid
graph TB
    subgraph Frontend
        REACT["React + Vite (Port 3000)"]
    end
    
    subgraph Backend
        NEST["NestJS API (Port 4000)"]
    end
    
    subgraph Storage
        PG[("PostgreSQL (Supabase)")]
        REDIS[("Redis (Upstash)")]
    end
    
    subgraph AI
        GEMINI["Google Gemini API"]
    end
    
    subgraph External
        GF["Google Form → Apps Script"]
    end
    
    GF -->|"POST /gform/webhook"| NEST
    REACT -->|"REST API"| NEST
    NEST --> PG
    NEST --> REDIS
    NEST --> GEMINI
```

### Alur Data Google Form ke CRM

```mermaid
graph LR
    FORM["Google Form"] --> SCRIPT["Apps Script (onSubmit)"]
    SCRIPT -->|"POST x-api-key"| WEBHOOK["/api/v1/gform/webhook"]
    WEBHOOK --> CUSTOMER["Create/Update Customer"]
    CUSTOMER --> PROSPECT["Create Prospect + Answers"]
    PROSPECT --> KANBAN["Kualifikasi Prospek"]
```

### Arsitektur Frontend

```
frontend/
└── src/
    ├── bootstrap/          # Init / event handlers
    ├── components/
    │   ├── layout/         # AppLayout, Sidebar, Topbar, Breadcrumb
    │   ├── shared/         # ErrorBoundary, dll.
    │   └── ui/             # Badge, Button, Card, Modal, Table, Tabs
    ├── config/             # Routes, permissions, nav items
    ├── features/           # Feature modules (lazy-loaded)
    │   ├── approvals/      # Approval inbox
    │   ├── audit/          # Audit log viewer
    │   ├── auth/           # Login, forgot/reset password
    │   ├── config/         # 13+ halaman konfigurasi
    │   ├── dashboard/      # Dashboard utama
    │   ├── kpi/            # KPI dashboard, progress, targets
    │   ├── master-data/    # Customers, competitors, categories
    │   ├── notifications/  # Notification center
    │   ├── procurement/    # Modul procurement
    │   ├── projects/       # Project list, detail, form
    │   ├── prospects/      # Prospect list, pipeline, detail, form
    │   └── reports/        # Win/loss, pipeline, calendar, KPI
    ├── hooks/              # Custom hooks (usePermission, queries)
    ├── routes/             # Route tree (lazy-loading & guards)
    ├── services/           # API client & CRUD services
    ├── stores/             # 23 Zustand stores
    ├── types/              # TypeScript definitions
    └── utils/              # Formatters, validators, export
```

### Arsitektur Backend

```
backend/
└── src/
    ├── approvals/     # Approval engine (SLA, chains, delegation)
    ├── audit/         # Audit logging
    ├── auth/          # JWT auth, Passport strategies
    ├── common/        # Shared utilities, guards, filters
    ├── config/        # System configuration
    ├── customers/     # Customer CRUD
    ├── dashboard/     # Dashboard aggregations
    ├── gform/         # Google Forms webhook handler
    ├── lphs/          # LPHS/SIOS module
    ├── master/        # Master data
    ├── notification/  # Notification services
    ├── prisma/        # Prisma module (database client)
    ├── projects/      # Project management
    ├── prospects/     # Prospect management
    ├── rbac/          # Role-based access control
    └── rks/           # RKS module
```

---

## Struktur Proyek

```
root/
├── backend/                  # NestJS API (port 4000)
│   ├── prisma/               # Backend prisma schema
│   ├── src/                  # Source code (modules)
│   └── uploads/              # File upload storage
│
├── frontend/                 # React + Vite (port 3000)
│   └── src/
│       ├── components/       # UI & layout
│       ├── features/         # Feature modules (lazy-loaded)
│       ├── hooks/            # Custom React hooks
│       ├── routes/           # Route definitions & guards
│       ├── services/         # API client & services
│       ├── stores/           # Zustand state stores
│       ├── types/            # TypeScript definitions
│       └── utils/            # Utility functions
│
├── prisma/                   # Shared Prisma schema & migrations
│   ├── schema.prisma         # Database schema (46+ models)
│   ├── seed.ts               # Database seeder
│   └── migrations/           # Migration files
│
├── database/                 # SQL dumps & backup files
├── docker/                   # Docker Compose & infrastructure
│   ├── docker-compose.yml
│   ├── postgres/             # PostgreSQL init scripts
│   └── nginx/                # Nginx reverse proxy config
├── shared/                   # Shared library (Zod schemas, types)
├── scripts/                  # Utility scripts
├── storage/                  # Local file storage
├── md-Kinetic-CRM/           # Dokumentasi sistem (65 file)
├── gform-create-script.gs    # Google Apps Script untuk form prospek
└── package.json              # Root scripts (frontend + Prisma)
```

---

## Instalasi

### Prasyarat

- [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/)
- Node.js >= 18
- Git

### 1. Clone Repository

```bash
git clone https://github.com/NiMain00/Kinetic-CRM.git
cd kinetic-crm
```

### 2. Copy Environment File

```bash
copy .env docker\.env
```

### 3. Start Docker Containers

```bash
docker compose -f docker/docker-compose.yml -f docker/docker-compose.override.yml --env-file docker/.env up -d --build
```

### 4. Database Migration & Seed

```bash
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kinetic_crm"
npx prisma migrate deploy
npx prisma db seed
```

### 5. Restart Backend

```bash
docker restart kinetic_backend
```

Tunggu ~30 detik hingga NestJS selesai kompilasi.

### 6. Akses Aplikasi

Buka **http://localhost:3000** di browser.

---

## Konfigurasi

### Environment Variables (`.env`)

| Variable | Deskripsi | Default |
|---|---|---|
| `DATABASE_URL` | Connection string PostgreSQL | — |
| `DIRECT_URL` | Direct connection untuk migrations | — |
| `REDIS_PASSWORD` | Password Redis | `redispass` |
| `JWT_SECRET` | Secret key JWT | *(wajib diubah)* |
| `JWT_EXPIRY_HOURS` | Masa berlaku token JWT | `8` |
| `AI_PROVIDER` | Provider AI | `gemini` |
| `GEMINI_API_KEY` | API key Google Gemini | *(opsional)* |
| `AI_MODEL` | Model AI | `gemini-2.5-pro` |
| `AI_RATE_LIMIT_RPM` | Rate limit AI per menit | `60` |
| `AI_COST_LIMIT_USD_PER_DAY` | Batas biaya AI per hari | `10.0` |
| `STORAGE_MAX_UPLOAD_MB` | Maksimum ukuran upload | `25` |
| `LOG_LEVEL` | Level logging | `debug` |

### Frontend Environment (`frontend/.env`)

| Variable | Default |
|---|---|
| `VITE_API_BASE_URL` | `http://localhost:4000` |
| `VITE_APP_VERSION` | — |

---

## Akun Default

Setelah menjalankan seed database:

| Username | Password | Role |
|---|---|---|
| `superadmin` | `admin123` | Super Admin |
| `bambang` | `admin123` | Project Manager |
| `rina` | `admin123` | Branch Manager |
| `deni` | `staff123` | Staff (Finance) |
| `siti` | `staff123` | Staff (Procurement) |
| `ahmad` | `staff123` | Staff (PM) |

---

## Input Prospek via Google Form

Prospek bisa masuk otomatis ke CRM melalui Google Form tanpa harus login. Cocok untuk marketing yang ingin input prospek cepat dari mana saja.

**Form Publik:** [https://docs.google.com/forms/d/e/1FAIpQLSfTNWtkGpfB4O44HXJkocWw0IL4v8qPSXxaTrnzpojvY0MWdg/viewform](https://docs.google.com/forms/d/e/1FAIpQLSfTNWtkGpfB4O44HXJkocWw0IL4v8qPSXxaTrnzpojvY0MWdg/viewform)

### Cara Kerja

```
Google Form → Google Apps Script → POST /api/v1/gform/webhook → Customer + Prospect terbuat di CRM
```

1. Marketing isi data prospek di Google Form
2. Google Apps Script trigger `onSubmit` mengirim data ke webhook backend
3. Backend otomatis membuat Customer & Prospect baru dengan level (Hot/Medium/Low)
4. Prospek muncul di halaman **Kualifikasi Prospek** → tinggal dipromote atau dikelola

### Setup Form Baru

Script Google Apps Script tersedia di `gform-create-script.gs`:

1. Buka [Google Apps Script](https://script.google.com/home) → New Project
2. Paste isi `gform-create-script.gs` → Simpan
3. Ganti `API_KEY` dengan key dari CRM (Konfigurasi → Integrasi)
4. Jalankan fungsi `createProspekForm()` → form akan terbuat otomatis
5. Buka form → ⋮ → Script Editor → paste ulang script yang sama
6. Jalankan fungsi `setupTrigger()` → trigger `onSubmit` aktif
7. Selesai! Setiap submission form otomatis masuk ke CRM

**Endpoint Webhook:** `POST /api/v1/gform/webhook` (dilindungi API Key)

---

## Perintah Berguna

### Docker

```bash
# Status container
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Log backend / frontend
docker logs kinetic_backend --tail 50 -f
docker logs kinetic_frontend --tail 50 -f

# Restart / rebuild service
docker compose -f docker/docker-compose.yml -f docker/docker-compose.override.yml --env-file docker\.env restart backend
docker compose -f docker/docker-compose.yml -f docker/docker-compose.override.yml --env-file docker\.env up -d --build backend

# Stop semua
docker compose -f docker/docker-compose.yml -f docker/docker-compose.override.yml --env-file docker\.env down

# Stop & hapus volume (hapus database)
docker compose -f docker/docker-compose.yml -f docker/docker-compose.override.yml --env-file docker\.env down -v

# Akses PostgreSQL
docker exec -it kinetic_postgres psql -U postgres kinetic_crm

# Backup database
./scripts/backup-db.sh
```

### Prisma

```bash
# Migration
npx prisma migrate deploy
npx prisma migrate dev --name <nama_migrasi>
npx prisma db seed
npx prisma studio
```

### Development (tanpa Docker)

```bash
# Frontend
cd frontend
npm run dev

# Backend
cd backend
npm run start:dev
```

### Build Production

```bash
# Frontend
npm run build

# Backend
cd backend
npm run build
```

---

## Development Notes

### Coding Style

- **Frontend:** TypeScript strict mode, functional components dengan hooks, Zustand untuk global state, TanStack Query untuk server state
- **Backend:** NestJS modular architecture, class-validator/transformer untuk DTO, Prisma untuk database access
- **Naming Conventions:** camelCase untuk JavaScript/TypeScript, PascalCase untuk komponen React dan kelas

### Key Dependencies

| Package | Purpose |
|---|---|
| Zustand | Global state management (23 stores) |
| TanStack React Query | Server state & caching |
| React Hook Form + Zod | Form handling & validation |
| Zustand | Global state management |
| Lucide React | Icon library |
| Passport + JWT | Authentication |
| Prisma | ORM & database migrations |
| class-validator | DTO validation |

### API Structure

Semua endpoint REST API berada di bawah prefix `/api/v1/`. Autentikasi menggunakan JWT Bearer token, kecuali webhook `/api/v1/gform/webhook` yang menggunakan API Key via header `x-api-key`.

### Workflow

1. Feature dikembangkan di branch terpisah
2. Gunakan TypeScript strict mode
3. Backend validation menggunakan `class-validator`
4. Frontend form validation menggunakan Zod schema
5. Database change melalui Prisma migrations
6. E2E testing menggunakan Playwright

---

## Known Limitations

- Membutuhkan koneksi internet untuk Google Gemini AI features
- Google Form webhook membutuhkan API Key yang dikonfigurasi manual
- Fitur tertentu (LPHS/SIOS concurrent review) membutuhkan pemahaman alur bisnis KALLA
- Report generation masih terbatas pada format yang sudah ditentukan
- Notifikasi hanya in-app (belum terintegrasi email/WhatsApp)

---

## Future Improvements

- Integrasi email notification (SMTP)
- Integrasi WhatsApp notification
- Export report ke PDF & Excel lanjutan
- Mobile app (React Native)
- Real-time collaboration pada review module
- Automated scoring untuk kualifikasi prospek (BANT framework)
- Integration dengan sistem akuntansi existing
- Dark mode
- Multi-language support (English)

---

## Lisensi

This project is intended for internal use within KALLA Transport &amp; Logistics.
