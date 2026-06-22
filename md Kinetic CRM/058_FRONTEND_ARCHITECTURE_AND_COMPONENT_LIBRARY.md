# 058 — FRONTEND ARCHITECTURE AND COMPONENT LIBRARY
## KINETIC CRM — Standar Resmi Arsitektur Frontend & Pustaka Komponen

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 058 |
| **Nama Dokumen** | Frontend Architecture and Component Library |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Klasifikasi** | Confidential / Internal |
| **Sumber Utama** | BA Review STMS v1.0 |
| **Sumber Sekunder** | 000_DOCUMENT_INDEX.md, FE Spec STMS v1.0 |
| **Dokumen Terkait** | 006 (Tech Stack Specification), 012 (Information Architecture & Navigation), 013 (Global State Machine Reference), 014 (UI Screen Catalog), 020 (Authorization Enforcement Spec), 056/057 (API Conventions & Endpoint Spec) |
| **Status** | Final — Siap Digunakan |

**Dibaca oleh:** Frontend Developer, Frontend Architect, Tech Lead, Backend Developer (untuk kontrak API), QA Engineer, UI/UX Designer, Onboarding Engineer baru

---

## 1. PURPOSE

Dokumen ini adalah **standar resmi dan otoritatif** arsitektur frontend KINETIC CRM yang mengikat seluruh tim engineering. Tujuannya:

1. Menjadi **referensi tunggal** untuk struktur source code, sehingga setiap engineer — baik anggota tim awal maupun yang onboarding di kemudian hari — meletakkan kode baru di lokasi yang sama, dengan pola yang sama.
2. Mendefinisikan **kontrak arsitektural** antara layer (komponen, state, API, routing) agar perubahan pada satu layer tidak merembes tak terkendali ke layer lain.
3. Menjadi **dasar code review**: setiap pull request dapat dinilai objektif terhadap dokumen ini, bukan terhadap preferensi individu.
4. Menjadi **dasar estimasi dan onboarding**: sprint planning (063) dan kriteria definition-of-done mengasumsikan struktur yang didefinisikan di sini.

Dokumen ini **tidak** mendokumentasikan layar (screen) individual — itu adalah tanggung jawab **014_UI_SCREEN_CATALOG.md**. Dokumen ini menjawab pertanyaan "bagaimana kita membangun layar apa pun secara konsisten", bukan "layar apa yang harus dibangun".

---

## 2. SCOPE

### In Scope

- Prinsip arsitektur frontend (scalability, maintainability, reusability, separation of concerns, accessibility-first, mobile-first)
- Stack teknologi resmi dan justifikasi pemilihan versi
- Struktur folder lengkap dan konvensi penamaan
- Arsitektur routing (public, protected, nested, guard)
- Arsitektur layout (Auth, Main App, Dashboard, Error)
- Arsitektur state management (global, server, UI, session) dan kapan menggunakan masing-masing
- Arsitektur integrasi API (client, service layer, query layer, mutation layer)
- Klasifikasi dan standar komponen (Page, Feature, Shared, UI)
- Standar penggunaan komponen pustaka inti (Button, Input, Select, Date Picker, Modal, Drawer, Table, Data Grid, Badge, Toast, Tabs, Card)
- Arsitektur form (React Hook Form + Zod, error handling)
- Strategi responsive design
- Checklist accessibility (WCAG, keyboard nav, screen reader, focus management)
- Pertimbangan keamanan sisi frontend
- Standar coding (naming, typing, komentar)

### Out of Scope (didokumentasikan di tempat lain)

- Detail layar individual dan business rule per layar → **014_UI_SCREEN_CATALOG.md**
- Sitemap, struktur menu, breadcrumb rule → **012_INFORMATION_ARCHITECTURE_AND_NAVIGATION.md**
- Lifecycle status entitas bisnis (Prospect, Project, RKS, dst.) → **013_GLOBAL_STATE_MACHINE_REFERENCE.md**
- Kontrak request/response API per endpoint → **057_FULL_API_ENDPOINT_SPECIFICATION.md**
- Enforcement RBAC di backend/DB → **020_AUTHORIZATION_ENFORCEMENT_SPEC.md** (dokumen ini hanya membahas enforcement di sisi frontend)
- Target performa terukur (bundle size, TTI, dst.) → **059_NON_FUNCTIONAL_REQUIREMENTS.md**

---

## 3. FRONTEND ARCHITECTURE PRINCIPLES

Enam prinsip berikut mengikat setiap keputusan desain di dokumen ini. Ketika dua pendekatan implementasi sama-sama valid, prinsip ini menjadi tie-breaker.

### 3.1 Scalability

Frontend harus tetap dapat dikelola seiring jumlah modul bisnis bertambah (Fase 1 saja sudah mencakup 7 modul inti + konfigurasi + master data). Diwujudkan melalui:
- **Feature-first folder structure** (bukan type-first/teknis-first) — setiap modul bisnis (`prospects/`, `projects/`, `approvals/`, dst.) adalah unit mandiri yang berisi komponen, hook, dan API call miliknya sendiri.
- **Lazy loading per route** — setiap modul di-bundle terpisah dan dimuat hanya saat diakses, agar penambahan modul baru tidak memperbesar initial bundle secara linear.
- **Penambahan modul baru tidak boleh mengubah modul yang sudah ada** kecuali via titik ekstensi resmi (route config, sidebar config).

### 3.2 Maintainability

- **Satu tanggung jawab per file**: komponen, hook, dan fungsi service masing-masing fokus pada satu hal.
- **Tidak ada logika bisnis di komponen UI murni** (lihat 8.4 Component Architecture) — logika bisnis tinggal di hook/service layer agar dapat diuji terpisah dari rendering.
- **Tidak ada fetch langsung di komponen** — semua akses API melalui service layer (lihat Bagian 7), sehingga perubahan kontrak API hanya menyentuh satu lokasi.
- **Konvensi seragam** lebih diutamakan daripada optimasi lokal yang membuat satu bagian kode berbeda gaya dari yang lain.

### 3.3 Reusability

- Komponen dikategorikan berjenjang: **UI → Shared → Feature → Page** (lihat Bagian 8). Aturan: komponen di layer lebih rendah tidak boleh mengetahui keberadaan layer lebih tinggi.
- Pola UI yang berulang di banyak layar (list+filter+table, form+validasi, modal konfirmasi) **wajib** diabstraksi jadi komponen Shared sebelum dipakai di modul kedua — lihat pola "Pola Umum Master Data" yang sudah dipraktikkan secara konsisten di seluruh layar `MAST-*` pada 014.
- Konfigurasi lebih disukai daripada duplikasi: misalnya satu komponen `DataTable` yang dikonfigurasi per kolom, bukan tabel custom di setiap modul.

### 3.4 Separation of Concerns

Empat lapisan dipisah tegas dan hanya boleh berkomunikasi searah:

```
Page Component        (komposisi layout + routing params)
        ↓
Feature Component     (UI + interaksi spesifik modul)
        ↓
Hook / Query Layer    (state, fetching, caching)
        ↓
Service Layer (api.ts) (kontrak HTTP, transformasi payload)
        ↓
API Client (Axios instance)
```

Komponen tidak pernah memanggil `axios` langsung; hook tidak pernah merender JSX; service layer tidak pernah mengetahui React. Pelanggaran terhadap urutan ini (misal komponen memanggil service layer langsung tanpa lewat hook React Query) ditolak saat code review.

### 3.5 Accessibility First

Aksesibilitas bukan tahap akhir, melainkan syarat masuk komponen ke pustaka. Komponen UI (Bagian 9) yang tidak memenuhi checklist accessibility dasar (Bagian 14) tidak dianggap selesai — bukan "nice to have" yang ditambahkan belakangan. Hal ini konsisten dengan persyaratan accessibility yang sudah dilampirkan per-layar di 014 (mis. `role="dialog"`, focus trap pada SlideDrawer).

### 3.6 Mobile Responsive First

Setiap komponen dan layout didesain dari breakpoint terkecil (mobile) lalu diperluas ke breakpoint lebih besar — bukan sebaliknya. Ini konsisten dengan keputusan FE Spec sumber yang sudah menetapkan strategi "Mobile-first Tailwind" sebagai konvensi kode. Implikasinya: kelas Tailwind dasar (tanpa prefix) merepresentasikan tampilan mobile; modifier `sm:`, `md:`, `lg:`, `xl:` menambah/mengubah perilaku untuk layar lebih besar — tidak pernah sebaliknya (menulis style desktop dahulu lalu override mobile).

---
