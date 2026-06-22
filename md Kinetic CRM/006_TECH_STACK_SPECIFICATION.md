# 006 — TECH STACK SPECIFICATION
## KINETIC CRM — Spesifikasi Teknologi Lengkap

**Modul:** Architecture
**Sumber Utama:** FE Spec §1.1; PRD §1, §9, Appendix A
**Dependensi Dokumen:** 005
**Dirujuk Oleh:** 058 (Frontend Architecture), 060 (Docker Deployment)

---

## 1. TUJUAN DOKUMEN

Mendaftarkan seluruh teknologi yang dipakai KINETIC CRM beserta versi spesifik dan justifikasi pemilihannya, agar tim development memiliki referensi tunggal saat setup environment dan tidak ada ambiguitas pustaka mana yang dipakai.

---

## 2. FRONTEND STACK

| Layer | Teknologi | Versi | Keterangan |
|---|---|---|---|
| UI Framework | React + TypeScript | 18.x / 5.x | SPA, strict mode enabled |
| Build Tool | Vite | 5.x | Fast HMR, code splitting per route |
| Styling | Tailwind CSS | 3.x | Utility-first; custom design tokens via `tailwind.config` |
| State Management | Zustand + React Query | 4.x / 5.x | Zustand untuk global UI state; React Query untuk server state & caching |
| Routing | React Router | 6.x | Nested routes, lazy loading per modul |
| Forms | React Hook Form + Zod | 7.x / 3.x | Validasi skema berbasis Zod; uncontrolled inputs untuk performa |
| HTTP Client | Axios | 1.x | Interceptor global untuk auth token & error handling |
| Table | TanStack Table | 8.x | Virtualisasi, sorting, filtering sisi client |
| Date | date-fns | 3.x | Formatting, kalkulasi hari kerja (terintegrasi Master Holiday Calendar) |
| Icons | Lucide React | latest | Tree-shakeable icon set |
| Notifikasi Toast | react-hot-toast | 2.x | Lightweight toast; posisi top-right |
| File Upload | react-dropzone | 14.x | Drag & drop + klik; validasi MIME & size client-side |
| Charts | Recharts | 2.x | Kompatibel React; responsive container |
| Testing | Vitest + Testing Library | 1.x / 14.x | Unit & integration; minimal mocking |
| Linting | ESLint + Prettier | — | Enforced via pre-commit hook (Husky) |
| Containerisasi FE | Docker + Nginx | — | Vite build di-serve via Nginx Alpine |

**Justifikasi Pemilihan Kunci:**
- **Zustand + React Query (bukan Redux):** memisahkan secara jelas antara *UI state* (Zustand, ringan) dan *server state* (React Query, dengan caching/invalidation otomatis) — mengurangi boilerplate dan risiko state UI menyimpang dari data server (mengatasi Risiko 2 BA Review §B.4).
- **Zod:** validasi skema yang dapat dibagi (di masa depan) antara client dan konsep request body backend, mengurangi duplikasi logika validasi.
- **TanStack Table:** dibutuhkan karena hampir seluruh modul (Prospek, Proyek, Master Data, Audit Log) memerlukan tabel dengan sorting/filtering/pagination server-side yang konsisten.

---

## 3. BACKEND STACK

| Layer | Teknologi | Versi | Keterangan |
|---|---|---|---|
| Bahasa & Runtime | PHP | 8.2 | Dengan PHP-FPM |
| Web Server (backend) | Nginx | Alpine | Reverse proxy ke PHP-FPM |
| Database Driver | PDO (MySQL) | — | **Wajib** prepared statements; raw SQL concatenation dilarang (mengatasi R-07 PRD §13.1) |
| Autentikasi | JWT (firebase/php-jwt atau setara) | — | Expiry 8 jam, atau session cookie HttpOnly + Secure + SameSite=Strict sebagai alternatif |
| Password Hashing | bcrypt | cost factor ≥ 12 | — |
| HTTP Client (server-to-server, untuk AI) | Guzzle HTTP atau cURL native | — | Untuk komunikasi AI Service Layer → Gemini API |
| Dependency Manager | Composer | — | — |
| API Style | REST, JSON | — | Versioned `/api/v1/` (lihat 056) |

**Justifikasi Pemilihan Kunci:**
- PHP 8.2 dipilih meneruskan rekomendasi PRD/BA Review untuk kompatibilitas dengan tim yang sudah familiar, sembari memperbaiki seluruh anti-pattern yang dikritik (raw SQL, JSON blob, file backend tanpa struktur `/api/`).
- Struktur backend direorganisasi ke `/backend/api/v1/{module}/` (mengatasi kritik PRD §14.1 "Kurangnya API Versioning").

---

## 4. DATABASE STACK

| Komponen | Teknologi | Versi |
|---|---|---|
| RDBMS | MySQL | 8.0 |
| Karakter Set | utf8mb4 | — (mendukung emoji/karakter khusus pada catatan teks) |
| Storage Engine | InnoDB | — (wajib untuk dukungan foreign key & transaksi) |

---

## 5. AI STACK

| Komponen | Teknologi/Provider | Versi/Model | Keterangan |
|---|---|---|---|
| Provider Utama | Google Gemini API | `gemini-2.5-pro` (teks/analisis), opsional model lebih ringan untuk fitur volume tinggi | Lihat 010 untuk detail penuh |
| Model Embedding (Smart Search) | Gemini Embedding | `text-embedding-004` | Untuk fitur Smart Search semantik (011) |
| Library Komunikasi | HTTP client backend (Guzzle/cURL) | — | Tidak menggunakan SDK client-side; seluruh panggilan dari Backend (Server-to-Server) demi keamanan API key |
| Future Provider Support | OpenAI API, Anthropic Claude API, Azure OpenAI | — | Diabstraksi via Provider Abstraction Layer, lihat 010 |

> **Prinsip kunci:** API key Gemini **tidak pernah** terekspos ke Frontend. Seluruh panggilan AI berasal dari Backend melalui AI Service Layer.

---

## 6. INFRASTRUCTURE STACK

| Komponen | Teknologi | Keterangan |
|---|---|---|
| Containerization | Docker + Docker Compose | Lihat 060 untuk konfigurasi lengkap |
| Reverse Proxy | Nginx Alpine | Serve frontend build + proxy API |
| Volume Persistence | Docker Named Volumes | MySQL data, file upload, log |
| Backup | Cron container + `mysqldump` | Backup harian, retensi 30 hari |
| OS Target Deployment | Ubuntu 22.04 LTS (atau setara) | Asumsi dari PRD §13.2 |

---

## 7. MATRIX KOMPATIBILITAS VERSI (RINGKASAN PIN VERSION)

| Paket | Versi Minimum yang Diuji | Catatan Upgrade |
|---|---|---|
| Node.js (build time) | 20.x | Sesuai base image `node:20-alpine` di Dockerfile (060) |
| PHP | 8.2 | Base image `php:8.2-fpm` |
| MySQL | 8.0 | Base image `mysql:8.0` |
| React | 18.x | Hindari upgrade ke React 19 tanpa audit kompatibilitas shadcn/ui & Recharts |

---

## 8. BROWSER SUPPORT

Sesuai PRD §13.2 Assumptions: Chrome 110+, Firefox 110+, Edge 110+. Tidak ada dukungan resmi untuk Internet Explorer (deprecated oleh Microsoft).

---

## 9. KESELARASAN DENGAN PRINSIP ARSITEKTUR (005)

Seluruh pilihan stack di atas dirancang agar:
- Backend dapat di-scale horizontal (stateless PHP-FPM container).
- AI Service Layer dapat dipisah menjadi service independen tanpa migrasi besar (karena sudah diabstraksi sebagai modul kode terpisah sejak Fase 1).
- Frontend dapat membangun ulang (rebuild) tanpa downtime backend, karena build dipisah dalam multi-stage Docker (lihat 060).
