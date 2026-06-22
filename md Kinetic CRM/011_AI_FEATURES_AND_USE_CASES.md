# 011 — AI FEATURES AND USE CASES
## KINETIC CRM — Katalog Fitur AI dan Kasus Penggunaan

**Modul:** Architecture
**Sumber Utama:** Instruksi tambahan eksplisit stakeholder (daftar fitur AI wajib)
**Dependensi Dokumen:** 010
**Dirujuk Oleh:** 014 (UI Screen Catalog), 050 (Dashboard Module), 057 (API Endpoint Spec), 062 (QA Test Case Catalog)

---

## 1. TUJUAN DOKUMEN

Mendefinisikan **setiap** fitur AI yang didukung KINETIC CRM secara konkret: kapan dipicu, data apa yang menjadi input, bagaimana output ditampilkan, dan strategi prompt di belakangnya — agar Frontend, Backend, dan QA memiliki spesifikasi yang sama persis untuk diimplementasikan dan diuji.

Seluruh fitur berikut **wajib** melalui AI Service Layer (010) dan tidak ada modul bisnis yang memanggil Gemini secara langsung.

---

## 2. RINGKASAN KATALOG FITUR AI

| # | Fitur | Modul Terkait | Trigger | Fase |
|---|---|---|---|---|
| 1 | Tender Summary | RKS Module (034) | Manual (tombol) | Fase 1 |
| 2 | RKS Summary | RKS Module (034) | Manual (tombol) | Fase 1 |
| 3 | LPHS Summary | LPHS/SIOS Module (035) | Manual (tombol) | Fase 1 |
| 4 | Prospect Analysis | Prospect Management (032) | Manual (tombol) | Fase 1 |
| 5 | Customer Insight | Master Customer (021) | Manual (tombol) | Fase 1 |
| 6 | Competitor Analysis | Master Competitor (023), Harga & Kompetitor (036) | Manual (tombol) | Fase 1 |
| 7 | Meeting Summary | *(Inferred — lihat §2.1)* | Manual (upload transkrip/catatan) | Fase 2 |
| 8 | KPI Insight | Target & KPI Module (043-045) | Manual (tombol) / terjadwal | Fase 1 |
| 9 | Executive Dashboard Summary | Dashboard Module (050) | Otomatis saat dashboard dimuat (dengan cache) | Fase 1 |
| 10 | Smart Search | Lintas modul | Manual (search bar) | Fase 1 |
| 11 | Future AI Recommendations | Lintas modul | — | Fase 2/3 |

### 2.1 Catatan tentang Meeting Summary (Inferred Requirement)

**Inferred Requirement:** KINETIC CRM Fase 1 tidak memiliki modul rapat/meeting formal di scope PRD/BA Review/FE Spec asli. Fitur "Meeting Summary" yang diminta dalam daftar AI ditafsirkan sebagai kemampuan AI meringkas **catatan/transkrip rapat yang diupload sebagai dokumen** dalam konteks proyek (mis. notulen rapat koordinasi tender), bukan modul kalender/meeting terintegrasi penuh. *Alasan: tidak ada entitas "meeting" di ketiga dokumen sumber; interpretasi ini menjaga fitur tetap bernilai tanpa membangun modul baru yang tidak diminta.* Fitur ini diklasifikasikan **Fase 2** karena bergantung pada kematangan Document Management Module (048-049) dan kebutuhan validasi lebih lanjut dari bisnis tentang format catatan rapat yang akan diupload.

---

## 3. SPESIFIKASI DETAIL PER FITUR

### 3.1 Tender Summary

| Aspek | Detail |
|---|---|
| **Tujuan** | Memberikan ringkasan singkat keseluruhan proyek tender (status, nilai, deadline, risiko) tanpa user harus membuka seluruh tab detail proyek |
| **Trigger** | Tombol "Ringkas dengan AI" di Tab Overview Detail Proyek |
| **Input** | Data proyek (nama, customer, nilai estimasi, status, deadline), ringkasan RKS jika ada, status approval LPHS jika ada |
| **Output** | Paragraf naratif 3-5 kalimat dalam Bahasa Indonesia, mis. *"Proyek tender untuk PT XYZ senilai estimasi Rp 2,5 miliar saat ini dalam tahap review departemen, dengan deadline 12 hari lagi. RKS telah disetujui PM tanpa revisi..."* |
| **Penempatan UI** | Panel collapsible di atas Tab Overview, dengan label "Ringkasan AI" dan ikon AI |
| **Role yang Dapat Mengakses** | Cabang, PM, Management, Admin |
| **Cache** | Hasil di-cache per proyek selama data belum berubah (invalidasi saat status proyek berubah) untuk menghindari pemanggilan AI berulang untuk data yang sama |

### 3.2 RKS Summary

| Aspek | Detail |
|---|---|
| **Tujuan** | Membantu PM memahami isi dokumen RKS yang panjang dengan cepat sebelum memberikan keputusan approve/revisi |
| **Trigger** | Tombol "Ringkas Dokumen" di Tab RKS, setelah dokumen RKS diupload |
| **Input** | Teks yang diekstrak dari dokumen RKS (PDF/DOCX) yang diupload, plus metadata (nomor tender, nama tender) |
| **Output** | Ringkasan poin-poin kunci: ketentuan teknis utama, syarat administrasi, potensi risiko/perhatian khusus |
| **Penempatan UI** | Panel di samping area Review RKS (role PM) |
| **Role yang Dapat Mengakses** | PM, Admin |
| **Batasan** | Jika dokumen berformat gambar hasil scan tanpa teks dapat diekstrak, sistem menampilkan pesan "Dokumen tidak dapat dianalisis AI (format tidak didukung)" — tidak memblokir alur approval manual |

### 3.3 LPHS Summary

| Aspek | Detail |
|---|---|
| **Tujuan** | Memberikan gambaran cepat hasil survei kepada Departemen dan Management sebelum membaca dokumen lengkap |
| **Trigger** | Tombol "Ringkas Dokumen" di Tab LPHS/SIOS |
| **Input** | Teks dari dokumen draft LPHS/SIOS yang diupload Cabang |
| **Output** | Ringkasan temuan survei utama dan rekomendasi yang tercantum dalam dokumen |
| **Penempatan UI** | Panel di Sub-panel Review per Departemen dan Review Management |
| **Role yang Dapat Mengakses** | PM, Departemen, Management, Admin |

### 3.4 Prospect Analysis

| Aspek | Detail |
|---|---|
| **Tujuan** | Membantu PM menilai kualitas dan potensi prospek sebelum approval |
| **Trigger** | Tombol "Analisis AI" di Detail Prospek, Tab Ringkasan |
| **Input** | Deskripsi prospek, jawaban checklist pertanyaan, nilai estimasi, data historis customer (jika ada — terhubung ke Customer Insight) |
| **Output** | Analisis naratif: kekuatan/kelengkapan informasi prospek, area yang perlu klarifikasi, perbandingan kasar dengan prospek sejenis sebelumnya (jika data historis tersedia) |
| **Penempatan UI** | Panel di Tab Ringkasan Detail Prospek |
| **Role yang Dapat Mengakses** | PM, Admin |

### 3.5 Customer Insight

| Aspek | Detail |
|---|---|
| **Tujuan** | Memberikan gambaran riwayat dan karakteristik customer berdasarkan data historis proyek di sistem |
| **Trigger** | Tombol "Lihat Insight" di halaman Master Customer / Detail Customer |
| **Input** | Riwayat proyek customer tersebut (jumlah proyek, win rate dengan customer ini, nilai rata-rata, kategori proyek yang sering diajukan) |
| **Output** | Narasi insight, mis. *"Customer ini memiliki riwayat 8 proyek dengan win rate 62%, didominasi kategori konstruksi. Nilai rata-rata proyek Rp 1,2 miliar."* |
| **Penempatan UI** | Panel di Detail Customer (perluasan dari 021 Master Customer) |
| **Role yang Dapat Mengakses** | PM, Management, Admin |
| **Ketergantungan Data** | Membutuhkan data historis minimal (mis. 3 proyek selesai) untuk insight bermakna; jika data kurang, tampilkan pesan "Belum cukup data historis untuk insight" — **bukan** memanggil AI dengan data minim yang berisiko menghasilkan insight tidak akurat |

### 3.6 Competitor Analysis

| Aspek | Detail |
|---|---|
| **Tujuan** | Memberikan insight pola kompetitor berdasarkan data historis (mendukung resolusi GAP20) |
| **Trigger** | Tombol "Analisis Kompetitor" di Master Competitor / Tab Kompetitor proyek |
| **Input** | Data historis `project_competitors` — frekuensi kompetitor muncul, frekuensi menang, segmen/kategori proyek |
| **Output** | Narasi insight, mis. *"Kompetitor A muncul di 15 tender tahun ini dan memenangkan 9, didominasi pada kategori IT dengan nilai di atas Rp 1 miliar."* |
| **Penempatan UI** | Panel di Master Competitor Module dan Dashboard widget Competitive Analysis (050) |
| **Role yang Dapat Mengakses** | Management, Admin |
| **Fase** | Fase 1 untuk insight dasar; analitik mendalam (segmentasi otomatis) — Fase 3 sesuai roadmap GAP20 |

### 3.7 Meeting Summary *(Fase 2, Inferred Scope — lihat §2.1)*

| Aspek | Detail |
|---|---|
| **Tujuan** | Meringkas catatan/transkrip rapat terkait proyek yang diupload sebagai dokumen |
| **Trigger** | Tombol "Ringkas Catatan Rapat" pada dokumen bertipe "Catatan Rapat" di Tab Dokumen proyek |
| **Input** | Teks dokumen catatan rapat |
| **Output** | Poin-poin keputusan dan tindak lanjut (action items) yang teridentifikasi dari catatan |
| **Penempatan UI** | Tab Dokumen, opsi kontekstual pada dokumen bertipe catatan rapat |
| **Role yang Dapat Mengakses** | Seluruh role dengan akses ke proyek tersebut |

### 3.8 KPI Insight

| Aspek | Detail |
|---|---|
| **Tujuan** | Membantu Management memahami **mengapa** suatu cabang/divisi mencapai atau tidak mencapai target, bukan hanya angka mentah |
| **Trigger** | Tombol "Insight AI" di halaman Progress Monitoring (045) |
| **Input** | Data target vs realisasi per KPI, tren beberapa periode terakhir, breakdown per cabang/divisi |
| **Output** | Narasi analisis, mis. *"Win rate Cabang Surabaya turun 8% dibanding kuartal lalu, terutama disebabkan peningkatan jumlah tender yang kalah pada kategori konstruksi. Jumlah tender yang disubmit tetap stabil."* |
| **Penempatan UI** | Panel di halaman Progress Monitoring & Scoring (045) |
| **Role yang Dapat Mengakses** | Management, Admin |

### 3.9 Executive Dashboard Summary

| Aspek | Detail |
|---|---|
| **Tujuan** | Memberikan ringkasan naratif kondisi bisnis secara keseluruhan saat Management membuka dashboard, tanpa harus menafsirkan banyak widget satu per satu |
| **Trigger** | Otomatis saat Dashboard dimuat oleh role Management/Admin (dengan cache untuk menghindari pemanggilan berulang) |
| **Input** | Ringkasan data seluruh widget dashboard (pipeline value, win rate, approval pending, proyek at-risk) |
| **Output** | Paragraf ringkas di bagian atas dashboard, mis. *"Pipeline aktif saat ini senilai Rp 18 miliar dengan 3 proyek berisiko mendekati deadline. Win rate bulan ini 54%, naik dari 48% bulan lalu."* |
| **Penempatan UI** | Card khusus di bagian paling atas Dashboard (050), di atas grid widget |
| **Role yang Dapat Mengakses** | Management, Admin |
| **Strategi Cache** | Di-generate ulang maksimum setiap 1 jam atau saat data dashboard berubah signifikan, untuk mengontrol biaya (lihat 010 §11 Cost Control) |

### 3.10 Smart Search

| Aspek | Detail |
|---|---|
| **Tujuan** | Pencarian berbasis maksud (intent), bukan hanya pencocokan kata kunci literal — mis. user mengetik "tender yang hampir deadline di Surabaya" dan sistem memahami maksud filter status+lokasi+waktu |
| **Trigger** | Search bar global di Topbar (perluasan dari struktur navigasi di 012) |
| **Input** | Query teks bebas dari user |
| **Output** | Daftar hasil relevan (proyek, prospek, customer) dengan ranking berdasarkan kecocokan semantik (memanfaatkan `generateEmbedding()` dari Provider Adapter — lihat 010 §3.3) |
| **Penempatan UI** | Dropdown hasil pencarian di bawah search bar Topbar |
| **Role yang Dapat Mengakses** | Seluruh role (hasil tetap difilter sesuai scope data masing-masing role) |
| **Catatan Teknis** | Memerlukan indexing embedding terhadap entitas yang dapat dicari (proyek, prospek, customer) — strategi indexing didetailkan di 055 |

### 3.11 Future AI Recommendations

| Aspek | Detail |
|---|---|
| **Tujuan** | Payung untuk kapabilitas AI lanjutan yang divalidasi nilai bisnisnya setelah Fase 1 berjalan |
| **Contoh Kandidat** | Rekomendasi otomatis kompetitor yang perlu diwaspadai untuk tender baru; saran penyesuaian harga penawaran berdasarkan pola historis win/loss; deteksi anomali pada data proyek (mis. nilai penawaran jauh di luar pola historis) |
| **Fase** | Fase 2/3, didesain tingkat tinggi di 064 (Future Enhancement Roadmap) |
| **Prasyarat** | Volume data historis yang cukup besar dari operasional Fase 1 untuk melatih/memvalidasi pola rekomendasi |

---

## 4. PRINSIP UMUM LINTAS FITUR AI

1. **Tidak ada fitur AI yang menggantikan keputusan bisnis manusia.** Seluruh output AI bersifat pendukung keputusan (decision support), bukan otomatisasi keputusan (decision automation) di Fase 1.
2. **Setiap output AI diberi label visual jelas** sesuai 010 §15.
3. **Fitur AI gagal secara graceful.** Jika AI tidak tersedia, fitur inti (input data, approval, dst.) tetap berfungsi normal.
4. **Akses fitur AI dapat dikontrol granular per role** melalui Role & Permission Module (017), bukan all-or-nothing.

---

## 5. KETERKAITAN DENGAN BUSINESS GOAL

| Fitur AI | Business Goal Terkait |
|---|---|
| RKS/LPHS/Tender Summary | BG-08 (Inferred) — mempercepat pemahaman dokumen |
| Executive Dashboard Summary, KPI Insight | BG-07 (Inferred) — basis objektif evaluasi performa |
| Competitor Analysis | GAP20 — analitik kompetitor lintas proyek |
| Smart Search | BG-03 — meningkatkan visibilitas/akses informasi proyek |
