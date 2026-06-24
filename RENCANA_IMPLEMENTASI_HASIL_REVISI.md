# RENCANA IMPLEMENTASI — KINETIC CRM (Frontend Only)

## Fase 1: Form Prospek & Customer Selection

**Tujuan**: Merekonstruksi `ProspectFormPage.tsx` dengan layout 2 kolom customer.

| # | Perubahan | File |
|---|-----------|------|
| 1 | **Two-column customer**: Kolom kiri untuk Existing Customer (autocomplete/search dari Master Data), kolom kanan untuk New Customer (inline form) | `pmprospect-form-1` |
| 2 | **Toggle Existing/New**: Radio/checkbox untuk memilih. Jika Existing → load data customer, disable form input. Jika New → enable field, simpan ke Master Data otomatis + badge kuning "Perlu Verifikasi" | `prospect-form-1` |
| 3 | **Field New Customer**: Nama, Kode, Tipe (Swasta/BUMN/Pemerintah/Asing), Kota, NPWP (opsional) — semua non-mandatory kecuali Nama | `prospect-form-2` |
| 4 | **PIC Customer**: Nama PIC, Jabatan PIC, No HP PIC — ditambahkan di form | `prospect-form-3` |
| 5 | **Potensi Penambahan Unit**: Field angka "Potensi Penambahan Unit" di form | `prospect-form-4` |
| 6 | **Cabang (Branch)**: Dropdown cabang, default dari user login. Non-mandatory | `prospect-form-5` |
| 7 | **Rename label**: "Evaluasi & Ketentuan Teknis" → **"Pertanyaan Standar"** | `prospect-form-6` |
| 8 | **Tambah 2 pertanyaan baru**: (a) "Apakah jenis pengadaan customer beli putus?" → multiple choice (Ya/Tidak). (b) "Sebutkan detail kebutuhan pengadaan unit" → long text / textarea | `prospect-form-7` |

## Fase 2: Flow & Status Prospek

**Tujuan**: Split status Prospecting jadi Non Potensial dan Potensial.

| # | Perubahan | File |
|---|-----------|------|
| 1 | **Tambah field `potensiUnit` ke tipe Prospect** (`types/domain/index.ts`) | `types-prospect` |
| 2 | **Tambah field `prospectType`**: `'non_potensial' \| 'potensial'` ke tipe Prospect | `types-prospect` |
| 3 | **Saat simpan draft**: Jika `potensiUnit` = 0 → status `Non Potensial`. Jika > 0 → status `Potensial` | `prospect-form-8` |
| 4 | **Filter tab di list**: Tambah tab "Non Potensial" dan "Potensial" (ganti "Prospecting") | `ProspectsPage.tsx` |
| 5 | **Status badge**: Non Potensial = grey/danger, Potensial = success/info (kuning untuk new customer) | `ProspectsPage.tsx` |

## Fase 3: Detail Prospek & Overview

**Tujuan**: Restruktur `ProspectDetailPage.tsx` dengan kondisi potensi.

| # | Perubahan | File |
|---|-----------|------|
| 1 | **Tambah Overview section**: Tampilkan potensi penambahan unit, customer info, PIC | `ProspectDetailPage.tsx` |
| 2 | **Kondisional**: Jika Non Potensial → sembunyikan tombol "Buat Proyek", tampilkan info terbatas. Jika Potensial → tampilkan tombol "Lanjut ke RKS / Buat Proyek" | `ProspectDetailPage.tsx` |
| 3 | **Status "Perlu Verifikasi"**: New customer yang belum diverifikasi dapat badge kuning di header | `ProspectDetailPage.tsx` |
| 4 | **Customer info card**: Tampilkan data customer lengkap (termasuk PIC, cabang, industri) | `ProspectDetailPage.tsx` |

## Fase 4: Project Overview Tab

**Tujuan**: Ubah progress stepper di Project Overview berdasarkan kondisi.

| # | Perubahan | File |
|---|-----------|------|
| 1 | **Kondisi flow**: Jika `type = 'Prospecting'` dan project berasal dari Non Potensial → stepper tidak tampil atau disabled | `ProjectDetailPage.tsx` bagian Overview |
| 2 | **Progress stepper**: Ubah visual stepper — saat ini hardcoded 5 langkah (RKS → Dept Review → LPHS/SIOS → Harga → Pemenang), sesuaikan dengan role user | `ProjectDetailPage.tsx` |
| 3 | **Map visual**: Ubah/refine tampilan map progress (bukan map geografis, tapi progress mapping) | `ProjectDetailPage.tsx` |

## Fase 5: Kompetitor / Provider Existing di Form

| # | Perubahan | File |
|---|-----------|------|
| 1 | **Tambah field "Provider Existing"** di form prospek (atau di form proyek?), non-mandatory, label: "Provider Existing" (bukan "Kompetitor") | `ProspectFormPage.tsx` atau `ProjectFormPage.tsx` |

**Pertanyaan**: Di form mana field ini ditambahkan? Prospek atau Proyek?

## Fase 6: Role & Permission Overhaul

**Tujuan**: Implementasi RBAC yang benar.

| # | Perubahan | File |
|---|-----------|------|
| 1 | **RoleRoute diterapkan secara konsisten** di semua route yang restricted | `router.tsx` |
| 2 | **Admin restriction**: Admin TIDAK bisa akses `/users/*`, `/config/*` | `nav-items.ts`, `router.tsx` |
| 3 | **Move Users ke Master Data**: Pindah route `/users/*` di bawah `/master-data/users/*` | `router.tsx`, `nav-items.ts` |
| 4 | **Update nav-items**: Hanya Super Admin yang lihat menu Users dan Config | `nav-items.ts` |
| 5 | **Perbaiki authStore**: Pastikan `roleName` dari user digunakan dengan benar untuk filtering | `authStore.ts`, `guards.tsx` |

## Fase 7: Master Data Navigation

| # | Perubahan | File |
|---|-----------|------|
| 1 | **Menu "Pengguna" pindah** ke bawah Master Data di sidebar | `nav-items.ts` |
| 2 | **Menu "Pengguna" di MasterDataPage**: Tambah tab Users di halaman Master Data | `MasterDataPage.tsx` |
| 3 | **Route update**: `/master-data/users` → menampilkan UserList | `router.tsx` |

## Files yang akan dimodifikasi (urutan pengerjaan):

```text
1. frontend/src/types/domain/index.ts          — tambah field Prospect
2. frontend/src/types/domain/prospect.ts       — refine tipe
3. frontend/src/features/prospects/ProspectFormPage.tsx  — form baru
4. frontend/src/features/prospects/ProspectsPage.tsx     — filter & status
5. frontend/src/features/prospects/ProspectDetailPage.tsx — overview & flow
6. frontend/src/features/projects/ProjectDetailPage.tsx   — stepper condition
7. frontend/src/stores/authStore.ts             — role handling
8. frontend/src/routes/guards.tsx               — perbaiki RoleRoute
9. frontend/src/routes/router.tsx               — route restrictions
10. frontend/src/routes/nav-items.ts             — menu restructuring
11. frontend/src/features/master-data/MasterDataPage.tsx — + Users tab
12. frontend/src/services/mock-data.ts           — update mock data
```

---

**Konfirmasi**: Apakah rencana ini sudah sesuai ekspektasi? Ada yang perlu ditambah/dikurangi? Khususnya untuk **Fase 5 (Provider Existing)**, saya perlu tahu apakah field itu di form **Prospek** atau **Proyek**.