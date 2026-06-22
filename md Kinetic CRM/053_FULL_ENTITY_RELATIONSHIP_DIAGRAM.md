# 053 — FULL ENTITY RELATIONSHIP DIAGRAM
## KINETIC CRM — Diagram Relasi Entitas Lengkap

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 053 |
| **Nama Dokumen** | Full Entity Relationship Diagram |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Klasifikasi** | Confidential / Internal |
| **Sumber Utama** | BA Review STMS v1.0 |
| **Sumber Sekunder** | 000_DOCUMENT_INDEX.md, FE Spec STMS v1.0, 014 (UI Screen Catalog), 020 (Authorization Enforcement Spec), 057 (Full API Endpoint Specification) |
| **Dokumen Terkait** | 007 (Data Architecture Principles), 054 (Full Database Schema DDL), 055 (Indexing and Query Optimization Strategy), 013 (Global State Machine Reference) |
| **Status** | Final — Siap Digunakan |

**Dibaca oleh:** Database Architect, Backend Developer, Data Engineer, QA Engineer, Technical Writer

---

## 1. PURPOSE

Dokumen ini adalah **model data konseptual dan logis tunggal** untuk KINETIC CRM. Dokumen ini mendefinisikan seluruh entitas bisnis, atributnya, dan relasi antar entitas — termasuk kardinalitas setiap relasi — sebelum entitas tersebut diterjemahkan menjadi DDL fisik di **054_FULL_DATABASE_SCHEMA_DDL.md**.

Prinsip desain yang mengikat dokumen ini diturunkan dari **007_DATA_ARCHITECTURE_PRINCIPLES**: **tidak ada JSON blob untuk data terstruktur** (lihat 000_DOCUMENT_INDEX catatan 3). Setiap data yang sebelumnya disimpan sebagai JSON freeform pada desain lama (kompetitor per proyek, tipe pertanyaan di localStorage, jawaban checklist) dinormalisasi penuh menjadi tabel relasional dengan foreign key yang jelas.

Dokumen ini **tidak** mendefinisikan tipe data SQL konkret, constraint SQL, index, atau default value — itu adalah tanggung jawab 054 dan 055. Dokumen ini menjawab pertanyaan "entitas apa yang ada dan bagaimana mereka saling terhubung", bukan "bagaimana entitas ini direpresentasikan di SQL".

---

## 2. SCOPE

### In Scope
- Seluruh entitas bisnis lintas modul (Organisasi, Master Data, Prospek, Proyek, RKS, LPHS/SIOS, Harga & Kompetitor, Pemenang & Delivery, Approval, Target & KPI, Notifikasi, Dokumen, Audit, Konfigurasi, AI)
- Atribut setiap entitas pada level konseptual (nama atribut + tipe konseptual, bukan SQL type)
- Relasi dan kardinalitas antar entitas
- Diagram ERD dalam notasi teks terstruktur per domain
- Penjelasan keputusan normalisasi untuk setiap area yang sebelumnya berisiko menjadi JSON blob

### Out of Scope
- DDL SQL konkret (tipe data, constraint, index) → 054
- Strategi indexing dan query optimization → 055
- State machine/lifecycle status detail per entitas → 013

---

## 3. NOTASI DIAGRAM

Dokumen ini menggunakan notasi ERD teks dengan simbol kardinalitas berikut untuk setiap relasi:

```
A ||--o{ B   : Satu A memiliki nol atau banyak B (one-to-many, opsional di sisi B)
A ||--|{ B   : Satu A memiliki satu atau banyak B (one-to-many, wajib di sisi B)
A ||--o| B   : Satu A memiliki nol atau satu B (one-to-one, opsional)
A }o--o{ B   : Banyak A berelasi ke banyak B (many-to-many, biasanya melalui tabel junction)
A ||--|| B   : Satu A wajib memiliki tepat satu B (one-to-one, wajib)
```

Setiap entitas dituliskan dengan format:
```
ENTITY_NAME
- attribute_name : conceptual_type [constraint_note]
```

---

## 4. DOMAIN: ORGANIZATION & ACCESS

### 4.1 Entitas

```
COMPANY (Perusahaan)
- id : UUID [PK]
- name : Text
- legal_entity_number : Text
- logo_document_id : UUID [FK → DOCUMENT, nullable]
- address : Text [nullable]
- is_active : Boolean
- created_at, updated_at, deleted_at : Timestamp

DIVISION (Divisi)
- id : UUID [PK]
- company_id : UUID [FK → COMPANY]
- name : Text
- code : Text [unique]
- head_user_id : UUID [FK → USER, nullable]
- is_active : Boolean
- created_at, updated_at, deleted_at : Timestamp

DEPARTMENT (Departemen)
- id : UUID [PK]
- division_id : UUID [FK → DIVISION, nullable]
- parent_department_id : UUID [FK → DEPARTMENT, nullable — self-referencing untuk sub-departemen]
- name : Text
- code : Text [unique]
- head_user_id : UUID [FK → USER, nullable]
- is_active : Boolean
- created_at, updated_at, deleted_at : Timestamp

BRANCH (Cabang)
- id : UUID [PK]
- division_id : UUID [FK → DIVISION]
- name : Text
- code : Text [unique]
- city : Text
- address : Text [nullable]
- pic_user_id : UUID [FK → USER, nullable]
- is_active : Boolean
- created_at, updated_at, deleted_at : Timestamp

ROLE (Role)
- id : UUID [PK]
- code : Text [unique — cabang|pm|dept|mgmt|admin|custom]
- name : Text
- description : Text [nullable]
- is_system_default : Boolean
- created_at, updated_at : Timestamp

PERMISSION (Permission — katalog statis seluruh permission sistem)
- id : UUID [PK]
- code : Text [unique — format resource.action]
- resource : Text
- action : Text
- label : Text

ROLE_PERMISSION (Junction — permission yang dimiliki role)
- id : UUID [PK]
- role_id : UUID [FK → ROLE]
- permission_id : UUID [FK → PERMISSION]
- created_at : Timestamp

USER ("Pengguna")
- id : UUID [PK]
- name : Text
- username : Text [unique]
- email : Text [unique]
- password_hash : Text
- role_id : UUID [FK → ROLE]
- branch_id : UUID [FK → BRANCH, nullable — wajib jika role=cabang]
- department_id : UUID [FK → DEPARTMENT, nullable — wajib jika role=dept]
- is_active : Boolean
- is_locked : Boolean
- failed_login_count : Integer
- last_login_at : Timestamp [nullable]
- created_at, updated_at, deleted_at : Timestamp

ACTIVE_SESSION (Sesi Aktif)
- id : UUID [PK]
- user_id : UUID [FK → USER]
- token_jti : Text [unique]
- ip_address : Text
- user_agent : Text [nullable]
- expires_at : Timestamp
- revoked_at : Timestamp [nullable]
- created_at : Timestamp

POSITION (Master Position/Job Title)
- id : UUID [PK]
- name : Text [unique]
- approval_level : Integer [referensi urutan otoritas approval berbasis posisi, bukan nama user]
- is_active : Boolean
- created_at, updated_at : Timestamp

USER_POSITION (Junction — posisi yang dipegang user, mendukung backup approver)
- id : UUID [PK]
- user_id : UUID [FK → USER]
- position_id : UUID [FK → POSITION]
- is_backup : Boolean [true jika user ini adalah backup approver untuk posisi tersebut]
- valid_from, valid_until : Date [nullable — untuk delegasi sementara]
- created_at : Timestamp
```

### 4.2 Relasi

```
COMPANY     ||--o{  DIVISION           : satu perusahaan punya banyak divisi
DIVISION    ||--o{  DEPARTMENT         : satu divisi punya banyak departemen
DIVISION    ||--o{  BRANCH             : satu divisi punya banyak cabang
DEPARTMENT  ||--o{  DEPARTMENT         : self-reference untuk sub-departemen (parent_department_id)
ROLE        ||--o{  USER               : satu role dimiliki banyak user
ROLE        }o--o{  PERMISSION         : melalui ROLE_PERMISSION
BRANCH      ||--o{  USER               : satu cabang punya banyak user (role=cabang)
DEPARTMENT  ||--o{  USER               : satu departemen punya banyak user (role=dept)
USER        ||--o{  ACTIVE_SESSION     : satu user punya banyak sesi (multi-device)
USER        }o--o{  POSITION           : melalui USER_POSITION
```

**Catatan Normalisasi:** Hierarki organisasi (Company→Division→Department/Branch) sebelumnya tidak dimodelkan sebagai entitas (GAP05). Model di atas menggantikan struktur hardcode dengan tabel relasional penuh, sehingga Admin dapat mengelola struktur via CONF-01 tanpa deployment ulang.

---

## 5. DOMAIN: MASTER DATA

### 5.1 Entitas

```
CUSTOMER (Master Customer)
- id : UUID [PK]
- name : Text [unique]
- code : Text [unique]
- type : Enum [swasta|bumn|pemerintah]
- pic_contact : Text [nullable]
- email : Text [nullable]
- phone : Text [nullable]
- address : Text [nullable]
- is_active : Boolean
- created_at, updated_at, deleted_at : Timestamp

PROJECT_CATEGORY (Master Kategori Proyek — MD04)
- id : UUID [PK]
- name : Text [unique]
- requires_lphs : Boolean [menentukan apakah proyek kategori ini memerlukan tahap LPHS/SIOS]
- is_active : Boolean
- created_at, updated_at : Timestamp

PROJECT_STATUS_DEFINITION (Master Status Proyek — MD05, dinamis via CFG-03)
- id : UUID [PK]
- code : Text [unique]
- label : Text
- color : Text [hex color untuk badge]
- display_order : Integer
- is_terminal : Boolean [true untuk status final seperti selesai/cancelled/kalah]
- is_active : Boolean
- created_at, updated_at : Timestamp

APPROVAL_LEVEL_DEFINITION (Master Approval Level — MD06)
- id : UUID [PK]
- level : Integer
- label : Text
- description : Text [nullable]

DOCUMENT_TYPE_DEFINITION (Master Tipe Dokumen — MD11)
- id : UUID [PK]
- code : Text [unique — RKS|LPHS|SIOS|HARGA|SPK_KONTRAK|SURAT_KEKALAHAN|LAINNYA]
- label : Text
- applies_to_stage : Text [nullable — tahap mana dokumen ini relevan]
- is_active : Boolean

COMPETITOR (Master Kompetitor — MD14, normalisasi GAP09)
- id : UUID [PK]
- name : Text [unique]
- short_code : Text [nullable]
- business_field : Text [nullable]
- description : Text [nullable]
- status : Enum [active|pending_review|inactive]
- created_at, updated_at, deleted_at : Timestamp

QUESTION_TYPE (Tipe Pertanyaan — CFG-12, migrasi dari localStorage GAP03)
- id : UUID [PK]
- code : Text [unique]
- label : Text
- config : Text [konseptual: definisi opsi jawaban sebagai struktur terlist — lihat QUESTION_TYPE_OPTION untuk normalisasi penuh]
- is_active : Boolean
- created_at, updated_at : Timestamp

QUESTION_TYPE_OPTION (Opsi Jawaban per Tipe Pertanyaan — menormalisasi config JSON)
- id : UUID [PK]
- question_type_id : UUID [FK → QUESTION_TYPE]
- option_label : Text
- display_order : Integer

QUESTION (Master Pertanyaan)
- id : UUID [PK]
- text : Text
- question_type_id : UUID [FK → QUESTION_TYPE]
- context : Enum [prospect|rks]
- category_label : Text [nullable — untuk grouping tampilan]
- is_required : Boolean
- display_order : Integer
- is_active : Boolean
- created_at, updated_at, deleted_at : Timestamp

QUESTION_OPTION (Opsi Jawaban per Pertanyaan Spesifik — untuk radio/checkbox/select per pertanyaan, berbeda dari opsi default tipe)
- id : UUID [PK]
- question_id : UUID [FK → QUESTION]
- option_label : Text
- display_order : Integer

PERIOD_DEFINITION (Master Periode Pelaporan — MD10)
- id : UUID [PK]
- name : Text
- start_date : Date
- end_date : Date
- is_closed : Boolean
- created_at, updated_at : Timestamp

HOLIDAY (Master Hari Libur — MD13)
- id : UUID [PK]
- date : Date
- description : Text
- is_recurring_annually : Boolean
- created_at, updated_at : Timestamp

LOSS_REASON (Master Alasan Kekalahan — GAP12)
- id : UUID [PK]
- code : Text [unique]
- label : Text
- is_active : Boolean
- created_at, updated_at : Timestamp
```

### 5.2 Relasi

```
QUESTION_TYPE       ||--o{  QUESTION_TYPE_OPTION  : satu tipe punya banyak opsi default
QUESTION_TYPE       ||--o{  QUESTION               : satu tipe dipakai banyak pertanyaan
QUESTION             ||--o{  QUESTION_OPTION        : satu pertanyaan punya banyak opsi spesifik (radio/checkbox/select)
```

**Catatan Normalisasi Kritis (GAP03):** Tipe pertanyaan dan konfigurasi opsinya **wajib** berada di tabel `QUESTION_TYPE` dan `QUESTION_TYPE_OPTION` di database pusat — bukan localStorage browser. Ini menyelesaikan bug kritis di mana data tipe pertanyaan sebelumnya hilang/tidak konsisten antar browser karena tersimpan per-device.

---

## 6. DOMAIN: PROSPECT MANAGEMENT

### 6.1 Entitas

```
PROSPECT (Prospek)
- id : UUID [PK]
- name : Text
- customer_id : UUID [FK → CUSTOMER]
- branch_id : UUID [FK → BRANCH]
- category_id : UUID [FK → PROJECT_CATEGORY]
- description : Text [nullable]
- estimated_value : Decimal [nullable]
- estimated_date : Date [nullable]
- status : Enum [prospecting|waiting_pm_approval|revision|approved]
- converted_to_project_id : UUID [FK → PROJECT, nullable — diisi setelah konversi]
- created_by : UUID [FK → USER]
- created_at, updated_at, deleted_at : Timestamp

PROSPECT_ANSWER (Jawaban Checklist Prospek — menormalisasi jawaban yang sebelumnya berisiko JSON bebas)
- id : UUID [PK]
- prospect_id : UUID [FK → PROSPECT]
- question_id : UUID [FK → QUESTION]
- answer_text : Text [nullable — untuk tipe text/textarea]
- answer_option_id : UUID [FK → QUESTION_OPTION, nullable — untuk tipe radio/select]
- created_at, updated_at : Timestamp

PROSPECT_ANSWER_OPTION (Junction — untuk tipe checkbox dengan multi-jawaban)
- id : UUID [PK]
- prospect_answer_id : UUID [FK → PROSPECT_ANSWER]
- question_option_id : UUID [FK → QUESTION_OPTION]

PROSPECT_REVIEW_QUESTION (Pertanyaan Review PM saat meminta revisi prospek)
- id : UUID [PK]
- prospect_id : UUID [FK → PROSPECT]
- review_round : Integer [nomor iterasi revisi]
- question_text : Text
- answer_text : Text [nullable — diisi cabang saat revision]
- created_by : UUID [FK → USER]
- answered_at : Timestamp [nullable]
- created_at : Timestamp

PROSPECT_REVIEW_NOTE (Catatan Umum PM per iterasi review)
- id : UUID [PK]
- prospect_id : UUID [FK → PROSPECT]
- review_round : Integer
- note_text : Text
- created_by : UUID [FK → USER]
- created_at : Timestamp
```

### 6.2 Relasi

```
CUSTOMER    ||--o{  PROSPECT                  : satu customer punya banyak prospek
BRANCH      ||--o{  PROSPECT                  : satu cabang punya banyak prospek
PROSPECT    ||--o{  PROSPECT_ANSWER           : satu prospek punya banyak jawaban checklist
QUESTION    ||--o{  PROSPECT_ANSWER           : satu pertanyaan dijawab di banyak prospek
PROSPECT_ANSWER ||--o{  PROSPECT_ANSWER_OPTION : satu jawaban checkbox punya banyak opsi terpilih
PROSPECT    ||--o{  PROSPECT_REVIEW_QUESTION  : satu prospek punya banyak pertanyaan review (lintas iterasi)
PROSPECT    ||--o| PROJECT                    : satu prospek dikonversi menjadi maksimum satu proyek
```

**Catatan Normalisasi:** Jawaban checklist prospek (yang berpotensi disimpan sebagai JSON object per prospek di desain lama) dipecah menjadi tabel `PROSPECT_ANSWER` dengan relasi eksplisit ke `QUESTION` dan `QUESTION_OPTION`, memungkinkan query analitik seperti "berapa persen prospek yang menjawab Ya pada pertanyaan X" tanpa parsing JSON.

---

## 7. DOMAIN: PROJECT CORE

### 7.1 Entitas

```
PROJECT (Proyek — entitas inti, dua tipe: tender/prospecting)
- id : UUID [PK]
- prospect_id : UUID [FK → PROSPECT, nullable — proyek bisa dibuat langsung tanpa prospek di Fase 1 jika dibutuhkan, namun mayoritas berasal dari konversi prospek]
- name : Text
- project_type : Enum [tender|prospecting]
- customer_id : UUID [FK → CUSTOMER]
- branch_id : UUID [FK → BRANCH]
- category_id : UUID [FK → PROJECT_CATEGORY]
- status_id : UUID [FK → PROJECT_STATUS_DEFINITION]
- deadline_tender : Date [nullable — relevan untuk tipe tender]
- tender_number : Text [nullable, unique dalam scope customer]
- tender_name : Text [nullable]
- cancelled_at : Timestamp [nullable]
- cancellation_reason : Text [nullable]
- cancelled_by : UUID [FK → USER, nullable]
- created_by : UUID [FK → USER]
- created_at, updated_at, deleted_at : Timestamp

PROJECT_TIMELINE_EVENT (Timeline append-only — audit trail visual per proyek)
- id : UUID [PK]
- project_id : UUID [FK → PROJECT]
- event_type : Text [contoh: project.created, rks.submitted, rks.approved, lphs.dept_approved, dll.]
- actor_id : UUID [FK → USER, nullable — null untuk event sistem otomatis]
- description : Text
- metadata : Text [konseptual: detail tambahan terstruktur, lihat 007 untuk batasan penggunaan field semi-terstruktur ini]
- occurred_at : Timestamp
```

### 7.2 Relasi

```
PROSPECT            ||--o|  PROJECT                  : satu prospek dikonversi menjadi maksimum satu proyek
CUSTOMER            ||--o{  PROJECT                  : satu customer punya banyak proyek
BRANCH              ||--o{  PROJECT                  : satu cabang punya banyak proyek
PROJECT_CATEGORY    ||--o{  PROJECT                  : satu kategori dipakai banyak proyek
PROJECT_STATUS_DEFINITION ||--o{ PROJECT             : satu definisi status dipakai banyak proyek
PROJECT             ||--o{  PROJECT_TIMELINE_EVENT   : satu proyek punya banyak event timeline
USER                ||--o{  PROJECT_TIMELINE_EVENT   : satu user menjadi actor banyak event (nullable untuk event sistem)
```

**Catatan GAP04 (Cancellation):** Status `cancelled` dimodelkan sebagai bagian dari `PROJECT_STATUS_DEFINITION` (status dinamis), bukan boolean flag terpisah, agar konsisten dengan filosofi status proyek dinamis (CFG-03). Field `cancelled_at`, `cancellation_reason`, `cancelled_by` tetap dipertahankan sebagai metadata khusus pembatalan karena `PROJECT_STATUS_DEFINITION` tidak menyimpan data transaksional per-instance.

---

## 8. DOMAIN: RKS MODULE

### 8.1 Entitas

```
RKS (Rencana Kerja dan Syarat)
- id : UUID [PK]
- project_id : UUID [FK → PROJECT, unique — satu proyek tender punya tepat satu RKS aktif]
- content : Text
- status : Enum [draft|waiting_pm_approval|revision|approved]
- revision_number : Integer
- submitted_at : Timestamp [nullable]
- approved_at : Timestamp [nullable]
- created_at, updated_at : Timestamp

RKS_REVIEW_QUESTION (Pertanyaan Review PM untuk RKS, analog dengan PROSPECT_REVIEW_QUESTION)
- id : UUID [PK]
- rks_id : UUID [FK → RKS]
- review_round : Integer
- question_text : Text
- answer_text : Text [nullable]
- created_by : UUID [FK → USER]
- answered_at : Timestamp [nullable]
- created_at : Timestamp

RKS_REVIEW_NOTE (Catatan umum PM per iterasi review RKS)
- id : UUID [PK]
- rks_id : UUID [FK → RKS]
- review_round : Integer
- note_text : Text
- created_by : UUID [FK → USER]
- created_at : Timestamp
```

### 8.2 Relasi

```
PROJECT  ||--||  RKS                    : satu proyek tender wajib punya tepat satu RKS aktif
RKS      ||--o{  RKS_REVIEW_QUESTION    : satu RKS punya banyak pertanyaan review lintas iterasi
RKS      ||--o{  RKS_REVIEW_NOTE        : satu RKS punya banyak catatan review
RKS      }o--o{  DOCUMENT               : melalui PROJECT_DOCUMENT (lihat §13), dokumen RKS terhubung via resource_type=rks
```

---

## 9. DOMAIN: LPHS/SIOS MODULE

### 9.1 Entitas

```
LPHS_SIOS (Dokumen LPHS/SIOS — redesain paralelisasi GAP08)
- id : UUID [PK]
- project_id : UUID [FK → PROJECT, unique]
- status : Enum [draft|lphs_sios|approved]
- link_lphs_external : Text [nullable — URL Google Docs eksternal]
- pm_approval_status : Enum [pending|approved|revision_requested]
- pm_approved_at : Timestamp [nullable]
- pm_approved_by : UUID [FK → USER, nullable]
- final_approval_status : Enum [pending|approved|revision_requested]
- final_approved_at : Timestamp [nullable]
- final_approved_by : UUID [FK → USER, nullable]
- revision_number : Integer
- created_at, updated_at : Timestamp

LPHS_DEPARTMENT_REVIEW (Status approval per departemen — mendukung paralelisasi BP02 dan revisi tertarget BP03)
- id : UUID [PK]
- lphs_sios_id : UUID [FK → LPHS_SIOS]
- department_id : UUID [FK → DEPARTMENT]
- approval_status : Enum [reviewing|pending_pm|approved|revision_requested]
- comment : Text [nullable]
- reviewed_by : UUID [FK → USER, nullable]
- reviewed_at : Timestamp [nullable]
- created_at, updated_at : Timestamp

LPHS_TARGETED_REVISION (Riwayat revisi tertarget — BP03, mencatat departemen mana yang direset saat revisi)
- id : UUID [PK]
- lphs_sios_id : UUID [FK → LPHS_SIOS]
- revision_number : Integer
- initiated_by : UUID [FK → USER]
- initiated_role : Text [pm|management]
- note : Text [nullable]
- created_at : Timestamp

LPHS_TARGETED_REVISION_DEPARTMENT (Junction — departemen mana yang ditarget dalam satu revisi)
- id : UUID [PK]
- lphs_targeted_revision_id : UUID [FK → LPHS_TARGETED_REVISION]
- department_id : UUID [FK → DEPARTMENT]
```

### 9.2 Relasi

```
PROJECT     ||--||  LPHS_SIOS                       : satu proyek tender wajib punya tepat satu LPHS/SIOS aktif
LPHS_SIOS   ||--|{  LPHS_DEPARTMENT_REVIEW          : satu LPHS punya satu atau banyak review departemen (minimum 1 dept dipilih)
DEPARTMENT  ||--o{  LPHS_DEPARTMENT_REVIEW          : satu departemen mereview banyak LPHS lintas proyek
LPHS_SIOS   ||--o{  LPHS_TARGETED_REVISION          : satu LPHS punya banyak riwayat revisi tertarget
LPHS_TARGETED_REVISION ||--|{ LPHS_TARGETED_REVISION_DEPARTMENT : satu revisi menargetkan satu atau banyak dept
DEPARTMENT  ||--o{  LPHS_TARGETED_REVISION_DEPARTMENT : satu dept bisa menjadi target banyak revisi
```

**Catatan Desain Paralelisasi (GAP08/BP02):** `LPHS_DEPARTMENT_REVIEW.approval_status` memiliki sub-status `reviewing` (dept mulai mereview bersamaan dengan PM) dan `pending_pm` (dept sudah siap approve tapi menunggu PM approve dulu), sesuai aturan bisnis bahwa dept tidak dapat memberikan approval final sebelum PM approve. Ini menghindari kebutuhan tabel terpisah untuk "status paralel" — direpresentasikan sebagai nilai enum granular pada satu kolom status.

**Catatan Revisi Tertarget (BP03):** Saat PM/Management mengirim revisi, hanya `LPHS_DEPARTMENT_REVIEW` milik departemen yang dipilih (via `LPHS_TARGETED_REVISION_DEPARTMENT`) yang di-reset `approval_status` ke `reviewing`/`pending_pm`. Departemen lain yang sudah `approved` tidak berubah — inilah yang membedakan "revisi tertarget" dari "revisi total" pada desain lama.

---

## 10. DOMAIN: HARGA & KOMPETITOR

### 10.1 Entitas

```
PRICE_SUBMISSION (Harga Penawaran — FR050)
- id : UUID [PK]
- project_id : UUID [FK → PROJECT, unique]
- our_price : Decimal
- margin_percentage : Decimal [nullable]
- note : Text [nullable]
- reference_link : Text [nullable]
- submitted_at : Timestamp
- submitted_by : UUID [FK → USER]
- created_at, updated_at : Timestamp

PROJECT_COMPETITOR (Junction — relasi many-to-many proyek↔kompetitor, FR051, menggantikan JSON bebas GAP09)
- id : UUID [PK]
- project_id : UUID [FK → PROJECT]
- competitor_id : UUID [FK → COMPETITOR]
- competitor_price : Decimal [nullable]
- advantage_note : Text [nullable]
- created_at, updated_at : Timestamp
```

### 10.2 Relasi

```
PROJECT      ||--o|  PRICE_SUBMISSION       : satu proyek punya maksimum satu harga penawaran
PROJECT      ||--o{  PROJECT_COMPETITOR     : satu proyek bisa melibatkan banyak kompetitor
COMPETITOR   ||--o{  PROJECT_COMPETITOR     : satu kompetitor muncul di banyak proyek
```

**Catatan Normalisasi Kritis (GAP09):** `PROJECT_COMPETITOR` adalah tabel junction murni yang menggantikan penyimpanan kompetitor sebagai JSON array bebas per proyek pada desain lama. Karena `competitor_id` adalah foreign key ke `COMPETITOR` (bukan nama teks bebas), analitik lintas proyek seperti "win rate kita melawan Kompetitor X" menjadi mungkin tanpa parsing teks/JSON.

---

## 11. DOMAIN: PEMENANG & DELIVERY

### 11.1 Entitas

```
TENDER_RESULT (Pemenang Tender — FR060)
- id : UUID [PK]
- project_id : UUID [FK → PROJECT, unique]
- result : Enum [won|lost]
- final_price : Decimal [nullable]
- loss_reason_id : UUID [FK → LOSS_REASON, nullable — wajib diisi jika result=lost]
- loss_reason_note : Text [nullable]
- decided_at : Timestamp
- decided_by : UUID [FK → USER]
- created_at, updated_at : Timestamp

DELIVERY_TARGET (Target Delivery — FR061-062)
- id : UUID [PK]
- project_id : UUID [FK → PROJECT, unique]
- start_date : Date
- end_date : Date
- pic_name : Text
- notes : Text [nullable]
- status : Enum [scheduled|in_progress|completed|delayed]
- completed_at : Timestamp [nullable]
- created_at, updated_at : Timestamp
```

### 11.2 Relasi

```
PROJECT        ||--o|  TENDER_RESULT     : satu proyek punya maksimum satu hasil tender
LOSS_REASON    ||--o{  TENDER_RESULT     : satu alasan kekalahan dipakai banyak hasil tender (jika lost)
PROJECT        ||--o|  DELIVERY_TARGET   : satu proyek (yang menang) punya maksimum satu target delivery
```

---

## 12. DOMAIN: APPROVAL & WORKFLOW ENGINE

### 12.1 Entitas

```
APPROVAL_WORKFLOW_STAGE (Konfigurasi tahap approval — CFG-02)
- id : UUID [PK]
- stage_code : Text [unique — rks_review|lphs_dept_review|lphs_pm_coordination|lphs_final_approval|dll.]
- label : Text
- approver_role_id : UUID [FK → ROLE]
- display_order : Integer
- is_parallel : Boolean [true untuk tahap yang dapat berjalan bersamaan, GAP08]
- is_active : Boolean
- created_at, updated_at : Timestamp

APPROVAL (Approval Task — entitas generik yang melayani seluruh jenis approval di sistem)
- id : UUID [PK]
- resource_type : Enum [prospect|rks|lphs_sios]
- resource_id : UUID [polymorphic reference — tidak FK langsung karena resource_type bervariasi, lihat 007 untuk justifikasi pola ini]
- stage_id : UUID [FK → APPROVAL_WORKFLOW_STAGE]
- assigned_to_user_id : UUID [FK → USER, nullable]
- assigned_to_role_id : UUID [FK → ROLE, nullable]
- assigned_to_department_id : UUID [FK → DEPARTMENT, nullable]
- status : Enum [pending|approved|rejected|superseded]
- decision_comment : Text [nullable]
- decided_by : UUID [FK → USER, nullable]
- decided_at : Timestamp [nullable]
- sla_deadline : Timestamp [nullable]
- created_at, updated_at : Timestamp

APPROVAL_REASSIGNMENT (Riwayat re-assign approval — GAP07/BP01)
- id : UUID [PK]
- approval_id : UUID [FK → APPROVAL]
- previous_assignee_user_id : UUID [FK → USER, nullable]
- new_assignee_user_id : UUID [FK → USER]
- reason : Text
- reassigned_by : UUID [FK → USER]
- reassigned_at : Timestamp

BACKUP_APPROVER_DELEGATION (Delegasi sementara backup approver)
- id : UUID [PK]
- position_id : UUID [FK → POSITION]
- primary_user_id : UUID [FK → USER]
- backup_user_id : UUID [FK → USER]
- valid_from : Date
- valid_until : Date
- created_by : UUID [FK → USER]
- created_at : Timestamp
```

### 12.2 Relasi

```
ROLE                       ||--o{  APPROVAL_WORKFLOW_STAGE  : satu role menjadi approver di banyak tahap
APPROVAL_WORKFLOW_STAGE    ||--o{  APPROVAL                 : satu tahap menghasilkan banyak approval task
USER                       ||--o{  APPROVAL                 : satu user menjadi assignee banyak approval (nullable jika assign ke role)
ROLE                       ||--o{  APPROVAL                 : satu role menjadi assignee banyak approval (assignment berbasis role, bukan user spesifik)
DEPARTMENT                 ||--o{  APPROVAL                 : satu dept menjadi assignee banyak approval (untuk review LPHS per dept)
APPROVAL                   ||--o{  APPROVAL_REASSIGNMENT    : satu approval punya banyak riwayat reassignment
POSITION                   ||--o{  BACKUP_APPROVER_DELEGATION : satu posisi punya banyak riwayat delegasi
```

**Catatan Desain Polymorphic Reference:** `APPROVAL.resource_id` tidak menggunakan foreign key constraint database langsung karena `resource_type` dapat merujuk ke tabel `PROSPECT`, `RKS`, atau `LPHS_SIOS` secara bergantian. Pola ini didokumentasikan secara eksplisit di 007 sebagai satu-satunya pengecualian terhadap prinsip "no JSON blob", karena polymorphic association adalah pola relasional standar (bukan JSON), dan integritas referensial untuk pola ini ditegakkan di application/service layer (lihat 020 §8.2) alih-alih di level constraint database. Justifikasi: approval workflow generik (039) harus melayani banyak tipe resource tanpa duplikasi tabel approval per modul.

---

## 13. DOMAIN: DOCUMENT MANAGEMENT

### 13.1 Entitas

```
DOCUMENT (Dokumen Upload — FR070, disimpan di luar webroot)
- id : UUID [PK]
- document_type_id : UUID [FK → DOCUMENT_TYPE_DEFINITION]
- resource_type : Enum [prospect|rks|lphs_sios|harga|pemenang|project_misc]
- resource_id : UUID [polymorphic reference, sama prinsip dengan APPROVAL — lihat 007]
- department_id : UUID [FK → DEPARTMENT, nullable — untuk dokumen LPHS revisi tertarget per dept]
- file_name : Text
- file_size_bytes : Integer
- mime_type : Text
- storage_path : Text [internal only, tidak pernah diekspos ke API response — lihat 020 §9.4]
- version_number : Integer
- is_latest_version : Boolean
- uploaded_by : UUID [FK → USER]
- uploaded_at : Timestamp
- deleted_at : Timestamp [nullable]
```

### 13.2 Relasi

```
DOCUMENT_TYPE_DEFINITION  ||--o{  DOCUMENT   : satu tipe dokumen dipakai banyak file
DEPARTMENT                ||--o{  DOCUMENT   : satu dept terhubung ke banyak dokumen LPHS targeted (nullable)
USER                      ||--o{  DOCUMENT   : satu user mengupload banyak dokumen
DOCUMENT                  ||--o{  DOCUMENT   : versioning melalui kombinasi resource_type+resource_id+document_type_id yang sama, version_number berurutan (lihat 049 untuk model versioning detail)
```

**Catatan Normalisasi Versioning (GAP14):** Upload ulang dokumen dengan `resource_type` + `resource_id` + `document_type_id` yang sama tidak melakukan overwrite, melainkan insert row baru dengan `version_number` increment dan menandai versi sebelumnya `is_latest_version = false`. Detail lengkap model versioning (termasuk retrieval riwayat) ada di 049_DOCUMENT_VERSIONING_MODULE.

---

## 14. DOMAIN: TARGET & KPI MODULE

Modul ini didesain penuh sesuai catatan 000_DOCUMENT_INDEX poin 2 (Gap Kritikal GAP01) — bukan ringkasan.

### 14.1 Entitas

```
KPI_DEFINITION (Master KPI — MD07)
- id : UUID [PK]
- code : Text [unique — pipeline_value|win_rate|project_count|dll.]
- name : Text
- formula_description : Text [deskripsi formula kalkulasi dalam bahasa natural, bukan executable code]
- unit : Enum [currency|percentage|count]
- is_active : Boolean
- created_at, updated_at : Timestamp

KPI_WEIGHT (Master Bobot — bobot setiap KPI dalam skor komposit)
- id : UUID [PK]
- kpi_definition_id : UUID [FK → KPI_DEFINITION]
- weight_percentage : Decimal [total seluruh bobot aktif harus = 100%, divalidasi di service layer]
- effective_from : Date
- effective_until : Date [nullable]
- created_by : UUID [FK → USER]
- created_at : Timestamp

TARGET (Master Target — versioned, per unit organisasi dan periode)
- id : UUID [PK]
- kpi_definition_id : UUID [FK → KPI_DEFINITION]
- scope_type : Enum [branch|division|company]
- scope_id : UUID [polymorphic reference ke BRANCH/DIVISION/COMPANY sesuai scope_type]
- period_id : UUID [FK → PERIOD_DEFINITION]
- target_value : Decimal
- version_number : Integer
- is_current_version : Boolean
- created_by : UUID [FK → USER]
- created_at : Timestamp

TARGET_PROGRESS_SNAPSHOT (Snapshot periodik progress vs target)
- id : UUID [PK]
- target_id : UUID [FK → TARGET]
- snapshot_date : Date
- actual_value : Decimal
- percentage_achieved : Decimal
- traffic_light_status : Enum [red|yellow|green]
- created_at : Timestamp
```

### 14.2 Relasi

```
KPI_DEFINITION   ||--o{  KPI_WEIGHT                  : satu KPI punya banyak riwayat bobot (versioned by effective date)
KPI_DEFINITION   ||--o{  TARGET                      : satu KPI punya banyak target (lintas unit organisasi dan periode)
PERIOD_DEFINITION ||--o{ TARGET                      : satu periode punya banyak target
TARGET           ||--o{  TARGET_PROGRESS_SNAPSHOT    : satu target punya banyak snapshot progress (riwayat harian/periodik)
```

**Catatan Desain Versioning Target:** `TARGET.version_number` dan `is_current_version` memungkinkan riwayat perubahan target tersimpan penuh (sesuai kebutuhan "histori versi" pada 044_TARGET_SETTING_WORKFLOW) tanpa overwrite — setiap perubahan target oleh admin/management menghasilkan row baru dengan version_number increment, version lama tetap ada untuk audit historis kalkulasi skor di periode tersebut.

**Catatan Desain Skor Komposit:** Formula skor komposit final (gabungan beberapa KPI dengan bobotnya) dihitung di application layer berdasarkan `KPI_WEIGHT` aktif pada periode terkait dan disimpan hasilnya di `TARGET_PROGRESS_SNAPSHOT` sebagai cache hasil kalkulasi — bukan dihitung ulang setiap kali dashboard di-load, untuk menjaga performa sesuai target 059 (Dashboard Load Time).

---

## 15. DOMAIN: NOTIFICATION

### 15.1 Entitas

```
NOTIFICATION_TEMPLATE (Master Template Notifikasi — MD12, CFG-09)
- id : UUID [PK]
- event_code : Text [unique]
- template_text : Text [mendukung placeholder {{variable}}]
- channel : Enum [in_app|email]
- is_active : Boolean
- created_at, updated_at : Timestamp

NOTIFICATION_TEMPLATE_RECIPIENT (Junction — role/dept penerima per template)
- id : UUID [PK]
- notification_template_id : UUID [FK → NOTIFICATION_TEMPLATE]
- recipient_role_id : UUID [FK → ROLE, nullable]
- recipient_department_id : UUID [FK → DEPARTMENT, nullable]

NOTIFICATION (Notifikasi In-App — FR090)
- id : UUID [PK]
- notification_template_id : UUID [FK → NOTIFICATION_TEMPLATE]
- recipient_user_id : UUID [FK → USER]
- resource_type : Text [nullable]
- resource_id : UUID [nullable, polymorphic reference]
- message : Text [rendered dari template]
- is_read : Boolean
- read_at : Timestamp [nullable]
- created_at : Timestamp
```

### 15.2 Relasi

```
NOTIFICATION_TEMPLATE  ||--o{  NOTIFICATION_TEMPLATE_RECIPIENT  : satu template punya banyak definisi penerima
NOTIFICATION_TEMPLATE  ||--o{  NOTIFICATION                     : satu template menghasilkan banyak notifikasi terkirim
USER                   ||--o{  NOTIFICATION                     : satu user menerima banyak notifikasi
```

---

## 16. DOMAIN: AUDIT

### 16.1 Entitas

```
AUDIT_LOG (Audit Trail — append-only, GAP16)
- id : UUID [PK]
- actor_id : UUID [FK → USER, nullable — null jika sistem otomatis]
- actor_role_snapshot : Text [snapshot role pada saat aksi terjadi, bukan FK live ke ROLE — agar histori tidak berubah jika role user kemudian diubah]
- action : Text [format resource.action]
- resource_type : Text [nullable]
- resource_id : UUID [nullable, polymorphic reference]
- branch_id_snapshot : UUID [nullable, snapshot]
- ip_address : Text
- user_agent : Text [nullable]
- payload_before : Text [konseptual: representasi state sebelum, lihat 007 untuk batasan]
- payload_after : Text [konseptual: representasi state setelah]
- metadata : Text [nullable]
- result : Enum [success|denied|error]
- error_code : Text [nullable]
- created_at : Timestamp
```

### 16.2 Relasi

```
USER   ||--o{  AUDIT_LOG   : satu user menjadi actor banyak entri audit log (nullable untuk aksi sistem)
```

**Catatan Khusus — Append-Only & Snapshot:** `AUDIT_LOG` secara sengaja **tidak** menggunakan foreign key live ke `ROLE` atau `BRANCH` untuk field snapshot (`actor_role_snapshot`, `branch_id_snapshot`) — keduanya disimpan sebagai nilai snapshot at-the-time-of-action. Ini memastikan riwayat audit tetap akurat secara historis meskipun role/struktur organisasi user berubah di kemudian hari (lihat IR-053-02 di §18). `payload_before`/`payload_after` adalah satu-satunya tempat di seluruh skema yang menyimpan representasi data semi-terstruktur, dijustifikasi di 007 sebagai pengecualian wajar karena sifatnya adalah snapshot historis read-only, bukan data transaksional yang di-query secara relasional.

---

## 17. DOMAIN: CONFIGURATION & AI

### 17.1 Entitas

```
SLA_CONFIGURATION (CFG-05)
- id : UUID [PK]
- stage_id : UUID [FK → APPROVAL_WORKFLOW_STAGE]
- sla_working_days : Integer
- is_enforcement_active : Boolean
- created_at, updated_at : Timestamp

SLA_REMINDER_CONFIGURATION (CFG-06 — bisa lebih dari satu reminder per stage)
- id : UUID [PK]
- sla_configuration_id : UUID [FK → SLA_CONFIGURATION]
- reminder_days_before : Integer
- escalation_role_id : UUID [FK → ROLE, nullable]

UPLOAD_POLICY_CONFIGURATION (CFG-13)
- id : UUID [PK]
- document_type_id : UUID [FK → DOCUMENT_TYPE_DEFINITION]
- max_size_mb : Integer
- created_at, updated_at : Timestamp

UPLOAD_POLICY_MIME_TYPE (Junction — mime type yang diizinkan per tipe dokumen)
- id : UUID [PK]
- upload_policy_configuration_id : UUID [FK → UPLOAD_POLICY_CONFIGURATION]
- mime_type : Text

INTEGRATION_CONFIGURATION (CFG-14 — termasuk konfigurasi AI provider)
- id : UUID [PK]
- key : Text [unique — GEMINI_API_KEY|AI_PROVIDER|AI_MODEL|SMTP_HOST|dll.]
- value_encrypted : Text [nilai dienkripsi jika is_secret=true]
- is_secret : Boolean
- updated_by : UUID [FK → USER]
- updated_at : Timestamp

AI_REQUEST_LOG (Log permintaan ke AI Service Layer — terhubung ke audit per prinsip 000_DOCUMENT_INDEX)
- id : UUID [PK]
- requested_by : UUID [FK → USER]
- feature_code : Text [tender_summary|prospect_analysis|competitor_analysis|kpi_insight|executive_summary|smart_search]
- resource_type : Text [nullable]
- resource_id : UUID [nullable, polymorphic reference]
- provider : Text [gemini|...]
- model : Text
- status : Enum [success|failed|rate_limited]
- latency_ms : Integer [nullable]
- error_code : Text [nullable]
- created_at : Timestamp
```

### 17.2 Relasi

```
APPROVAL_WORKFLOW_STAGE       ||--o|  SLA_CONFIGURATION              : satu tahap punya maksimum satu konfigurasi SLA
SLA_CONFIGURATION             ||--o{  SLA_REMINDER_CONFIGURATION     : satu SLA config punya banyak reminder
DOCUMENT_TYPE_DEFINITION      ||--o|  UPLOAD_POLICY_CONFIGURATION    : satu tipe dokumen punya maksimum satu policy upload
UPLOAD_POLICY_CONFIGURATION   ||--o{  UPLOAD_POLICY_MIME_TYPE        : satu policy punya banyak mime type diizinkan
USER                          ||--o{  AI_REQUEST_LOG                 : satu user memicu banyak request AI
```

**Catatan Arsitektur AI:** `AI_REQUEST_LOG` adalah entitas terpisah dari `AUDIT_LOG` umum karena memiliki atribut khusus AI (provider, model, latency, rate-limit status) yang tidak relevan untuk audit log domain bisnis lain — namun setiap entri di sini **juga** menghasilkan entri di `AUDIT_LOG` umum (action=`ai.{feature_code}`) untuk menjaga satu sumber kebenaran audit lintas sistem, sesuai prinsip cross-document di 000_DOCUMENT_INDEX ("Seluruh request AI tercatat di audit log").

---

## 18. INFERRED REQUIREMENTS

### IR-053-01: Polymorphic Reference untuk Approval dan Document
**Deskripsi:** Tabel `APPROVAL`, `DOCUMENT`, `NOTIFICATION`, dan `AUDIT_LOG` menggunakan pola polymorphic reference (`resource_type` + `resource_id`) tanpa foreign key constraint database langsung ke tabel target.
**Alasan:** BA Review dan FE Spec mendeskripsikan approval, dokumen, dan notifikasi sebagai konsep generik yang melayani banyak jenis entitas bisnis (Prospek, RKS, LPHS/SIOS) tanpa membedakan struktur tabel approval/dokumen per modul. Tanpa pola ini, setiap modul baru akan memerlukan tabel approval/dokumen terpisah, melanggar prinsip Reusability di 058 §3.3. Integritas referensial untuk pola ini ditegakkan di service layer (020 §8.2), bukan di level database constraint — trade-off yang diterima karena manfaat fleksibilitas lintas modul lebih besar dari risiko, mengingat validasi service layer sudah menjadi pola wajib di seluruh sistem.

### IR-053-02: Snapshot Field pada Audit Log
**Deskripsi:** `AUDIT_LOG.actor_role_snapshot` dan `AUDIT_LOG.branch_id_snapshot` disimpan sebagai nilai snapshot (bukan foreign key live).
**Alasan:** BA Review tidak menyebutkan kebutuhan ini secara eksplisit, namun ini diperlukan agar laporan audit historis tetap akurat menggambarkan kondisi pada saat aksi terjadi, bukan kondisi role/cabang user saat ini. Tanpa snapshot, audit log akan "berubah retroaktif" setiap kali admin mengubah role/cabang seorang user — yang bertentangan dengan sifat audit trail yang harus immutable secara historis (lihat 020 §10.5).

### IR-053-03: Tabel Junction untuk Multi-Jawaban Checkbox
**Deskripsi:** `PROSPECT_ANSWER_OPTION` ditambahkan sebagai tabel junction terpisah dari `PROSPECT_ANSWER` untuk menangani pertanyaan tipe checkbox yang memungkinkan lebih dari satu jawaban terpilih.
**Alasan:** FE Spec mendeskripsikan tipe pertanyaan "checkbox" sebagai "multi-select" (PROS-02). Satu baris `PROSPECT_ANSWER` per pertanyaan tidak cukup untuk merepresentasikan banyak opsi terpilih tanpa JSON array, yang melanggar prinsip anti-JSON-blob (007). Tabel junction terpisah menyelesaikan ini secara relasional murni.

### IR-053-04: KPI_WEIGHT dan TARGET sebagai Tabel Terpisah dari KPI_DEFINITION
**Deskripsi:** Bobot KPI (`KPI_WEIGHT`) dan target nilai (`TARGET`) dipisah dari definisi KPI itu sendiri (`KPI_DEFINITION`), masing-masing dengan riwayat versi/efektivitas sendiri.
**Alasan:** 000_DOCUMENT_INDEX poin 2 mewajibkan modul Target & KPI didesain lengkap dan penuh dengan "histori versi" untuk target. Memisahkan definisi (stabil) dari nilai target dan bobot (berubah per periode) memungkinkan riwayat perubahan tersimpan tanpa mengubah/menduplikasi definisi KPI itu sendiri.

### IR-053-05: AI_REQUEST_LOG Terpisah dari AUDIT_LOG Umum
**Deskripsi:** Permintaan ke AI Service Layer dicatat di tabel khusus `AI_REQUEST_LOG` selain juga tercatat di `AUDIT_LOG` umum.
**Alasan:** BA Review tidak membahas AI; namun 000_DOCUMENT_INDEX (revisi v1.1) menetapkan AI sebagai komponen arsitektur resmi dengan kebutuhan monitoring, cost control, dan rate limiting khusus (010). Atribut seperti `latency_ms`, `provider`, `model` tidak relevan untuk audit log domain bisnis lain; tabel terpisah menghindari pelebaran skema `AUDIT_LOG` dengan kolom yang sebagian besar NULL untuk 95% baris non-AI.

---

## 19. ENTITY COUNT SUMMARY

| Domain | Jumlah Entitas |
|---|---|
| Organization & Access | 11 (COMPANY, DIVISION, DEPARTMENT, BRANCH, ROLE, PERMISSION, ROLE_PERMISSION, USER, ACTIVE_SESSION, POSITION, USER_POSITION) |
| Master Data | 12 (CUSTOMER, PROJECT_CATEGORY, PROJECT_STATUS_DEFINITION, APPROVAL_LEVEL_DEFINITION, DOCUMENT_TYPE_DEFINITION, COMPETITOR, QUESTION_TYPE, QUESTION_TYPE_OPTION, QUESTION, QUESTION_OPTION, PERIOD_DEFINITION, HOLIDAY, LOSS_REASON) — 13 entitas |
| Prospect Management | 4 (PROSPECT, PROSPECT_ANSWER, PROSPECT_ANSWER_OPTION, PROSPECT_REVIEW_QUESTION, PROSPECT_REVIEW_NOTE) — 5 entitas |
| Project Core | 2 (PROJECT, PROJECT_TIMELINE_EVENT) |
| RKS Module | 3 (RKS, RKS_REVIEW_QUESTION, RKS_REVIEW_NOTE) |
| LPHS/SIOS Module | 4 (LPHS_SIOS, LPHS_DEPARTMENT_REVIEW, LPHS_TARGETED_REVISION, LPHS_TARGETED_REVISION_DEPARTMENT) |
| Harga & Kompetitor | 2 (PRICE_SUBMISSION, PROJECT_COMPETITOR) |
| Pemenang & Delivery | 2 (TENDER_RESULT, DELIVERY_TARGET) |
| Approval & Workflow Engine | 4 (APPROVAL_WORKFLOW_STAGE, APPROVAL, APPROVAL_REASSIGNMENT, BACKUP_APPROVER_DELEGATION) |
| Document Management | 1 (DOCUMENT) |
| Target & KPI | 4 (KPI_DEFINITION, KPI_WEIGHT, TARGET, TARGET_PROGRESS_SNAPSHOT) |
| Notification | 3 (NOTIFICATION_TEMPLATE, NOTIFICATION_TEMPLATE_RECIPIENT, NOTIFICATION) |
| Audit | 1 (AUDIT_LOG) |
| Configuration & AI | 6 (SLA_CONFIGURATION, SLA_REMINDER_CONFIGURATION, UPLOAD_POLICY_CONFIGURATION, UPLOAD_POLICY_MIME_TYPE, INTEGRATION_CONFIGURATION, AI_REQUEST_LOG) |
| **TOTAL** | **61 entitas** |

Jumlah ini melampaui estimasi awal "40+ tabel" pada 000_DOCUMENT_INDEX karena normalisasi penuh (anti-JSON-blob) terhadap area yang sebelumnya disederhanakan sebagai JSON (jawaban checklist, opsi checkbox, revisi tertarget LPHS, bobot KPI versioned) menghasilkan tabel junction dan tabel riwayat tambahan yang tidak terhitung dalam estimasi kasar awal.
