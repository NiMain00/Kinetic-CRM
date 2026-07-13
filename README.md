<div align="center">
  <h1>Kinetic CRM</h1>
  <p><strong>Sistem Manajemen Penjualan & Tender Terintegrasi</strong></p>
</div>

<p align="center">
  Kinetic CRM (sebelumnya <em>Sales & Tender Management System / STMS</em>) adalah aplikasi enterprise berbasis web yang mendigitalisasi dan menstandarisasi seluruh siklus bisnis — mulai dari identifikasi prospek hingga penyelesaian tender proyek.
</p>

---

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Tech Stack](#tech-stack)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Prasyarat](#prasyarat)
- [Panduan Instalasi (Docker)](#panduan-instalasi-docker)
- [Konfigurasi Lingkungan](#konfigurasi-lingkungan)
- [Akun Default](#akun-default)
- [Struktur Proyek](#struktur-proyek)
- [Perintah Berguna](#perintah-berguna)
- [Dokumentasi](#dokumentasi)
- [Lisensi](#lisensi)

---

## Fitur Utama

### Manajemen Prospek
- Pipeline prospek (kanban-style) dengan alur status: Potensial → Waiting Supervisor → Revision → Approved / Non Potensial
- Kuesioner dinamis per prospek
- Review questions & notes per round
- Timeline event tracking
- Konversi prospek ke proyek

### Manajemen Proyek
- Siklus hidup proyek: Prospecting → RKS → LPHS/SIOS → Pricing → Tender → Won/Lost/Cancelled
- Anggota proyek & pembagian department
- Timeline events dengan file tracking
- Tasks dengan prioritas, subtasks, dan alur status

### Modul RKS (Rencana Kerja dan Syarat)
- Pembuatan RKS dengan dynamic answer-based fields
- Review rounds (questions & notes)
- Status: draft → waiting PM approval → revision → approved

### Modul LPHS/SIOS
- Review multi-department secara paralel
- PM approval, Management approval, Final approval
- Targeted revision per department
- File upload tracking

### Manajemen Pricing & Kompetitor
- Price submission dengan margin tracking
- Perbandingan harga kompetitor per proyek
- Penyimpanan reference link/URL

### Tender Result & Delivery
- Won/Lost tracking dengan loss reasons
- Contract value & SPK document upload
- Delivery target scheduling dengan status

### Modul Procurement
- Siklus pengadaan: Draft → Purchase Request → Vendor Selection → PO Process → Delivery → Progress → Closed/Cancelled
- Manajemen supplier dengan evaluasi & rating
- RFQ (Request for Quotation) dengan supplier selection
- Item/BOM management (Master Items, Project Requirements, Procurement Items)
- Procurement allocation ke project requirements

### Approval Engine
- Alur kerja approval generik dengan review paralel
- SLA-based deadlines dengan eskalasi
- Approval chains dengan amount-based levels
- Delegasi backup approver
- Reassignment support
- In-app approval inbox

### Target & KPI
- Definisi KPI dengan weighted scoring
- Target setting per scope (branch, division, company)
- Period management (monthly, quarterly, semester, annual)
- Progress snapshots dengan traffic-light scoring (red/yellow/green)

### Sistem Konfigurasi (14 Modul)
- Struktur organisasi, Status proyek, Template notifikasi, Kebijakan SLA
- Target settings, Workflow stages, Integration connectors, Upload policies
- Periods, Question types, Access control, Input options
- Dynamic input config groups

### Manajemen Dokumen
- Upload dokumen dengan versioning
- Document types dengan kebijakan ekstensi/ukuran
- Resource-linked documents (prospect, RKS, LPHS, project)

### Sistem Notifikasi
- Notifikasi in-app dengan template
- Template recipients (by role/department)
- Read receipts

### Audit Trail
- Logging audit lengkap dengan before/after payload
- Actor tracking, IP, user agent
- Audit log viewer yang dapat dicari & difilter

### AI Integration
- Analisis berbasis Google Gemini (prospek, proyek, strategi, prediksi)
- AI chat interface
- Rate limiting, cost tracking, provider abstraction

### Laporan & Dashboard
- Win/Loss report, Pipeline report
- KPI dashboard dengan progress tracking
- Calendar view
- Dashboard stats (trends, status distribution, critical deadlines)

---

## Tech Stack

### Frontend

| Teknologi | Versi | Kegunaan |
|---|---|---|
| React | 19.0.1 | UI framework (SPA) |
| TypeScript | 5.8 | Type-safe JavaScript |
| Vite | 6.2 | Build tool & dev server |
| Tailwind CSS | 4.1 | Utility-first CSS framework |
| React Router | 7.18 | Client-side routing |
| Zustand | 4.x | Global state management |
| TanStack React Query | 5.x | Server state & caching |
| Axios | 1.x | HTTP client |
| React Hook Form | 7.x | Form handling |
| Zod | 3.x | Schema validation |
| react-hot-toast | 2.x | Notifications |
| lucide-react | 0.546 | Icon library |
| date-fns | 3.x | Date utilities |

### Backend

| Teknologi | Versi | Kegunaan |
|---|---|---|
| NestJS | 10.x | Node.js framework (TypeScript) |
| Prisma | 5.22 | ORM & database migrations |
| MySQL | 8.0 | Database |
| Redis | 7.x | Caching |
| Passport + JWT | 10.x / 4.x | Authentication |
| bcrypt | 5.x | Password hashing |
| class-validator / class-transformer | 0.14 / 0.5 | DTO validation |

### AI & Infrastructure

| Teknologi | Kegunaan |
|---|---|
| Google Gemini API (Gemini 2.5 Pro) | AI analysis |
| text-embedding-004 | Semantic search embeddings |
| Docker / Docker Compose | Container orchestration (6 services) |
| Nginx | Reverse proxy, SSL termination |
| Playwright | E2E testing |

---

## Arsitektur Sistem

```
┌───────────────┐       ┌───────────────┐
│   Frontend    │──────▶│   Backend     │
│  React + Vite │       │   NestJS      │
│   (Port 3000) │◀──────│  (Port 4000)  │
└───────────────┘       └───────┬───────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
          ▼                     ▼                     ▼
   ┌──────────┐          ┌──────────┐          ┌──────────┐
   │  MySQL 8 │          │  Redis   │          │  Gemini  │
   │Database  │          │  Cache   │          │  AI API  │
   └──────────┘          └──────────┘          └──────────┘
```

### Arsitektur Frontend

```
frontend/
├── src/
│   ├── main.tsx                        # Entry point
│   ├── App.tsx                         # Root (TanStack Query + Router)
│   ├── bootstrap/                      # Init / event handlers
│   ├── components/
│   │   ├── layout/                     # AppLayout, Sidebar, Topbar, Breadcrumb, PageLoader
│   │   ├── shared/                     # ErrorBoundary, dll.
│   │   └── ui/                         # Badge, Button, Card, Modal, Table, Tabs, dll.
│   ├── config/                         # Routes, permissions, API endpoints, nav items
│   ├── features/                       # Feature modules (lazy-loaded)
│   │   ├── approvals/                  # Approval inbox
│   │   ├── audit/                      # Audit log viewer
│   │   ├── auth/                       # Login, forgot/reset password
│   │   ├── config/                     # 13+ halaman konfigurasi
│   │   ├── dashboard/                  # Dashboard utama
│   │   ├── kpi/                        # KPI dashboard, progress, targets
│   │   ├── master-data/                # Customers, competitors, categories, dll.
│   │   ├── notifications/              # Notification center
│   │   ├── procurement/                # Modul procurement lengkap
│   │   ├── projects/                   # Project list, detail, form
│   │   ├── prospects/                  # Prospect list, pipeline, detail, form
│   │   └── reports/                    # Win/loss, pipeline, calendar, KPI reports
│   ├── hooks/                          # Custom hooks (usePermission, queries, mutations)
│   ├── routes/                         # Route tree dengan lazy-loading & guards
│   ├── services/                       # API client & CRUD services
│   ├── stores/                         # 23 Zustand stores
│   ├── types/                          # TypeScript type definitions
│   └── utils/                          # Formatters, validators, export utilities
```

### Arsitektur Backend

```
backend/
├── src/
│   ├── main.ts                         # Entry point
│   ├── app.module.ts                   # Root module
│   ├── approvals/                      # Approval engine (SLA, chains, delegation)
│   ├── audit/                          # Audit logging
│   ├── auth/                           # JWT auth, Passport strategies
│   ├── common/                         # Shared utilities, guards, filters, interceptors
│   ├── config/                         # System configuration
│   ├── customers/                      # Customer CRUD
│   ├── dashboard/                      # Dashboard aggregations
│   ├── lphs/                           # LPHS/SIOS module
│   ├── master/                         # Master data
│   ├── notification/                   # Notification services
│   ├── prisma/                         # Prisma module (database client)
│   ├── projects/                       # Project management
│   ├── prospects/                      # Prospect management
│   ├── rbac/                           # Role-based access control
│   └── rks/                            # RKS module
```

### Infrastruktur Docker (6 Services)

| Service | Container Name | Port |
|---|---|---|
| Frontend | `kinetic_frontend` | `:3000` |
| Backend | `kinetic_backend` | `:4000` |
| MySQL | `kinetic_mysql` | `:3306` |
| Redis | `kinetic_redis` | `:6379` |
| Nginx | `kinetic_nginx` | `:80`, `:443` |
| Scheduler | `kinetic_scheduler` | — |

### Entity Relationship Diagram

Lihat dokumentasi lengkap ERD di `prisma/ERD_FINAL.md` (46+ model).

---

## Prasyarat

- [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/) (wajib untuk MySQL, Redis, dan container aplikasi)
- Node.js >= 18 (hanya diperlukan untuk menjalankan migrasi/seed Prisma dari host)
- Git

---

## Panduan Instalasi (Docker)

### 1. Clone Repository

```bash
git clone <repository-url>
cd kinetic-crm
```

### 2. Copy Environment File

```bash
copy .env docker\.env
```

### 3. Start Semua Container

```bash
docker compose -f docker/docker-compose.yml -f docker/docker-compose.override.yml --env-file docker/.env up -d --build
```

### 4. Jalankan Database Migration & Seed

> **Pertama kali?** Buat user database terlebih dahulu:
> ```bash
> docker exec kinetic_mysql mysql -uroot -prootpass -e "CREATE USER IF NOT EXISTS 'kinetic_user'@'%' IDENTIFIED BY 'secret'; GRANT ALL PRIVILEGES ON *.* TO 'kinetic_user'@'%'; FLUSH PRIVILEGES;"
> ```

Kemudian jalankan migrasi dan seed:

```bash
$env:DATABASE_URL="mysql://kinetic_user:secret@localhost:3306/kinetic_crm"
npx prisma migrate deploy
npx prisma db seed
```

### 5. Restart Backend

```bash
docker restart kinetic_backend
```

Tunggu ~30 detik hingga NestJS selesai kompilasi.

### 6. Akses Aplikasi

Buka **http://localhost:3000** di browser Anda.

---

## Konfigurasi Lingkungan

### Variabel Environment Utama (`.env`)

| Variable | Deskripsi | Default |
|---|---|---|
| `APP_ENV` | Environment aplikasi | `local` |
| `APP_URL` | Base URL aplikasi | — |
| `DB_DATABASE` | Nama database | `kinetic_crm` |
| `DB_USERNAME` | User database | `kinetic_user` |
| `DB_PASSWORD` | Password database | `secret` |
| `DATABASE_URL` | Connection string Prisma | — |
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

Setelah menjalankan seed database, akun-akun berikut tersedia untuk login:

| Username | Password | Role |
|---|---|---|
| `superadmin` | `admin123` | Super Admin |
| `bambang` | `admin123` | Project Manager |
| `rina` | `admin123` | Branch Manager |
| `deni` | `staff123` | Staff (Finance) |
| `siti` | `staff123` | Staff (Procurement) |
| `ahmad` | `staff123` | Staff (PM) |

---

## Struktur Proyek

```
root/
├── backend/                       # NestJS API (port 4000)
│   ├── prisma/                    # Backend prisma files
│   ├── src/                       # Source code (modules)
│   └── uploads/                   # File upload storage
│
├── frontend/                      # React + Vite (port 3000)
│   ├── src/
│   │   ├── components/            # UI & layout components
│   │   ├── features/              # Feature modules (lazy-loaded)
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── routes/                # Route definitions & guards
│   │   ├── services/              # API client & services
│   │   ├── stores/                # Zustand state stores
│   │   ├── types/                 # TypeScript type definitions
│   │   └── utils/                 # Utility functions
│   └── public/                    # Static assets
│
├── prisma/                        # Shared Prisma schema & migrations
│   ├── schema.prisma              # Database schema (46+ models)
│   ├── seed.ts                    # Database seeder
│   └── migrations/                # Migration files
│
├── shared/                        # Shared library (Zod schemas, types)
│
├── docker/                        # Docker Compose & infrastructure
│   ├── docker-compose.yml         # Main compose file
│   ├── docker-compose.override.yml# Dev overrides
│   ├── mysql/                     # MySQL config & init scripts
│   └── nginx/                     # Nginx reverse proxy config
│
├── md-Kinetic-CRM/                # Dokumentasi sistem (65 file)
│
├── scripts/                       # Utility scripts
├── storage/                       # Local file storage
├── dist/                          # Frontend build artifacts
├── .env                           # Environment variables
├── .env.example                   # Template environment
├── package.json                   # Root scripts (frontend + Prisma)
└── vite.config.ts                 # Vite configuration
```

---

## Perintah Berguna

### Docker

```bash
# Lihat status container
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Log backend
docker logs kinetic_backend --tail 50 -f

# Log frontend
docker logs kinetic_frontend --tail 50 -f

# Restart service
docker compose -f docker/docker-compose.yml -f docker/docker-compose.override.yml --env-file docker\.env restart backend

# Rebuild & restart service
docker compose -f docker/docker-compose.yml -f docker/docker-compose.override.yml --env-file docker\.env up -d --build backend

# Stop semua container
docker compose -f docker/docker-compose.yml -f docker/docker-compose.override.yml --env-file docker\.env down

# Stop & hapus volumes (menghapus database)
docker compose -f docker/docker-compose.yml -f docker/docker-compose.override.yml --env-file docker\.env down -v

# Akses MySQL
docker exec -it kinetic_mysql mysql -ukinetic_user -psecret kinetic_crm

# Backup database
./scripts/backup-db.sh
```

### Prisma

```bash
# Jalankan migrasi
npx prisma migrate deploy

# Buat migrasi baru
npx prisma migrate dev --name <nama_migrasi>

# Seed database
npx prisma db seed

# Lihat data di Prisma Studio
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

### Build

```bash
# Frontend production build (dari root)
npm run build

# Backend production build
cd backend
npm run build
```

---

## Dokumentasi

Dokumentasi sistem lengkap tersedia di direktori `md-Kinetic-CRM/` (65 file) yang mencakup:

| Dokumen | Deskripsi |
|---|---|
| `001_SYSTEM_OVERVIEW.md` | Gambaran umum sistem & tujuan bisnis |
| `005_SYSTEM_ARCHITECTURE_OVERVIEW.md` | Arsitektur sistem |
| `006_TECH_STACK_SPECIFICATION.md` | Spesifikasi tech stack |
| `007_DATA_ARCHITECTURE_PRINCIPLES.md` | Prinsip arsitektur data |
| `008_SECURITY_ARCHITECTURE.md` | Arsitektur keamanan |
| `010_AI_INTEGRATION_ARCHITECTURE.md` | Arsitektur integrasi AI |
| `013_GLOBAL_STATE_MACHINE_REFERENCE.md` | State machine reference |
| `053-055` | ERD, DDL, & Indexing |
| `056-057` | API Endpoint Specification |
| `058` | Frontend Architecture & Component Library |
| `060` | Docker Deployment & Operations |
| `062` | Master Test Case Catalog |

Juga tersedia:
- **Gap Analysis:** `prisma/ANALISIS_GAP.md`
- **Entity Relationship Diagram:** `prisma/ERD_FINAL.md`

---

## Lisensi

Hak cipta © PT. Kinetic Cerdas Indonesia. Seluruh hak cipta dilindungi undang-undang.

---

<div align="center">
  <sub>Built with ❤️</sub>
</div>
