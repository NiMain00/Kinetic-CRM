# 049 — DOCUMENT VERSIONING MODULE
## KINETIC CRM — Modul Versioning Dokumen

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 049 |
| **Nama Dokumen** | Document Versioning Module |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Klasifikasi** | Confidential / Internal |
| **Sumber Utama** | BA Review STMS v1.0 |
| **Sumber Sekunder** | 000_DOCUMENT_INDEX.md, FE Spec STMS v1.0 |
| **Dokumen Terkait** | 048 (Document Upload & Storage Module — fondasi penyimpanan fisik), 022 (Master Tipe Dokumen), 052 (Audit Trail Module), 014 (UI Screen Catalog), 057 (API Endpoint Specification) |
| **Status** | Final — Siap Digunakan |

**Dibaca oleh:** Backend Developer, Frontend Developer, Business Analyst, QA Engineer

---

## 1. PURPOSE

Modul ini menyelesaikan **GAP-14** dari BA Review: pada desain lama, mengunggah ulang dokumen ke entitas yang sama tidak jelas apakah dimaksudkan sebagai *replace* (menimpa) atau *versi baru* (riwayat dipertahankan). Akibatnya, reviewer berisiko meninjau dokumen yang sudah usang tanpa sadar bahwa versi tersebut bukan yang terbaru, atau sebaliknya, kehilangan jejak dokumen versi sebelumnya yang mungkin diperlukan untuk audit.

BA Review menetapkan rekomendasi tindakan secara eksplisit: **tabel `documents` dengan `version_number`; upload ulang = versi baru, bukan overwrite**. Modul ini mendesain penuh mekanisme tersebut: bagaimana versi baru dibuat, bagaimana versi aktif ditentukan, bagaimana riwayat versi ditampilkan, dan aturan bisnis yang membatasi siapa boleh membuat versi baru dalam konteks apa.

Modul ini **bergantung langsung** pada fondasi yang sudah didesain di **048_DOCUMENT_UPLOAD_STORAGE_MODULE** — kolom `version_number` dan `is_current_version` pada tabel `documents`, serta seluruh aturan storage/validasi/keamanan di 048, tetap berlaku penuh untuk setiap versi dokumen. Modul ini **tidak mendefinisikan ulang** tabel `documents`, melainkan menambahkan logika di atasnya.

---

## 2. SCOPE

### In Scope

- Definisi apa yang dianggap "dokumen yang sama" untuk keperluan versioning (version grouping key)
- Alur pembuatan versi baru saat upload ulang
- Penentuan versi aktif (`is_current_version`) dan implikasinya terhadap tampilan default
- Model data tambahan untuk riwayat versi (jika diperlukan di luar yang sudah ada di 048)
- UI behavior histori versi (accordion per file, badge versi) — selaras dengan referensi 014
- Business rules: siapa boleh membuat versi baru, kapan versi lama tidak boleh dihapus
- Strategi retensi versi lama (apakah dihapus, berapa lama disimpan)
- API contract untuk melihat riwayat versi dan mengunduh versi tertentu (bukan hanya versi terbaru)

### Out of Scope

- Mekanisme upload, validasi MIME/ukuran, storage fisik, dan download dasar → **048_DOCUMENT_UPLOAD_STORAGE_MODULE.md** (didesain penuh di sana, dirujuk di sini)
- Klasifikasi tipe dokumen → **022_MASTER_PROJECT_STATUS_AND_DOCUMENT_TYPE.md**
- Tampilan detail layar Tab Dokumen → **014_UI_SCREEN_CATALOG.md**

---

## 3. GAP TRACEABILITY

| Referensi | Deskripsi (dari BA Review) | Bagaimana Diselesaikan |
|---|---|---|
| **GAP-14** | "Tidak ada versioning dokumen: upload ulang tidak jelas apakah replace atau versi baru" — Klasifikasi: Minor | Bagian 5 (Version Creation Flow): setiap upload ulang ke konteks yang sama otomatis membuat baris baru dengan `version_number` bertambah, versi lama dipertahankan |
| **Rekomendasi BA Review** | "Tabel `documents` dengan `version_number`; upload ulang = versi baru, bukan overwrite" | Diimplementasikan tepat sesuai rekomendasi — lihat Bagian 4 dan 5 |

---

## 4. DATA MODEL

### 4.1 Version Grouping Key

Agar sistem mengetahui dokumen mana yang merupakan "versi dari dokumen yang sama", dibutuhkan satu identitas yang stabil lintas-versi — karena `documents.id` di 048 bersifat unik **per baris/per versi**, bukan per "dokumen logis".

Kolom tambahan pada tabel `documents` (memperluas skema 048, bukan menggantinya):

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `document_group_id` | UUID | NOT NULL | Identitas stabil yang sama untuk seluruh versi dari "dokumen logis" yang sama. Di-generate baru saat versi pertama diunggah, lalu disalin ke setiap versi berikutnya |
| `replaced_document_id` | UUID | FK → `documents.id`, NULLABLE | Menunjuk ke baris versi sebelumnya secara langsung (linked list), memudahkan penelusuran "versi sebelum ini" tanpa query agregat |
| `replaced_reason` | VARCHAR(255) | NULLABLE | Catatan opsional dari uploader saat mengganti versi (mis. "revisi setelah catatan PM") |

**Business Rule BR-VER-01:** `document_group_id` ditentukan oleh kombinasi `(owner_type, owner_id, document_type_id)` pada saat upload pertama untuk konteks tersebut — bukan oleh nama file. Dua file dengan nama berbeda yang diunggah ke `owner_type` + `owner_id` + `document_type_id` yang identik dianggap sebagai versi dari dokumen logis yang sama, **kecuali** konteksnya adalah Tab Dokumen dengan kategori "Lainnya" (lihat BR-VER-02).

**Business Rule BR-VER-02 (pengecualian Tab Dokumen kategori Lainnya):** Untuk upload melalui Tab Dokumen dengan `document_type_id` = "Lainnya" (`OTHER`), setiap upload **selalu** dianggap dokumen logis baru (mendapat `document_group_id` baru), bukan versi dari dokumen lain — karena pada konteks ini tidak ada batasan satu dokumen per kombinasi owner+tipe (user bisa mengunggah banyak lampiran lepas berbeda-beda dengan tipe "Lainnya" pada proyek yang sama, dan tidak ada cara otomatis menyimpulkan mana yang "menggantikan" mana). Pengelompokan versi untuk kategori ini hanya terjadi jika user secara eksplisit memilih aksi "Unggah versi baru" pada salah satu dokumen lampiran yang sudah ada — bukan otomatis berdasarkan kombinasi owner+tipe.

### 4.2 Relasi Antar Versi

```
document_group_id = G1
┌─────────────────────────────────────────────────────┐
│  v1 (is_current_version=false, replaced_document_id=NULL)
│       ↓ replaced_document_id menunjuk balik
│  v2 (is_current_version=false, replaced_document_id=v1.id)
│       ↓
│  v3 (is_current_version=true,  replaced_document_id=v2.id)  ← versi aktif
└─────────────────────────────────────────────────────┘
```

**Business Rule BR-VER-03:** Tepat satu baris per `document_group_id` yang boleh memiliki `is_current_version = true` pada satu waktu. Konsistensi ini ditegakkan secara atomik di service layer: saat versi baru dibuat, update `is_current_version = false` pada versi sebelumnya dan `is_current_version = true` pada versi baru terjadi dalam satu transaksi database.

---

## 5. VERSION CREATION FLOW

### 5.1 Alur End-to-End (Upload Ulang)

```
1. User memicu aksi "Unggah versi baru" pada dokumen yang sudah ada
   (bukan aksi "Unggah dokumen baru" generik — lihat perbedaan UI di Bagian 7)
2. FE kirim POST /api/documents/:id/new-version (multipart/form-data)
   :id = id dokumen versi saat ini (current version)
3. BE jalankan seluruh validasi upload dari 048 Bagian 6 terhadap file baru
   (ukuran, MIME-sniffing, tipe file — tidak ada pengecualian validasi untuk versi baru)
4. BE validasi tambahan khusus versioning:
   a. Dokumen :id harus is_current_version = true (tidak bisa membuat versi baru dari versi yang sudah usang)
   b. owner_type+owner_id dari dokumen :id harus masih dalam status yang mengizinkan perubahan
      (selaras 013_GLOBAL_STATE_MACHINE_REFERENCE — aturan sama dengan 048 BR-DOC-04 baris status)
5. BE mulai transaksi:
   a. Simpan file baru ke storage (mengikuti strategi penyimpanan 048 Bagian 7 secara penuh)
   b. Insert baris documents baru: document_group_id = grup versi sebelumnya,
      version_number = version_number lama + 1, replaced_document_id = :id,
      is_current_version = true
   c. Update baris documents lama (:id): is_current_version = false
   d. Commit transaksi
6. BE tulis audit log: DOCUMENT_VERSION_CREATED (mencatat versi lama & baru)
7. BE return 201 dengan metadata versi baru (termasuk versionNumber)
8. FE perbarui tampilan: versi baru jadi yang ditampilkan utama, versi lama pindah ke histori (accordion)
```

**Business Rule BR-VER-04:** Jika langkah 5 gagal di titik mana pun, seluruh transaksi di-rollback — termasuk file fisik yang baru disimpan, sehingga tidak pernah ada kondisi dua versi sama-sama `is_current_version = true` atau file orphan tanpa baris DB (konsisten dengan prinsip atomicity 048 BR-DOC-05).

### 5.2 Perbedaan dengan Upload Dokumen Baru (048)

| Aspek | Upload Baru (048) | Upload Versi Baru (049) |
|---|---|---|
| Endpoint | `POST /api/documents/upload` | `POST /api/documents/:id/new-version` |
| `document_group_id` | Di-generate baru | Disalin dari versi yang digantikan |
| `version_number` | Selalu `1` | `version_number` versi sebelumnya + 1 |
| Dampak ke versi lain | Tidak ada | Versi sebelumnya berubah `is_current_version` jadi `false` |
| Validasi tambahan | — | Versi sumber harus berstatus current (BR-VER-04 langkah 4a) |

---

## 6. BUSINESS RULES TAMBAHAN

**Business Rule BR-VER-05 (siapa boleh membuat versi baru):** Hak untuk mengunggah versi baru mengikuti hak yang sama dengan hak upload dokumen pada konteks aslinya (lihat 048 Bagian 5.2 dan Bagian 6.4) — tidak ada role tambahan khusus untuk versioning. Misalnya, hanya Cabang yang dapat mengunggah versi baru dokumen RKS, sama seperti hanya Cabang yang dapat mengunggah RKS pertama kali.

**Business Rule BR-VER-06 (versi lama tidak pernah dihapus otomatis):** Versi non-current **tidak pernah** dihapus (baik soft-delete maupun hard-delete) secara otomatis oleh sistem. Versi lama tetap dapat diunduh dan diaudit selama dokumen induk belum mengalami soft-delete eksplisit oleh pengguna berwenang. Ini penting secara bisnis karena reviewer (PM, Dept, Management) mungkin perlu menelusuri perubahan dokumen antar revisi sebagai bagian dari audit kualitas tender.

**Business Rule BR-VER-07 (retensi versi):** Tidak ada batas jumlah versi per dokumen logis di Fase 1. Kebijakan retensi/arsip otomatis untuk versi yang sudah sangat lama ditandai sebagai topik Fase 2+ dan tidak didesain di dokumen ini.

**Business Rule BR-VER-08 (penghapusan dokumen logis):** Soft-delete (`DELETE /api/documents/:id`, sesuai kontrak 048 Bagian 10) terhadap versi current akan menandai **seluruh versi dalam `document_group_id` yang sama** sebagai `is_deleted = true` — bukan hanya versi current. Ini karena dari sudut pandang bisnis, "menghapus dokumen" berarti menghapus dokumen logis beserta seluruh riwayatnya, bukan menyisakan versi lama yang "yatim" tanpa versi current.

---

## 7. UI BEHAVIOR — HISTORI VERSI

Sesuai dengan keputusan FE Spec sumber pada Tab Dokumen (referensi 014, SUB-SCREEN PROJ-03j): setiap file dalam daftar dokumen menampilkan **badge versi** jika `version_number` lebih dari 1, dan histori versi dapat dibuka melalui **expand accordion per file** — modul ini tidak mendefinisikan ulang detail visual tersebut, hanya memastikan data yang dikonsumsi tampilan tersebut tersedia dan konsisten:

| Elemen UI | Sumber Data |
|---|---|
| Badge "v{N}" pada baris dokumen | `version_number` dari baris dengan `is_current_version = true` dalam `document_group_id` tersebut |
| Daftar dalam accordion histori | Semua baris dalam `document_group_id` yang sama, diurutkan `version_number` DESC |
| Tombol "Unggah versi baru" | Hanya tampil jika user memiliki hak sesuai BR-VER-05 **dan** status entitas induk mengizinkan perubahan |
| Tombol download per versi dalam histori | Memanggil `GET /api/documents/:id/download` (048) dengan `:id` versi spesifik yang dipilih, bukan selalu versi current |

**Inferred Requirement (IR-049-01):** FE Spec sumber menyebutkan "histori versi: expand accordion per file" sebagai perilaku UI namun tidak merinci apakah versi lama dapat diunduh langsung dari accordion tersebut atau hanya dapat dilihat metadatanya. Mengingat BR-VER-06 menetapkan versi lama tetap tersimpan dan dapat diaudit, kemampuan mengunduh versi lama secara langsung ditetapkan sebagai requirement wajib — jika tidak, mempertahankan versi lama tanpa cara mengaksesnya tidak memberikan nilai bisnis (dasar gap GAP-14 itu sendiri adalah kebutuhan ketertelusuran).

---

## 8. API CONTRACT SUMMARY

Kontrak lengkap di **057_FULL_API_ENDPOINT_SPECIFICATION.md**; ringkasan orientasi:

| Method | Endpoint | Tujuan | Role |
|---|---|---|---|
| POST | `/api/documents/:id/new-version` | Unggah versi baru menggantikan dokumen `:id` sebagai current | Sesuai hak upload konteks asli (BR-VER-05) |
| GET | `/api/documents/:id/versions` | Daftar seluruh versi dalam `document_group_id` yang sama dengan `:id` | Sama dengan hak lihat dokumen tersebut |
| GET | `/api/documents/:id/download` | Download versi spesifik (berlaku untuk versi mana pun, current atau bukan) — kontrak sama dengan 048 | Sesuai scope (048 Bagian 8) |

**Response — `GET /api/documents/:id/versions`:**

```json
{
  "documentGroupId": "uuid",
  "versions": [
    {
      "id": "uuid-v3",
      "versionNumber": 3,
      "isCurrentVersion": true,
      "fileNameOriginal": "RKS_Tender_2025_rev3.pdf",
      "uploadedBy": { "id": "uuid", "name": "Nama User" },
      "uploadedAt": "2025-06-14T10:00:00Z",
      "replacedReason": "Revisi setelah catatan PM"
    },
    {
      "id": "uuid-v2",
      "versionNumber": 2,
      "isCurrentVersion": false,
      "fileNameOriginal": "RKS_Tender_2025_rev2.pdf",
      "uploadedBy": { "id": "uuid", "name": "Nama User" },
      "uploadedAt": "2025-06-12T09:00:00Z",
      "replacedReason": null
    }
  ]
}
```

---

## 9. ACCEPTANCE CRITERIA

| # | Kriteria |
|---|---|
| AC-049-01 | Mengunggah file baru ke konteks (owner_type+owner_id+document_type_id) yang sudah memiliki dokumen menghasilkan versi baru (`version_number` bertambah), bukan menimpa file lama |
| AC-049-02 | Setelah versi baru dibuat, tepat satu baris dalam `document_group_id` yang sama memiliki `is_current_version = true` |
| AC-049-03 | File fisik versi lama tetap ada di storage dan dapat diunduh melalui `GET /api/documents/:id/download` menggunakan id versi lama |
| AC-049-04 | Percobaan membuat versi baru dari id dokumen yang `is_current_version = false` ditolak (mencegah percabangan riwayat versi yang tidak linear) |
| AC-049-05 | Upload ke Tab Dokumen kategori "Lainnya" tanpa memilih aksi "Unggah versi baru" secara eksplisit selalu membuat dokumen logis baru, bukan versi tambahan dari dokumen lain |
| AC-049-06 | Soft-delete terhadap versi current menandai seluruh versi dalam `document_group_id` yang sama sebagai `is_deleted = true` |
| AC-049-07 | `GET /api/documents/:id/versions` mengembalikan seluruh versi terurut `version_number` menurun, termasuk versi non-current |
| AC-049-08 | Setiap pembuatan versi baru tercatat di audit log dengan referensi jelas ke versi yang digantikan |
| AC-049-09 | Hak untuk mengunggah versi baru mengikuti hak upload pada konteks asli (role yang tidak berhak upload RKS tidak berhak mengunggah versi baru RKS) |
| AC-049-10 | Seluruh validasi ukuran/tipe file dari 048 tetap berlaku penuh pada setiap upload versi baru, tanpa pengecualian |

---

*Dokumen ini adalah versi 1.0 dari 049 Document Versioning Module untuk KINETIC CRM.*
*Cross-reference dengan dokumen: 048 (Document Upload & Storage Module), 022 (Master Tipe Dokumen), 052 (Audit Trail), 013 (Global State Machine Reference), 057 (API Endpoint Specification).*

---
**Akhir Dokumen 049 — Document Versioning Module**
**KINETIC CRM | Confidential / Internal | Versi 1.0 | Juni 2025**
