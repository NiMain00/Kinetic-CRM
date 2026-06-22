# 000 — DOCUMENT INDEX
## KINETIC CRM — Full System Documentation Blueprint

**Versi:** 1.1 (revisi setelah review)
**Sumber:** BA Review STMS v1.0 (prioritas utama) + PRD STMS v1.0 + Frontend Spec STMS v1.0
**Status:** INDEX DISETUJUI — siap masuk tahap pembuatan isi dokumen

---

## CATATAN PENTING

1. Seluruh nama produk "Sales & Tender Management System / STMS" ditulis ulang sebagai **KINETIC CRM** di seluruh dokumen turunan, namun seluruh istilah proses bisnis domain tender Indonesia (RKS, LPHS, SIOS, SPK, dll.) **dipertahankan**.
2. Modul **Target & KPI** (Gap Kritikal GAP01) didesain **lengkap dan penuh** — bukan ringkasan. Klasifikasi fase tetap dicantumkan tapi desain selesai 100% sekarang.
3. Seluruh JSON blob di desain lama **dinormalisasi penuh ke tabel relasional** — tidak ada lagi JSON freeform untuk data terstruktur.
4. Seluruh 22 gap BA Review dipetakan melalui **Gap Traceability Matrix** (file 003).
5. Modul Configuration (CFG-01 s/d CFG-14) didesain penuh sebagai pengganti seluruh parameter hardcode.
6. **REVISI v1.1 — Penambahan wajib dari hasil review:**
   - **AI Integration (Gemini)** dinaikkan jadi komponen arsitektur resmi: 2 dokumen baru (Architecture + Features & Use Cases), bukan sekadar env var.
   - **UI Screen Catalog** ditambahkan: katalog seluruh layar sistem dengan purpose/roles/components/actions/validation/navigation/API dependency per screen.
   - **Information Architecture & Navigation** ditambahkan: sitemap, struktur menu, breadcrumb rules, role-based navigation.
   - **Global State Machine Reference** ditambahkan: referensi pusat seluruh lifecycle status (Prospect, Project, RKS, LPHS, SIOS, Approval, KPI, Cancellation) dalam satu dokumen lintas-modul.
   - **Data Migration Strategy** ditambahkan dengan catatan scope (lihat file 061): PRD/BA Review/FE Spec tidak menyebut sistem digital lama yang digantikan secara formal — proses existing adalah manual (email/spreadsheet/dokumen fisik). Dokumen ini ditandai sebagai **Inferred Scope**: fokus pada (a) migrasi data manual/spreadsheet ke KINETIC CRM saat onboarding, dan (b) migrasi teknis localStorage→DB (GAP03).
   - **Docker & Deployment** diperluas: environment variables AI, secret management, environment separation (local/dev/staging/production), container security, backup strategy, disaster recovery sebagai sub-bagian wajib di file 060 (bukan dokumen baru terpisah, scope diperluas).
   - **Integration Architecture** diperluas: prinsip resmi AI Service Layer sebagai perantara wajib (Business Module tidak boleh memanggil Gemini langsung), dengan diagram alur Frontend → Backend API → AI Service Layer → Gemini API.
7. Total **64 file** dokumentasi isi + index ini = **65 file**. Setiap file memiliki satu tanggung jawab jelas.
8. Setiap dokumen ditulis lengkap, tanpa placeholder/TBD, siap dipakai BA/FE/BE/QA/DevOps/PM. Cross-check terhadap ketiga dokumen sumber dilakukan di akhir setiap batch pembuatan. Requirement implisit yang ditemukan akan ditandai eksplisit sebagai **"Inferred Requirement"** beserta alasannya di dalam dokumen terkait — tidak disisipkan diam-diam.

---

## STRUKTUR FOLDER

```
kinetic-crm-docs/
├── 000_DOCUMENT_INDEX.md
├── 00_overview/
├── 01_architecture/
├── 02_reference_catalog/
├── 03_organization_access/
├── 04_master_data/
├── 05_configuration/
├── 06_core_modules/
├── 07_workflow_engine/
├── 08_target_kpi/
├── 09_notification/
├── 10_document_management/
├── 11_dashboard/
├── 12_reporting/
├── 13_audit/
├── 14_database/
├── 15_api/
├── 16_frontend/
├── 17_non_functional/
├── 18_infrastructure/
├── 19_qa_testing/
├── 20_project_planning/
└── 21_gap_roadmap/
```

---

## DAFTAR FILE

### 00 — Overview & Governance (4 file)
| # | File | Tanggung Jawab |
|---|------|-----------------|
| 001 | `00_overview/001_SYSTEM_OVERVIEW.md` | Visi produk, problem statement, business goals & KPI (BG-01..06), ruang lingkup in/out scope, daftar stakeholder |
| 002 | `00_overview/002_GLOSSARY_AND_TERMINOLOGY.md` | Kamus istilah domain (RKS, LPHS, SIOS, SPK, dll.), istilah teknis, akronim, penamaan status |
| 003 | `00_overview/003_GAP_TRACEABILITY_MATRIX.md` | Tabel pemetaan seluruh 22 gap BA Review ke dokumen/modul yang menyelesaikannya, status resolusi, fase implementasi |
| 004 | `00_overview/004_USER_PERSONAS_AND_JOURNEYS.md` | 5 persona (Cabang, PM, Departemen, Management, Admin) detail + end-to-end user journey (Prospek-Proyek, Tender, Non-Tender) |

### 01 — Architecture (8 file)
| # | File | Tanggung Jawab |
|---|------|-----------------|
| 005 | `01_architecture/005_SYSTEM_ARCHITECTURE_OVERVIEW.md` | Arsitektur high-level (frontend SPA, backend REST API, DB, container, AI service layer), diagram komponen, prinsip desain |
| 006 | `01_architecture/006_TECH_STACK_SPECIFICATION.md` | Stack lengkap FE (React/TS/Tailwind/Zustand/RQ/dll.) dan rekomendasi BE/DB, versi, justifikasi pemilihan |
| 007 | `01_architecture/007_DATA_ARCHITECTURE_PRINCIPLES.md` | Prinsip normalisasi (anti-JSON-blob), strategi versioning, soft-delete, audit-by-design, optimistic locking |
| 008 | `01_architecture/008_SECURITY_ARCHITECTURE.md` | Auth (JWT/session), RBAC enforcement layer, encryption, OWASP controls, CSRF/XSS/SQLi prevention, secrets management |
| 009 | `01_architecture/009_INTEGRATION_ARCHITECTURE.md` | Arsitektur integrasi fase 2/3 (SMTP, SSO/SAML-OAuth2, WhatsApp/Teams, ERP/CRM API publik) plus prinsip resmi AI Service Layer sebagai perantara wajib |
| 010 | `01_architecture/010_AI_INTEGRATION_ARCHITECTURE.md` | [BARU] AI sebagai komponen arsitektur resmi: AI Service Layer, Provider Abstraction Layer, Gemini API Integration, Future Provider Support, Retry Strategy, Error Handling, Rate Limiting, Monitoring, Logging, Cost Control, Security Policy, Prompt Management, AI Request Lifecycle |
| 011 | `01_architecture/011_AI_FEATURES_AND_USE_CASES.md` | [BARU] Katalog fitur AI: Tender Summary, RKS Summary, LPHS Summary, Prospect Analysis, Customer Insight, Competitor Analysis, Meeting Summary, KPI Insight, Executive Dashboard Summary, Smart Search, Future AI Recommendations |
| 012 | `01_architecture/012_INFORMATION_ARCHITECTURE_AND_NAVIGATION.md` | [BARU] Sitemap lengkap, struktur menu, sidebar navigation, breadcrumb rules, role-based navigation, page hierarchy, navigation flow |

### 02 — Reference & Catalog (2 file) — KATEGORI BARU
| # | File | Tanggung Jawab |
|---|------|-----------------|
| 013 | `02_reference_catalog/013_GLOBAL_STATE_MACHINE_REFERENCE.md` | [BARU] Referensi pusat seluruh lifecycle status (Prospect, Project, RKS, LPHS, SIOS, Approval, KPI, Cancellation): allowed transition, actor, validation, trigger, notification per status |
| 014 | `02_reference_catalog/014_UI_SCREEN_CATALOG.md` | [BARU] Katalog seluruh layar sistem dengan Purpose, User Roles, Components, Actions, Validation, Navigation, API Dependencies per screen |

### 03 — Organization & Access (6 file)
| # | File | Tanggung Jawab |
|---|------|-----------------|
| 015 | `03_organization_access/015_ORGANIZATION_HIERARCHY_MODULE.md` | Modul Company-Division-Department-Branch penuh (GAP05): business rules, CRUD, state diagram, validation, API, DB |
| 016 | `03_organization_access/016_POSITION_MANAGEMENT_MODULE.md` | Master Position/Job Title untuk approval berbasis posisi, bukan nama user |
| 017 | `03_organization_access/017_ROLE_PERMISSION_MODULE.md` | Modul Role & Permission dinamis (CFG-04): permission matrix, role custom, scope data per role |
| 018 | `03_organization_access/018_USER_MANAGEMENT_MODULE.md` | CRUD user, reset password, lock/unlock, assignment branch/dept/role/position |
| 019 | `03_organization_access/019_AUTHENTICATION_SESSION_MODULE.md` | Login, session lifecycle, idle timeout, lockout, multi-session handling, FR001-FR004 lengkap |
| 020 | `03_organization_access/020_AUTHORIZATION_ENFORCEMENT_SPEC.md` | Spek teknis enforcement RBAC di setiap layer (route guard FE, middleware BE, query scope DB) |

### 04 — Master Data (6 file)
| # | File | Tanggung Jawab |
|---|------|-----------------|
| 021 | `04_master_data/021_MASTER_CUSTOMER_AND_CATEGORY.md` | Master Customer, Master Kategori Proyek (MD04), Master Industri |
| 022 | `04_master_data/022_MASTER_PROJECT_STATUS_AND_DOCUMENT_TYPE.md` | Master Status Proyek dinamis (MD05), Master Tipe Dokumen (MD11) |
| 023 | `04_master_data/023_MASTER_COMPETITOR_MODULE.md` | Normalisasi Master Kompetitor (MD14/GAP09): entitas, relasi many-to-many ke proyek, analitik dasar |
| 024 | `04_master_data/024_MASTER_QUESTION_AND_QUESTION_TYPE.md` | Master Pertanyaan (prospek & RKS) plus migrasi Question Type dari localStorage ke DB (GAP03/FR102/CFG-12) |
| 025 | `04_master_data/025_MASTER_PERIOD_AND_HOLIDAY_CALENDAR.md` | Master Periode Pelaporan (MD10), Master Hari Libur (MD13) untuk kalkulasi SLA hari kerja |
| 026 | `04_master_data/026_MASTER_LOSS_REASON_AND_MISC.md` | Master Alasan Kekalahan (GAP12), master pendukung lain |

### 05 — Configuration Module / Admin Backbone (5 file)
| # | File | Tanggung Jawab |
|---|------|-----------------|
| 027 | `05_configuration/027_CONFIG_ORGANIZATION_AND_WORKFLOW.md` | CFG-01 (Org) dan CFG-02 (Approval Workflow): UI tree config, builder workflow drag-drop, validasi |
| 028 | `05_configuration/028_CONFIG_STATUS_CATEGORY_ROLE.md` | CFG-03 (Status Proyek), CFG-04 (Role & Permission), CFG-11 (Kategori Proyek) |
| 029 | `05_configuration/029_CONFIG_SLA_REMINDER_ESCALATION.md` | CFG-05 (SLA) dan CFG-06 (Reminder/Eskalasi): kalkulasi hari kerja, trigger, recipient |
| 030 | `05_configuration/030_CONFIG_TARGET_DASHBOARD_NOTIFICATION.md` | CFG-07 (Target & Bobot KPI), CFG-08 (Dashboard), CFG-09 (Notifikasi Email) |
| 031 | `05_configuration/031_CONFIG_SYSTEM_PERIOD_UPLOAD_INTEGRATION.md` | CFG-10 (Periode Pelaporan), CFG-12 (Tipe Pertanyaan), CFG-13 (Upload), CFG-14 (Integrasi Eksternal, termasuk konfigurasi AI provider) |

### 06 — Core Business Modules (7 file)
| # | File | Tanggung Jawab |
|---|------|-----------------|
| 032 | `06_core_modules/032_PROSPECT_MANAGEMENT_MODULE.md` | Modul Prospek penuh: CRUD, state lifecycle, approval PM, revisi, konversi ke proyek (FR010-015) |
| 033 | `06_core_modules/033_PROJECT_CORE_MODULE.md` | Entitas Project inti: dua tipe (tender/prospecting), state machine gabungan plus status cancelled (GAP04) |
| 034 | `06_core_modules/034_RKS_MODULE.md` | Modul RKS: input, validasi, review PM, revisi, approval (FR030-033) |
| 035 | `06_core_modules/035_LPHS_SIOS_MODULE.md` | Modul LPHS/SIOS: pemilihan dept, upload draft, approval paralel PM+Dept (redesain GAP08), revisi tertarget |
| 036 | `06_core_modules/036_HARGA_KOMPETITOR_MODULE.md` | Modul Harga Penawaran & Kompetitor per proyek (FR050-051) |
| 037 | `06_core_modules/037_PEMENANG_DELIVERY_MODULE.md` | Modul Pemenang Tender (menang/kalah + loss reason) & Target Delivery (FR060-062) |
| 038 | `06_core_modules/038_PROJECT_CANCELLATION_MODULE.md` | Status cancelled penuh (GAP04/BP04): business rule, hak akses, dampak ke laporan |

### 07 — Approval & Workflow Engine (4 file)
| # | File | Tanggung Jawab |
|---|------|-----------------|
| 039 | `07_workflow_engine/039_APPROVAL_ENGINE_CORE.md` | Engine approval generik: konsep stage, decision, precondition enforcement, approval audit trail kaya |
| 040 | `07_workflow_engine/040_PARALLEL_REVIEW_AND_TARGETED_REVISION.md` | Redesain parallelisasi review Dept+PM (GAP08/BP02) & revisi LPHS tertarget per dept (BP03) |
| 041 | `07_workflow_engine/041_SLA_ESCALATION_ENGINE.md` | Engine SLA: kalkulasi hari kerja, reminder T-X, eskalasi otomatis (GAP06/BP01) |
| 042 | `07_workflow_engine/042_BACKUP_APPROVER_AND_REASSIGNMENT.md` | Backup approver & re-assign manual oleh admin (GAP07), delegasi sementara |

### 08 — Target & KPI Module (3 file) — Gap Kritikal, Desain Penuh
| # | File | Tanggung Jawab |
|---|------|-----------------|
| 043 | `08_target_kpi/043_TARGET_KPI_DATA_MODEL_AND_BUSINESS_RULES.md` | Master KPI, Master Target (versioned), Master Bobot, formula skor komposit, business rules lengkap |
| 044 | `08_target_kpi/044_TARGET_SETTING_WORKFLOW.md` | Workflow input/update target oleh admin/management, histori versi |
| 045 | `08_target_kpi/045_PROGRESS_MONITORING_AND_SCORING.md` | Kalkulasi progress real-time vs target, snapshot periodik, traffic-light indicator, UI & API |

### 09 — Notification Module (2 file)
| # | File | Tanggung Jawab |
|---|------|-----------------|
| 046 | `09_notification/046_INAPP_NOTIFICATION_MODULE.md` | Notifikasi in-app: polling, tipe event, trigger matrix lengkap, badge counter (FR090-091) |
| 047 | `09_notification/047_EMAIL_AND_EXTERNAL_NOTIFICATION_FASE2.md` | Desain penuh notifikasi email/WhatsApp/Teams & approval one-click via link (Fase 2/3) |

### 10 — Document Management (2 file)
| # | File | Tanggung Jawab |
|---|------|-----------------|
| 048 | `10_document_management/048_DOCUMENT_UPLOAD_STORAGE_MODULE.md` | Upload, validasi tipe/ukuran, storage di luar webroot, download terautentikasi (FR070-071) |
| 049 | `10_document_management/049_DOCUMENT_VERSIONING_MODULE.md` | Versioning dokumen penuh (GAP14): model data, UI histori versi, business rules |

### 11 — Dashboard Module (1 file)
| # | File | Tanggung Jawab |
|---|------|-----------------|
| 050 | `11_dashboard/050_DASHBOARD_MODULE.md` | Dashboard per role + filter granular (GAP10/D.6): seluruh widget, kalkulasi, refresh policy, AI Executive Summary widget |

### 12 — Reporting Module (1 file)
| # | File | Tanggung Jawab |
|---|------|-----------------|
| 051 | `12_reporting/051_REPORTING_MODULE.md` | Laporan Win/Loss, Pipeline, Progress vs Target, export Excel/PDF (GAP11) |

### 13 — Audit Module (1 file)
| # | File | Tanggung Jawab |
|---|------|-----------------|
| 052 | `13_audit/052_AUDIT_TRAIL_MODULE.md` | Audit log append-only, payload before/after, export CSV (GAP16), kebijakan retensi |

### 14 — Database Design (3 file)
| # | File | Tanggung Jawab |
|---|------|-----------------|
| 053 | `14_database/053_FULL_ENTITY_RELATIONSHIP_DIAGRAM.md` | ERD lengkap seluruh entitas (40+ tabel), relasi, kardinalitas |
| 054 | `14_database/054_FULL_DATABASE_SCHEMA_DDL.md` | DDL lengkap: semua tabel, kolom, tipe data, constraint, FK, default value |
| 055 | `14_database/055_INDEXING_AND_QUERY_OPTIMIZATION_STRATEGY.md` | Strategi index per tabel, query pattern kritis, partitioning masa depan |

### 15 — API Design (2 file)
| # | File | Tanggung Jawab |
|---|------|-----------------|
| 056 | `15_api/056_API_CONVENTIONS_AND_STANDARDS.md` | Konvensi REST, versioning (/api/v1/), format response/error, pagination, rate limiting |
| 057 | `15_api/057_FULL_API_ENDPOINT_SPECIFICATION.md` | Spesifikasi lengkap seluruh endpoint per modul (termasuk AI endpoints): method, request/response schema, role, error code |

### 16 — Frontend Architecture (1 file)
| # | File | Tanggung Jawab |
|---|------|-----------------|
| 058 | `16_frontend/058_FRONTEND_ARCHITECTURE_AND_COMPONENT_LIBRARY.md` | Struktur folder, konvensi kode, state management, routing, UI component library lengkap, responsive strategy, accessibility checklist |

### 17 — Non-Functional Requirements (1 file)
| # | File | Tanggung Jawab |
|---|------|-----------------|
| 059 | `17_non_functional/059_NON_FUNCTIONAL_REQUIREMENTS.md` | Security, performance, scalability, reliability, accessibility — target terukur lengkap |

### 18 — Infrastructure & Deployment (2 file)
| # | File | Tanggung Jawab |
|---|------|-----------------|
| 060 | `18_infrastructure/060_DOCKER_DEPLOYMENT_AND_OPERATIONS.md` | Docker Compose lengkap (termasuk env var AI: GEMINI_API_KEY, AI_PROVIDER, AI_MODEL, dll.), Dockerfile FE/BE, health check (GAP15), Secret Management, Environment Separation (local/dev/staging/production), Container Security, Backup Strategy, Disaster Recovery |
| 061 | `18_infrastructure/061_DATA_MIGRATION_STRATEGY.md` | [BARU, Inferred Scope] Strategi migrasi data manual (spreadsheet/email/dokumen fisik) ke KINETIC CRM saat onboarding plus migrasi teknis localStorage ke DB (GAP03): Legacy Mapping, Data Cleansing, Migration Rules, Validation, Rollback Strategy, Reconciliation Process |

### 19 — QA & Testing (1 file)
| # | File | Tanggung Jawab |
|---|------|-----------------|
| 062 | `19_qa_testing/062_MASTER_TEST_CASE_CATALOG.md` | Seluruh test case per modul (positif/negatif/edge/security/infra/AI), extend dari PRD §12 + modul baru |

### 20 — Project Planning (1 file)
| # | File | Tanggung Jawab |
|---|------|-----------------|
| 063 | `20_project_planning/063_SPRINT_PLANNING_AND_MODULE_DEPENDENCY.md` | Breakdown sprint Fase 1, dependency antar modul, estimasi, kriteria definition-of-done per modul |

### 21 — Gap Resolution & Roadmap (1 file)
| # | File | Tanggung Jawab |
|---|------|-----------------|
| 064 | `21_gap_roadmap/064_FUTURE_ENHANCEMENT_ROADMAP.md` | Fase 2 & 3 detail (SSO, email/WA notif, PWA, contract mgmt, BI/DWH, API publik ERP, AI provider expansion) |

---

## TOTAL: 65 FILE (termasuk index ini)

Ringkasan per kategori:
- Overview & Governance: 4
- Architecture (termasuk AI): 8
- Reference & Catalog: 2
- Organization & Access: 6
- Master Data: 6
- Configuration: 5
- Core Business Modules: 7
- Workflow Engine: 4
- Target & KPI: 3
- Notification: 2
- Document Management: 2
- Dashboard: 1
- Reporting: 1
- Audit: 1
- Database: 3
- API: 2
- Frontend: 1
- Non-Functional: 1
- Infrastructure (termasuk Data Migration): 2
- QA: 1
- Project Planning: 1
- Gap Roadmap: 1

Total file isi: 64 + index ini = 65

---

## PRINSIP DESAIN AI YANG DITERAPKAN LINTAS DOKUMEN

Agar konsisten di semua dokumen yang menyentuh AI (010, 011, 009, 030, 057, 060, 062):

```
Frontend
    -> Backend API
        -> AI Service Layer (provider-agnostic, internal interface)
            -> Gemini API (provider konkret saat ini)
```

- Business Module tidak boleh memanggil Gemini API langsung. Semua akses AI wajib melalui AI Service Layer.
- AI Service Layer mengekspos kontrak internal (misalnya summarize, analyze, search) yang independen dari provider.
- Provider lain (OpenAI, Claude, Azure OpenAI) dapat dipasang di belakang AI Service Layer tanpa mengubah kode modul bisnis manapun — didesain di file 010.
- Seluruh request AI tercatat di audit log (siapa, kapan, fitur AI apa, berhasil/gagal) — terhubung ke modul 052.
- Cost control & rate limiting AI didesain sebagai kebijakan terpusat, bukan per-modul.

---

## URUTAN PEMBUATAN

File dibuat secara berurutan sesuai nomor (001 sampai 064), karena dokumen belakangan (Database Design, API Spec, Test Case Catalog) merujuk konsisten ke entitas/modul yang sudah didefinisikan di dokumen-dokumen sebelumnya. Setiap file ditulis lengkap penuh — tanpa placeholder, tanpa "TBD".

Status: Index telah disetujui dengan revisi di atas. Lanjut ke pembuatan isi dokumen 001 sampai 064 secara berurutan per batch, dengan cross-check terhadap PRD/BA Review/FE Spec di akhir setiap batch.
