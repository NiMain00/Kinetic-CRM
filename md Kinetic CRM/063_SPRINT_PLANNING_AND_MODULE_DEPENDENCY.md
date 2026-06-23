# 063 — SPRINT PLANNING & MODULE DEPENDENCY
## KINETIC CRM — Breakdown Sprint Fase 1, Dependency Antar Modul, Estimasi, DoD

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 063 |
| **Nama Dokumen** | Sprint Planning & Module Dependency |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | BA Review STMS v1.0 — seluruh dokumen, prioritas gap |
| **Status** | Final |

---

## 1. PRINSIP PERENCANAAN

### 1.1 Asumsi Sprint

| Parameter | Nilai |
|---|---|
| Durasi Sprint | 2 minggu |
| Tim Backend | 2 developer |
| Tim Frontend | 2 developer |
| QA Engineer | 1 orang (mulai Sprint 3) |
| DevOps | 1 orang (part-time; aktif penuh Sprint 1 dan Sprint 8) |
| Story Point Velocity | ~40 SP per sprint (estimasi awal; dikalibrasi Sprint 1–2) |
| Total Sprint Fase 1 | 8 sprint = 16 minggu (~4 bulan) |

### 1.2 Prioritas Penyelesaian Gap

Gap Critical dan High dari BA Review harus selesai di Sprint 1–5 karena menjadi fondasi modul lain:

| Gap ID | Deskripsi | Target Sprint |
|---|---|---|
| **GAP-03 Critical** | localStorage → DB (Question Types) | Sprint 1 |
| **GAP-01 Critical** | Modul Target & KPI | Sprint 6–7 |
| **GAP-02 Critical** | Menu Configuration | Sprint 2–3 |
| **GAP-04 Critical** | Status Cancelled | Sprint 4 |
| **GAP-05 Major** | Hierarki Organisasi | Sprint 2 |
| **GAP-06 Major** | SLA Enforcement | Sprint 5 |
| **GAP-07 Major** | Re-assign / Backup Approver | Sprint 5 |
| **GAP-08 Major** | Paralel Review LPHS | Sprint 4 |
| **GAP-09 Major** | Normalisasi Kompetitor | Sprint 4 |

---

## 2. MODULE DEPENDENCY GRAPH

```
Layer 0 (Foundation — tidak ada dependency):
  ├── Autentikasi & Session (019)
  ├── Role & Permission (017)
  ├── Organisasi Hierarki (015)
  └── Infrastructure / Docker (060)

Layer 1 (depends on Layer 0):
  ├── User Management (018)
  ├── Master Data (021–026)
  └── Konfigurasi (027–031)

Layer 2 (depends on Layer 1):
  ├── Prospect Module (032)
  └── Project Core (033)

Layer 3 (depends on Layer 2):
  ├── RKS Module (034)
  ├── Approval Engine (039)
  └── Document Upload (048)

Layer 4 (depends on Layer 3):
  ├── LPHS/SIOS (035) → depends on Approval Engine
  ├── Harga & Kompetitor (036) → depends on Project Core
  ├── SLA Engine (041) → depends on Approval Engine
  └── Notifikasi (046) → depends on Approval Engine

Layer 5 (depends on Layer 4):
  ├── Pemenang & Delivery (037)
  ├── Cancellation (038)
  ├── Backup Approver (042)
  └── Dashboard (050)

Layer 6 (depends on Layer 5):
  ├── Target & KPI (043–045)
  ├── Laporan (051)
  └── Audit Log (052)
```

---

## 3. SPRINT BREAKDOWN LENGKAP

### SPRINT 1 — Foundation & Infrastructure (Minggu 1–2)

**Goal:** Infrastruktur siap; autentikasi berfungsi; database schema terdeploy.

**Backend:**
| Story | SP | Modul |
|---|---|---|
| Setup Docker Compose (dev + staging) | 5 | 060 |
| Database schema DDL (semua tabel Layer 0–1) | 8 | 053/054 |
| Auth: login, logout, JWT | 5 | 019 |
| Auth: session management, lockout | 3 | 019 |
| Health check endpoint `/health` | 2 | 060 / GAP-15 |
| Seed data: roles, permissions, question_types | 3 | 017/024 |
| **KRITIS: Migrasi localStorage → DB (API endpoint)** | 3 | 024 / GAP-03 |
| Environment separation (local/dev/staging/prod) | 2 | 060 |

**Frontend:**
| Story | SP | Modul |
|---|---|---|
| Setup React + TypeScript + Vite + Tailwind | 3 | 058 |
| Setup Zustand + React Query | 2 | 058 |
| Layout: Sidebar + Topbar + NotificationBell (shell) | 5 | 058 |
| Halaman Login (AUTH-01) | 3 | AUTH-01 |
| Route Guard (PrivateRoute + RoleGuard) | 3 | 020 |
| Halaman Error (403, 404, 500) | 2 | ERRR-01/02/03 |
| **KRITIS: Migration banner + import localStorage** | 3 | CFG-12 / GAP-03 |

**QA:** Unit test auth endpoint; smoke test docker compose.
**DoD Sprint 1:** Login berfungsi; health check green; schema migrasi selesai; localStorage migration tool siap.

---

### SPRINT 2 — Organization, Users & Master Data (Minggu 3–4)

**Goal:** Hierarki organisasi termodelkan; user management berfungsi; master data inti siap.

**Backend:**
| Story | SP | Modul |
|---|---|---|
| CRUD Company / Division / Department / Branch | 8 | 015 / GAP-05 |
| Position Management | 3 | 016 |
| User CRUD + assignment branch/dept | 5 | 018 |
| Reset password + aktivasi | 2 | 018 |
| Role & Permission matrix API | 5 | 017 / GAP-02 |
| Permission middleware (scope enforcement) | 5 | 020 |
| Master Customer CRUD | 3 | 021 |
| Master Kategori Proyek | 2 | 021 |
| Master Industri | 1 | 021 |

**Frontend:**
| Story | SP | Modul |
|---|---|---|
| CONF-01: Tree Navigator Organisasi | 8 | 027 / CFG-01 |
| MAST-05: Halaman Manajemen Pengguna | 5 | 018 |
| CONF-04: Permission Matrix UI | 8 | 028 / CFG-04 |
| MAST-01: Master Customer | 3 | 021 |
| Profil Pengguna (PROF-01) | 3 | AUTH-02 |

**DoD Sprint 2:** Admin bisa kelola org tree; user bisa login dengan role/scope yang tepat; customer bisa dipilih di form.

---

### SPRINT 3 — Configuration Module & Master Data Lanjutan (Minggu 5–6)

**Goal:** Semua konfigurasi sistem dapat dikelola Admin; master pertanyaan di DB (bukan localStorage).

**Backend:**
| Story | SP | Modul |
|---|---|---|
| Config Workflow Stages (CFG-02) | 5 | 027 |
| Config Status Proyek dinamis (CFG-03) | 3 | 028 |
| Master Status Proyek + transitions | 3 | 022 |
| Master Document Types | 2 | 022 |
| Master Pertanyaan CRUD + reorder | 5 | 024 / GAP-03 |
| Master Kompetitor CRUD | 3 | 023 / GAP-09 |
| Master Alasan Kekalahan | 2 | 026 |
| Master Hari Libur + kalkulasi hari kerja | 3 | 025 |
| Master Periode Pelaporan | 2 | 025 |
| Notification Templates seed | 2 | 026 |

**Frontend:**
| Story | SP | Modul |
|---|---|---|
| CONF-02: Workflow Builder UI | 8 | 027 |
| CONF-03: Status Config + color picker | 3 | 028 |
| CONF-07: Tipe Pertanyaan + Question CRUD | 5 | 031 / CFG-12 |
| MAST-03: Master Pertanyaan dengan drag-reorder + preview | 5 | MAST-03 |
| MAST-04: Master Kompetitor | 2 | 023 |
| CONF-05: Konfigurasi SLA (shell; engine Sprint 5) | 3 | 029 |

**DoD Sprint 3:** Admin bisa konfigurasi semua parameter sistem; pertanyaan form dari DB; workflow stages terkonfigurasi.

---

### SPRINT 4 — Prospect & Project Core (Minggu 7–8)

**Goal:** Modul Prospek dan Project Core berfungsi end-to-end; status cancelled terimplementasi.

**Backend:**
| Story | SP | Modul |
|---|---|---|
| Prospect CRUD + lifecycle state machine | 8 | 032 |
| Prospect: submit, approve, revise, answer | 5 | 032 |
| Prospect: konversi ke proyek | 3 | 032 |
| Project Core CRUD + auto project_code | 5 | 033 |
| Project: status transitions (relasional) | 3 | 033 |
| Project: cancel mechanism (GAP-04) | 3 | 038 / GAP-04 |
| Project Timeline Events (append-only) | 3 | 033 |
| Document Upload + storage (out-of-webroot) | 5 | 048 |

**Frontend:**
| Story | SP | Modul |
|---|---|---|
| PROS-01: Daftar Prospek | 3 | PROS-01 |
| PROS-02: Form Buat/Edit Prospek + DynamicQuestionForm | 8 | PROS-02 |
| PROS-03: Detail Prospek (semua tab + actions) | 8 | PROS-03 |
| PROJ-01: Daftar Proyek + filter + at-risk badge | 5 | PROJ-01 |
| PROJ-02: Form Buat Proyek | 3 | PROJ-02 |
| PROJ-03: Detail Proyek (shell + Tab Overview + Timeline) | 5 | PROJ-03 |

**DoD Sprint 4:** Prospek bisa dibuat, di-review PM, dan dikonversi; proyek bisa dibuat dan dibatalkan; dokumen bisa diupload.

---

### SPRINT 5 — Tender Workflow: RKS, LPHS, Approval Engine, SLA (Minggu 9–10)

**Goal:** Alur tender penuh dari RKS sampai LPHS; SLA enforcement; approval inbox.

**Backend:**
| Story | SP | Modul |
|---|---|---|
| RKS Module (CRUD + submit + approve + revise) | 8 | 034 |
| Approval Engine Core (createRequest, approve, revise) | 8 | 039 |
| LPHS Module: upload, dept selection, PM approve | 8 | 035 |
| LPHS: Paralel review (GAP-08) | 5 | 035/040 |
| LPHS: Targeted revision (BP-03) | 5 | 035/040 |
| SLA Engine: kalkulasi deadline + cron job | 5 | 041 / GAP-06 |
| SLA: reminder + eskalasi | 3 | 041 |
| Backup Approver + delegasi (GAP-07) | 5 | 042 |
| Reassignment manual approval | 3 | 042 |
| Approval Inbox API | 3 | 039 |

**Frontend:**
| Story | SP | Modul |
|---|---|---|
| PROJ-03b: Tab RKS | 5 | PROJ-03b |
| PROJ-03c: Tab Review RKS (ReviewQuestionPanel) | 5 | PROJ-03c |
| PROJ-03d: Tab LPHS/SIOS + Status Matrix + Paralel | 10 | PROJ-03d |
| APPR-01: Approval Inbox | 5 | APPR-01 |
| APPR-02: Review Drawer | 5 | APPR-02 |
| SLA Badge di Approval Inbox | 2 | APPR-01 |

**DoD Sprint 5:** Alur RKS end-to-end; LPHS paralel; SLA berjalan; Approval Inbox berfungsi.

---

### SPRINT 6 — Harga, Pemenang, Delivery, Notifikasi (Minggu 11–12)

**Goal:** Alur tender selesai sampai pemenang; notifikasi in-app berfungsi; versioning dokumen.

**Backend:**
| Story | SP | Modul |
|---|---|---|
| Harga Penawaran CRUD + submit | 3 | 036 |
| Kompetitor per proyek (normalisasi GAP-09) | 3 | 036 |
| Pemenang Tender: win/lose input + alasan kekalahan | 5 | 037 / GAP-12 |
| Target Delivery CRUD + konfirmasi selesai | 3 | 037 |
| Document Versioning (is_latest, version chain) | 3 | 049 / GAP-14 |
| In-App Notification Service + send() | 5 | 046 |
| Notification polling endpoint | 2 | 046 |
| Deadline approaching cron (GAP-13) | 2 | 046 |
| Notification templates + variable substitution | 3 | 046 |

**Frontend:**
| Story | SP | Modul |
|---|---|---|
| PROJ-03e: Tab Harga | 3 | PROJ-03e |
| PROJ-03f: Tab Kompetitor (lookup master) | 3 | PROJ-03f |
| PROJ-03g: Tab Pemenang (win/lose form) | 5 | PROJ-03g |
| PROJ-03h: Tab Target Delivery | 3 | PROJ-03h |
| PROJ-03j: Tab Dokumen + versi histori | 5 | PROJ-03j |
| NOTF-01: Notification Bell + Dropdown + Halaman | 5 | NOTF-01 |
| Polling hook (useNotifications) | 2 | NOTF-01 |

**DoD Sprint 6:** Tender bisa selesai (win/lose); notifikasi sampai ke user; dokumen punya versioning.

---

### SPRINT 7 — Dashboard, Target KPI, Laporan (Minggu 13–14)

**Goal:** Dashboard fungsional per role; modul KPI & Target; laporan win/loss & pipeline.

**Backend:**
| Story | SP | Modul |
|---|---|---|
| Dashboard summary API (per role + scope) | 5 | 050 |
| KPI Indicators + bobot (GAP-01) | 3 | 043 |
| KPI Targets: set + revisi + histori | 5 | 043/044 |
| KPI Progress real-time (query realisasi) | 5 | 045 |
| KPI Snapshot cron job harian | 3 | 045 |
| Composite score + traffic light | 2 | 045 |
| Laporan Win/Loss API + export Excel/PDF | 5 | 051 |
| Laporan Pipeline API | 3 | 051 |
| Audit Log API + export CSV (GAP-16) | 3 | 052 |

**Frontend:**
| Story | SP | Modul |
|---|---|---|
| DASH-01: Dashboard (semua widget per role) | 10 | DASH-01 |
| CFG-07: Konfigurasi Target KPI + bobot UI | 5 | 030 |
| Target matrix per cabang per periode | 5 | 044 |
| REPT-01: Laporan Win/Loss + chart + export | 8 | REPT-01 |
| REPT-02: Laporan Pipeline + funnel chart | 5 | REPT-02 |
| AUDT-01: Audit Log (table + filter + export) | 3 | AUDT-01 |

**DoD Sprint 7:** Dashboard menampilkan data real per role; KPI bisa diset dan ditracking; laporan bisa diekspor.

---

### SPRINT 8 — Polish, Security Hardening, Testing & Go-Live Prep (Minggu 15–16)

**Goal:** Bug fixing; security hardening; performance tuning; dokumentasi final; go-live readiness.

**Backend:**
| Story | SP | Modul |
|---|---|---|
| Security audit: OWASP Top 10 fixes | 8 | 008 |
| Rate limiting (login, API) | 3 | 059 |
| Performance optimization (indexes, query tuning) | 5 | 055 |
| Config Notifikasi UI (CFG-09) | 2 | 030 |
| Config Upload Settings (CFG-13) | 2 | 031 |
| AI Service Layer + Gemini integration | 5 | 010/011 |
| Config Integrasi AI (CFG-14) | 3 | 031 |
| Data migration tools (CSV import, localStorage) | 3 | 061 |
| Backup scripts + restore testing | 3 | 060 |

**Frontend:**
| Story | SP | Modul |
|---|---|---|
| CONF-05: SLA Config UI (full) | 3 | 029 |
| CONF-06: Notifikasi Config UI | 2 | 030 |
| CONF-14: AI Config UI | 3 | 031 |
| Mobile responsiveness audit + fixes | 5 | 058 |
| Accessibility audit + fixes (WCAG AA) | 5 | 058 |
| Error handling polish (loading/empty/error states) | 3 | semua |
| UAT fixes | 8 | semua |

**QA:**
| Story | SP | |
|---|---|---|
| Full regression test (semua TC Critical + High) | 10 | 062 |
| Security penetration test (OWASP ZAP) | 5 | 062 |
| Performance load test (k6) | 3 | 062 |
| UAT dengan user representatif | 8 | semua |

**DoD Sprint 8 = Go-Live Criteria:**
- Semua TC Critical = 100% PASS
- TC High ≥ 95% PASS
- Tidak ada P1/P2 bug open
- Security scan: tidak ada Critical/High vulnerability
- Performance: p95 < 2 detik untuk list endpoints
- Backup + restore drill berhasil
- User acceptance sign-off dari PO dan representatif Cabang, PM, Management

---

## 4. DEPENDENCY MATRIX ANTAR SPRINT

| Sprint | Bergantung Pada | Catatan |
|---|---|---|
| Sprint 1 | — | Independen; foundation |
| Sprint 2 | Sprint 1 | Butuh auth + schema |
| Sprint 3 | Sprint 1, 2 | Butuh role/permission + user |
| Sprint 4 | Sprint 2, 3 | Butuh org, master data, config |
| Sprint 5 | Sprint 3, 4 | Butuh project core + workflow config |
| Sprint 6 | Sprint 4, 5 | Butuh project core + approval engine |
| Sprint 7 | Sprint 4, 5, 6 | Butuh data proyek untuk KPI + laporan |
| Sprint 8 | Sprint 1–7 | Semua modul harus selesai untuk regression |

**Risiko Dependency:** Jika Sprint 4 (Project Core) terlambat, Sprint 5 dan 6 ikut terlambat. Mitigasi: alokasikan 20% buffer di Sprint 4; paralel-kan BE dan FE selama mungkin.

---

## 5. ESTIMASI STORY POINT PER SPRINT

| Sprint | BE SP | FE SP | QA SP | Total SP | Buffer 20% |
|---|---|---|---|---|---|
| Sprint 1 | 31 | 21 | 5 | 57 | → 47 efektif |
| Sprint 2 | 29 | 27 | 5 | 61 | → 49 efektif |
| Sprint 3 | 27 | 24 | 5 | 56 | → 45 efektif |
| Sprint 4 | 35 | 34 | 8 | 77 | → 62 efektif |
| Sprint 5 | 45 | 32 | 8 | 85 | → 68 efektif |
| Sprint 6 | 29 | 26 | 8 | 63 | → 50 efektif |
| Sprint 7 | 34 | 31 | 8 | 73 | → 58 efektif |
| Sprint 8 | 32 | 26 | 26 | 84 | → 67 efektif |

**Catatan:** Sprint 4, 5, dan 7 adalah sprint paling padat. Jika velocity awal lebih rendah dari 40 SP/sprint, pertimbangkan memecah sprint atau mengurangi scope (pindah ke Fase 2).

---

## 6. MODUL KANDIDAT DIPINDAH KE FASE 2 (JIKA TERLAMBAT)

Jika terjadi keterlambatan, modul berikut dapat dipindah ke Fase 2 tanpa memblokir go-live:

| Modul | Alasan Bisa Dipindah | Dampak |
|---|---|---|
| AI Features (010/011) | Tidak ada di PRD utama; enhancement | Fitur AI tidak tersedia; sistem tetap berfungsi |
| Export Excel/PDF (051) | Laporan bisa ditampilkan tanpa export | User harus screenshot manual |
| Audit Log Export CSV | Audit log bisa dilihat tanpa export | Minor inconvenience untuk Admin |
| CONF-08 Dashboard Config | Dashboard pakai default per role | Tidak bisa kustomisasi per role |
| Laporan Pipeline (REPT-02) | Laporan Win/Loss tetap ada | Pipeline hanya di dashboard widget |

**Yang TIDAK bisa dipindah ke Fase 2 (blocking):**
- Semua modul authentication
- Prospect + Project Core + RKS + LPHS
- Approval Engine + SLA
- Notifikasi in-app
- GAP-03 (localStorage fix) — must fix sebelum go-live

---

## 7. CEREMONY & CADENCE

| Ceremony | Frekuensi | Durasi | Peserta |
|---|---|---|---|
| Sprint Planning | Awal sprint | 2–3 jam | Seluruh tim + PO |
| Daily Standup | Setiap hari | 15 menit | Dev team |
| Sprint Review (Demo) | Akhir sprint | 1–1.5 jam | Tim + PO + Stakeholder |
| Sprint Retrospective | Akhir sprint | 1 jam | Dev team + PO |
| Backlog Refinement | Tengah sprint | 1 jam | Dev team + PO + BA |
| Architecture Review | Sprint 1, 4 (awal) | 2 jam | Tech leads + BA |

---

## 8. DEFINITION OF DONE (GLOBAL)

Berlaku untuk **setiap story** di semua sprint:

```
✓ Kode di-review oleh minimal 1 developer lain
✓ Semua test case yang relevan untuk story ini = PASS
✓ Tidak ada P1/P2 bug dari testing story ini
✓ API endpoint terdokumentasi (Postman collection diperbarui)
✓ UI sesuai dengan screen catalog (014)
✓ State machine sesuai dokumen 013
✓ Audit log bekerja untuk semua aksi yang harus dilog
✓ Merge ke branch develop; CI/CD pipeline hijau
✓ Staging environment diperbarui
```
