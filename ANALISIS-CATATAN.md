# Analisis Catatan & Rekomendasi - Kinetic CRM

## A. Integrasi Google Forms → Sistem

### Status Saat Ini
- Backend sudah memiliki endpoint `POST /gform/webhook` di `backend/src/gform/`
- Mapping field: `nama_customer` → `Customer.name`, `level` → `Customer.level` (hot/medium/low)
- Auto-create Customer + Prospect dengan `source: 'Google Form'`
- Validasi via `x-api-key` dari `IntegrationConfiguration`

### Rekomendasi
1. **Buat UI untuk mapping field Google Form** - Agar admin bisa mapping field form tanpa coding
2. **Sinkronisasi Google Sheet** - Tidak hanya webhook, tapi juga bisa polling dari Google Sheet per cabang
3. **Real-time notification** - Ketika data masuk dari Google Form, notifikasi ke user terkait
4. **Duplicate handling** - Perbaiki deduplikasi customer (saat ini hanya by name, perlu by phone/email juga)
5. **Error logging** - Jika webhook gagal, log detail kenapa gagal

## B. Simplifikasi Prospek

### Masalah
Prospek saat ini menangkap terlalu banyak detail di tahap awal, padahal belum ada niat kerja sama.

### Rekomendasi
1. **Prospek Minimum:** Cukup 3 field wajib:
   - Nama Customer
   - Nama Aset
   - Kategori (Hot / Medium / Low)
2. **Conditional Detail:** Jika kategori Hot atau Medium → baru munculkan form detail project
3. **Hapus mandatory** untuk tipe project, lokasi detail, dll dari prospek awal
4. **Implementasi:** Tambahkan logika di frontend `ProspectQualificationPage` untuk conditional rendering

## C. Masalah LPHS (Prioritas Tinggi)

### Masalah dari Pak Fadhil
1. **Lama upload LPHS** - Tidak ada optimasi upload, file besar lambat
2. **Lama ke customer** - Tidak ada mekanisme notifikasi otomatis ke customer setelah LPHS selesai

### Rekomendasi
1. **Upload Optimasi:**
   - Progress bar upload (feedback visual)
   - Chunked upload untuk file >50MB
   - Kompresi file sebelum upload
   - Upload paralel untuk multiple files
   - Timeout handling untuk file besar
2. **Auto-notifikasi Customer:**
   - Tambahkan field email customer di project
   - Auto-send email saat LPHS final approved
   - Template notifikasi status LPHS
3. **Fokus Existing:** Prioritaskan penyelesaian LPHS yang tertahan sebelum fitur baru

## D. Upload File RKS >50MB

### Status Saat Ini
- Config default: 10MB via `UploadConfig` model
- Backend menggunakan `multer` dengan limit default

### Rekomendasi
1. **Ubah konfigurasi max file size** di `UploadConfig` → set `maxFileSizeMb: 100`
2. **Update backend:**
   - `multer` limit di `FileInterceptor` → `limits: { fileSize: 100 * 1024 * 1024 }`
   - Nginx `client_max_body_size` → 100M (jika pakai Nginx)
3. **Frontend:**
   - Validasi client-side untuk file size
   - Upload progress bar
   - Warning jika file >50MB (estimasi waktu upload)

## E. Simplifikasi Waktu Penginputan

### Masalah
Pengguna merasa input terlalu panjang dan memakan waktu.

### Rekomendasi
1. **Progress indicator** di setiap step (menunjukkan % progress)
2. **Save draft otomatis** (sebagian sudah ada di RKS dengan debounce)
3. **Batch input** - Bisa input beberapa data sekaligus
4. **Template/default values** untuk field yang sering sama
5. **Single form completion target** - Ukur waktu rata-rata per step

## F. Review RKS Multi-Divisi

### Masalah
- Saat ini review RKS hanya dilakukan oleh PM
- Setiap divisi perlu punya pertanyaan yang diajukan
- Perlu tanggung jawab bersama

### Status Saat Ini
- RKS review: hanya PM approve/revision (`ReviewRksTab.tsx`)
- LPHS review: sudah multi-department parallel review

### Rekomendasi
1. **Adaptasi mekanisme LPHS review untuk RKS:**
   - Tambahkan `RksDepartmentReview` model (analog dengan `LphsDepartmentReview`)
   - Setiap divisi terkait mendapat notifikasi untuk review RKS
   - Masing-masing divisi punya form pertanyaan yang bisa diajukan
2. **Template question per divisi:**
   - Tambahkan `departmentId` di master `Question` model
   - Filter pertanyaan berdasarkan divisi user
3. **Review bersama:**
   - Dashboard yang menampilkan status review semua divisi
   - Approval hanya jika semua divisi sudah approve

## G. Template Question Fleksibel per Role/Divisi

### Masalah
Question saat ini bersifat global per context (rks, prospect, both), tidak bisa dibedakan per role/divisi.

### Rekomendasi
1. **Tambahkan relasi Question ke Role dan Department:**
   - `questionRoles: QuestionRole[]` (many-to-many dengan Role)
   - `questionDepartments: QuestionDepartment[]` (many-to-many dengan Department)
2. **Filter by role/department** saat rendering question
3. **Fleksibel override** - Admin bisa set question spesifik untuk role tertentu

## H. Review UX & Alur

### Masalah
Step terlalu panjang (11 tab project), tujuan memudahkan tapi malah panjang.

### Rekomendasi
1. **Progress stepper** di bagian atas project detail
2. **Hide tab yang belum relevant** (misal: tab Harga tidak muncul sebelum LPHS selesai)
3. **Simplifikasi phase:**
   - Fase 1: Identifikasi (Nama customer, aset, level)
   - Fase 2: Persiapan (RHS/RKS + upload dokumen)
   - Fase 3: Review multi-divisi
   - Fase 4: Pricing & Tender
   - Fase 5: Delivery
4. **Wizard mode** - Alur step-by-step ketimbang tabs

## I. Standarisasi

### Masalah
Belum ada standarisasi antar cabang.

### Rekomendasi
1. **Template project** - Template RHS/RKS standar yang bisa dipakai semua cabang
2. **SOP digital** - Workflow yang terstandarisasi di sistem
3. **Required fields** per phase yang konsisten
4. **Approval matrix** yang seragam

## J. Beban Cabang vs Birokrasi

### Masalah
Terlalu banyak approval step bisa menyebabkan kalah tender karena lambat.

### Rekomendasi
1. **Parallel approval** (bukan sequential) untuk review multi-divisi
2. **SLA auto-approve** - Jika tidak direview dalam X hari, auto-approve
3. **Delegation** - User bisa delegate approval ke user lain
4. **Threshold-based approval** - Nilai project tertentu langsung ke level tertentu
5. **Timer untuk setiap stage** - Tracking berapa lama di setiap stage

## K. Setiap Project Baru Harus Terecord

### Status Saat Ini
- Project membuat entri di database dengan status/phase
- Ada timeline events untuk setiap perubahan
- Audit trail sudah ada

### Rekomendasi
1. **Auto-create project log** setiap kali ada project baru
2. **Dashboard monitoring** untuk management melihat semua project baru
3. **Notifikasi** ke branch manager dan director saat project baru dibuat
4. **Report periodik** untuk review project pipeline

## L. Kesimpulan Prioritas

| Prioritas | Item | Dampak |
|-----------|------|--------|
| **P0** | Upload LPHS >50MB + progress bar | Blocker utama (file besar) |
| **P0** | Review RKS multi-divisi | Tanggung jawab bersama |
| **P1** | Simplifikasi prospek (nama, aset, level) | Efisiensi input |
| **P1** | Google Form integration polish | Otomatisasi data |
| **P1** | Standarisasi antar cabang | Konsistensi |
| **P2** | Conditional form (hot/medium → detail) | UX improvement |
| **P2** | Auto-notifikasi customer | Response time |
| **P2** | Template question per role/divisi | Fleksibilitas |
| **P3** | Dashboard birokrasi tracking | Monitoring |
| **P3** | SLA auto-approve | Kecepatan tender |
