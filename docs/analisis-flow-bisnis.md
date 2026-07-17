# Analisis Flow Bisnis — Kinetic CRM (Prototype)

> **Dokumen ini berisi analisis kritis terhadap implementasi prototype Kinetic CRM.**
> Sistem masih dalam tahap prototyping dan belum dapat dianggap sebagai representasi final dari proses bisnis.

---

## Daftar Isi

1. [Arsitektur Sistem Saat Ini](#1-arsitektur-sistem-saat-ini)
2. [Flow Prospek (Prospect)](#2-flow-prospek-prospect)
3. [Flow Proyek (Project)](#3-flow-proyek-project)
4. [Flow Pengadaan (Procurement)](#4-flow-pengadaan-procurement)
5. [Hubungan Antar Modul](#5-hubungan-antar-modul)
6. [Status & Transitions](#6-status--transitions)
7. [Findings & Rekomendasi](#7-findings--rekomendasi)
8. [Ringkasan Perlu Validasi](#8-ringkasan-perlu-validasi)

---

## 1. Arsitektur Sistem Saat Ini

Berdasarkan implementasi prototype, sistem terdiri dari **3 modul inti** yang saling terhubung:

```
Prospek (Prospect) → Proyek (Project) → Pengadaan (Procurement)
```

Dengan modul pendukung:

- **Master Data** (Customer, Competitor, Kategori, Dokumen, Pertanyaan, Holidays, dll)
- **Approval Engine** (Workflow Stage-based & Chain-based)
- **Follow-Up Task & Visit** (Kunjungan dan Tindak Lanjut)
- **KPI & Targets**
- **Config & Admin** (Org Structure, Roles, Permissions, SLA, Notifikasi)

### Teknologi

- **Frontend**: React + TypeScript + Zustand (state management) + React Query
- **Backend**: Node.js + Prisma ORM + MySQL
- **Auth**: JWT-based dengan session management

---

## 2. Flow Prospek (Prospect)

### 2.1 Current Flow (Berdasarkan Implementasi)

**Tahapan status prospect:**

```
Lead → Potensial → Waiting Supervisor → Approved → [Konversi ke Proyek]
                                          → Revision (kembali ke pengirim)
                    → Non Potensial (buntu, tidak bisa konversi)
```

**Stepper di UI:**

```
Lead → Prospek → Review Supervisor → Approval → Proyek
```

**Syarat Lead → Potensial (Promote):**

1. Customer harus sudah terverifikasi (`needsVerification = false`)
2. `potensiUnit > 0`
3. Minimal 1 kunjungan (Visit) dengan status `completed`

**Trigger aksi per status:**

| Status | Aksi yang Tersedia |
|--------|-------------------|
| Lead | "Naikkan ke Prospek" — jika syarat terpenuhi |
| Potensial / Non Potensial | "Kirim ke Review" → status jadi `Waiting Supervisor` |
| Waiting Supervisor | "Setujui" → `Approved` / "Revisi" → `Revision` |
| Revision | "Kirim Ulang ke Supervisor" → `Waiting Supervisor` |
| Approved | "Buat Proyek" → navigasi ke form proyek |
| Approved + sudah ada proyek | "Lihat Proyek" |
| Non Potensial + Approved | Tidak bisa dikonversi (info message) |

### 2.2 Business Flow yang Seharusnya (Analisis)

**Flow prospek yang ideal di bisnis pengadaan/IT solutions:**

1. **Lead Generation** — Mendapatkan prospek dari berbagai sumber (event, referral, cold call, dll)
2. **Kualifikasi awal** — Apakah prospek ini layak dikejar? (Budget, Authority, Need, Timeline)
3. **Kunjungan & Need Analysis** — Visit untuk memahami kebutuhan customer
4. **Proposal & Negosiasi** — Menyusun proposal, negosiasi harga
5. **Review Internal** — Supervisor/Marketing review kelayakan
6. **Approval** — Persetujuan untuk melanjutkan ke proyek
7. **Konversi ke Proyek** — Jika menang tender

### 2.3 Potential Issue / Gap

> **Perlu validasi flow bisnis**

1. **Status `Non Potensial` vs `Potensial` tidak simetris:**
   - Keduanya bisa "Kirim ke Review" dan sama-sama bisa `Approved`
   - Tapi setelah `Approved`, `Non Potensial` tidak bisa dibuatkan proyek
   - Pertanyaan: Kenapa Non Potensial perlu di-approve? Bukankah lebih logis jika Non Potensial langsung di-drop?

2. **Tidak ada status `Lost` atau `Closed`:**
   - Prospek yang kalah di tender atau batal tidak memiliki status terminal selain `Non Potensial`
   - Tidak ada mekanisme mencatat alasan kehilangan pada level prospek

3. **Customer verification dilakukan di level prospek, bukan sebagai master data:**
   - Verifikasi customer hanya bisa oleh Super Admin
   - Customer yang belum diverifikasi menghambat promote ke Potensial
   - Pertanyaan: Apakah verifikasi harus benar-benar menghambat flow, atau bisa paralel?

4. **Syarat kunjungan untuk promote:**
   - Minimal 1 kunjungan completed adalah syarat yang valid
   - Tapi tidak ada batasan kapan kunjungan harus dilakukan (H-7 sebelum promote?)
   - Tidak ada minimum quality untuk kunjungan (hanya status completed)

5. **Tidak ada BANT (Budget, Authority, Need, Timeline) atau metode kualifikasi prospek lainnya:**
   - Sistem hanya mengandalkan `potensiUnit` dan `estimatedValue`
   - Tidak ada skor kualifikasi atau scoring system

6. **Prospek bisa langsung `Approved` tanpa melalui tahap review yang jelas:**
   - Flow: `Lead → Potensial → Waiting Supervisor → Approved`
   - Tidak ada tahap proposal atau negosiasi di sistem
   - Pertanyaan: Apakah proposal dikerjakan di luar sistem?

### 2.4 Question / Confirmation Needed

1. Bagaimana seharusnya flow untuk prospek yang **kalah** di tender? Apakah perlu `Lost` status?
2. Apakah verifikasi customer wajib **sebelum** promote, atau bisa setelahnya?
3. Siapa yang melakukan kualifikasi prospek — Staff Marketing atau Supervisor?
4. Apakah ada dokumen kelengkapan yang wajib di-upload sebelum prospek bisa di-approve?

---

## 3. Flow Proyek (Project)

### 3.1 Current Flow (Berdasarkan Implementasi)

**Project dibuat dari:** Prospek yang sudah `Approved`, atau bisa dibuat manual

**Project lifecycle phases (dari `project_phases` table):**

```
Draft → RKS → [Review RKS] → LPHS/SIOS → Harga → Kompetitor → Pemenang → [Selesai / Kalah]
```

**Tabs (tergantung tipe proyek):**

| Tipe | Tabs yang Tersedia |
|------|-------------------|
| `tender` | Overview, Tasks, RKS, Review RKS, LPHS/SIOS, Harga, Kompetitor, Pemenang, Timeline, Dokumen |
| `prospecting` (non-tender) | Overview, Tasks, RKS, LPHS/SIOS, Harga, Kompetitor, Pemenang, Timeline, Dokumen |
| `non_potensial` | Overview, Timeline, Dokumen (hanya 3 tab) |

**Approval flow proyek:**

- Tombol "Approve" di header → memajukan status ke fase berikutnya sesuai `NEXT_PHASE_MAP`
- Tombol "Revisi" → mengembalikan ke fase sebelumnya

**Status proyek:**

- Tersimpan di kolom `status` (string) dan `phase` (string)
- Status didefinisikan di `ProjectStatusDefinition` (configurable)
- Terminal: `Selesai`, `Kalah`

### 3.2 Sub-Flow Detail

#### RKS (Kerangka Acuan Kerja / TOR)

- Status: `draft → waiting_pm_approval → revision → approved`
- Ada review questions dan review notes
- PM (Project Manager) dan Reviewer yang terlibat

#### LPHS/SIOS

- Approval multi-level: **Department Review → PM Approval → Management Approval → Final Approval**
- Departemen bisa direview secara paralel
- Ada mekanisme `targeted_revision` untuk revisi yang ditargetkan ke departemen tertentu
- Status: `draft → dept_review → mgmt_review → approved`

#### Harga (Price Submission)

- Input: `ourPrice`, `marginPercentage`, `bottomPrice`, `note`
- Ada reference link/URL
- Disimpan ke `PriceSubmission`

#### Kompetitor

- Daftar kompetitor dengan `competitorPrice`, `advantageNote`
- Bisa menambah kompetitor baru langsung dari form (auto-create master data)

#### Pemenang (Tender Result)

- `won` / `lost`
- Jika menang: `contractValue`, `startDate`, `durationDays`, `spkDocument`
- Jika kalah: `lossReason`, `lossReasonNote`
- Delivery Target: `startDate`, `endDate`, `actualEndDate`

### 3.3 Potential Issue / Gap

> **Perlu validasi flow bisnis**

1. **Fase "Harga" dan "Kompetitor" tidak memiliki urutan yang jelas:**
   - Apakah harga harus diinput sebelum atau sesudah melihat kompetitor?
   - Locking mechanism: Harga, Kompetitor, Pemenang terkunci sampai LPHS/SIOS selesai
   - Tapi Harga dan Kompetitor tidak saling locking satu sama lain

2. **Approval proyek terlalu sederhana:**
   - Tombol "Approve" di header project langsung memajukan status tanpa workflow approval yang jelas
   - Tidak ada approver yang ditentukan per fase
   - Siapa yang approve RKS? Siapa yang approve LPHS? Siapa yang approve Pemenang?

3. **Dua sistem approval berbeda:**
   - Ada `Approval` model (stage-based) — untuk prospect, rks, lphs_sios
   - Ada `ApprovalChain/ApprovalRequest` — chain-based (multi-level berdasarkan amount)
   - Tidak jelas kapan masing-masing digunakan

4. **Status proyek bisa di-skip:**
   - Tidak ada guard yang mencegah user approve ke fase berikutnya tanpa menyelesaikan fase saat ini
   - Contoh: Bisa approve dari RKS langsung ke LPHS tanpa review

5. **Proyek Non-Potensial tidak jelas tujuannya:**
   - Hanya punya 3 tab (Overview, Timeline, Dokumen)
   - Tidak bisa melalui tender
   - Tapi kenapa dibuat proyek? Untuk pengadaan langsung?

6. **Tidak ada mekanisme `Change Order` atau `Variation Order`:**
   - Jika nilai kontrak berubah setelah proyek berjalan, bagaimana cara mencatatnya?
   - Delivery target hanya sekali input

### 3.4 Question / Confirmation Needed

1. Apakah proyek Non-Potensial dimaksudkan untuk **pengadaan non-tender** (direct appointment)?
2. Siapa yang menentukan pemenang tender? Apakah ada approval dari direksi?
3. Bagaimana flow jika proyek **menang tapi customer mundur**? Apakah ada `Cancelled` status?
4. Apakah LPHS/SIOS harus di-approve oleh semua departemen atau cukup departemen terkait?

---

## 4. Flow Pengadaan (Procurement)

### 4.1 Current Flow (Berdasarkan Implementasi)

**Procurement dibuat dari:** Proyek (ada `sourceProjectId`), atau bisa standalone

**Procurement phases:**

```
Draft → Purchase_Request → Vendor_Selection → PO_Process → Delivery → Progress → Closed
                                                                                 → Cancelled
```

**Tabs:** Overview, Vendor Selection, Delivery, Closing, Timeline, Dokumen

**Vendor Selection sub-flow:**

- Supplier management dengan evaluasi
- RFQ (Request for Quotation) dengan status: `draft → sent → evaluating → completed → cancelled`
- Quote dari supplier: `pending → evaluated → selected → rejected`
- Evaluasi supplier: quality, delivery, pricing, compliance, communication

**Procurement Items:**

- Items dari `MasterItem` (Barang & Jasa)
- Quantity, unit price, total price
- Status: `pending → ordered → partial → received → cancelled`
- Bisa dialokasikan ke `ProjectRequirementItem`

### 4.2 Potential Issue / Gap

> **Perlu validasi flow bisnis**

1. **Hubungan Procurement → Proyek kurang jelas:**
   - Procurement punya `sourceProjectId`, tapi item procurement bisa dialokasikan ke `ProjectRequirementItem` dari project yang berbeda
   - Apakah satu procurement bisa melayani beberapa proyek?

2. **Tidak ada mekanisme approval untuk PR atau PO:**
   - PR (Purchase Request) tidak melalui workflow approval
   - PO (Purchase Order) langsung bisa dibuat tanpa approval
   - Tidak ada `ApprovalChain` yang terintegrasi dengan procurement

3. **Status phase tidak terkunci secara berurutan:**
   - Tidak ada mekanisme yang mencegah Delivery sebelum PO selesai
   - Tidak ada validasi bahwa PO harus terbit sebelum barang diterima

4. **`selectedVendor` disimpan sebagai string (text), bukan relasi ke Supplier:**
   - Loss of referential integrity
   - Tidak bisa tracking histori vendor per procurement

5. **Delivery dan Progress adalah phases yang terpisah:**
   - Di bisnis pengadaan, delivery dan progress sering overlap (progress adalah status delivery)
   - Apakah ini 2 fase terpisah atau 1 fase dengan sub-status?

6. **Tidak ada mekanisme Goods Received Note (GRN) atau serah terima:**
   - `unitReceivedDate` ada, tapi tidak ada dokumen serah terima
   - Tidak ada validasi bahwa kuantitas yang diterima sesuai dengan PO

### 4.3 Question / Confirmation Needed

1. Apakah procurement bisa dibuat **tanpa proyek**? (standalone procurement)
2. Apakah semua procurement harus melalui RFQ, atau ada yang direct appointment?
3. Siapa yang berwenang approve PR? Siapa yang approve PO?
4. Apakah barang/jasa yang sudah diterima perlu melewati proses **quality check**?
5. Bagaimana dengan **retur** atau barang rusak?

---

## 5. Hubungan Antar Modul

### 5.1 Current Mapping

```
Prospek ──(isConverted)──→ Proyek ──(sourceProjectId)──→ Pengadaan
    │                          │
    │                          ├── RKS (one-to-one)
    │                          ├── LPHS/SIOS (one-to-one)
    │                          ├── PriceSubmission (one-to-one)
    │                          ├── TenderResult (one-to-one)
    │                          ├── DeliveryTarget (one-to-one)
    │                          ├── Tasks (many)
    │                          ├── Competitors (many-to-many)
    │                          └── ProjectRequirementItem (many)
    │
    ├── Visit (many)
    ├── FollowUpTask (many)
    ├── Answers (many-to-many via Question)
    └── TimelineEvents (many)
```

### 5.2 Potential Issue / Gap

> **Perlu validasi flow bisnis**

1. **Prospek → Proyek:**
   - Menggunakan `isConverted` flag + `convertedToProjectId`
   - Ada dual relationship: `Project.sourceProspectId` dan `Prospect.convertedToProjectId`
   - Tapi di kode, banyak referensi ke `prospect.projectId` (redundan?)
   - Tidak ada validasi bahwa satu prospek hanya bisa dikonversi sekali (sudah ada unique constraint di `sourceProspectIdActive`)

2. **Proyek → Pengadaan:**
   - Procurement terhubung ke proyek via `sourceProjectId`
   - Items procurement dialokasikan ke `ProjectRequirementItem` via `ProcurementAllocation`
   - Tapi satu procurement bisa mengalokasikan item ke requirement proyek yang sama
   - Beda proyek? Bisa, tapi tidak ada validasi eksplisit

3. **Visit dan FollowUpTask hanya terhubung ke Prospek:**
   - Tidak ada Visit atau FollowUpTask untuk proyek atau pengadaan
   - Kunjungan ke customer setelah proyek dimenangkan tidak tercatat
   - Follow-up pasca-pengiriman tidak terdokumentasi

4. **Tidak ada relasi antara Pengadaan dan Delivery yang terintegrasi dengan Project Delivery:**
   - Project punya `DeliveryTarget`
   - Procurement punya `Delivery` phase
   - Tapi keduanya tidak saling terhubung

### 5.3 Urutan Proses yang Ideal (Saran)

Berdasarkan bisnis pengadaan/IT solutions, urutan idealnya:

```
Lead → Prospect (Qualification)
         ↓
     Visit & Need Analysis
         ↓
     Proposal & Pricing
         ↓
     Internal Review & Approval
         ↓
     [MENANG] → Project (eksekusi)
         ↓                    ↓
     Tender Result      Procurement (pengadaan barang/jasa)
     (won/lost)              ↓
                         Delivery & Installasi
                              ↓
                         Serah Terima & Closed
```

---

## 6. Status & Transitions

### 6.1 Prospect Status Transitions

| Current | Valid Transitions | Issue |
|---------|------------------|-------|
| Lead | Potensial | ✅ OK |
| Potensial | Waiting Supervisor, Non Potensial | ⚠️ Non Potensial dari Potensial perlu validasi |
| Non Potensial | Waiting Supervisor | ⚠️ Kenapa Non Potensial perlu di-review? |
| Waiting Supervisor | Approved, Revision | ✅ OK |
| Revision | Waiting Supervisor | ✅ OK |
| Approved | [Konversi ke Project] | ✅ OK |

**Issue: Tidak ada status terminal untuk prospek yang batal/hilang:**
- Prospek yang sudah Approved lalu batal — dihapus?
- Non Potensial yang di-approve — mau diapakan?

### 6.2 Project Status Transitions

Sistem menggunakan `NEXT_PHASE_MAP` untuk menentukan fase berikutnya.

**Issue: Transisi menggunakan status sebagai string (tidak ada enum):**
- `Project.status` adalah `String`, bukan enum
- Bisa diisi nilai apa saja
- ProjectPhases di-define di config (`project_phases`), jadi fleksibel
- Tapi fleksibilitas ini rawan inkonsistensi

### 6.3 Procurement Status Transitions

```
Draft → Purchase_Request → Vendor_Selection → PO_Process → Delivery → Progress → Closed
                                                                                 → Cancelled
```

**Issue: Tidak ada validasi berurutan:**
- Status bisa diubah ke mana saja (tidak ada guard di frontend/backend)
- Tidak ada mekanisme "phase complete" checklist

---

## 7. Findings & Rekomendasi

### 7.1 Critical Issues (Harus Segera Divalidasi)

1. **Dual-purpose `Approved` status:**
   - Prospek `Approved` → bisa dibuat proyek
   - Tapi `Non Potensial` yang `Approved` tidak bisa
   - Perlu dibedakan: `Approved` (for conversion) vs `Approved Non Potensial` (for rejection acknowledgement)

2. **Tidak ada audit trail untuk perubahan status di procurement:**
   - Proyek dan prospek punya TimelineEvent, procurement tidak

3. **Approval system yang ambigu:**
   - Ada 2 sistem approval (stage-based vs chain-based)
   - Tidak jelas kapan menggunakan yang mana

### 7.2 Structural Issues

4. **No `Won/Lost` status on Prospect:**
   - Prospek tidak mencatat apakah akhirnya menang atau kalah
   - Tidak bisa reporting win rate per sales

5. **Customer data inconsistency:**
   - Customer bisa dibuat dari form prospek (new customer)
   - Tapi verifikasi hanya oleh Super Admin
   - Customer yang "pending" bisa menghambat seluruh flow

6. **Dokumen tidak terintegrasi dengan workflow:**
   - Dokumen bisa diupload kapan saja
   - Tidak ada "required documents per stage"
   - Meskipun ada field `isRequiredAtStage` di DocumentType, tidak di-enforce

### 7.3 Recommendations

> **Perlu validasi flow bisnis**

**A. Simplifikasi flow prospek:**

```
Lead → Potensial → Waiting Supervisor → Approved → Project
                  → Non Potensial (terminal, No-Go)
                  → Lost (terminal, jika kalah sebelum approval)
Approved → jika batal → Cancelled (terminal)
```

**B. Integrasi approval dengan workflow yang jelas:**
- Setiap fase proyek harus punya approver yang jelas
- Procurement harus melalui approval chain

**C. Hubungkan Delivery proyek dengan Delivery procurement:**
- Jika procurement untuk proyek tertentu, delivery procurement harus update delivery proyek

**D. Tambahkan mekanisme Change Order:**
- Nilai kontrak bisa berubah setelah proyek berjalan
- Scope pekerjaan bisa berubah

**E. Reporting & Analytics:**
- Pipeline revenue per sales
- Win rate per periode
- Procurement performance (on-time delivery, budget adherence)

---

## 8. Ringkasan Perlu Validasi

| No | Item | Modul | Priority |
|----|------|-------|----------|
| 1 | Flow Non Potensial → Approved | Prospek | Tinggi |
| 2 | Status terminal prospek (Lost/Cancelled) | Prospek | Tinggi |
| 3 | Syarat kualifikasi prospek (BANT/scoring) | Prospek | Sedang |
| 4 | Approval chain per fase proyek | Proyek | Tinggi |
| 5 | Guard transisi antar fase proyek | Proyek | Tinggi |
| 6 | Hubungan LPHS/SIOS → Harga → Pemenang | Proyek | Sedang |
| 7 | Approval procurement (PR/PO) | Pengadaan | Tinggi |
| 8 | Relasi Delivery proyek vs Delivery procurement | Proyek/Pengadaan | Sedang |
| 9 | Standalone procurement tanpa proyek | Pengadaan | Sedang |
| 10 | Quality check / GRN di procurement | Pengadaan | Rendah |
| 11 | Change order / variation order | Proyek | Rendah |
| 12 | Verifikasi customer menghambat flow | Prospek | Sedang |
| 13 | Dua sistem approval (stage vs chain) | Global | Tinggi |
| 14 | Dokumen wajib per stage tidak di-enforce | Global | Sedang |
| 15 | Visit/Follow-up hanya di prospek | Global | Rendah |

---

> **Dokumen ini disusun berdasarkan analisis implementasi prototype per 2026-07-16.**
> Semua flow yang diidentifikasi sebagai "Perlu validasi flow bisnis" harus dikonfirmasi dengan narasumber/pihak bisnis sebelum sistem dikembangkan lebih lanjut.
