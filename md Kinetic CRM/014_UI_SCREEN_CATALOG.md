# 014 — UI SCREEN CATALOG
## KINETIC CRM — Katalog Lengkap Layar Sistem

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 014 |
| **Nama Dokumen** | UI Screen Catalog |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Klasifikasi** | Confidential / Internal |
| **Sumber Utama** | BA Review STMS v1.0 |
| **Sumber Sekunder** | PRD STMS v1.0, FE Spec STMS v1.0 |
| **Status** | Final — Siap Digunakan |

**Dibaca oleh:** Business Analyst, Product Owner, UI/UX Designer, Frontend Developer, Backend Developer, QA Engineer, Project Manager, Technical Writer

---

## 1. PURPOSE

Dokumen ini adalah **katalog resmi dan otoritatif** seluruh layar (screen) yang ada dalam sistem KINETIC CRM. Setiap entri dalam katalog ini mendefinisikan secara lengkap:

- Identitas dan tujuan bisnis layar
- Role pengguna yang dapat mengakses
- Path URL dan entry point navigasi
- Komponen UI yang digunakan
- Aksi yang dapat dilakukan dari layar tersebut
- Aturan validasi yang berlaku
- API endpoint yang menjadi sumber data
- Perilaku loading, empty, dan error state
- Matrix permission per role
- Business rules yang berlaku
- Referensi GAP, CFG, dan MD dari BA Review
- Perilaku responsif di mobile/tablet/desktop
- Persyaratan aksesibilitas

Dokumen ini menjadi **satu sumber kebenaran (single source of truth)** untuk semua pihak yang terlibat dalam desain, implementasi, dan pengujian antarmuka KINETIC CRM. Setiap perubahan pada layar sistem harus tercermin dalam dokumen ini.

---

## 2. SCOPE

### In Scope

Seluruh layar yang dapat diakses oleh pengguna KINETIC CRM dalam Fase 1, mencakup:

- Modul Autentikasi (Login, Manajemen Sesi)
- Dashboard (per role)
- Modul Prospek (Daftar, Form, Detail)
- Modul Proyek (Daftar, Detail dengan seluruh tab)
- Approval Inbox (Daftar, Review Drawer)
- Modul Master Data (Customer, Departemen, Pertanyaan, Pengguna)
- Modul Konfigurasi (Organisasi, Workflow, Status, Role, SLA, Notifikasi, Tipe Pertanyaan)
- Modul Laporan (Win/Loss, Pipeline)
- Modul Audit Log
- Halaman Error (403, 404, 500)
- Halaman Profil Pengguna
- Notifikasi In-App

### Out of Scope (Fase 2 / Fase 3)

- SSO / Active Directory / Google Workspace login
- Notifikasi Email dan WhatsApp eksternal
- Approval one-click via email link
- Progressive Web App (PWA)
- Analitik Kompetitor Dashboard lanjutan
- Modul Contract Management
- BI Dashboard & Data Warehouse
- API Public untuk integrasi ERP/CRM

---

## 3. SCREEN CLASSIFICATION

### 3.1 Klasifikasi berdasarkan Kategori Fungsional

| Kode Kategori | Nama Kategori | Jumlah Screen |
|---|---|---|
| **AUTH** | Autentikasi & Sesi | 3 |
| **DASH** | Dashboard | 1 (multi-role) |
| **PROS** | Modul Prospek | 3 |
| **PROJ** | Modul Proyek | 3 (+ 10 tab sub-screen) |
| **APPR** | Approval Inbox | 2 |
| **MAST** | Master Data | 5 |
| **CONF** | Konfigurasi Sistem | 7 |
| **REPT** | Laporan & Reporting | 2 |
| **AUDT** | Audit Log | 1 |
| **NOTF** | Notifikasi | 1 |
| **PROF** | Profil Pengguna | 1 |
| **ERRR** | Halaman Error | 3 |
| **TOTAL** | | **33 Screen Utama + 10 Sub-Screen Tab** |

### 3.2 Klasifikasi berdasarkan Tipe Interaksi

| Tipe | Deskripsi | Contoh |
|---|---|---|
| **List Screen** | Menampilkan daftar entitas dengan filter dan pagination | Daftar Prospek, Daftar Proyek |
| **Detail Screen** | Menampilkan detail satu entitas dengan panel-panel | Detail Prospek, Detail Proyek |
| **Form Screen** | Full-page form untuk membuat atau mengedit entitas | Form Prospek, Form Proyek |
| **Dashboard Screen** | Agregasi widget data monitoring | Dashboard per role |
| **Configuration Screen** | Layar konfigurasi sistem oleh admin | Config Org, Config Workflow |
| **Report Screen** | Laporan dengan chart dan export | Laporan Win/Loss |
| **Utility Screen** | Layar sistem (login, error, notif) | Login, 403, 404 |

### 3.3 Klasifikasi berdasarkan Hak Akses

| Level Akses | Role | Keterangan |
|---|---|---|
| **Public** | Siapa saja (belum login) | Hanya halaman Login |
| **Authenticated** | Semua role yang sudah login | Dashboard, Proyek (scope berbeda) |
| **Cabang Only** | Role `cabang` | Buat/Edit Prospek, Submit RKS |
| **PM Only** | Role `pm` | Approval Prospek, Approval RKS |
| **Dept Only** | Role `department` | Approval LPHS per departemen |
| **Management Only** | Role `management` | Final approval LPHS, Laporan |
| **Admin Only** | Role `admin` | Semua + Konfigurasi, Master Data, Audit |

---

## 4. NAVIGATION HIERARCHY

### 4.1 Sitemap Lengkap

```
KINETIC CRM
├── /login                              [AUTH-01] Login
│
├── /dashboard                          [DASH-01] Dashboard (konten per role)
│
├── /prospects                          [PROS-01] Daftar Prospek
│   ├── /prospects/new                  [PROS-02] Form Buat Prospek
│   └── /prospects/:id                  [PROS-03] Detail Prospek
│       └── /prospects/:id/edit         [PROS-02b] Form Edit Prospek (reuse form)
│
├── /projects                           [PROJ-01] Daftar Proyek
│   ├── /projects/new                   [PROJ-02] Form Buat Proyek
│   └── /projects/:id                   [PROJ-03] Detail Proyek
│       ├── Tab: Overview               [PROJ-03a]
│       ├── Tab: RKS                    [PROJ-03b]
│       ├── Tab: Review RKS             [PROJ-03c]
│       ├── Tab: LPHS/SIOS              [PROJ-03d]
│       ├── Tab: Harga                  [PROJ-03e]
│       ├── Tab: Kompetitor             [PROJ-03f]
│       ├── Tab: Pemenang               [PROJ-03g]
│       ├── Tab: Target Delivery        [PROJ-03h]
│       ├── Tab: Timeline               [PROJ-03i]
│       └── Tab: Dokumen                [PROJ-03j]
│
├── /approvals                          [APPR-01] Approval Inbox
│   └── → Drawer Review                 [APPR-02] Review Drawer (overlay)
│
├── /reports                            [REPT-01] Laporan Win/Loss
│   └── /reports/pipeline               [REPT-02] Laporan Pipeline
│
├── /master
│   ├── /master/customers               [MAST-01] Master Customer
│   ├── /master/departments             [MAST-02] Master Departemen
│   ├── /master/questions               [MAST-03] Master Pertanyaan
│   └── /master/competitors             [MAST-04] Master Kompetitor
│
├── /config
│   ├── /config/org                     [CONF-01] Konfigurasi Organisasi
│   ├── /config/workflow                [CONF-02] Konfigurasi Approval Workflow
│   ├── /config/statuses                [CONF-03] Konfigurasi Status Proyek
│   ├── /config/roles                   [CONF-04] Konfigurasi Role & Permission
│   ├── /config/sla                     [CONF-05] Konfigurasi SLA & Escalation
│   ├── /config/notifications           [CONF-06] Konfigurasi Notifikasi
│   └── /config/question-types          [CONF-07] Konfigurasi Tipe Pertanyaan
│
├── /admin
│   ├── /admin/users                    [MAST-05] Manajemen Pengguna
│   └── /admin/audit-logs               [AUDT-01] Audit Log
│
├── /notifications                      [NOTF-01] Notifikasi (halaman penuh)
│   └── → Dropdown Panel                [NOTF-01a] Notif Dropdown (overlay topbar)
│
├── /profile                            [PROF-01] Profil Pengguna
│
└── /error
    ├── /403                            [ERRR-01] Akses Ditolak
    ├── /404                            [ERRR-02] Halaman Tidak Ditemukan
    └── /500                            [ERRR-03] Error Server
```

### 4.2 Sidebar Menu Visibility per Role

| Menu Item | Route | Cabang | PM | Dept | Mgmt | Admin |
|---|---|:---:|:---:|:---:|:---:|:---:|
| Dashboard | /dashboard | ✓ | ✓ | ✓ | ✓ | ✓ |
| Prospek | /prospects | ✓ | ✓ | — | — | ✓ |
| Proyek | /projects | ✓ | ✓ | ✓ | ✓ | ✓ |
| Approval Inbox | /approvals | — | ✓ | ✓ | ✓ | ✓ |
| Laporan | /reports | — | — | — | ✓ | ✓ |
| Master — Customer | /master/customers | — | — | — | — | ✓ |
| Master — Departemen | /master/departments | — | — | — | — | ✓ |
| Master — Pertanyaan | /master/questions | — | — | — | — | ✓ |
| Master — Kompetitor | /master/competitors | — | — | — | — | ✓ |
| Config — Organisasi | /config/org | — | — | — | — | ✓ |
| Config — Workflow | /config/workflow | — | — | — | — | ✓ |
| Config — Status | /config/statuses | — | — | — | — | ✓ |
| Config — Role & Akses | /config/roles | — | — | — | — | ✓ |
| Config — SLA | /config/sla | — | — | — | — | ✓ |
| Config — Notifikasi | /config/notifications | — | — | — | — | ✓ |
| Config — Tipe Pertanyaan | /config/question-types | — | — | — | — | ✓ |
| Pengguna | /admin/users | — | — | — | — | ✓ |
| Audit Log | /admin/audit-logs | — | — | — | — | ✓ |

**Catatan:**
- Approval Inbox hanya ditampilkan di sidebar jika ada pending approval > 0 (badge merah)
- Semua role memiliki akses ke /profile dan /notifications
- Scope data pada /projects dan /approvals berbeda per role meskipun route sama

### 4.3 Breadcrumb Rules

| Kedalaman | Pola Breadcrumb | Contoh |
|---|---|---|
| Level 1 (root) | Nama Modul | Dashboard |
| Level 2 | Nama Modul → Nama Item | Proyek → PR-2025-001 |
| Level 3 | Nama Modul → Nama Item → Sub-section | Proyek → PR-2025-001 → RKS |
| Config/Admin | Konfigurasi → Sub-menu | Konfigurasi → SLA & Eskalasi |

Breadcrumb ditampilkan di bawah Topbar untuk semua halaman ≥ level 2. Tidak ditampilkan pada halaman level 1 (Dashboard, Daftar Prospek, Daftar Proyek, dll.)

---

## 5. SCREEN INVENTORY

### Konvensi Format Entri Screen

Setiap screen didokumentasikan menggunakan format berikut:

```
Screen ID       : Kode unik screen
Screen Name     : Nama layar
Business Purpose: Tujuan bisnis layar
User Roles      : Role yang bisa mengakses
Route           : Path URL
Navigation EP   : Entry point navigasi
Components      : Komponen UI yang digunakan
Actions         : Aksi yang bisa dilakukan user
Validation      : Aturan validasi
API Deps        : API endpoint yang digunakan
Loading State   : Tampilan saat data sedang dimuat
Empty State     : Tampilan saat tidak ada data
Error State     : Tampilan saat terjadi error
Permission Matrix: Detail hak akses per role
Business Rules  : Aturan bisnis yang berlaku
Gap/CFG/MD Ref  : Referensi dari BA Review
Responsive      : Perilaku responsif
Accessibility   : Persyaratan aksesibilitas
```

---

## SCREEN: AUTH-01 — Login

**Screen ID:** AUTH-01
**Screen Name:** Login
**Business Purpose:** Titik masuk utama ke sistem KINETIC CRM. Memverifikasi identitas pengguna melalui username dan password sebelum memberikan akses ke modul-modul sistem sesuai role.
**User Roles:** Semua (belum terautentikasi)
**Route:** `/login`
**Navigation Entry Point:** URL langsung; redirect otomatis dari semua route yang dilindungi jika tidak terautentikasi; redirect dari Axios interceptor saat menerima HTTP 401.

**Components:**

| Komponen | Tipe | Detail |
|---|---|---|
| Background | Layout | Gradient navy full viewport |
| Logo Perusahaan | Image | Di atas card, dari CFG config atau asset statis |
| Login Card | Container | `max-w-md`, centered, shadow-md, rounded-lg, bg-white |
| Judul | Typography | "Masuk ke KINETIC CRM", text-xl font-semibold |
| Input Username | Input Atom | type=text, autofocus, label "Username", leftIcon User |
| Input Password | Input Atom | type=password, toggle show/hide, label "Password" |
| Error Banner | Alert | Merah, posisi di atas form fields, hidden by default |
| Lockout Notice | Alert | Kuning, muncul setelah 5 kali gagal |
| Tombol Masuk | Button | variant=primary, full-width, isLoading state |
| Link Lupa Password | Link | Text-sm, gray, "Lupa Password?" — menuju fase 2 placeholder |
| Footer | Typography | Versi app dari VITE_APP_VERSION, text-xs gray |

**Actions:**

| Aksi | Trigger | Behavior |
|---|---|---|
| Submit Login | Klik tombol "Masuk" atau Enter di field password | Validasi client → POST /api/auth/login → redirect /dashboard |
| Toggle Password | Klik ikon mata di field password | Berganti type=text/password |
| Lupa Password | Klik link "Lupa Password?" | Fase 2: belum aktif; tampilkan tooltip "Hubungi Administrator" |

**Validation Rules:**

| Field | Rule | Pesan Error |
|---|---|---|
| Username | Required | "Username wajib diisi" |
| Username | Min 3 karakter | "Username minimal 3 karakter" |
| Password | Required | "Password wajib diisi" |
| Password | Min 8 karakter | "Password minimal 8 karakter" |
| Kombinasi | Salah (dari backend) | "Username atau password salah" — ditampilkan di error banner, bukan di field |
| Lockout | 5 kali gagal | "Akun terkunci sementara. Coba lagi dalam 15 menit." |

Validasi dilakukan secara client-side menggunakan React Hook Form + Zod sebelum API call. Jika validasi client lolos, baru kirim ke server.

**API Dependencies:**

| Method | Endpoint | Request Body | Response Sukses | Response Gagal |
|---|---|---|---|---|
| POST | /api/auth/login | `{ username, password }` | `{ token, user: { id, name, role, branchId, deptId } }` | HTTP 401: `{ message: "..." }` |

Token disimpan di httpOnly cookie via Set-Cookie backend. localStorage digunakan sebagai fallback jika Set-Cookie tidak memungkinkan. Token dari Zustand useAuthStore.

**Loading State:**
- Tombol "Masuk" menjadi disabled
- Spinner kecil muncul di dalam tombol
- Teks tombol berubah menjadi "Memverifikasi..."
- Semua field menjadi disabled selama proses

**Empty State:** Tidak applicable (tidak ada data list)

**Error State:**

| Skenario | Tampilan |
|---|---|
| Kredensial salah | Error banner merah di atas form: "Username atau password salah" |
| Akun terkunci | Error banner kuning: "Akun terkunci 15 menit karena terlalu banyak percobaan gagal" |
| Server error 500 | Error banner merah: "Terjadi kesalahan server. Coba beberapa saat lagi." |
| Network offline | Error banner kuning: "Tidak dapat terhubung ke server. Periksa koneksi internet." |

**Permission Matrix:**

| Role | Akses |
|---|---|
| Semua (belum login) | Bisa mengakses /login |
| Sudah login | Redirect otomatis ke /dashboard (tidak bisa akses /login) |

**Business Rules:**

- BR-AUTH-01: Pengguna yang sudah terautentikasi tidak bisa mengakses /login; redirect ke /dashboard.
- BR-AUTH-02: Setelah 5 kali gagal login, tampilkan pesan lockout 15 menit (enforcement di backend; frontend hanya menampilkan pesan dari response).
- BR-AUTH-03: Token JWT disimpan dengan aman; tidak boleh ada URL hardcode untuk API.
- BR-AUTH-04: Setelah login sukses, simpan state user (id, name, role, branchId, deptId) ke Zustand useAuthStore.
- BR-AUTH-05: Jika login berhasil dan ada `state.from` di location state (redirect dari protected route), redirect ke halaman tersebut, bukan ke /dashboard.

**Related GAP/CFG/MD Reference:**
- FR001–FR004 (Authentication & Session)
- GAP-02 (hardcode parameter; role hardcode sebagai enum)

**Responsive Behavior:**

| Breakpoint | Perilaku |
|---|---|
| Mobile < 640px | Card full-width dengan padding; background gradient tetap; font sedikit lebih kecil |
| Tablet 640–1023px | Card max-w-md centered, identik dengan desktop |
| Desktop ≥ 1024px | Card max-w-md centered di tengah viewport |

**Accessibility Requirements:**
- `autofocus` pada field username saat halaman dibuka
- `aria-label` pada tombol toggle password: "Tampilkan password" / "Sembunyikan password"
- Error banner menggunakan `role="alert"` dan `aria-live="assertive"`
- Tab order: Username → Password → Tombol Masuk → Link Lupa Password
- Enter di field password → trigger submit
- `autocomplete="username"` pada field username, `autocomplete="current-password"` pada field password

---

## SCREEN: AUTH-02 — Ganti Password

**Screen ID:** AUTH-02
**Screen Name:** Ganti Password
**Business Purpose:** Memungkinkan pengguna yang sudah login untuk mengubah password akun mereka sendiri. Juga digunakan saat admin mewajibkan pengguna mengganti password awal.
**User Roles:** Semua role (terautentikasi)
**Route:** `/profile/change-password`
**Navigation Entry Point:** Dropdown avatar di Topbar → "Ganti Password"; redirect otomatis saat flag `must_change_password = true` di user data.

**Components:**

| Komponen | Tipe | Detail |
|---|---|---|
| PageHeader | Molecule | Judul "Ganti Password", breadcrumb Profil → Ganti Password |
| Form Card | Container | max-w-md, bg-white, shadow-sm, rounded-lg |
| Input Password Lama | Input Atom | type=password, toggle show/hide, label "Password Saat Ini" |
| Input Password Baru | Input Atom | type=password, toggle show/hide, label "Password Baru" |
| Input Konfirmasi Password | Input Atom | type=password, toggle show/hide, label "Konfirmasi Password Baru" |
| Password Strength Indicator | Custom | Bar 4 level: lemah/cukup/kuat/sangat kuat |
| Tombol Simpan | Button | variant=primary |
| Tombol Batal | Button | variant=ghost, navigate ke /profile |

**Actions:**

| Aksi | Trigger | Behavior |
|---|---|---|
| Submit | Klik "Simpan Password" | Validasi → PUT /api/auth/change-password → toast sukses → redirect /profile |
| Batal | Klik "Batal" | Kembali ke /profile tanpa perubahan |

**Validation Rules:**

| Field | Rule | Pesan Error |
|---|---|---|
| Password Lama | Required | "Password saat ini wajib diisi" |
| Password Baru | Required | "Password baru wajib diisi" |
| Password Baru | Min 8 karakter | "Password minimal 8 karakter" |
| Password Baru | Harus berbeda dari password lama | "Password baru tidak boleh sama dengan password lama" |
| Konfirmasi | Harus sama dengan password baru | "Konfirmasi password tidak cocok" |
| Password Lama | Salah (dari backend) | "Password saat ini tidak benar" |

**API Dependencies:**

| Method | Endpoint | Request Body | Response |
|---|---|---|---|
| PUT | /api/auth/change-password | `{ currentPassword, newPassword }` | HTTP 200 sukses / HTTP 422 jika validasi gagal |

**Loading State:** Tombol disabled + spinner + "Menyimpan..."

**Error State:** Toast merah untuk error server; field error inline untuk 422.

**Permission Matrix:** Semua role terautentikasi dapat mengakses.

**Business Rules:**
- BR-AUTH-06: Password baru minimal 8 karakter.
- BR-AUTH-07: Password lama harus diverifikasi di server sebelum perubahan diterima.
- BR-AUTH-08: Jika `must_change_password = true`, user tidak bisa mengakses halaman lain sampai ganti password; semua route redirect ke /profile/change-password.

**Related GAP/CFG/MD Reference:** FR003 (password management)

**Responsive Behavior:** Form card full-width di mobile; max-w-md centered di tablet/desktop.

**Accessibility Requirements:** Semua field memiliki label terasosiasi; toggle password memiliki aria-label; error menggunakan aria-describedby.

---

## SCREEN: AUTH-03 — Sesi Berakhir / Session Management

**Screen ID:** AUTH-03
**Screen Name:** Session Warning & Expired
**Business Purpose:** Menginformasikan pengguna bahwa sesinya akan segera berakhir (warning) atau sudah berakhir (expired), dan mengarahkan untuk login ulang agar tidak kehilangan pekerjaan.
**User Roles:** Semua role (terautentikasi)
**Route:** Overlay modal — muncul di atas halaman apapun; bukan route tersendiri.

**Components:**

| Komponen | Tipe | Detail |
|---|---|---|
| Session Warning Modal | ModalDialog | Muncul N menit sebelum expired (dari VITE_SESSION_WARN_MINUTES, default 25 menit) |
| Countdown Timer | Text | "Sesi Anda akan berakhir dalam X menit" |
| Tombol Lanjutkan | Button | variant=primary — trigger GET /api/auth/me untuk refresh sesi |
| Tombol Logout | Button | variant=ghost — trigger logout |

**Business Rules:**
- BR-AUTH-09: Warning modal muncul saat sisa waktu sesi = VITE_SESSION_WARN_MINUTES.
- BR-AUTH-10: Saat sesi expired (401 dari Axios interceptor), clear auth state → redirect /login + toast "Sesi berakhir, silakan login kembali".
- BR-AUTH-11: Jika user klik "Lanjutkan", refresh token melalui GET /api/auth/me; modal tutup.

**Related GAP/CFG/MD Reference:** FR004 (session lifecycle)

---

## SCREEN: DASH-01 — Dashboard

**Screen ID:** DASH-01
**Screen Name:** Dashboard
**Business Purpose:** Pusat monitoring real-time kinerja bisnis dan operasional tender. Setiap role mendapatkan tampilan berbeda yang relevan dengan tanggung jawabnya: Cabang memantau proyek dan deadline sendiri, PM memantau approval pending dan proyek at-risk, Dept melihat approval pending departemennya, Management melihat gambaran besar pipeline dan target vs realisasi, Admin melihat aktivitas sistem secara keseluruhan.
**User Roles:** Semua role (Cabang, PM, Dept, Management, Admin)
**Route:** `/dashboard`
**Navigation Entry Point:** Sidebar menu item "Dashboard"; redirect setelah login sukses; klik logo di topbar.

**Components:**

| Komponen | Tipe | Deskripsi |
|---|---|---|
| PageHeader | Molecule | Judul "Dashboard", subtitle tanggal hari ini, tidak ada action button |
| Filter Role Konteks | Info | Badge role + nama cabang/divisi untuk konteks data yang ditampilkan |
| Refresh Indicator | Custom | Teks kecil "Diperbarui X menit lalu" + spinner saat refetch |
| Grid Container | Layout | Responsive: 1 kolom mobile → 2 kolom tablet → 3–4 kolom desktop |
| DashboardCard | Molecule | Container widget: judul, nilai utama, sub-label, ikon, warna aksen |
| Widget: Proyek Aktif | DashboardCard | Count proyek + total nilai pipeline (Rp) |
| Widget: Approval Pending | DashboardCard + List | List 5 item terbaru, link "Lihat semua" |
| Widget: Approaching Deadline | DashboardCard + List | Proyek dengan deadline ≤ 7 hari |
| Widget: Win Rate Bulan Ini | DashboardCard | Persentase + perbandingan bulan lalu |
| Widget: Proyek At-Risk | DashboardCard + List | Proyek stuck > 5 hari atau deadline ≤ 3 hari |
| Widget: Pipeline Value Total | DashboardCard | Total nilai Rp semua proyek aktif |
| Widget: Trend Win/Loss | Recharts BarChart | Bar chart 6 bulan terakhir |
| Widget: Progress vs Target | DashboardCard + Progress | Realisasi KPI vs target bulan ini (traffic light) |
| Widget: Proyek per Status | Recharts DonutChart | Distribusi proyek per status |
| Widget: User Aktif Hari Ini | DashboardCard | Count user yang login hari ini |
| Skeleton Loading | Shimmer | Per DashboardCard saat initial load |

**Widget Visibility per Role:**

| Widget | Cabang | PM | Dept | Mgmt | Admin |
|:---|:---:|:---:|:---:|:---:|:---:|
| Proyek Aktif (count + nilai pipeline) | ✓ | ✓ | — | ✓ | ✓ |
| Approval Pending milik saya | — | ✓ | ✓ | ✓ | — |
| Approaching Deadline (≤ 7 hari) | ✓ | ✓ | — | ✓ | ✓ |
| Win Rate Bulan Ini (%) | ✓ | — | — | ✓ | ✓ |
| Proyek At-Risk (stuck > 5 hari) | — | ✓ | — | ✓ | ✓ |
| Pipeline Value Total (Rp) | — | — | — | ✓ | ✓ |
| Grafik Trend Win/Loss 6 Bulan | — | — | — | ✓ | ✓ |
| Progress vs Target Bulan Ini | — | — | — | ✓ | ✓ |
| Proyek per Status (donut chart) | — | ✓ | — | ✓ | ✓ |
| User Aktif Hari Ini | — | — | — | — | ✓ |

**Spesifikasi Detail Widget Kritis:**

**Widget: Approval Pending**
- List maksimal 5 item terbaru dari /api/approvals/pending?limit=5
- Link "Lihat semua →" ke /approvals
- Setiap item menampilkan: ikon tipe (prospek/proyek), nama entitas, cabang asal, durasi menunggu (format "X hari"), tombol "Review" langsung
- Warna durasi: hijau (< 1 hari), kuning (1–2 hari), merah (> 2 hari atau mendekati SLA batas)
- Empty state inline: "Tidak ada item pending. ✓"

**Widget: Approaching Deadline**
- Proyek dengan `deadlineTender` ≤ 7 hari dari hari ini
- Sorted by deadline ASC (paling dekat di paling atas)
- Badge merah jika ≤ 3 hari tersisa; badge kuning jika 4–7 hari tersisa
- Setiap item: nama proyek, nama customer, sisa hari (format: "Sisa 3 hari"), link ke detail proyek

**Widget: Trend Win/Loss (Grafik)**
- Recharts BarChart; X axis = nama bulan (Jan, Feb, dst); Y axis = jumlah proyek
- Dua bar per bulan: "Menang" (warna hijau #16A34A) dan "Kalah" (warna merah #DC2626)
- Tooltip on hover: "Menang: X | Kalah: Y | Win Rate: Z%"
- Jika data < 2 bulan: EmptyState "Belum cukup data untuk menampilkan tren win/loss"
- Legend di bawah chart; responsive (recharts ResponsiveContainer 100%)

**Widget: Progress vs Target Bulan Ini**
- Tampilkan 3 KPI utama: Jumlah Tender, Nilai Pipeline, Win Rate
- Setiap KPI: label, angka realisasi, angka target, persentase pencapaian, traffic light indicator
- Warna traffic light: merah (< 60%), kuning (60–89%), hijau (≥ 90%)
- Link "Detail →" ke /reports (laporan progress vs target)
- Data dari GET /api/dashboard/summary dengan field `targetProgress`

**Actions:**

| Aksi | Trigger | Behavior |
|---|---|---|
| Review item approval | Klik tombol "Review" di widget Approval Pending | Buka /approvals dengan item terpilih; atau buka SlideDrawer jika implementasi drawer global |
| Buka detail proyek | Klik nama proyek di widget | Navigate ke /projects/:id |
| Lihat semua approval | Klik "Lihat semua →" di widget approval | Navigate ke /approvals |
| Refresh dashboard | Otomatis setiap 5 menit | React Query refetchInterval; tidak ada tombol manual refresh di fase 1 |

**Validation Rules:** Tidak ada input form; validasi tidak berlaku.

**API Dependencies:**

| Method | Endpoint | Query Params | Deskripsi |
|---|---|---|---|
| GET | /api/dashboard/summary | `role=xxx&branchId=xxx` | Data semua widget sesuai role |
| GET | /api/approvals/pending | `limit=5` | Widget approval pending (5 terbaru) |

React Query `staleTime: 5 * 60 * 1000` (5 menit); `refetchInterval: 5 * 60 * 1000` untuk dashboard.

**Loading State:**
- Initial load: skeleton shimmer per DashboardCard — proportional dengan layout akhir
- Tidak menggunakan full-page spinner
- Refetch background: spinner kecil di sudut kanan atas masing-masing card; konten lama tetap visible

**Empty State:**
- Widget tanpa data: EmptyState inline minimal di dalam card
- Teks: "Belum ada data untuk periode ini"
- Tidak ada CTA di widget empty state (kecuali widget Approval Pending: "Semua sudah ditangani! ✓")

**Error State:**
- Jika API gagal per widget: card menampilkan ikon error + "Gagal memuat data" + tombol Reload (hanya untuk query widget tersebut)
- Jika semua data gagal: ErrorBoundary level route dengan tombol "Muat Ulang Halaman"

**Permission Matrix:**

| Role | Akses Dashboard | Widget yang Tersedia |
|---|---|---|
| Cabang | ✓ | Proyek Aktif, Approaching Deadline, Win Rate Bulan Ini |
| PM | ✓ | Proyek Aktif, Approval Pending, Approaching Deadline, At-Risk, Proyek per Status |
| Dept | ✓ | Approval Pending (hanya dept sendiri) |
| Management | ✓ | Semua kecuali User Aktif |
| Admin | ✓ | Semua widget |

**Business Rules:**
- BR-DASH-01: Semua data dashboard dibatasi scope role: Cabang hanya melihat data cabangnya sendiri; PM melihat semua data; Dept hanya melihat approval untuk departemennya.
- BR-DASH-02: Data direfresh otomatis setiap 5 menit tanpa interaksi user.
- BR-DASH-03: Widget "Progress vs Target" hanya relevan jika Modul Target & KPI sudah aktif (GAP-01); jika belum ada data target, widget menampilkan placeholder "Belum ada target ditetapkan untuk periode ini. Hubungi Admin."
- BR-DASH-04: "Proyek At-Risk" = proyek yang sudah ≥ 5 hari di status yang sama tanpa perubahan ATAU deadline ≤ 3 hari.
- BR-DASH-05: Widget Approval Pending di dashboard adalah preview; untuk aksi approval, user harus ke halaman /approvals.

**Related GAP/CFG/MD Reference:**
- GAP-01 (Target & KPI monitoring — widget Progress vs Target)
- GAP-10 (filter granular dashboard untuk management)
- GAP-04 (status cancelled tidak boleh muncul di widget proyek aktif)
- CFG-08 (Konfigurasi Dashboard — widget per role)
- D.6 dari BA Review (rekomendasi widget dashboard per role)

**Responsive Behavior:**

| Breakpoint | Layout |
|---|---|
| Mobile < 640px | 1 kolom, semua widget stack vertikal |
| Tablet 640–1023px | 2 kolom widget |
| Desktop 1024–1279px | 3 kolom widget |
| Wide ≥ 1280px | 4 kolom widget; chart dan tabel lebih lebar |

**Accessibility Requirements:**
- Setiap DashboardCard memiliki role="region" dan aria-label dengan nama widget
- Chart (BarChart, DonutChart) memiliki aria-label deskriptif dan fallback tabel data
- Badge traffic light tidak menggunakan warna sebagai satu-satunya indikator; tambahkan teks label (Merah/Kuning/Hijau atau ≥90%/60-89%/<60%)
- Update nilai dashboard (saat refetch) menggunakan aria-live="polite"

---

## SCREEN: PROS-01 — Daftar Prospek

**Screen ID:** PROS-01
**Screen Name:** Daftar Prospek
**Business Purpose:** Menampilkan semua prospek sesuai scope role pengguna. Menjadi titik masuk untuk membuat prospek baru, melihat status prospek yang sedang berjalan, melakukan filter dan pencarian, serta menavigasi ke detail prospek tertentu. Cabang memantau prospek milik cabangnya; PM memantau semua prospek untuk keperluan approval.
**User Roles:** Cabang, PM, Admin
**Route:** `/prospects`
**Navigation Entry Point:** Sidebar menu item "Prospek".

**Components:**

| Komponen | Tipe | Detail |
|---|---|---|
| PageHeader | Molecule | Judul "Prospek", tombol "Buat Prospek" (kanan) — hanya visible untuk role Cabang dan Admin |
| FilterBar | Molecule | Filter Status + Search field + Date Range |
| Filter: Status | Select | Options: Semua, Prospecting, Menunggu Approval PM, Perlu Revisi, Disetujui |
| Filter: Pencarian | Input | Debounced 300ms; cari nama prospek atau nama customer |
| Filter: Tanggal Dibuat | DatePicker Range | Date from — Date to |
| DataTable | Molecule | Server-side pagination, sortable, row actions |
| Kolom: No | Text | Nomor urut di halaman saat ini |
| Kolom: Nama Prospek | Text + Link | Link ke /prospects/:id |
| Kolom: Customer | Text | Nama customer |
| Kolom: Status | Badge | Color-coded per status |
| Kolom: Dibuat Oleh | Text | Nama user + nama cabang |
| Kolom: Tgl Dibuat | Text | Format: DD MMM YYYY |
| Kolom: Aksi | Button group | Lihat Detail, Edit (conditional), Hapus (conditional) |
| Pagination | Atom | Server-side; selector 10/20/50 baris per halaman; default 20 |
| EmptyState | Molecule | Ilustrasi + teks + CTA (conditional per konteks) |

**Status Badge Color Mapping:**

| Status Value | Label | Warna |
|---|---|---|
| prospecting | Prospecting | Abu-abu (#6B7280) |
| waiting_pm_approval | Menunggu Approval PM | Biru (#2563A8) |
| revision | Perlu Revisi | Kuning (#D97706) |
| approved | Disetujui | Hijau (#16A34A) |

**Actions:**

| Aksi | Trigger | Role | Behavior |
|---|---|---|---|
| Buat Prospek Baru | Klik tombol "Buat Prospek" | Cabang, Admin | Navigate ke /prospects/new |
| Lihat Detail | Klik nama prospek ATAU tombol "Lihat Detail" | Semua | Navigate ke /prospects/:id |
| Edit Prospek | Klik "Edit" di row actions | Cabang (status prospecting/revision), Admin | Navigate ke /prospects/:id/edit |
| Hapus Prospek | Klik "Hapus" di row actions | Cabang (status prospecting), Admin | ConfirmDialog → DELETE /api/prospects/:id → refresh list |
| Apply Filter | Perubahan filter | Semua | Trigger API call dengan params baru; reset ke halaman 1 |
| Reset Filter | Klik "Hapus Filter" di EmptyState | Semua | Clear semua filter; reset ke default |
| Ganti halaman | Klik tombol pagination | Semua | Fetch halaman baru |

**Validation Rules:**

| Rule | Detail |
|---|---|
| Hapus hanya jika draft | Tombol "Hapus" hanya muncul jika status = prospecting. Backend juga enforce. |
| Edit hanya jika editable | Tombol "Edit" hanya muncul jika status = prospecting ATAU revision. |
| Scope data | Backend enforce: Cabang hanya bisa melihat prospek milik cabangnya. |

**API Dependencies:**

| Method | Endpoint | Query Params |
|---|---|---|
| GET | /api/prospects | `status=`, `search=`, `page=`, `perPage=`, `dateFrom=`, `dateTo=` |
| DELETE | /api/prospects/:id | Path param :id |

**Loading State:**
- Initial load: Skeleton tabel 5 baris dengan shimmer animasi
- Refetch (filter/pagination): Spinner kecil (16px) di header tabel; data lama tetap visible sampai data baru tiba

**Empty State:**

| Konteks | Ilustrasi | Teks | CTA |
|---|---|---|---|
| Belum ada prospek sama sekali | Dokumen dengan magnifier | "Belum ada prospek. Mulai buat prospek pertama." | Tombol "Buat Prospek Pertama" (hanya untuk Cabang) |
| Filter tidak menghasilkan hasil | Kaca pembesar + tanda X | "Tidak ada prospek yang cocok dengan filter yang dipilih." | Tombol "Hapus Filter" |

**Error State:**
- API error: Toast merah "Gagal memuat daftar prospek" + tombol "Coba Lagi" di area tabel
- Network error: Toast kuning "Koneksi bermasalah, coba lagi"

**Permission Matrix:**

| Role | Lihat List | Buat | Edit | Hapus | Lihat Detail |
|---|:---:|:---:|:---:|:---:|:---:|
| Cabang | ✓ (milik sendiri) | ✓ | ✓ (draft/revision) | ✓ (draft) | ✓ |
| PM | ✓ (semua) | — | — | — | ✓ |
| Dept | — | — | — | — | — |
| Management | — | — | — | — | — |
| Admin | ✓ (semua) | ✓ | ✓ | ✓ | ✓ |

**Business Rules:**
- BR-PROS-01: Cabang hanya bisa melihat prospek milik cabangnya sendiri (enforced di API berdasarkan `branchId` dari token).
- BR-PROS-02: PM dan Admin dapat melihat semua prospek dari semua cabang.
- BR-PROS-03: Hapus prospek hanya diizinkan pada status `prospecting`. Prospek yang sudah di-submit ke PM tidak bisa dihapus.
- BR-PROS-04: Prospek yang sudah dikonversi menjadi proyek tidak bisa diedit atau dihapus.

**Related GAP/CFG/MD Reference:**
- FR010–FR015 (Prospect Management)
- MD-04 (Master Kategori Proyek)
- GAP-04 (status cancelled tidak masuk ke prospek, tapi pola serupa)

**Responsive Behavior:**

| Breakpoint | Perilaku |
|---|---|
| Mobile < 640px | Tabel berubah menjadi card stack. Setiap card: nama prospek + badge status + customer + tgl + tombol "Buka". Filter bar collapse ke ikon filter. |
| Tablet 640–1023px | Tabel dengan kolom terbatas: No, Nama, Status, Aksi (sembunyikan Dibuat Oleh, Tgl). Filter bar satu baris. |
| Desktop ≥ 1024px | Tabel lengkap semua kolom. Filter bar horizontal. |

**Accessibility Requirements:**
- Tabel memiliki `<caption>` "Daftar Prospek"
- `<th>` dengan `scope="col"` untuk semua header kolom
- Badge status memiliki `aria-label` (bukan hanya warna)
- Tombol hapus memiliki `aria-label="Hapus prospek [nama]"`
- ConfirmDialog memiliki fokus trap; tombol "Batalkan" mendapat fokus awal

---

## SCREEN: PROS-02 — Form Buat / Edit Prospek

**Screen ID:** PROS-02
**Screen Name:** Form Buat / Edit Prospek
**Business Purpose:** Form lengkap untuk membuat prospek baru atau mengedit draft prospek yang sudah ada. Terdiri dari dua bagian: informasi dasar prospek dan checklist pertanyaan dinamis yang di-load dari Master Pertanyaan. Menjadi titik awal pipeline tender / prospecting. Edit mode menggunakan route yang sama dengan data pre-populated.
**User Roles:** Cabang, Admin
**Route:** `/prospects/new` (buat baru) | `/prospects/:id/edit` (edit)
**Navigation Entry Point:**
- "Buat Prospek" button di PROS-01
- "Edit" button di PROS-01 row actions
- "Edit" button di PROS-03 (Detail Prospek)

**Components:**

| Komponen | Tipe | Detail |
|---|---|---|
| PageHeader | Molecule | Judul "Buat Prospek Baru" / "Edit Prospek", breadcrumb |
| Layout Dua Kolom | Container | Desktop: kolom kiri (info dasar) + kolom kanan (checklist pertanyaan) |
| Layout Satu Kolom | Container | Mobile: info dasar dulu, pertanyaan di bawah |
| **BAGIAN KIRI: Info Dasar** | | |
| Input: Nama Prospek | Input | type=text, required, autofocus, label "Nama Prospek" |
| Select: Customer | Select | Searchable, required; async dari /api/master/customers; search-as-you-type |
| Textarea: Deskripsi | Textarea | Optional, max 2000 char, counter karakter |
| Input: Estimasi Nilai (Rp) | CurrencyInput | Optional, min 0, format rupiah otomatis saat blur |
| Input: Estimasi Tanggal | DatePicker | Optional, disable past dates |
| **BAGIAN KANAN: Checklist Pertanyaan** | | |
| DynamicQuestionForm | Form Component | Di-load dari /api/master/questions?type=prospect; render per tipe jawaban |
| Pertanyaan tipe text | Input | Single line, label = teks pertanyaan |
| Pertanyaan tipe textarea | Textarea | Multi-line |
| Pertanyaan tipe radio | Radio group | Opsi dari master |
| Pertanyaan tipe checkbox | Checkbox group | Multi-select, opsi dari master |
| Pertanyaan tipe select | Select | Dropdown opsi dari master |
| Pertanyaan Required | Badge | Bintang merah (*) di label |
| Pertanyaan per kategori | Group | Grouped by kategori_pertanyaan jika ada |
| **Footer Actions** | | |
| Tombol "Simpan Draft" | Button | variant=secondary; simpan tanpa validasi pertanyaan required |
| Tombol "Submit ke PM" | Button | variant=primary; validasi semua required sebelum submit |
| Tombol "Batal" | Button | variant=ghost; konfirmasi jika isDirty |
| Dirty Form Warning | ConfirmDialog | "Ada perubahan yang belum disimpan. Yakin ingin meninggalkan halaman?" |

**Actions:**

| Aksi | Trigger | Behavior |
|---|---|---|
| Simpan Draft | Klik "Simpan Draft" | POST/PUT tanpa validasi pertanyaan → toast "Draft disimpan" → tetap di halaman atau redirect ke /prospects/:id |
| Submit ke PM | Klik "Submit ke PM" | Validasi semua required → ConfirmDialog → POST /api/prospects/:id/submit → toast sukses → redirect ke /prospects/:id |
| Batal | Klik "Batal" | Jika isDirty: ConfirmDialog "Ada perubahan..." → jika konfirm: navigate back; jika tidak dirty: navigate back langsung |
| Load pertanyaan | Mount komponen | GET /api/master/questions?type=prospect → render DynamicQuestionForm |
| Search customer | Input di Select Customer | Debounced GET /api/master/customers?search=xxx |

**Validation Rules:**

| Field | Rule | Trigger | Pesan Error |
|---|---|---|---|
| Nama Prospek | Required | Submit | "Nama prospek wajib diisi" |
| Nama Prospek | Min 3 karakter | Submit | "Nama prospek minimal 3 karakter" |
| Nama Prospek | Max 200 karakter | Typing | "Nama prospek maksimal 200 karakter" |
| Customer | Required | Submit | "Customer wajib dipilih" |
| Deskripsi | Max 2000 karakter | Typing | Counter merah saat mendekati/melewati batas |
| Estimasi Nilai | Min 0 jika diisi | Blur | "Nilai estimasi tidak boleh negatif" |
| Estimasi Tanggal | Tidak boleh masa lalu jika diisi | DatePicker | "Tanggal estimasi tidak boleh di masa lalu" |
| Pertanyaan required | Required saat "Submit ke PM" | Submit | "Pertanyaan ini wajib dijawab" (inline di bawah field) |
| Pertanyaan required | Tidak required saat "Simpan Draft" | — | Tidak ada validasi required untuk draft |

**API Dependencies:**

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | /api/master/customers | Async search untuk Select Customer |
| GET | /api/master/questions?type=prospect | Load daftar pertanyaan dinamis |
| POST | /api/prospects | Buat prospek baru (status: prospecting) |
| PUT | /api/prospects/:id | Update draft prospek |
| POST | /api/prospects/:id/submit | Submit ke PM untuk approval |
| GET | /api/prospects/:id | Pre-populate form saat edit mode |

**Format penyimpanan jawaban pertanyaan:** JSON array `[{ questionId: number, answer: string | string[] }]` — disimpan di field `answers` pada tabel prospects.

**Loading State:**
- Saat form mount (edit mode): Skeleton form dengan placeholder untuk setiap field
- Saat load pertanyaan: Skeleton 3 item pertanyaan di panel kanan
- Saat submit: Tombol submit disabled + spinner; tombol lain juga disabled

**Empty State:** Jika tidak ada pertanyaan aktif dari master: Teks info "Tidak ada pertanyaan yang perlu dijawab saat ini. Silakan hubungi Admin untuk menambahkan."

**Error State:**
- API load pertanyaan gagal: Error inline "Gagal memuat pertanyaan. Coba muat ulang." + tombol Retry
- Submit gagal 422: Error per field dari response ditampilkan inline
- Submit gagal 500: Toast merah "Gagal menyimpan prospek. Coba lagi."

**Permission Matrix:**

| Role | Buat | Edit Draft | Edit Revision | Submit ke PM |
|---|:---:|:---:|:---:|:---:|
| Cabang | ✓ (milik sendiri) | ✓ | ✓ | ✓ |
| PM | — | — | — | — |
| Dept | — | — | — | — |
| Management | — | — | — | — |
| Admin | ✓ (semua) | ✓ | ✓ | ✓ |

**Business Rules:**
- BR-PROS-05: Pertanyaan dinamis diambil dari Master Pertanyaan, bukan localStorage (GAP-03). Pertanyaan_type_defs harus sudah dimigrasikan ke DB sebelum form ini bisa digunakan.
- BR-PROS-06: "Simpan Draft" tidak memerlukan semua pertanyaan required terisi; memungkinkan penyimpanan parsial.
- BR-PROS-07: "Submit ke PM" memerlukan validasi lengkap termasuk semua pertanyaan required.
- BR-PROS-08: ConfirmDialog muncul saat user menekan Batal atau navigasi pergi dari form yang isDirty (dirty form check via React Hook Form `.formState.isDirty`).
- BR-PROS-09: Jawaban pertanyaan disimpan sebagai JSON terstruktur `[{ questionId, answer }]`, bukan freeform JSON, untuk memungkinkan query dan analitik.

**Related GAP/CFG/MD Reference:**
- GAP-03 (migrasi Question Type dari localStorage ke DB — kritis)
- CFG-12 (Konfigurasi Tipe Pertanyaan)
- FR010 (Create Prospect)
- FR102 (Question Type Definitions ke DB)

**Responsive Behavior:**

| Breakpoint | Perilaku |
|---|---|
| Mobile < 640px | Satu kolom; info dasar teratas, pertanyaan di bawah; tombol action di footer sticky |
| Tablet 640–1023px | Satu kolom atau dua kolom sempit; tombol action di footer |
| Desktop ≥ 1024px | Dua kolom (60% info dasar, 40% pertanyaan); tombol action di bawah kolom kiri |

**Accessibility Requirements:**
- Semua field memiliki `<label>` dengan `htmlFor` terasosiasi
- Pertanyaan required memiliki `aria-required="true"`
- Error messages dihubungkan via `aria-describedby`
- DynamicQuestionForm: setiap kelompok pertanyaan memiliki `<fieldset>` dan `<legend>`
- CurrencyInput menggunakan `inputmode="numeric"` di mobile
- Tombol "Submit ke PM" memiliki aria-label lebih deskriptif: "Submit prospek ke PM untuk review"

---

## SCREEN: PROS-03 — Detail Prospek

**Screen ID:** PROS-03
**Screen Name:** Detail Prospek
**Business Purpose:** Menampilkan seluruh informasi prospek secara lengkap dalam satu halaman. Menjadi titik koordinasi antara Cabang (yang membuat) dan PM (yang melakukan review). PM dapat melakukan approval atau mengirimkan pertanyaan revisi. Cabang dapat menjawab pertanyaan revisi. Setelah approved, halaman ini memberikan akses untuk mengkonversi prospek menjadi proyek.
**User Roles:** Cabang, PM, Admin
**Route:** `/prospects/:id`
**Navigation Entry Point:**
- Klik nama prospek di PROS-01
- Klik tombol "Lihat Detail" di PROS-01
- Link dari notifikasi (notif event prospek)
- Link dari widget Approval Pending di dashboard

**Components:**

| Komponen | Tipe | Detail |
|---|---|---|
| PageHeader | Molecule | Nama prospek, breadcrumb, tombol aksi kontekstual |
| Layout Dua Panel | Container | Panel kiri (1/3) + panel kanan (2/3) dengan tab |
| **PANEL KIRI: Info & Status** | | |
| Status Badge Besar | Badge | Status saat ini, warna sesuai status mapping |
| Info: Nama Prospek | Text | font-bold text-lg |
| Info: Customer | Text + Link | Link ke detail customer jika ada |
| Info: Estimasi Nilai | Text | Format rupiah; "—" jika tidak diisi |
| Info: Estimasi Tanggal | Text | Format DD MMM YYYY; "—" jika tidak diisi |
| Info: Dibuat Oleh | Text | Nama user + cabang |
| Info: Tgl Dibuat | Text | Format DD MMM YYYY HH:mm |
| Info: Tgl Diperbarui | Text | Relative time (format "X hari lalu") |
| Timeline Riwayat Status | List | Riwayat perubahan status dari newest ke oldest |
| Tombol Aksi Kontekstual | Button group | Berbeda per status + role (lihat tabel aksi) |
| **PANEL KANAN: Konten dengan Tab** | | |
| Tab: Ringkasan | Tab | Default aktif; deskripsi + jawaban checklist (read-only) |
| Tab: Review PM | Tab | Hanya tampil jika status revision atau waiting_pm_approval |
| Tab: Timeline | Tab | Feed kronologis semua event |

**Tab: Ringkasan**
- Deskripsi prospek dalam format text
- Jawaban checklist pertanyaan dalam format read-only yang rapi (bukan form, tapi display)
- Setiap pertanyaan: label pertanyaan (bold) → jawaban di bawahnya
- Jawaban pertanyaan checkbox: ditampilkan sebagai bullet list
- Jika belum ada jawaban: "Belum dijawab" dalam teks italic

**Tab: Review PM**
- Hanya visible jika status = `waiting_pm_approval` atau `revision`
- Layout dua kolom: pertanyaan PM (kiri) + jawaban cabang (kanan)
- Pertanyaan PM: daftar pertanyaan yang sudah diinput PM sebelumnya
- Jawaban Cabang: input field untuk setiap pertanyaan (jika role Cabang dan status revision); read-only untuk role lain
- Badge progress: "X dari Y pertanyaan terjawab"
- Catatan umum PM di bawah tabel pertanyaan

**Tab: Timeline**
- Feed vertikal kronologis
- Setiap event: ikon berwarna per tipe event, deskripsi aksi, nama actor, timestamp (relative on hover: absolute)
- Tipe event dan ikonnya:
  - Dibuat: ikon plus, abu-abu
  - Submit ke PM: ikon send, biru
  - Revisi dikirim: ikon edit, kuning
  - Revisi dijawab: ikon check-edit, kuning
  - Disetujui: ikon check-circle, hijau
  - Dihapus: ikon trash, merah
- Filter chip: Semua | Perubahan Status | Approval | Revisi
- Semua event di-load sekaligus (lazy render jika > 50 event)

**Actions per Status dan Role:**

| Status Prospek | Role Cabang | Role PM | Role Admin |
|---|---|---|---|
| prospecting | Edit, Hapus, Submit ke PM | — (read-only) | Edit, Hapus, Submit ke PM |
| waiting_pm_approval | — (read-only, menunggu) | Approve, Kirim Revisi | Approve, Kirim Revisi, Re-assign PM |
| revision | Edit Jawaban, Submit Ulang | — (menunggu jawaban) | Edit Jawaban, Submit Ulang, Kirim Ulang ke PM |
| approved | Konversi ke Proyek | — (read-only) | Konversi ke Proyek |

**Spesifikasi Modal Aksi:**

**Modal Approve (PM)**
- Judul: "Setujui Prospek"
- Konten: "Apakah Anda yakin ingin menyetujui prospek [Nama Prospek]?"
- Tombol: "Setujui" (hijau, primary) + "Batal" (ghost)
- API: POST /api/prospects/:id/approve

**Modal Kirim Revisi (PM)**
- Judul: "Kirim Pertanyaan Revisi"
- Konten: form dinamis untuk menambah pertanyaan (tombol "+ Tambah Pertanyaan")
- Setiap pertanyaan: text field untuk teks pertanyaan + tombol hapus baris
- Minimal 1 pertanyaan harus ditambahkan sebelum submit
- Field catatan umum (textarea, optional)
- Tombol: "Kirim Revisi" (kuning, primary) + "Batal"
- API: POST /api/prospects/:id/revise

**Modal Konversi ke Proyek (Cabang)**
- Judul: "Konversi ke Proyek"
- Konten: Pilih tipe proyek (Tender / Prospecting) + nama proyek (pre-filled dari nama prospek, editable)
- Tombol: "Buat Proyek" (biru, primary) + "Batal"
- API: POST /api/projects (dengan prospectId = id prospek ini)
- Sukses: redirect ke /projects/:newProjectId

**API Dependencies:**

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | /api/prospects/:id | Load data lengkap prospek + review questions |
| PUT | /api/prospects/:id | Update draft (redirect ke edit form) |
| DELETE | /api/prospects/:id | Hapus prospek draft |
| POST | /api/prospects/:id/submit | Submit ke PM |
| POST | /api/prospects/:id/approve | PM approve |
| POST | /api/prospects/:id/revise | PM kirim revisi |
| POST | /api/prospects/:id/answer | Cabang submit jawaban revisi |
| POST | /api/projects | Konversi ke proyek baru |

**Loading State:**
- Initial load: Skeleton dua panel; panel kiri skeleton info, panel kanan skeleton konten
- Aksi modal (approve/revisi): Tombol disabled + spinner saat API call

**Empty State:**
- Tab Review PM (belum ada pertanyaan revisi): "Belum ada pertanyaan revisi dari PM."
- Tab Timeline (baru dibuat): "Belum ada aktivitas selain pembuatan prospek."

**Error State:**
- Load gagal: Pesan error di tengah halaman + tombol "Muat Ulang"
- Prospek tidak ditemukan (404): Redirect ke halaman 404

**Permission Matrix:**

| Role | Lihat | Edit | Submit | Approve | Kirim Revisi | Jawab Revisi | Konversi | Hapus |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Cabang | ✓ (milik sendiri) | ✓ (draft/revision) | ✓ | — | — | ✓ (revision) | ✓ (approved) | ✓ (draft) |
| PM | ✓ (semua) | — | — | ✓ | ✓ | — | — | — |
| Dept | — | — | — | — | — | — | — | — |
| Management | — | — | — | — | — | — | — | — |
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

**Business Rules:**
- BR-PROS-10: Prospek yang sudah dikonversi menjadi proyek tidak bisa diedit, dihapus, atau disubmit ulang. Badge "Sudah dikonversi ke Proyek [nomor]" ditampilkan.
- BR-PROS-11: PM harus mengisi minimal 1 pertanyaan review saat kirim revisi.
- BR-PROS-12: Cabang harus menjawab semua pertanyaan review dari PM sebelum bisa submit ulang.
- BR-PROS-13: Riwayat semua iterasi review-revisi tersimpan dan visible di Tab Timeline.

**Related GAP/CFG/MD Reference:**
- FR010–FR015 (Prospect Management full lifecycle)
- FR102 (DynamicQuestionForm dari DB, bukan localStorage — GAP-03)
- GAP-07 (Re-assign PM — admin dapat re-assign PM dari detail prospek)

**Responsive Behavior:**

| Breakpoint | Perilaku |
|---|---|
| Mobile < 640px | Panel kiri tampil sebagai section di atas; panel kanan dengan tab di bawahnya; tab scroll horizontal |
| Tablet 640–1023px | Panel kiri + panel kanan tapi proporsional lebih kecil |
| Desktop ≥ 1024px | Split dua panel penuh; panel kiri sticky saat scroll |

**Accessibility Requirements:**
- Tab panel menggunakan role="tablist", role="tab", role="tabpanel" dengan `aria-controls` dan `aria-selected`
- Modal menggunakan fokus trap; Esc menutup modal
- Status badge memiliki aria-label
- Timeline feed menggunakan `<ol>` dengan setiap event sebagai `<li>`

---

## SCREEN: PROJ-01 — Daftar Proyek

**Screen ID:** PROJ-01
**Screen Name:** Daftar Proyek
**Business Purpose:** Menampilkan semua proyek sesuai scope role pengguna. Menjadi pusat navigasi ke seluruh aktivitas tender dan prospecting yang sedang berjalan. Management menggunakannya untuk monitoring pipeline; PM untuk manajemen proyek yang menjadi tanggung jawabnya; Cabang untuk memantau proyek milik cabangnya; Dept untuk melihat proyek yang menunggu review departemennya.
**User Roles:** Semua role (Cabang, PM, Dept, Management, Admin)
**Route:** `/projects`
**Navigation Entry Point:** Sidebar menu item "Proyek"; link dari Dashboard widget.

**Components:**

| Komponen | Tipe | Detail |
|---|---|---|
| PageHeader | Molecule | Judul "Proyek", tombol "Buat Proyek Baru" (Cabang, Admin) |
| FilterBar | Molecule | Multi-filter horizontal |
| Filter: Tipe | Select | Semua / Tender / Prospecting |
| Filter: Status | Select | Semua / [daftar status dinamis dari CFG-03] |
| Filter: Cabang | Select | Hanya visible untuk PM, Management, Admin |
| Filter: Customer | Select | Searchable async |
| Filter: Periode | DatePicker Range | Berdasarkan tanggal dibuat atau deadline tender |
| Filter: Pencarian | Input | Debounced 300ms; cari nama proyek atau nomor tender |
| DataTable | Molecule | Server-side pagination + sorting |
| Kolom: No | Text | Nomor urut |
| Kolom: Nama Proyek | Text + Link | Link ke /projects/:id; nomor tender sebagai sub-text |
| Kolom: Tipe | Badge | Tender (biru) / Prospecting (abu) |
| Kolom: Customer | Text | Nama customer |
| Kolom: Status | Badge | Color-coded per status (lihat tabel warna) |
| Kolom: Deadline | Text | Format DD MMM YYYY; merah jika ≤ 3 hari; kuning jika 4–7 hari |
| Kolom: PIC Cabang | Text | Nama cabang |
| Kolom: Progress | Progress Bar | Bar visual inline; panjang = % langkah selesai dari total langkah alur |
| Kolom: At-Risk | Icon | Ikon api 🔥 jika stuck > 5 hari ATAU deadline ≤ 3 hari |
| Kolom: Aksi | Button | Tombol "Buka" (primary) + dropdown "⋯" |
| Dropdown Aksi | Menu | Lihat Timeline, Lihat Dokumen, Cancel Proyek (PM/Admin) |
| Checkbox Bulk | Checkbox | Per baris; bulk action export CSV |
| Pagination | Atom | Server-side; default 20 per halaman |
| EmptyState | Molecule | Per konteks |

**Status Badge Color Mapping (sesuai BA Review):**

| Status Value | Label Tampilan | Warna Badge |
|---|---|---|
| created | Dibuat | Abu-abu (#6B7280) |
| submit_rks | RKS Disubmit | Biru (#2563A8) |
| review_department | Review Departemen | Ungu (#7C3AED) |
| lphs_sios | LPHS/SIOS | Indigo (#4338CA) |
| revision | Revisi | Kuning (#D97706) |
| submit_harga | Input Harga | Teal (#0D9488) |
| pengumuman_pemenang | Pengumuman Pemenang | Oranye (#EA580C) |
| target_delivery | Target Delivery | Biru Muda (#0284C7) |
| selesai | Selesai | Hijau (#16A34A) |
| cancelled | Dibatalkan | Merah Tua (#9F1239) |

**Actions:**

| Aksi | Trigger | Role | Behavior |
|---|---|---|---|
| Buat Proyek Baru | Klik "Buat Proyek Baru" | Cabang, Admin | Navigate ke /projects/new |
| Buka Proyek | Klik nama proyek atau tombol "Buka" | Semua | Navigate ke /projects/:id |
| Lihat Timeline | Dropdown ⋯ → "Lihat Timeline" | Semua | Navigate ke /projects/:id (Tab Timeline aktif) |
| Lihat Dokumen | Dropdown ⋯ → "Lihat Dokumen" | Semua | Navigate ke /projects/:id (Tab Dokumen aktif) |
| Cancel Proyek | Dropdown ⋯ → "Cancel Proyek" | PM, Admin | ConfirmDialog dengan form alasan → POST /api/projects/:id/cancel |
| Bulk Export CSV | Checkbox pilih + "Export CSV" | Semua | Export data proyek terpilih ke file CSV |
| Apply Filter | Perubahan filter | Semua | API call dengan params; reset ke halaman 1 |

**Validation Rules:**
- Cancel Proyek: Wajib isi alasan pembatalan (min 10 karakter)
- Bulk Export: Minimal 1 proyek harus dipilih

**API Dependencies:**

| Method | Endpoint | Query Params |
|---|---|---|
| GET | /api/projects | `type=`, `status=`, `branchId=`, `customerId=`, `search=`, `page=`, `perPage=`, `dateFrom=`, `dateTo=` |
| POST | /api/projects/:id/cancel | Body: `{ reason }` |

**Loading State:** Skeleton tabel 5 baris; spinner kecil di header saat refetch.

**Empty State:**

| Konteks | Teks | CTA |
|---|---|---|
| Tidak ada proyek | "Belum ada proyek aktif" | "Buat Proyek Baru" (Cabang) |
| Filter kosong | "Tidak ada proyek yang cocok dengan filter" | "Hapus Filter" |

**Error State:** Toast + retry mechanism.

**Permission Matrix:**

| Role | Lihat | Buat | Cancel | Bulk Export |
|---|:---:|:---:|:---:|:---:|
| Cabang | ✓ (milik sendiri) | ✓ | — | ✓ |
| PM | ✓ (semua) | — | ✓ | ✓ |
| Dept | ✓ (semua, read-only) | — | — | — |
| Management | ✓ (semua) | — | — | ✓ |
| Admin | ✓ (semua) | ✓ | ✓ | ✓ |

**Business Rules:**
- BR-PROJ-01: Scope data per role: Cabang hanya melihat proyek milik cabangnya; PM melihat semua; Dept melihat semua (untuk konteks review); Management dan Admin melihat semua.
- BR-PROJ-02: Proyek berstatus `cancelled` ditampilkan di daftar dengan badge merah, namun tidak dihitung dalam widget "Proyek Aktif" di dashboard (GAP-04).
- BR-PROJ-03: At-risk indicator (🔥) muncul otomatis berdasarkan kalkulasi: `DATEDIFF(NOW(), last_status_change) > 5` OR `deadlineTender - NOW() <= 3 hari`.
- BR-PROJ-04: Cancel proyek hanya bisa dilakukan oleh PM atau Admin; wajib mengisi alasan; tidak bisa dibatalkan setelah cancel.
- BR-PROJ-05: Progress bar dihitung berdasarkan jumlah tahap yang sudah dilalui dari total tahap untuk tipe proyek tersebut.

**Related GAP/CFG/MD Reference:**
- GAP-04 (mekanisme cancel proyek)
- GAP-10 (filter granular dashboard dan list)
- CFG-03 (Status Proyek dinamis — badge warna dari CFG)
- CFG-11 (Kategori Proyek)
- MD-04 (Master Kategori Proyek)
- MD-05 (Master Status Proyek)

**Responsive Behavior:**

| Breakpoint | Perilaku |
|---|---|
| Mobile < 640px | Card stack; setiap card: nama proyek + badge tipe + status + deadline + tombol "Buka"; progress bar mini |
| Tablet 640–1023px | Tabel terbatas: No, Nama, Status, Deadline, Aksi |
| Desktop ≥ 1024px | Tabel lengkap semua kolom |

**Accessibility Requirements:**
- Tabel dengan `<caption>`, `<th scope="col">`
- At-risk indicator 🔥 memiliki `aria-label="Proyek berisiko"` dan `title="Proyek ini membutuhkan perhatian segera"`
- Badge status memiliki `aria-label`
- Checkbox bulk memiliki `aria-label="Pilih proyek [nama]"`

---

## SCREEN: PROJ-02 — Form Buat Proyek

**Screen ID:** PROJ-02
**Screen Name:** Form Buat Proyek
**Business Purpose:** Form untuk membuat proyek baru. Proyek bisa dibuat dari dua cara: konversi dari prospek yang sudah disetujui (data sebagian pre-filled) atau dibuat langsung (tanpa prospek). Penentuan tipe proyek (Tender/Prospecting) di form ini menentukan alur workflow yang akan berlaku.
**User Roles:** Cabang, Admin
**Route:** `/projects/new`
**Navigation Entry Point:**
- Tombol "Buat Proyek Baru" di PROS-01 (PROJ-01)
- Modal Konversi ke Proyek di PROS-03

**Components:**

| Komponen | Tipe | Detail |
|---|---|---|
| PageHeader | Molecule | Judul "Buat Proyek Baru", breadcrumb |
| Form Card | Container | max-w-2xl centered |
| Select: Tipe Proyek | Radio/Select | "Tender" atau "Prospecting" — wajib; menentukan field selanjutnya |
| Input: Nama Proyek | Input | Required, 3–200 char |
| Select: Customer | Select | Searchable async, required |
| Select: Kategori Proyek | Select | Dari /api/master/categories, required |
| Input: Sumber Prospek | Select | Optional; pilih dari daftar prospek yang sudah approved (jika ada); info pre-fill |
| Input: Estimasi Nilai (Rp) | CurrencyInput | Optional |
| Input: Estimasi Tanggal Close | DatePicker | Optional |
| Textarea: Keterangan | Textarea | Optional, max 1000 char |
| Tombol "Buat Proyek" | Button | variant=primary |
| Tombol "Batal" | Button | variant=ghost |

**Actions:**

| Aksi | Trigger | Behavior |
|---|---|---|
| Submit | Klik "Buat Proyek" | Validasi → POST /api/projects → redirect ke /projects/:id |
| Batal | Klik "Batal" | Navigate ke /projects |
| Pilih Prospek Sumber | Select prospek | Pre-fill nama, customer, estimasi nilai dari data prospek terpilih |

**Validation Rules:**

| Field | Rule | Pesan Error |
|---|---|---|
| Tipe Proyek | Required | "Tipe proyek wajib dipilih" |
| Nama Proyek | Required, 3–200 char | "Nama proyek wajib diisi (3–200 karakter)" |
| Customer | Required | "Customer wajib dipilih" |
| Kategori Proyek | Required | "Kategori proyek wajib dipilih" |

**API Dependencies:**

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | /api/master/customers | Async search |
| GET | /api/master/categories | Daftar kategori proyek |
| GET | /api/prospects?status=approved | Daftar prospek tersedia untuk dijadikan sumber |
| POST | /api/projects | Buat proyek baru |

**Business Rules:**
- BR-PROJ-06: Tipe proyek menentukan workflow yang aktif: Tender menggunakan alur penuh (RKS → Dept Review → LPHS/SIOS → Harga → dst.); Prospecting menggunakan alur lebih singkat (langsung ke Harga).
- BR-PROJ-07: Jika proyek dibuat dari prospek, `source_prospect_id` disimpan; prospek tersebut ditandai sebagai "sudah dikonversi".
- BR-PROJ-08: Cabang hanya bisa membuat proyek untuk cabangnya sendiri; sistem mengisi `branch_id` dari token user secara otomatis.

**Related GAP/CFG/MD Reference:**
- MD-04 (Master Kategori Proyek)
- CFG-11 (Konfigurasi Kategori Proyek)
- GAP-05 (Hierarki Organisasi — branch assignment otomatis)

**Responsive Behavior:** Form satu kolom di semua breakpoint; max-w-2xl centered.

**Accessibility Requirements:** Semua field dengan label terasosiasi; radio tipe proyek menggunakan `<fieldset>` dan `<legend>`.

---

## SCREEN: PROJ-03 — Detail Proyek

**Screen ID:** PROJ-03
**Screen Name:** Detail Proyek
**Business Purpose:** Pusat kendali operasional satu proyek. Menampilkan semua informasi dan menyediakan semua aksi yang dibutuhkan oleh setiap aktor dalam alur tender: Cabang mengisi data, PM melakukan review, Dept melakukan review LPHS, Management memberikan approval final, semua pihak memantau progress. Tab yang ditampilkan disesuaikan dengan tipe proyek dan status saat ini.
**User Roles:** Semua role (dengan scope dan aksi berbeda)
**Route:** `/projects/:id`
**Navigation Entry Point:**
- Klik nama proyek di PROJ-01
- Tombol "Buka" di PROJ-01
- Link dari notifikasi
- Link dari widget Dashboard
- Link dari Approval Inbox

**Components Level Layar:**

| Komponen | Tipe | Detail |
|---|---|---|
| Sticky Header | Container | Nama proyek, badge tipe, badge status, tombol aksi kontekstual; sticky saat scroll |
| Stepper Progress | StatusStepper | Horizontal (desktop) / vertikal (mobile); tahap aktif di-highlight |
| Tab Navigation | Tab List | Daftar tab yang relevan; tab tidak relevan disembunyikan (bukan disabled) |
| Tab Panel | Tab Content | Konten berubah sesuai tab aktif |

**Tab Visibility per Tipe Proyek:**

| Tab | Tender | Prospecting | Keterangan |
|---|:---:|:---:|---|
| Overview | ✓ | ✓ | Selalu tampil |
| RKS | ✓ | — | Hanya tender |
| Review RKS | ✓ | — | Hanya tender, PM yang melihat |
| LPHS/SIOS | ✓ | — | Hanya tender |
| Harga | ✓ | ✓ | Kedua tipe |
| Kompetitor | ✓ | ✓ | Kedua tipe |
| Pemenang | ✓ | ✓ | Kedua tipe |
| Target Delivery | ✓ | ✓ | Kedua tipe |
| Timeline | ✓ | ✓ | Selalu tampil |
| Dokumen | ✓ | ✓ | Selalu tampil |

---

## SUB-SCREEN: PROJ-03a — Tab Overview

**Screen ID:** PROJ-03a
**Screen Name:** Detail Proyek — Tab Overview
**Business Purpose:** Tampilan ringkasan cepat semua informasi penting proyek dalam satu pandangan: identitas proyek, progress saat ini, siapa yang bertanggung jawab, dan 5 event terakhir.

**Components:**

| Komponen | Tipe | Detail |
|---|---|---|
| Info Card: Identitas Proyek | Card | Customer, tipe, nilai estimasi, tanggal dibuat, nomor tender (jika ada) |
| Info Card: Sumber Prospek | Card | Nama prospek sumber + link ke PROS-03; hanya tampil jika ada |
| Progress Card | Card | Tahap saat ini (bold), tahap berikutnya, nama actor yang bertanggung jawab |
| Timeline Mini | List | 5 event terakhir + link "Lihat semua timeline →" ke Tab Timeline |
| Dokumen Ringkasan | List | Daftar dokumen terakhir diupload per kategori + link "Lihat semua dokumen →" ke Tab Dokumen |

**API Dependencies:**
- GET /api/projects/:id — sudah di-load di level parent; tidak perlu call tambahan untuk overview

---

## SUB-SCREEN: PROJ-03b — Tab RKS

**Screen ID:** PROJ-03b
**Screen Name:** Detail Proyek — Tab RKS (Rencana Kerja & Syarat)
**Business Purpose:** Formulir pengisian data RKS oleh Cabang dan area review oleh PM. Berisi nomor tender, nama tender, deadline, upload dokumen tender, dan pertanyaan master yang harus dijawab sebelum proyek dapat melanjutkan ke tahap review departemen.
**User Roles:** Cabang (edit), PM (read-only + action approve/revisi), Admin (full)
**Visibility:** Hanya pada proyek tipe Tender.

**Components:**

| Field | Tipe | Validasi | Keterangan |
|---|---|---|---|
| Nomor Tender | Input text | Required; unik per customer (validasi backend) | Backend validasi uniqueness |
| Nama Tender | Input text | Required, 3–200 char | |
| Deadline Tender | DatePicker | Required; tidak boleh past date | Date picker dengan disable past dates |
| Upload Dokumen Tender | FileDropzone | Required; PDF/DOCX max 25 MB | Nama file + ukuran + ikon preview setelah upload |
| Pertanyaan Master | DynamicQuestionForm | Semua required harus terisi saat submit | Di-render dari /api/master/questions?type=rks |
| Catatan Tambahan | Textarea | Optional, max 2000 char | |

**Actions:**

| Aksi | Role | Trigger | Behavior |
|---|---|---|---|
| Simpan RKS | Cabang | Klik "Simpan RKS" | Save tanpa kirim ke review; validasi dasar |
| Kirim ke Review | Cabang | Klik "Kirim ke Review" | Validasi lengkap → POST /api/projects/:id/rks (dengan flag submit=true) |
| Approve RKS | PM | Klik "Approve RKS" | Validasi: semua jawaban review PM sudah terisi → POST /api/projects/:id/rks/approve |
| Kirim Revisi | PM | Klik "Kirim Revisi" | Minimal 1 pertanyaan review → POST /api/projects/:id/rks/revise |

**Mode Edit/Read-only:**
- Edit mode: Cabang jika status = created, submit_rks, atau revision
- Read-only mode: PM, Dept, Management; Cabang jika status ≠ editable

**API Dependencies:**
- GET /api/master/questions?type=rks
- PUT /api/projects/:id/rks
- POST /api/projects/:id/rks/approve
- POST /api/projects/:id/rks/revise

**Business Rules:**
- BR-RKS-01: Deadline tender harus lebih besar dari tanggal saat ini.
- BR-RKS-02: Nomor tender harus unik dalam scope customer yang sama.
- BR-RKS-03: Upload dokumen tender wajib ada sebelum submit ke review.
- BR-RKS-04: PM hanya bisa Approve jika semua pertanyaan review sudah dijawab oleh Cabang.

**Related GAP/CFG/MD Reference:** FR030–FR033 (RKS Module), MD-11 (Master Tipe Dokumen)

---

## SUB-SCREEN: PROJ-03c — Tab Review RKS

**Screen ID:** PROJ-03c
**Screen Name:** Detail Proyek — Tab Review RKS (Panel Review PM)
**Business Purpose:** Tampilan khusus PM untuk melakukan review RKS. PM dapat menambah pertanyaan review, melihat jawaban Cabang, dan memutuskan untuk approve atau kirim revisi. Pertanyaan dan jawaban ditampilkan dalam layout dua kolom.
**User Roles:** PM (edit + aksi), Cabang (jawab jika revision), Admin (full)
**Visibility:** Hanya pada proyek tipe Tender; tampil saat status = submit_rks, revision, atau lebih lanjut.

**Components:**

| Komponen | Tipe | Detail |
|---|---|---|
| Header Panel Review | Text | "Review RKS oleh PM" + badge status approval PM |
| Badge Progress | Badge | "X dari Y pertanyaan terjawab" |
| ReviewQuestionPanel | Molecule | Dua kolom: Pertanyaan PM (kiri) + Jawaban Cabang (kanan) |
| Baris Pertanyaan | Row | Field teks pertanyaan (PM edit) + Field jawaban (Cabang edit jika revision) |
| Tombol "+ Tambah Pertanyaan" | Button | PM menambah baris pertanyaan baru |
| Tombol Hapus Baris | IconButton | PM menghapus pertanyaan yang sudah ditambahkan |
| Catatan Umum PM | Textarea | Catatan tambahan PM untuk Cabang |
| Tombol "Approve RKS" | Button | variant=success; hanya PM |
| Tombol "Kirim Revisi" | Button | variant=warning; hanya PM |

**Validation Rules:**
- Kirim Revisi: minimal 1 pertanyaan review wajib ada
- Approve RKS: semua pertanyaan yang ada harus sudah dijawab oleh Cabang

**Related GAP/CFG/MD Reference:** FR031–FR032 (RKS Review), GAP-07 (backup approver PM)

---

## SUB-SCREEN: PROJ-03d — Tab LPHS/SIOS

**Screen ID:** PROJ-03d
**Screen Name:** Detail Proyek — Tab LPHS/SIOS
**Business Purpose:** Manajemen proses LPHS (Lembar Permintaan Harga Satuan) dan SIOS dalam satu tab terpadu. Melibatkan multi-actor secara paralel: Cabang mengupload draft, PM melakukan review, setiap departemen yang dipilih melakukan review independen (paralel), dan Management memberikan persetujuan final setelah semua departemen setuju. Sistem mendukung revisi yang ditargetkan ke departemen tertentu.
**User Roles:** Cabang, PM, Dept (hanya departemennya), Management, Admin
**Visibility:** Hanya pada proyek tipe Tender.

**Components:**

| Sub-Panel | Role yang Melihat | Konten |
|---|---|---|
| Pilih Departemen | Cabang | Checklist departemen yang harus terlibat dalam review; hanya bisa diubah sebelum draft diupload |
| Upload Draft LPHS | Cabang | FileDropzone + input link eksternal (Google Docs URL) |
| Upload Draft SIOS | Cabang | FileDropzone PDF/DOCX |
| Review PM | PM | Approve / Revisi dengan catatan; badge status approval PM |
| Review per Departemen | Dept | Setiap dept hanya melihat panel approval departemennya sendiri; Approve / Revisi dengan catatan per departemen |
| Status Matrix | Semua | Tabel: Departemen | Status | Approver | Tgl Approval | Catatan; progress ring visual "X dari Y departemen approve" |
| Approval Management | Management | Tampil setelah semua dept approve; Approve / Revisi final |

**Parallelisasi Review (sesuai BA Review GAP-08 / BP-02):**
- Setelah Cabang upload draft dan PM mulai review, departemen-departemen yang dipilih BISA mulai mereview secara paralel dengan PM
- Departemen TIDAK BISA memberikan approval final sampai PM sudah approve
- Departemen BISA memberikan catatan dan pertanyaan sementara PM masih review
- Implementasi: status per-departemen memiliki dua sub-status: `reviewing` (bisa mulai, PM belum approve) dan `pending_pm` (menunggu PM approve baru bisa submit approval)

**Targeted Revision LPHS (sesuai BA Review BP-03):**
- Saat PM atau Management mengirim revisi, sistem menampilkan dialog: "Revisi ini terkait dengan departemen mana?"
- User memilih satu atau beberapa departemen yang perlu merevisi
- Hanya approval departemen yang dipilih yang direset; departemen lain tidak perlu approve ulang
- Riwayat "targeted revision" tersimpan di audit trail

**Actions:**

| Aksi | Role | Behavior |
|---|---|---|
| Pilih Departemen | Cabang | Checklist toggle; dikunci setelah draft diupload |
| Upload Draft LPHS | Cabang | FileDropzone → POST /api/documents/upload → link ke proyek |
| Input Link LPHS | Cabang | Validasi URL valid; disimpan sebagai link_lphs |
| Upload Draft SIOS | Cabang | FileDropzone |
| Approve LPHS (PM) | PM | POST /api/projects/:id/lphs/approve?actor=pm |
| Kirim Revisi (PM) | PM | Dialog pilih departemen target → POST /api/projects/:id/lphs/revise |
| Approve LPHS (Dept) | Dept | POST /api/projects/:id/lphs/approve?actor=dept&deptId=xxx |
| Revisi per Dept | Dept | Catatan per departemen → POST /api/projects/:id/lphs/revise?deptId=xxx |
| Approve Final (Mgmt) | Management | POST /api/projects/:id/lphs/approve?actor=management |
| Revisi Final (Mgmt) | Management | Dialog pilih dept target → POST revisi |

**API Dependencies:**
- PUT /api/projects/:id/lphs
- POST /api/projects/:id/lphs/approve (dengan query param actor + deptId)
- POST /api/projects/:id/lphs/revise (dengan body targetDepts)
- POST /api/documents/upload
- GET /api/master/departments

**Business Rules:**
- BR-LPHS-01: Pilihan departemen dikunci setelah draft LPHS pertama diupload.
- BR-LPHS-02: Departemen dapat mulai review bersamaan dengan PM (GAP-08/BP-02); namun approval final dept hanya bisa disubmit setelah PM approve.
- BR-LPHS-03: Revisi dari PM atau Management dapat ditargetkan ke departemen tertentu; hanya approval dept terpilih yang direset (BP-03).
- BR-LPHS-04: Management hanya bisa approve setelah 100% departemen yang dipilih sudah approve.
- BR-LPHS-05: Semua catatan review per departemen tersimpan di audit trail.

**Related GAP/CFG/MD Reference:**
- GAP-08 (parallelisasi review dept + PM — BP-02)
- BP-03 (revisi LPHS tertarget per departemen)
- FR040–FR045 (LPHS/SIOS Module)

**Responsive Behavior:**
- Mobile: Stack vertikal per sub-panel; status matrix menggunakan horizontal scroll
- Desktop: Sub-panel dalam accordion atau split pane

---

## SUB-SCREEN: PROJ-03e — Tab Harga

**Screen ID:** PROJ-03e
**Screen Name:** Detail Proyek — Tab Harga Penawaran
**Business Purpose:** Input dan tampilan harga penawaran yang akan diajukan dalam tender. Hanya Cabang yang bisa mengisi; role lain read-only. Data ini menjadi dasar kalkulasi win/loss setelah pengumuman pemenang.
**User Roles:** Cabang (edit), PM/Dept/Management (read-only), Admin (full)

**Components & Fields:**

| Field | Tipe | Validasi |
|---|---|---|
| Harga Penawaran (Rp) | CurrencyInput | Required, > 0 |
| Margin (%) | Input number | Required, 0–100 |
| Catatan Harga | Textarea | Optional, max 1000 char |
| Dokumen Pendukung | FileDropzone | Optional, max 25 MB |
| Link Referensi | Input url | Optional, validasi format URL |

**API Dependencies:** PUT /api/projects/:id/harga

**Business Rules:**
- BR-HARGA-01: Harga penawaran hanya bisa diisi/diedit oleh Cabang saat status = submit_harga.
- BR-HARGA-02: Setelah disubmit, harga menjadi read-only untuk semua role.

---

## SUB-SCREEN: PROJ-03f — Tab Kompetitor

**Screen ID:** PROJ-03f
**Screen Name:** Detail Proyek — Tab Kompetitor
**Business Purpose:** Mencatat informasi kompetitor yang ikut dalam tender beserta estimasi harga penawaran dan analisis kelebihan mereka. Data kompetitor dihubungkan ke Master Kompetitor (bukan lagi JSON bebas) untuk memungkinkan analisis lintas proyek.
**User Roles:** Cabang (edit), semua role (read-only), Admin (full)

**Components:**

| Komponen | Detail |
|---|---|
| Tabel Kompetitor | Kolom: Nama Kompetitor | Estimasi Harga | Kelebihan | Keterangan |
| Baris Tambah Inline | Form inline di bawah tabel; nama required; lookup ke Master Kompetitor |
| Edit Inline | Klik ikon edit per baris; bukan modal |
| Hapus per Baris | Klik ikon hapus dengan konfirmasi inline |
| Select Kompetitor | Searchable dropdown; pilih dari Master Kompetitor atau tambah baru |

**API Dependencies:**
- PUT /api/projects/:id/kompetitor
- GET /api/master/competitors (untuk lookup)

**Business Rules:**
- BR-KOMP-01: Nama kompetitor harus dipilih dari Master Kompetitor, bukan input bebas, untuk memungkinkan analisis lintas proyek (GAP-09).
- BR-KOMP-02: Jika kompetitor belum ada di master, user bisa klik "+ Tambah Kompetitor Baru" yang akan membuka mini-form inline dan menyimpan ke Master Kompetitor sekaligus.
- BR-KOMP-03: Cabang dapat edit; role lain read-only.

**Related GAP/CFG/MD Reference:**
- GAP-09 (normalisasi Master Kompetitor dari JSON bebas)
- MD-14 (Master Kompetitor)

---

## SUB-SCREEN: PROJ-03g — Tab Pemenang

**Screen ID:** PROJ-03g
**Screen Name:** Detail Proyek — Tab Pemenang
**Business Purpose:** Input hasil akhir tender (menang atau kalah) beserta dokumentasi yang diperlukan. Jika menang: input nilai kontrak dan upload dokumen SPK/Kontrak. Jika kalah: input alasan kekalahan terstruktur dari dropdown master dan upload surat kekalahan. Data ini menjadi basis laporan win/loss dan analitik kompetitor.
**User Roles:** Cabang (input hasil), semua role (read-only), Admin (full)
**Visibility:** Form aktif hanya saat status = pengumuman_pemenang; setelah submit: read-only.

**Components & Fields:**

| Field | Tipe | Kondisi | Validasi |
|---|---|---|---|
| Hasil Tender | Radio | Selalu | Required; opsi: "Menang" / "Kalah" |
| Nilai Kontrak (Rp) | CurrencyInput | Jika Menang | Required |
| Alasan Kekalahan | Select dari master | Jika Kalah | Required (dari MD-15 Master Alasan Kekalahan) |
| Catatan Kekalahan | Textarea | Jika Kalah | Optional, max 2000 char |
| Dokumen SPK/Kontrak | FileDropzone | Jika Menang | Required |
| Dokumen Surat Kekalahan | FileDropzone | Jika Kalah | Optional |
| Catatan Tambahan | Textarea | Selalu | Optional |

**API Dependencies:** PUT /api/projects/:id/pemenang

**Business Rules:**
- BR-PEMEN-01: Form ini hanya aktif saat status = `pengumuman_pemenang`.
- BR-PEMEN-02: Alasan kekalahan harus dipilih dari Master Alasan Kekalahan (GAP-12), bukan freeform teks.
- BR-PEMEN-03: Setelah submit hasil pemenang: status proyek bergerak ke `target_delivery` (jika menang) atau `selesai` (jika kalah).

**Related GAP/CFG/MD Reference:**
- GAP-12 (field alasan kekalahan terstruktur)
- MD-14 (Master Kompetitor — siapa pemenangnya)
- FR060 (Pemenang Tender)

---

## SUB-SCREEN: PROJ-03h — Tab Target Delivery

**Screen ID:** PROJ-03h
**Screen Name:** Detail Proyek — Tab Target Delivery
**Business Purpose:** Mengatur timeline delivery proyek yang sudah menang tender. Cabang mengisi tanggal mulai dan selesai delivery. Setelah konfirmasi selesai, proyek berubah status menjadi selesai.
**User Roles:** Cabang (input), semua role (read-only), Admin (full)
**Visibility:** Hanya relevan saat status = target_delivery.

**Components & Fields:**

| Field | Tipe | Validasi |
|---|---|---|
| Tanggal Mulai | DatePicker | Required |
| Tanggal Selesai | DatePicker | Required, harus > Tanggal Mulai |
| Keterangan | Textarea | Optional |
| Tombol "Konfirmasi Selesai" | Button | Muncul setelah form terisi; dialog konfirmasi sebelum aksi |

**API Dependencies:** PUT /api/projects/:id/delivery

**Business Rules:**
- BR-DELIVERY-01: Tanggal selesai harus lebih besar dari tanggal mulai.
- BR-DELIVERY-02: "Konfirmasi Selesai" mengubah status proyek ke `selesai` dan mengirim notifikasi ke PM dan Management.

---

## SUB-SCREEN: PROJ-03i — Tab Timeline

**Screen ID:** PROJ-03i
**Screen Name:** Detail Proyek — Tab Timeline
**Business Purpose:** Rekaman lengkap dan kronologis semua aktivitas yang terjadi dalam lifecycle proyek. Menjadi referensi audit trail visual untuk semua pihak.
**User Roles:** Semua role (read-only)

**Components:**

| Komponen | Detail |
|---|---|
| Filter Chip | Semua | Perubahan Status | Approval | Upload Dokumen | Revisi |
| Feed Vertikal | Setiap event: garis vertikal penghubung |
| Event Item | Ikon (per tipe, berwarna), deskripsi aksi (bold), nama actor, nama cabang, timestamp relative (hover: absolute) |

**Tipe Event dan Ikon:**

| Tipe Event | Ikon | Warna |
|---|---|---|
| Dibuat / Status Change | Arrow-right-circle | Abu-abu atau biru per status |
| Disubmit | Send | Biru |
| Approval | Check-circle | Hijau |
| Revisi Dikirim | Edit-2 | Kuning |
| Upload Dokumen | Upload-cloud | Ungu |
| Dibatalkan | X-circle | Merah |
| Notifikasi | Bell | Abu-abu |

**API Dependencies:** GET /api/projects/:id/timeline

**Business Rules:**
- BR-TIMELINE-01: Timeline adalah append-only; tidak ada yang bisa edit atau hapus event timeline.
- BR-TIMELINE-02: Semua event dari semua actor tersimpan; tidak ada filtering per role.

---

## SUB-SCREEN: PROJ-03j — Tab Dokumen

**Screen ID:** PROJ-03j
**Screen Name:** Detail Proyek — Tab Dokumen
**Business Purpose:** Repositori terpusat semua dokumen yang terhubung ke proyek. Dokumen dikelompokkan per tipe (RKS, LPHS, SIOS, Harga, Kontrak, Lainnya). Mendukung versioning dokumen sehingga upload ulang menghasilkan versi baru, bukan overwrite.
**User Roles:** Semua role (lihat + download); Cabang + Admin (upload tambahan)

**Components:**

| Komponen | Detail |
|---|---|
| Grup per Tipe | Accordion atau section header per tipe dokumen (dari MD-11) |
| File Item | Nama file, tipe, ukuran (format KB/MB), nama uploader, tanggal upload, tombol Download, badge versi |
| Badge Versi | "v1", "v2", dst.; "Terbaru" badge pada versi terkini |
| Histori Versi | Accordion expand per file untuk melihat semua versi sebelumnya |
| Tombol Upload Tambahan | Hanya untuk kategori "Lainnya"; semua role bisa upload dokumen tambahan |
| FileVersionUpload | Komponen; upload + tampil histori versi; badge "Terbaru" |

**API Dependencies:**
- GET /api/projects/:id/documents
- POST /api/documents/upload (multipart)
- GET /api/documents/:id/download (stream authenticated)

**Business Rules:**
- BR-DOK-01: Upload ulang dokumen yang sama tipenya menghasilkan versi baru, bukan overwrite file lama (GAP-14).
- BR-DOK-02: Download dokumen memerlukan autentikasi; endpoint download men-stream file dari storage.
- BR-DOK-03: Semua user yang memiliki akses ke proyek dapat mendownload semua dokumen proyek tersebut.
- BR-DOK-04: Upload dokumen tambahan (kategori "Lainnya") tersedia untuk semua role; tercatat di timeline.

**Related GAP/CFG/MD Reference:**
- GAP-14 (versioning dokumen)
- MD-11 (Master Tipe Dokumen)
- CFG-13 (Konfigurasi Ukuran & Tipe File Upload)
- FR070–FR071 (Document Upload)

---

## SCREEN: APPR-01 — Approval Inbox

**Screen ID:** APPR-01
**Screen Name:** Approval Inbox
**Business Purpose:** Satu halaman terpusat yang menampilkan semua item yang membutuhkan tindakan approval dari user yang sedang login. Mengeliminasi kebutuhan user untuk menelusuri semua proyek satu per satu untuk menemukan apa yang perlu di-approve. Dilengkapi SLA indicator untuk prioritisasi.
**User Roles:** PM, Dept, Management, Admin
**Route:** `/approvals`
**Navigation Entry Point:** Sidebar menu item "Approval Inbox" (dengan badge merah count pending); widget Approval Pending di Dashboard.

**Components:**

| Komponen | Tipe | Detail |
|---|---|---|
| PageHeader | Molecule | "Approval Inbox", count total pending di subtitle |
| FilterBar | Molecule | Filter tipe + filter SLA status + filter cabang |
| Filter: Tipe Approval | Select | Semua / Prospek / RKS / LPHS |
| Filter: Status SLA | Select | Semua / Normal / Mendekati Batas / Terlewat |
| Filter: Cabang | Select | PM, Mgmt, Admin bisa filter per cabang |
| Grup Header | Text | "Prospek Menunggu Review" | "RKS Menunggu Review" | "LPHS Menunggu Persetujuan" |
| DataTable / List | Molecule | Grouped per tipe approval |
| Kolom: Nama | Text + Link | Nama prospek/proyek; link ke detail |
| Kolom: Tipe | Badge | Prospek / RKS / LPHS |
| Kolom: Cabang | Text | Cabang asal |
| Kolom: Menunggu Sejak | Text | Tanggal + relative time ("3 hari lalu") |
| Kolom: SLA Sisa | Badge | Hari kerja tersisa; merah ≤ 1 hari; kuning 2 hari |
| Kolom: Aksi | Button | "Review" — buka SlideDrawer |
| Sort Default | — | ASC by "Menunggu Sejak" (terlama di atas) |
| EmptyState | Molecule | Jika tidak ada item pending |
| SlideDrawer | Overlay | Drawer review (APPR-02) |

**Actions:**

| Aksi | Trigger | Behavior |
|---|---|---|
| Buka Review Drawer | Klik "Review" | Slide-in drawer APPR-02 dari kanan |
| Filter Tipe | Dropdown | Re-fetch dengan filter |
| Filter SLA | Dropdown | Re-fetch |
| Sortir | Klik header kolom | Re-sort |

**API Dependencies:**
- GET /api/approvals/pending?role=&type=&branchId=
- (Data SLA dihitung dari konfigurasi CFG-05 dan tanggal submission)

**Loading State:** Skeleton list 5 item saat initial load.

**Empty State:**

| Konteks | Ilustrasi | Teks |
|---|---|---|
| Tidak ada pending sama sekali | Centang besar (outline) | "Semua sudah ditangani! Tidak ada item yang perlu ditinjau. ✓" |
| Filter tidak menemukan | Kaca pembesar X | "Tidak ada item yang cocok dengan filter" |

**Error State:** Toast + retry.

**Permission Matrix:**

| Role | Akses | Scope Data |
|---|---|---|
| Cabang | — | Tidak ada akses ke halaman ini |
| PM | ✓ | Prospek pending + RKS pending yang merupakan tanggung jawabnya |
| Dept | ✓ | LPHS pending untuk departemennya saja |
| Management | ✓ | LPHS pending yang butuh approval management |
| Admin | ✓ | Semua pending dari semua jenis dan semua user |

**Business Rules:**
- BR-APPR-01: Approval Inbox menampilkan item berdasarkan assignment — bukan semua approval yang ada di sistem, tapi yang ditujukan kepada user yang login.
- BR-APPR-02: SLA sisa dihitung dalam hari kerja berdasarkan konfigurasi CFG-05 dan Master Hari Libur (MD-13).
- BR-APPR-03: Item yang sudah di-approve atau sudah dikirim revisi akan hilang dari inbox setelah aksi berhasil (optimistic update + query invalidation).
- BR-APPR-04: Item yang SLA-nya terlewat ditandai merah dengan teks "SLA TERLEWAT" dan muncul di posisi teratas list.

**Related GAP/CFG/MD Reference:**
- GAP-06 (SLA enforcement pada approval)
- GAP-07 (re-assign approval jika approver tidak aktif)
- GAP-08 (parallelisasi review)
- CFG-05 (Konfigurasi SLA per tahap)
- CFG-06 (Konfigurasi Reminder & Eskalasi)
- MD-13 (Master Hari Libur untuk kalkulasi hari kerja SLA)
- D.5 dari BA Review (Approval Summary View)

**Responsive Behavior:**
- Mobile: List item sebagai card; drawer menjadi fullscreen
- Desktop: List dengan tabel; drawer lebar 480px dari kanan

**Accessibility Requirements:**
- Badge SLA tidak menggunakan warna saja; teks "SLA sisa: X hari" atau "SLA TERLEWAT"
- Tombol "Review" memiliki `aria-label="Review [tipe]: [nama item]"`
- List grouped menggunakan `<section>` dengan `aria-labelledby` per grup header

---

## SCREEN: APPR-02 — Review Drawer

**Screen ID:** APPR-02
**Screen Name:** Review Drawer (Overlay)
**Business Purpose:** Drawer slide-in yang memungkinkan approver melakukan review dan mengambil keputusan approval tanpa meninggalkan halaman Approval Inbox. Mengurangi context-switching dan mempercepat proses approval.
**User Roles:** PM, Dept, Management, Admin
**Route:** Tidak memiliki route tersendiri; overlay di atas APPR-01
**Navigation Entry Point:** Klik "Review" di APPR-01

**Components:**

| Komponen | Tipe | Detail |
|---|---|---|
| SlideDrawer | Molecule | Slide dari kanan; lebar 480px desktop; fullscreen mobile; backdrop |
| Drawer Header | Container | Nama item, tipe, badge status, tombol close (X) |
| Konten Scrollable | Container | Konten review sesuai tipe approval |
| Footer Sticky | Container | Tombol aksi (Approve + Kirim Revisi + Tutup) |
| **KONTEN UNTUK PROSPEK** | | |
| Ringkasan Prospek | Text | Nama, customer, estimasi nilai, tanggal dibuat |
| Jawaban Checklist | List | Read-only jawaban pertanyaan prospek |
| **KONTEN UNTUK RKS** | | |
| Ringkasan Proyek | Text | Nama proyek, customer, tipe, cabang |
| Data RKS | Info | Nomor tender, nama tender, deadline |
| Link Dokumen Tender | Link | Download dokumen tender |
| Panel Pertanyaan Review | ReviewQuestionPanel | Dua kolom: pertanyaan PM + jawaban Cabang |
| **KONTEN UNTUK LPHS** | | |
| Ringkasan Proyek | Text | Info dasar proyek |
| Link Draft LPHS/SIOS | Link/Download | Link ke dokumen atau URL eksternal |
| Status Matrix Dept | ApprovalMatrix | Status approval tiap departemen |
| **FOOTER ACTIONS** | | |
| Tombol "Approve" | Button | variant=success; konfirmasi inline di dalam drawer (bukan modal terpisah) |
| Tombol "Kirim Revisi" | Button | variant=warning; expand form revisi di dalam drawer |
| Tombol "Tutup" | Button | variant=ghost |
| Form Revisi (inline expand) | Form | Textarea catatan revisi; untuk LPHS: pilih dept target |

**Actions:**

| Aksi | Trigger | Behavior |
|---|---|---|
| Approve | Klik "Approve" | Konfirmasi inline ("Yakin ingin approve?") → API call → drawer tutup → item hilang dari list |
| Kirim Revisi | Klik "Kirim Revisi" | Form revisi expand di dalam drawer → isi catatan → submit → drawer tutup → item hilang |
| Tutup | Klik X atau "Tutup" | Drawer slide-out; kembali ke APPR-01 |
| Backdrop klik | Klik di luar drawer | Tutup drawer (jika tidak ada perubahan form yang belum disave) |
| Esc | Keyboard | Tutup drawer |

**Business Rules:**
- BR-APPR-05: Setelah approve atau kirim revisi berhasil, drawer ditutup secara otomatis dan item dihilangkan dari APPR-01 (optimistic update + query invalidation).
- BR-APPR-06: Drawer tidak membuka halaman baru; semua aksi dilakukan dalam konteks drawer untuk meminimalkan interupsi.
- BR-APPR-07: Untuk LPHS revision, form di dalam drawer menampilkan checklist departemen yang bisa dipilih sebagai target revisi.

**Related GAP/CFG/MD Reference:** GAP-08 (parallelisasi), BP-03 (targeted revision)

**Accessibility Requirements:**
- SlideDrawer menggunakan `role="dialog"` dan `aria-modal="true"`
- Fokus trap aktif saat drawer terbuka
- Esc menutup drawer; fokus kembali ke tombol "Review" yang membuka drawer
- Konten drawer dapat di-scroll dengan keyboard

---

## SCREEN: MAST-01 — Master Customer

**Screen ID:** MAST-01
**Screen Name:** Master Customer
**Business Purpose:** CRUD data customer untuk digunakan sebagai referensi dalam pembuatan prospek dan proyek. Menjamin konsistensi nama customer dan memungkinkan analitik per customer.
**User Roles:** Admin
**Route:** `/master/customers`
**Navigation Entry Point:** Sidebar menu "Master → Customer"

**Components:**

| Komponen | Detail |
|---|---|
| PageHeader | "Master Customer", tombol "Tambah Customer" |
| FilterBar | Search (nama/kode) + filter Status (Aktif/Nonaktif/Semua) |
| DataTable | Kolom: No | Nama Customer | Kode | Jenis | Kontak PIC | Status | Aksi |
| Modal Form | Tambah/Edit customer; field sesuai spec |
| Tombol Aksi | Edit (modal), Nonaktifkan/Aktifkan |

**Form Fields:**

| Field | Tipe | Validasi |
|---|---|---|
| Nama Customer | Input text | Required, 2–200 char, unique |
| Kode Customer | Input text | Required, uppercase, alphanumeric, 3–10 char; auto-generate opsional |
| Jenis | Select | Required; opsi: Swasta / BUMN / Pemerintah |
| Kontak PIC | Input text | Optional |
| Email | Input email | Optional, format email valid |
| Telepon | Input tel | Optional |
| Alamat | Textarea | Optional |
| Status | Toggle | Aktif/Nonaktif; default Aktif |

**Actions:**
- Tambah Customer: buka modal form kosong → POST /api/master/customers
- Edit: buka modal form pre-filled → PUT /api/master/customers/:id
- Nonaktifkan/Aktifkan: konfirmasi → PUT /api/master/customers/:id (status toggle) — soft delete
- Admin tidak bisa hapus permanen; hanya nonaktifkan

**API Dependencies:**
- GET /api/master/customers?search=&isActive=&page=&perPage=
- POST /api/master/customers
- PUT /api/master/customers/:id

**Loading State:** Skeleton 5 baris tabel saat load; spinner di tombol "Simpan" saat submit modal.

**Empty State:** "Belum ada customer terdaftar. Tambahkan customer pertama." + tombol CTA.

**Business Rules:**
- BR-MAST-01: Kode customer harus unik dalam sistem.
- BR-MAST-02: Customer yang sudah digunakan dalam proyek tidak bisa dinonaktifkan tanpa peringatan; tampilkan "Customer ini digunakan dalam X proyek aktif".
- BR-MAST-03: Customer nonaktif tidak muncul di dropdown pembuatan prospek/proyek.

**Related GAP/CFG/MD Reference:** MD-04 (relasi ke Kategori Proyek), FR020 (Master Customer)

**Responsive Behavior:** Modal full-screen di mobile; tabel dengan horizontal scroll atau card stack.

**Accessibility Requirements:** Modal dengan fokus trap; Esc tutup modal; field dengan label `htmlFor`.

---

## SCREEN: MAST-02 — Master Departemen

**Screen ID:** MAST-02
**Screen Name:** Master Departemen
**Business Purpose:** CRUD data departemen yang digunakan dalam penentuan reviewer LPHS dan penetapan posisi approver dalam workflow.
**User Roles:** Admin
**Route:** `/master/departments`
**Navigation Entry Point:** Sidebar "Master → Departemen"

**Components:** Menggunakan pola umum Master Data (PageHeader + FilterBar + DataTable + Modal Form).

**Form Fields:**

| Field | Tipe | Validasi |
|---|---|---|
| Nama Departemen | Input text | Required, unique |
| Kode | Input text | Required, 2–10 char, uppercase |
| Kepala Departemen | Select user | Optional; filter role=department |
| Divisi | Select | Optional; dari master divisi (jika sudah dikonfigurasi di CFG-01) |
| Status | Toggle | Aktif/Nonaktif; default Aktif |

**API Dependencies:**
- GET /api/master/departments
- POST /api/master/departments
- PUT /api/master/departments/:id

**Business Rules:**
- BR-MAST-04: Departemen nonaktif tidak muncul di checklist pemilihan dept pada LPHS.
- BR-MAST-05: Kepala Departemen adalah user dengan role `department`; system menggunakan data ini untuk routing approval berbasis posisi (bukan nama user spesifik).

**Related GAP/CFG/MD Reference:**
- GAP-05 (hierarki organisasi; departemen terhubung ke divisi)
- MD-02 (Master Divisi)
- CFG-01 (Konfigurasi Hierarki Organisasi)
- D.3 BA Review (Approval berbasis posisi)

---

## SCREEN: MAST-03 — Master Pertanyaan

**Screen ID:** MAST-03
**Screen Name:** Master Pertanyaan
**Business Purpose:** CRUD pertanyaan yang digunakan dalam form prospek dan form RKS. Menggantikan data yang sebelumnya disimpan di localStorage (GAP-03/CFG-12). Admin dapat mengelola teks pertanyaan, tipe jawaban, urutan, dan status aktif. Terdapat preview real-time tampilan form.
**User Roles:** Admin
**Route:** `/master/questions`
**Navigation Entry Point:** Sidebar "Master → Pertanyaan"

**Components:**

| Komponen | Detail |
|---|---|
| PageHeader | "Master Pertanyaan", tombol "Tambah Pertanyaan" |
| Tab Navigasi | "Pertanyaan Prospek" | "Pertanyaan RKS" |
| DataTable | Kolom: Urutan | Teks Pertanyaan | Tipe Jawaban | Required | Status | Aksi |
| Drag-and-Drop Reorder | Handle di kolom Urutan; reorder mengupdate field `order` di DB |
| Modal Form Pertanyaan | Tambah/edit pertanyaan dengan preview |
| Sub-form Opsi Jawaban | Muncul jika tipe = radio/checkbox/select; inline tambah opsi |
| Preview Panel | Panel kanan di modal: render tampilan pertanyaan sebagaimana terlihat user |
| Tombol Aksi | Edit (modal), Nonaktifkan/Aktifkan |

**Form Fields:**

| Field | Tipe | Validasi |
|---|---|---|
| Teks Pertanyaan | Textarea | Required, min 5 char |
| Tipe Jawaban | Select | Required; opsi: text / textarea / radio / checkbox / select |
| Required Flag | Toggle | Default: false |
| Urutan | Number | Auto-assigned; bisa diubah via drag-and-drop |
| Opsi Jawaban (jika radio/checkbox/select) | Repeater | Minimal 2 opsi; setiap opsi: teks required |
| Status | Toggle | Aktif/Nonaktif; default Aktif |

**Actions:**
- Tambah Pertanyaan: modal → POST /api/master/questions
- Edit: modal pre-filled → PUT /api/master/questions/:id
- Drag reorder: PATCH /api/master/questions/reorder (array of IDs dengan urutan baru)
- Nonaktifkan/Aktifkan: soft delete

**API Dependencies:**
- GET /api/master/questions?type=prospect / type=rks
- POST /api/master/questions
- PUT /api/master/questions/:id
- PATCH /api/master/questions/reorder

**Business Rules:**
- BR-MAST-06: Pertanyaan yang sudah memiliki jawaban di prospek/proyek aktif tidak bisa dihapus permanen; hanya bisa dinonaktifkan.
- BR-MAST-07: Pertanyaan nonaktif tidak muncul di form prospek/RKS untuk pengisian baru.
- BR-MAST-08: Urutan pertanyaan menentukan urutan tampil di form.
- **KRITIS BR-MAST-09:** Seluruh data pertanyaan HARUS tersimpan di DB, bukan localStorage. Ini adalah penyelesaian GAP-03.

**Related GAP/CFG/MD Reference:**
- **GAP-03 KRITIS** (migrasi Question Type dari localStorage ke DB)
- CFG-12 (Konfigurasi Tipe Pertanyaan — di /config/question-types)
- FR-102 (Question Type Definitions ke DB)

**Accessibility Requirements:**
- Drag-and-drop reorder harus memiliki alternatif keyboard (tombol up/down per baris)
- Preview panel diperbarui secara live; menggunakan `aria-live="polite"`

---

## SCREEN: MAST-04 — Master Kompetitor

**Screen ID:** MAST-04
**Screen Name:** Master Kompetitor
**Business Purpose:** CRUD data kompetitor yang dinormalisasi sebagai entitas mandiri. Menggantikan penyimpanan kompetitor sebagai JSON bebas per proyek. Memungkinkan analisis kompetitor lintas proyek dan identifikasi pola kemenangan/kekalahan per kompetitor.
**User Roles:** Admin
**Route:** `/master/competitors`
**Navigation Entry Point:** Sidebar "Master → Kompetitor"

**Components:** Pola umum Master Data.

**Form Fields:**

| Field | Tipe | Validasi |
|---|---|---|
| Nama Kompetitor | Input text | Required, unique, 2–200 char |
| Kode / Singkatan | Input text | Optional, uppercase |
| Bidang Usaha | Input text | Optional |
| Deskripsi | Textarea | Optional |
| Status | Toggle | Aktif/Nonaktif |

**API Dependencies:**
- GET /api/master/competitors
- POST /api/master/competitors
- PUT /api/master/competitors/:id

**Business Rules:**
- BR-MAST-10: Kompetitor nonaktif masih muncul dalam data historis proyek lama, tapi tidak muncul di dropdown penambahan kompetitor baru.
- BR-MAST-11: Hapus kompetitor hanya boleh jika tidak ada proyek yang mereferensikannya.

**Related GAP/CFG/MD Reference:**
- **GAP-09 Major** (normalisasi Master Kompetitor dari JSON bebas)
- MD-14 (Master Kompetitor)
- GAP-20 (analitik kompetitor lintas proyek — Fase 3)

---

## SCREEN: MAST-05 — Manajemen Pengguna

**Screen ID:** MAST-05
**Screen Name:** Manajemen Pengguna
**Business Purpose:** CRUD akun pengguna sistem. Admin mengelola seluruh siklus hidup akun: pembuatan, pembaruan, reset password, nonaktifkan. Penetapan role, cabang, dan departemen saat buat/edit pengguna menentukan akses dan scope data user tersebut.
**User Roles:** Admin
**Route:** `/admin/users`
**Navigation Entry Point:** Sidebar "Pengguna"

**Components:** Pola umum Master Data.

**Form Fields:**

| Field | Tipe | Validasi | Kondisi |
|---|---|---|---|
| Nama Lengkap | Input text | Required | Selalu |
| Username | Input text | Required, unique, 3–30 char, alphanumeric+underscore | Selalu |
| Email | Input email | Required, unique | Selalu |
| Role | Select | Required; opsi: cabang/pm/department/management/admin | Selalu |
| Cabang | Select | Required jika role = cabang | Hanya role cabang |
| Departemen | Select | Required jika role = department | Hanya role department |
| Password Awal | Input password | Required saat create; min 8 char; tersembunyi (masked) setelah save | Hanya saat create |
| Status | Toggle | Aktif/Nonaktif; default Aktif | Selalu |

**Actions:**

| Aksi | Trigger | Behavior |
|---|---|---|
| Tambah User | Klik "Tambah Pengguna" | Modal form kosong → POST /api/admin/users |
| Edit User | Klik "Edit" | Modal form pre-filled → PUT /api/admin/users/:id |
| Nonaktifkan/Aktifkan | Toggle aksi | Konfirmasi → PUT /api/admin/users/:id (toggle status) |
| Reset Password | Klik "Reset Password" di dropdown aksi | ConfirmDialog "Reset password dan kirim ke email user?" → POST /api/admin/users/:id/reset-password |

**API Dependencies:**
- GET /api/admin/users?search=&role=&isActive=&page=
- POST /api/admin/users
- PUT /api/admin/users/:id
- POST /api/admin/users/:id/reset-password
- GET /api/config/branches (untuk select cabang)
- GET /api/master/departments (untuk select departemen)

**Business Rules:**
- BR-MAST-12: Admin tidak bisa menghapus user secara permanen; hanya nonaktifkan. Data historis user tetap terjaga untuk keperluan audit.
- BR-MAST-13: Satu user bisa memiliki satu role saja. Role menentukan scope data dan aksi yang tersedia.
- BR-MAST-14: Jika role = cabang, harus pilih satu cabang; sistem akan mengisi `branch_id` di DB (GAP-05).
- BR-MAST-15: Jika role = department, harus pilih satu departemen; sistem akan mengisi `department_id` (GAP-05).
- BR-MAST-16: Password awal dikirim ke email user; password ditampilkan sekali di modal (tersembunyi setelah modal tutup).
- BR-MAST-17: User tidak bisa mengedit data diri sendiri melalui halaman ini; gunakan /profile.

**Related GAP/CFG/MD Reference:**
- GAP-05 (hierarki organisasi — branch_id dan department_id pada user)
- CFG-04 (Role & Permission)
- FR001 (User Management)

---

## SCREEN: CONF-01 — Konfigurasi Organisasi

**Screen ID:** CONF-01
**Screen Name:** Konfigurasi Organisasi
**Business Purpose:** Manajemen hierarki organisasi Perusahaan → Divisi → Departemen → Cabang secara visual sebagai tree navigasi. Memungkinkan admin menambah, mengedit, dan menonaktifkan unit organisasi tanpa perlu deployment ulang aplikasi. Menggantikan data organisasi yang sebelumnya hardcode.
**User Roles:** Admin
**Route:** `/config/org`
**Navigation Entry Point:** Sidebar "Konfigurasi → Organisasi"

**Components:**

| Komponen | Tipe | Detail |
|---|---|---|
| PageHeader | Molecule | "Konfigurasi Hierarki Organisasi", tombol "Tambah Perusahaan" |
| Tree Navigator | Custom | Panel kiri: tree expand/collapse; setiap node: ikon tipe + nama + badge aktif/nonaktif |
| Panel Detail | Container | Panel kanan: form edit entitas yang dipilih + list anak-anak + tombol tambah anak |
| Node: Perusahaan | Tree item | Ikon bangunan; expand ke Divisi |
| Node: Divisi | Tree item | Ikon chart-bar; expand ke Departemen dan Cabang |
| Node: Departemen | Tree item | Ikon users; expand ke sub-departemen (jika ada) |
| Node: Cabang | Tree item | Ikon map-pin; leaf node |
| Cascade Warning | Alert | Muncul saat nonaktifkan node yang memiliki anak: "Nonaktifkan ini akan menonaktifkan X sub-entitas" |

**Form Fields per Tipe Entitas:**

**Perusahaan:**
| Field | Validasi |
|---|---|
| Nama Perusahaan | Required, unique |
| Logo | File upload, opsional (PNG/JPG max 2MB) |
| Alamat | Optional textarea |

**Divisi:**
| Field | Validasi |
|---|---|
| Nama Divisi | Required |
| Kode | Required, 2–10 char, uppercase |
| Perusahaan Induk | Required, select dari list perusahaan |
| Kepala Divisi | Optional, select user |

**Departemen:** (lihat MAST-02; form sama, konteks dari tree)

**Cabang:**
| Field | Validasi |
|---|---|
| Nama Cabang | Required |
| Kode Cabang | Required, unique |
| Kota | Required |
| Alamat | Optional |
| Divisi Induk | Required, select divisi |
| PIC Cabang | Optional, select user |
| Status | Toggle Aktif/Nonaktif |

**Actions:**
- Klik node: tampilkan detail di panel kanan
- Expand/collapse node: toggle anak-anak
- Tambah anak: klik tombol "Tambah [Tipe Anak]" di panel detail
- Edit: inline di panel kanan → auto-save atau tombol "Simpan"
- Nonaktifkan: tombol di panel detail + cascade warning

**API Dependencies:**
- GET /api/config/org/tree (seluruh hierarki sekaligus)
- POST /api/config/companies | PUT /api/config/companies/:id
- POST /api/config/divisions | PUT /api/config/divisions/:id
- POST /api/config/departments | PUT /api/config/departments/:id
- POST /api/config/branches | PUT /api/config/branches/:id

**Business Rules:**
- BR-CONF-01: Nonaktifkan node secara cascade: menonaktifkan divisi akan menonaktifkan semua departemen dan cabang di bawahnya, plus memberi peringatan berapa entitas yang terdampak.
- BR-CONF-02: Cabang yang dinonaktifkan tidak bisa dipilih saat assign user ke cabang.
- BR-CONF-03: Struktur minimal adalah satu perusahaan → satu divisi; tidak bisa hapus entitas terakhir.

**Related GAP/CFG/MD Reference:**
- **GAP-05 Major** (hierarki organisasi tidak dimodelkan sebagai entitas)
- **CFG-01 High Priority** (Konfigurasi Hierarki Organisasi)
- MD-01 (Master Perusahaan), MD-02 (Master Divisi), MD-03 (Master Cabang)
- D.3 BA Review (perbaikan struktur organisasi)

**Accessibility Requirements:**
- Tree menggunakan ARIA tree widget pattern: `role="tree"`, `role="treeitem"`, `aria-expanded`
- Keyboard navigasi: Arrow keys untuk navigasi antar node; Enter/Space untuk expand/pilih

---

## SCREEN: CONF-02 — Konfigurasi Approval Workflow

**Screen ID:** CONF-02
**Screen Name:** Konfigurasi Approval Workflow
**Business Purpose:** Mendefinisikan alur approval untuk setiap tipe proyek (Tender dan Prospecting). Admin dapat mengubah urutan tahap, menentukan siapa yang menjadi approver di setiap tahap (berbasis posisi/role, bukan nama user spesifik), dan mengatur backup approver. Perubahan berlaku untuk proyek baru; proyek aktif menggunakan konfigurasi saat proyek dibuat.
**User Roles:** Admin
**Route:** `/config/workflow`
**Navigation Entry Point:** Sidebar "Konfigurasi → Workflow"

**Components:**

| Komponen | Detail |
|---|---|
| PageHeader | "Konfigurasi Approval Workflow" |
| Tab: Workflow Tender | Tab panel untuk alur tender |
| Tab: Workflow Prospecting | Tab panel untuk alur prospecting |
| Daftar Tahap | Setiap tahap sebagai card; dapat di-reorder via drag-and-drop |
| Card Tahap | Nama tahap, role approver, backup approver, SLA (hari kerja), toggle aktif |
| Preview Flowchart | SVG diagram sederhana di panel bawah menggambarkan alur visual |
| Warning Banner | "N proyek sedang menggunakan workflow ini" muncul saat ada perubahan |
| Tombol "Simpan Workflow" | Submit perubahan |

**Fields per Tahap:**

| Field | Tipe | Validasi |
|---|---|---|
| Nama Tahap | Input text | Required |
| Role Approver | Select | Required; opsi dari sistem (pm/dept_head/management/admin) |
| Backup Approver | Select user | Optional; user yang menjadi pengganti jika approver utama tidak tersedia |
| SLA (hari kerja) | Input number | Required, min 1; kalkulasi dari CFG-05 |
| Aksi yang tersedia | Checkbox multi | Approve / Kirim Revisi |
| Aktif | Toggle | Tahap bisa dinonaktifkan tanpa hapus |

**API Dependencies:**
- GET /api/config/workflow?type=tender | type=prospecting
- PUT /api/config/workflow/:type

**Business Rules:**
- BR-CONF-04: Perubahan workflow tidak retroaktif; hanya berlaku untuk proyek yang dibuat setelahnya.
- BR-CONF-05: Setiap proyek aktif menyimpan snapshot konfigurasi workflow pada saat proyek dibuat.
- BR-CONF-06: Approver dikonfigurasi berbasis posisi/role (bukan username), sehingga pergantian pejabat tidak perlu rekonfigurasi manual.

**Related GAP/CFG/MD Reference:**
- **CFG-02 High Priority**
- GAP-07 (backup approver)
- MD-06 (Master Approval Level)
- D.5 BA Review (backup approver)

---

## SCREEN: CONF-03 — Konfigurasi Status Proyek

**Screen ID:** CONF-03
**Screen Name:** Konfigurasi Status Proyek
**Business Purpose:** Mengelola daftar status proyek secara dinamis: label tampilan, warna badge, urutan, dan transisi yang diizinkan. Menggantikan status yang sebelumnya hardcode di source code.
**User Roles:** Admin
**Route:** `/config/statuses`
**Navigation Entry Point:** Sidebar "Konfigurasi → Status"

**Components:**
- PageHeader + DataTable + Modal Form
- Kolom tabel: No | Kode Status | Label | Warna Badge (preview) | Urutan | Aktif | Aksi
- Form fields: Kode Status (Required, unique, snake_case), Label Tampilan (Required), Warna Hex (Color picker + input hex), Urutan (number), Status (toggle)
- Color picker terintegrasi untuk pemilihan warna badge

**API Dependencies:**
- GET /api/config/statuses
- POST/PUT /api/config/statuses/:id

**Business Rules:**
- BR-CONF-07: Status sistem bawaan (created, selesai, cancelled) tidak bisa diedit kode-nya, hanya label dan warna.
- BR-CONF-08: Status yang sedang digunakan oleh proyek aktif tidak bisa dinonaktifkan tanpa peringatan.

**Related GAP/CFG/MD Reference:** CFG-03, MD-05 (Master Status Proyek)

---

## SCREEN: CONF-04 — Konfigurasi Role & Permission

**Screen ID:** CONF-04
**Screen Name:** Konfigurasi Role & Permission
**Business Purpose:** Mengelola role pengguna dan permission matrix yang menentukan aksi apa yang boleh dilakukan setiap role pada setiap modul/resource. Memungkinkan penambahan role baru tanpa coding.
**User Roles:** Admin
**Route:** `/config/roles`
**Navigation Entry Point:** Sidebar "Konfigurasi → Role & Akses"

**Components:**

| Komponen | Detail |
|---|---|
| PageHeader | "Konfigurasi Role & Permission" |
| Tab: Daftar Role | Kelola role (tambah, edit, nonaktifkan) |
| Tab: Permission Matrix | Tabel role × aksi × resource; toggle per sel |
| Tabel Permission Matrix | Baris = Role; Kolom = Resource/Aksi; sel = checkbox diizinkan/tidak |
| Filter Kolom | Filter per modul (Prospek / Proyek / Laporan / Admin / dst.) |
| Tombol "Simpan Perubahan" | Bulk save seluruh permission matrix |

**Form Fields untuk Role:**
| Field | Validasi |
|---|---|
| Nama Role | Required, unique |
| Kode Role | Required, unique, lowercase_underscore |
| Deskripsi | Optional |
| Status | Aktif/Nonaktif |

**Business Rules:**
- BR-CONF-09: Role bawaan sistem (cabang, pm, department, management, admin) tidak bisa dihapus; hanya bisa ditambah role custom.
- BR-CONF-10: Admin selalu memiliki seluruh permission; tidak bisa dicabut melalui UI ini.
- BR-CONF-11: Perubahan permission berlaku saat user login ulang (session refresh).

**Related GAP/CFG/MD Reference:** CFG-04 High Priority, GAP-02 (role hardcode)

---

## SCREEN: CONF-05 — Konfigurasi SLA & Eskalasi

**Screen ID:** CONF-05
**Screen Name:** Konfigurasi SLA & Eskalasi
**Business Purpose:** Mendefinisikan batas waktu (dalam hari kerja) untuk setiap tahap approval, beserta konfigurasi pengiriman reminder dan eskalasi otomatis jika batas waktu mendekati atau terlampaui.
**User Roles:** Admin
**Route:** `/config/sla`
**Navigation Entry Point:** Sidebar "Konfigurasi → SLA"

**Components:**
- PageHeader + Form per tahap approval
- Setiap tahap: card dengan fields SLA

**Fields per Tahap Approval:**

| Field | Tipe | Detail |
|---|---|---|
| Tahap | Label | Read-only (nama tahap dari CFG-02) |
| Batas Hari Kerja | Input number | Min 1; wajib |
| Aktifkan SLA Enforcement | Toggle | On/Off per tahap |
| Kirim Reminder T-X | Input number | Hari kerja sebelum batas untuk kirim reminder pertama |
| Kirim Reminder T-Y | Input number | Hari kerja kedua (opsional) |
| Eskalasi ke | Select user/role | Siapa yang mendapat notifikasi eskalasi |
| Channel Reminder | Checkbox multi | In-app / Email (Fase 2) |
| Preview Kalkulasi | Info | "Jika disubmit hari ini, batas approval adalah: [tanggal kalkulasi berdasarkan hari kerja + hari libur]" |

**API Dependencies:**
- GET /api/config/sla
- PUT /api/config/sla

**Business Rules:**
- BR-CONF-12: Kalkulasi hari kerja menggunakan Master Hari Libur (MD-13) untuk mengecualikan hari libur nasional dari hitungan SLA.
- BR-CONF-13: Jika SLA enforcement dinonaktifkan untuk satu tahap, sistem tetap menampilkan durasi menunggu sebagai informasi (tanpa alert).
- BR-CONF-14: Eskalasi otomatis mengirim notifikasi in-app ke approver atasan; email di Fase 2.

**Related GAP/CFG/MD Reference:**
- **GAP-06 Major** (SLA enforcement)
- **CFG-05 High Priority**
- CFG-06 (Reminder & Eskalasi)
- MD-13 (Master Hari Libur)
- D.5 BA Review (SLA per tahap)

---

## SCREEN: CONF-06 — Konfigurasi Notifikasi

**Screen ID:** CONF-06
**Screen Name:** Konfigurasi Notifikasi
**Business Purpose:** Mengelola template pesan notifikasi in-app per event dan konfigurasi penerima notifikasi. Admin dapat mengkustomisasi teks pesan tanpa perlu mengubah kode aplikasi.
**User Roles:** Admin
**Route:** `/config/notifications`
**Navigation Entry Point:** Sidebar "Konfigurasi → Notifikasi"

**Components:**
- DataTable: Kolom Event | Template Pesan | Penerima | Channel | Aktif | Aksi
- Modal Edit Template: field teks template dengan placeholder variables ({{projectName}}, {{cabang}}, dll.)
- Preview rendered message saat edit

**Fields per Template:**
| Field | Validasi |
|---|---|
| Event | Read-only label |
| Template Pesan | Textarea, required; mendukung placeholder {{variable}} |
| Penerima | Select multi-role | Siapa yang menerima notifikasi ini |
| Channel | Checkbox: In-App / Email (Fase 2) |
| Aktif | Toggle |

**API Dependencies:**
- GET /api/config/notifications
- PUT /api/config/notifications/:eventId

**Business Rules:**
- BR-CONF-15: Template pesan bawaan sistem tidak bisa dihapus; hanya bisa diedit atau dinonaktifkan.
- BR-CONF-16: Variabel placeholder harus menggunakan format {{variableName}} untuk disubstitusi saat runtime.

**Related GAP/CFG/MD Reference:** CFG-09, MD-12 (Master Notifikasi Template), FR090 (In-App Notification)

---

## SCREEN: CONF-07 — Konfigurasi Tipe Pertanyaan

**Screen ID:** CONF-07
**Screen Name:** Konfigurasi Tipe Pertanyaan
**Business Purpose:** CRUD definisi tipe pertanyaan yang digunakan dalam form prospek dan RKS. INI ADALAH MIGRASI KRITIS DARI LOCALSTORAGE KE DATABASE (GAP-03). Data tipe pertanyaan yang sebelumnya tersimpan per-browser di localStorage harus dimigrasikan ke tabel DB terpusat sehingga konsisten untuk semua user.
**User Roles:** Admin
**Route:** `/config/question-types`
**Navigation Entry Point:** Sidebar "Konfigurasi → Tipe Pertanyaan"

**Components:**
- PageHeader + DataTable
- Kolom: Nama Tipe | Konfigurasi (preview JSON, truncated) | Digunakan Oleh (count pertanyaan aktif) | Aktif | Aksi

**Form Fields:**
| Field | Validasi |
|---|---|
| Nama Tipe | Required, unique |
| Konfigurasi | JSON editor; validasi JSON valid |
| Status | Aktif/Nonaktif |

**API Dependencies:**
- GET /api/config/question-types
- POST /api/config/question-types
- PUT /api/config/question-types/:id
- DELETE /api/config/question-types/:id (hanya jika Digunakan Oleh = 0)

**Business Rules:**
- **BR-CONF-17 KRITIS:** Tipe pertanyaan HARUS tersimpan di DB, bukan localStorage. Ini adalah bug fix (GAP-03) yang harus diselesaikan sebelum go-live.
- BR-CONF-18: Hapus tipe hanya diizinkan jika tidak ada pertanyaan aktif yang menggunakan tipe tersebut.

**Related GAP/CFG/MD Reference:**
- **GAP-03 Critical** (localStorage bug — data hilang antar browser)
- **CFG-12 High Priority** (sebelum go-live)
- FR-102 (Question Type Definitions)

---

## SCREEN: REPT-01 — Laporan Win/Loss

**Screen ID:** REPT-01
**Screen Name:** Laporan Win/Loss
**Business Purpose:** Laporan periodik yang menampilkan rekap kemenangan dan kekalahan tender per periode, cabang, dan kategori. Menjadi basis untuk evaluasi kinerja dan perencanaan strategi bisnis. Mendukung export ke Excel dan PDF untuk pelaporan ke direksi.
**User Roles:** Management, Admin
**Route:** `/reports`
**Navigation Entry Point:** Sidebar "Laporan"

**Components:**

| Komponen | Tipe | Detail |
|---|---|---|
| PageHeader | Molecule | "Laporan Win/Loss", tombol "Export Excel" + "Export PDF" |
| FilterBar | Molecule | Filter komprehensif |
| Filter: Periode | DatePicker Range | Default: bulan ini; opsi cepat: bulan ini, kuartal ini, tahun ini |
| Filter: Cabang | Select | Multi-select; default: semua |
| Filter: Kategori Proyek | Select | Dari Master Kategori |
| Filter: Tipe | Select | Tender / Prospecting / Semua |
| Summary Cards | DashboardCard | Total Proyek, Menang, Kalah, Win Rate % |
| BarChart Bulanan | Recharts | Trend win/loss per bulan dalam periode |
| DataTable Detail | Molecule | Detail per proyek |
| Kolom Detail | — | Nama Proyek | Customer | Nilai Kontrak/Estimasi | Hasil | Kompetitor Pemenang | Tgl Pengumuman |

**Actions:**

| Aksi | Trigger | Behavior |
|---|---|---|
| Apply Filter | Perubahan filter | Re-fetch dan re-render |
| Export Excel | Tombol "Export Excel" | Toast "Menyiapkan laporan..." → POST /api/reports/win-loss/export?format=excel → download file .xlsx |
| Export PDF | Tombol "Export PDF" | Toast "Menyiapkan laporan..." → POST /api/reports/win-loss/export?format=pdf → download file .pdf |

**API Dependencies:**
- GET /api/reports/win-loss?from=&to=&branchId=&categoryId=&type=
- POST /api/reports/win-loss/export (untuk download)

**Loading State:**
- Summary cards: skeleton shimmer
- Chart: skeleton rectangle
- Tabel: skeleton 5 baris
- Export: Toast "Menyiapkan laporan..." → ganti ke "Unduh siap" saat selesai; download otomatis via blob URL

**Empty State:** "Belum ada data untuk periode yang dipilih. Coba ubah rentang tanggal."

**Business Rules:**
- BR-REPT-01: Laporan hanya menampilkan proyek yang sudah mencapai status `selesai` atau `cancelled` dengan catatan hasil tender.
- BR-REPT-02: Win Rate dihitung sebagai: (jumlah proyek menang / total proyek yang sudah ada hasil) × 100%.
- BR-REPT-03: Export mempertahankan semua filter yang sedang aktif.
- BR-REPT-04: Laporan ini tidak menampilkan data yang belum selesai/masih berjalan.

**Related GAP/CFG/MD Reference:**
- **GAP-11 Major** (laporan periodik yang bisa diekspor)
- MD-10 (Master Periode)
- GAP-12 (alasan kekalahan terstruktur di kolom detail)

**Responsive Behavior:** Chart responsive container; tabel horizontal scroll di mobile; card summary 2×2 di mobile.

---

## SCREEN: REPT-02 — Laporan Pipeline

**Screen ID:** REPT-02
**Screen Name:** Laporan Pipeline
**Business Purpose:** Visualisasi pipeline proyek aktif dalam format funnel berdasarkan tahap status. Membantu management memahami distribusi proyek di setiap tahap dan nilai pipeline total. Dilengkapi tabel detail untuk drill-down.
**User Roles:** Management, Admin
**Route:** `/reports/pipeline`
**Navigation Entry Point:** Submenu di bawah "Laporan" di sidebar; atau tab/link dari REPT-01.

**Components:**

| Komponen | Detail |
|---|---|
| PageHeader | "Laporan Pipeline", tombol Export |
| FilterBar | Filter Cabang, Divisi, Kategori, Periode estimasi close |
| Funnel Chart | Recharts FunnelChart atau custom SVG funnel; setiap tahap: nama, count proyek, total nilai |
| Summary Bar | Total nilai pipeline semua tahap aktif |
| DataTable Detail | Per tahap: detail proyek (nama, customer, nilai, estimasi close) |
| Toggle Tampilan | Tampilkan per count / per nilai Rp |

**API Dependencies:** GET /api/reports/pipeline?branchId=&divisionId=&categoryId=&closeDateFrom=&closeDateTo=

**Business Rules:**
- BR-REPT-05: Proyek berstatus `cancelled` dan `selesai` tidak masuk pipeline.
- BR-REPT-06: Nilai pipeline untuk proyek yang belum ada harga penawaran dihitung dari estimasi nilai prospek/proyek.

**Related GAP/CFG/MD Reference:** GAP-11, D.6 BA Review (Pipeline Funnel widget)

---

## SCREEN: AUDT-01 — Audit Log

**Screen ID:** AUDT-01
**Screen Name:** Audit Log
**Business Purpose:** Tampilan dan pencarian seluruh aktivitas yang terjadi dalam sistem untuk keperluan keamanan, compliance, dan pemecahan masalah. Setiap aksi sistem tercatat dengan detail siapa, kapan, apa, dan apa yang berubah (before/after). Mendukung export CSV untuk analisis eksternal.
**User Roles:** Admin
**Route:** `/admin/audit-logs`
**Navigation Entry Point:** Sidebar "Audit Log"

**Components:**

| Komponen | Detail |
|---|---|
| PageHeader | "Audit Log", tombol "Export CSV" |
| FilterBar | Filter komprehensif |
| Filter: User | Select searchable; semua user |
| Filter: Tipe Aksi | Select; opsi: create/update/delete/login/logout/approve/revisi/export |
| Filter: Entitas | Select; opsi: prospects/projects/users/config/dll. |
| Filter: Tanggal | DatePicker range; default 7 hari terakhir |
| DataTable | Server-side pagination; default sort DESC by timestamp |
| Kolom | Timestamp | User | Aksi | Entitas | Entity ID | IP Address | Detail |
| Modal Detail | Klik baris → modal dengan payload before/after dalam format JSON diff |
| JSON Diff View | Before (merah/strikethrough) vs After (hijau) — color-coded |

**Actions:**

| Aksi | Trigger | Behavior |
|---|---|---|
| Lihat Detail | Klik baris | Modal dengan JSON before/after diff |
| Export CSV | Tombol "Export CSV" | Export dengan filter aktif; download otomatis |

**API Dependencies:**
- GET /api/admin/audit-logs?userId=&action=&entity=&from=&to=&page=
- GET /api/admin/audit-logs/:id (detail before/after)
- POST /api/admin/audit-logs/export (CSV export)

**Loading State:** Skeleton 10 baris saat load; spinner saat export.

**Empty State:** "Tidak ada log yang cocok dengan filter. Coba ubah kriteria pencarian."

**Business Rules:**
- BR-AUDT-01: Audit log adalah append-only; tidak ada yang bisa menghapus atau mengubah log.
- BR-AUDT-02: Setiap aksi yang mengubah data (create/update/delete) menyimpan payload before dan after dalam format JSON.
- BR-AUDT-03: Login dan logout juga tercatat beserta IP address.
- BR-AUDT-04: Retensi log minimal 1 tahun; data lebih lama diarsipkan.
- BR-AUDT-05: Export CSV mengikuti filter aktif; tidak bisa export semua log sekaligus tanpa filter (mencegah export berlebihan).

**Related GAP/CFG/MD Reference:**
- **GAP-16 Minor** (export audit log CSV)
- FR083 (Audit Trail)

**Accessibility Requirements:**
- JSON diff modal harus menyediakan tampilan alternatif teks (tidak hanya warna)
- Kolom tabel memiliki scope yang tepat

---

## SCREEN: NOTF-01 — Notifikasi

**Screen ID:** NOTF-01
**Screen Name:** Notifikasi In-App
**Business Purpose:** Menampilkan semua notifikasi yang diterima user, memungkinkan user untuk menandai sudah dibaca, dan melakukan navigasi cepat ke item yang notifikasinya diterima. Didukung oleh sistem polling setiap 60 detik.
**User Roles:** Semua role
**Route:** `/notifications` (halaman penuh) + dropdown panel di topbar (overlay)

**Components:**

| Komponen | Detail |
|---|---|
| **DROPDOWN (Topbar)** | |
| NotificationBell | Ikon lonceng di topbar; badge merah dengan count unread |
| Dropdown Panel | Muncul klik bell; max-h-96 scrollable; daftar 10 notif terbaru |
| Item Notif | Ikon tipe, teks pesan, timestamp relative, badge "Baru" jika unread |
| Tombol "Tandai Semua Dibaca" | Bulk mark-as-read |
| Link "Lihat Semua Notifikasi" | Navigate ke /notifications |
| **HALAMAN PENUH** | |
| PageHeader | "Notifikasi", tombol "Tandai Semua Dibaca" |
| Filter | Filter tipe notifikasi; filter Status (Semua/Belum Dibaca/Sudah Dibaca) |
| DataList | Semua notifikasi dengan pagination |
| Item Notif | Baris lebih lebar: ikon, pesan, timestamp, link ke item terkait, tombol mark-as-read |

**Actions:**

| Aksi | Trigger | Behavior |
|---|---|---|
| Buka dropdown | Klik ikon bell | Toggle dropdown notifikasi |
| Buka item | Klik item notif | Navigate ke URL terkait (proyek/prospek) + mark-as-read otomatis |
| Tandai dibaca (1) | Klik ikon read per item | PUT /api/notifications/:id/read → update UI |
| Tandai semua dibaca | Klik tombol bulk | PUT /api/notifications/read-all → count reset ke 0 |
| Lihat semua | Klik link | Navigate ke /notifications |

**Polling Mechanism:**
- GET /api/notifications?unreadOnly=true setiap 60 detik via React Query `refetchInterval`
- Response: `{ count: number, items: Notification[] }`
- Jika count bertambah dari sebelumnya: toast "X notifikasi baru"
- Badge count di bell diperbarui

**Tipe Notifikasi dan Trigger (sesuai FE Spec):**

| Event | Penerima |
|---|---|
| Prospek disubmit ke PM | PM yang ditugaskan |
| PM kirim revisi prospek | Cabang pembuat |
| PM approve prospek | Cabang pembuat |
| RKS disubmit ke review | PM proyek |
| PM kirim revisi RKS | Cabang |
| PM approve RKS | Cabang + Dept terpilih |
| Dept diminta review LPHS | Dept yang dipilih |
| Semua dept approve LPHS | Management |
| Management approve LPHS | Cabang |
| Deadline approaching (≤ 3 hari) | Cabang + PM |
| SLA approval hampir terlewat | Approver terkait |

**API Dependencies:**
- GET /api/notifications?unreadOnly=true (polling)
- GET /api/notifications?page=&isRead= (halaman penuh)
- PUT /api/notifications/:id/read
- PUT /api/notifications/read-all

**Loading State:**
- Dropdown: skeleton 3 item saat pertama buka
- Halaman penuh: skeleton list

**Empty State:**

| Konteks | Teks |
|---|---|
| Dropdown kosong | "Tidak ada notifikasi baru" (ikon lonceng tidur) |
| Halaman penuh kosong | "Semua notifikasi sudah dibaca." |

**Business Rules:**
- BR-NOTF-01: Notifikasi dikirim berdasarkan konfigurasi dari CFG-06; Admin dapat mengubah teks template dan penerima tanpa coding.
- BR-NOTF-02: Polling setiap 60 detik; pada Fase 2 digantikan WebSocket atau Server-Sent Events.
- BR-NOTF-03: Notifikasi disimpan di DB; tidak hilang jika user tidak online saat event terjadi.
- BR-NOTF-04: Notifikasi yang sudah dibaca tidak dihapus dari list; hanya berubah visual (teks lebih terang, tidak ada badge Baru).

**Related GAP/CFG/MD Reference:**
- GAP-13 (notifikasi deadline approaching)
- GAP-18 (notifikasi email — Fase 2)
- CFG-06 (Konfigurasi Reminder & Eskalasi)
- CFG-09 (Konfigurasi Notifikasi Email)
- MD-12 (Master Notifikasi Template)
- FR090–FR091 (Notification Module)

**Accessibility Requirements:**
- Badge count memiliki `aria-label="X notifikasi belum dibaca"`
- Dropdown memiliki `role="menu"`; item memiliki `role="menuitem"`
- Toast notifikasi baru menggunakan `aria-live="polite"`

---

## SCREEN: PROF-01 — Profil Pengguna

**Screen ID:** PROF-01
**Screen Name:** Profil Pengguna
**Business Purpose:** Memungkinkan setiap user untuk melihat dan mengedit data profil diri sendiri (nama tampilan, email, avatar) dan mengakses fitur ganti password.
**User Roles:** Semua role
**Route:** `/profile`
**Navigation Entry Point:** Klik avatar/nama di footer sidebar atau dropdown avatar di topbar.

**Components:**

| Komponen | Detail |
|---|---|
| PageHeader | "Profil Saya" |
| Avatar Upload | Komponen upload gambar profil; preview langsung; crop opsional |
| Form Profil | Nama Lengkap (edit), Email (edit), Username (read-only), Role (read-only), Cabang/Dept (read-only) |
| Tombol "Simpan Perubahan" | PUT /api/auth/profile |
| Link "Ganti Password" | Navigate ke /profile/change-password (AUTH-02) |
| Info Sesi | Informasi sesi terakhir: login terakhir, IP terakhir |

**API Dependencies:**
- GET /api/auth/me
- PUT /api/auth/profile
- POST /api/auth/avatar (upload avatar)

**Business Rules:**
- BR-PROF-01: Username dan role tidak bisa diubah sendiri; hanya Admin yang bisa mengubah melalui MAST-05.
- BR-PROF-02: Perubahan email memerlukan verifikasi (Fase 2); untuk Fase 1 langsung update.

---

## SCREEN: ERRR-01 — Halaman 403 Akses Ditolak

**Screen ID:** ERRR-01
**Screen Name:** Halaman 403 — Akses Ditolak
**Business Purpose:** Menginformasikan user bahwa mereka tidak memiliki izin untuk mengakses halaman yang diminta, tanpa melemparkan user ke halaman login (yang akan membingungkan karena mereka sudah login).
**User Roles:** User yang sudah login namun tidak memiliki izin
**Route:** `/403` (juga dapat render inline tanpa route change)

**Components:**

| Komponen | Detail |
|---|---|
| Ilustrasi | SVG kunci terkunci atau tanda stop |
| Heading | "Akses Ditolak" (text-2xl) |
| Deskripsi | "Anda tidak memiliki izin untuk mengakses halaman ini. Jika Anda merasa ini adalah kesalahan, hubungi Administrator." |
| Tombol "Kembali ke Dashboard" | Navigate ke /dashboard |
| Tombol "Hubungi Admin" | Mailto atau link ke fitur helpdesk (Fase 2) |

**Business Rules:**
- BR-ERRR-01: Halaman 403 ditampilkan (bukan redirect) agar user mengetahui mereka sudah login tapi tidak punya akses.
- BR-ERRR-02: Route guard RoleGuard menampilkan 403 inline (tidak navigate ke /403) untuk konsistensi UX.

---

## SCREEN: ERRR-02 — Halaman 404 Tidak Ditemukan

**Screen ID:** ERRR-02
**Screen Name:** Halaman 404 — Halaman Tidak Ditemukan
**Business Purpose:** Menginformasikan user bahwa URL yang diakses tidak ada atau resource sudah dihapus.
**User Roles:** Semua user
**Route:** `/404` atau catch-all route `*`

**Components:**
- Ilustrasi SVG: halaman kosong dengan kaca pembesar
- Heading: "Halaman Tidak Ditemukan"
- Deskripsi: "Halaman yang Anda cari tidak ada atau telah dipindahkan."
- Tombol "Kembali ke Dashboard"
- Tombol "Kembali ke Halaman Sebelumnya" (browser back)

---

## SCREEN: ERRR-03 — Halaman 500 Error Server

**Screen ID:** ERRR-03
**Screen Name:** Halaman 500 — Error Server
**Business Purpose:** Menampilkan pesan error yang ramah pengguna saat terjadi error server, tanpa mengekspos detail teknis yang sensitif.
**User Roles:** Semua user
**Route:** Ditampilkan oleh ErrorBoundary di route level; bukan route tersendiri

**Components:**
- Ilustrasi SVG: server dengan ikon lightning
- Heading: "Terjadi Kesalahan"
- Deskripsi: "Server mengalami masalah sementara. Tim kami sedang bekerja untuk memperbaikinya."
- Tombol "Muat Ulang Halaman" (window.location.reload)
- Tombol "Kembali ke Dashboard"
- Error code (hanya development mode, disembunyikan di production)

**Business Rules:**
- BR-ERRR-03: Detail error teknis tidak pernah ditampilkan ke user di production; hanya di log server.
- BR-ERRR-04: ErrorBoundary di setiap route top-level menangkap error yang tidak tertangani.

---

## 6. INFERRED REQUIREMENTS

Berikut adalah kebutuhan yang ditemukan secara implisit saat mendesain katalog screen ini, yang tidak secara eksplisit disebutkan di BA Review atau FE Spec namun diperlukan untuk keberlangsungan sistem:

| ID | Kebutuhan | Alasan | Dampak |
|---|---|---|---|
| IR-001 | Screen Profil Pengguna (/profile) | Setiap sistem memerlukan cara user mengelola data diri sendiri; disebutkan di FE Spec sebagai dropdown avatar tapi tidak didetailkan | User experience dasar |
| IR-002 | Halaman 403 terpisah dari redirect login | Membedakan "belum login" dengan "tidak punya akses" mencegah kebingungan user | UX & Security |
| IR-003 | Toast notifikasi baru saat polling menemukan item baru | Tanpa ini user tidak akan tahu ada notifikasi baru jika sedang di halaman lain | UX Notification |
| IR-004 | Warning saat navigate dari form yang isDirty | Mencegah kehilangan data akibat navigasi tidak sengaja | Data Integrity |
| IR-005 | Halaman konfirmasi sebelum Cancel Proyek (inline, bukan modal) | Cancel adalah aksi ireversibel; wajib ada safeguard | Data Integrity |
| IR-006 | Screen Master Kompetitor (/master/competitors) | Disebutkan di BA Review GAP-09 sebagai entitas yang perlu dinormalisasi; screen-nya belum ada di FE Spec | GAP Resolution |
| IR-007 | Filter tanggal "Periode estimasi close" di Laporan Pipeline | Tanpa ini laporan pipeline tidak bisa difilter berdasarkan kapan proyek diperkirakan selesai | Reporting Completeness |
| IR-008 | Badge "Versi X" pada dokumen yang sudah punya > 1 versi | Tanpa badge versi, user tidak tahu mana dokumen yang paling baru (GAP-14 resolution) | Document Management |
| IR-009 | Tombol "Re-assign PM" di Detail Prospek (Admin) | BA Review D.5 menyebutkan re-assign approval; harus ada entry point UI-nya | GAP-07 Resolution |
| IR-010 | Progress ring visual "X dari Y dept approve" di LPHS | Tanpa visualisasi ini, approver tidak bisa melihat seberapa jauh progress paralel approval dept | UX Clarity |
| IR-011 | Preview kalkulasi tanggal SLA di CONF-05 | Membantu Admin memvalidasi konfigurasi SLA yang diinput | Configuration UX |
| IR-012 | Redirect ke halaman asal setelah login (state.from) | Jika user mengakses /projects/123 tapi belum login, setelah login harus kembali ke /projects/123, bukan /dashboard | UX Flow |

---

## 7. CROSS-REFERENCE GAP RESOLUTION

Tabel berikut menunjukkan bagaimana setiap GAP dari BA Review diselesaikan oleh screen-screen dalam katalog ini:

| GAP ID | Deskripsi | Screen yang Menyelesaikan |
|---|---|---|
| **GAP-01 Critical** | Tidak ada modul Target & KPI | DASH-01 (widget Progress vs Target), REPT-01 (laporan), CFG-05 (SLA terhubung ke target) |
| **GAP-02 Critical** | Tidak ada Menu Configuration | CONF-01 s/d CONF-07 (seluruh modul konfigurasi) |
| **GAP-03 Critical** | Question Type di localStorage | MAST-03, CONF-07, PROS-02, PROJ-03b (DynamicQuestionForm dari DB) |
| **GAP-04 Critical** | Tidak ada mekanisme cancel proyek | PROJ-01 (dropdown cancel), PROJ-03 (tombol cancel di header), ERRR state |
| **GAP-05 Major** | Hierarki organisasi tidak dimodelkan | CONF-01 (tree hierarki), MAST-05 (branch/dept assignment) |
| **GAP-06 Major** | Tidak ada SLA enforcement | APPR-01 (kolom SLA Sisa), CONF-05 (konfigurasi SLA) |
| **GAP-07 Major** | Tidak ada re-assign approval | APPR-01 (admin re-assign), PROS-03 (re-assign PM), CONF-02 (backup approver) |
| **GAP-08 Major** | Review dept tidak paralel | PROJ-03d (Tab LPHS/SIOS dengan parallelisasi) |
| **GAP-09 Major** | Kompetitor sebagai JSON bebas | MAST-04 (Master Kompetitor), PROJ-03f (Tab Kompetitor dengan lookup) |
| **GAP-10 Major** | Dashboard tanpa filter granular | DASH-01 (filter per periode/cabang/divisi — Inferred dari konteks role) |
| **GAP-11 Major** | Tidak ada laporan periodik export | REPT-01 (Win/Loss + export), REPT-02 (Pipeline) |
| **GAP-12 Minor** | Tidak ada field alasan kekalahan | PROJ-03g (Tab Pemenang dengan select Master Alasan Kekalahan) |
| **GAP-13 Minor** | Tidak ada notifikasi deadline | NOTF-01 (event "Deadline approaching"), DASH-01 (widget Approaching Deadline) |
| **GAP-14 Minor** | Tidak ada versioning dokumen | PROJ-03j (Tab Dokumen dengan versi accordion), IR-008 |
| **GAP-15 Minor** | Tidak ada health check | Bukan screen UI; lihat dokumen 060 Infrastructure |
| **GAP-16 Minor** | Tidak ada export audit log CSV | AUDT-01 (tombol Export CSV) |

---

## 8. APPENDIX: GLOBAL UI CONVENTIONS

### 8.1 Toast Notification Standards

| Tipe | Warna | Icon | Duration | Posisi |
|---|---|---|---|---|
| Sukses | Hijau (#16A34A) | check-circle | 4 detik | Top-right |
| Error | Merah (#DC2626) | x-circle | 5 detik (sticky jika kritis) | Top-right |
| Warning | Kuning (#D97706) | alert-triangle | 4 detik | Top-right |
| Info | Biru (#2563A8) | info | 3 detik | Top-right |

### 8.2 Confirmation Dialog Standards

Semua aksi destruktif atau ireversibel menggunakan ConfirmDialog dengan:
- Judul yang jelas menyebut apa yang akan terjadi
- Pesan yang menjelaskan konsekuensi
- Tombol konfirmasi berwarna merah (danger) untuk aksi destruktif
- Tombol batal selalu tersedia
- Tidak bisa ditutup dengan klik backdrop (mencegah aksi tidak sengaja)
- Tombol batal mendapat fokus default (lebih aman)

### 8.3 Form Behavior Standards

- Dirty Form Check: semua form menggunakan React Hook Form `.formState.isDirty`. Jika user navigasi pergi dari form yang isDirty, tampilkan ConfirmDialog.
- Submit Disabled: tombol submit disabled jika form tidak valid (setelah first submit attempt) atau sedang dalam proses loading.
- Error Inline: semua error validasi ditampilkan di bawah field yang bersangkutan, bukan hanya di toast.
- Auto-save Draft: Form prospek dan RKS mendukung "Simpan Draft" untuk menyimpan tanpa validasi penuh.

### 8.4 Loading Pattern Standards

| Konteks | Pattern |
|---|---|
| Page initial load | Skeleton shimmer sesuai layout konten |
| Background refetch | Spinner kecil 16px di konten; data lama tetap terlihat |
| Button action | Disabled + spinner inline + teks "Menyimpan..." |
| File upload | Progress bar di dropzone |
| Export | Toast progress → toast sukses + auto-download |
| Full page loading (error recovery) | Spinner centered + teks |

### 8.5 Color Design Tokens Reference

| Token | Nilai Hex | Penggunaan |
|---|---|---|
| C.primary | #2563A8 | Primary button, link aktif, aksen utama |
| C.success | #16A34A | Tombol approve, badge selesai, status aktif |
| C.warning | #D97706 | Badge revisi, status approaching deadline |
| C.danger | #DC2626 | Tombol destruktif, badge cancelled |
| C.info | #0284C7 | Informasi, badge target delivery |
| C.neutral | #6B7280 | Badge created, teks sekunder |
| C.border | #E5E7EB | Border komponen |
| C.background | #F9FAFB | Background halaman |

---

*Dokumen ini adalah versi 1.0 dari 014 UI Screen Catalog untuk KINETIC CRM.*
*Setiap perubahan pada desain layar sistem harus diperbarui dalam dokumen ini sebelum implementasi.*
*Cross-reference dengan dokumen: 013 Global State Machine Reference, 012 Information Architecture & Navigation, 015-020 Organization & Access Modules, 032-038 Core Business Modules.*

---
**Akhir Dokumen 014 — UI Screen Catalog**
**KINETIC CRM | Confidential / Internal | Versi 1.0 | Juni 2025**
