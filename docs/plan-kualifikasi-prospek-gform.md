# Rencana Implementasi: Sistem Kualifikasi Prospek & Integrasi Google Forms

## 1. Latar Belakang

Marketing ingin workflow pembuatan prospek yang efisien:
1. **Semua prospek** — entah hot, medium, atau low — masuk **otomatis melalui Google Forms**
2. Google Forms → otomatis terdeteksi → data masuk ke sistem (customer + prospect + jawaban)
3. Baru setelah itu, di CRM:
   - **Hot**: bisa dikelola penuh (edit detail, kirim review, approve, konversi ke proyek)
   - **Low/Medium**: cuma bisa dilihat dan dinaikkan level-nya (promote)
4. Sidebar perlu sub-menu baru di bawah "Prospek" untuk halaman kualifikasi

**Intinya:** Google Forms jadi gerbang utama input data prospek. CRM jadi tools untuk manage & follow-up, terutama yang sudah hot.

---

## 2. Current State

**Backend (Prisma Schema):**
- `CustomerLevel` enum: `hot`, `medium`, `low` — sudah ada
- `Customer.level?: CustomerLevel?` — sudah ada
- `Customer` ↔ `Prospect` relasi via `customerId` — sudah ada
- `ProspectAnswer` model untuk menyimpan jawaban pertanyaan — sudah ada
- `Question` master data dengan context `prospect`, `rks`, `both` — sudah ada
- `Customer.source?: String?` — sudah ada untuk tracking sumber data

**Frontend:**
- `NAV_ITEMS` — flat list, belum nested
- `Sidebar.tsx` — render flat, belum support collapsible sub-menu
- `ProspectFormPage.tsx` — form create/edit prospek
- `ProspectDetailPage.tsx` — detail prospek dengan tabs
- `customerStore.ts` — sudah ada `updateCustomer(id, data)` untuk update level
- Routes `/prospects/new` dan `/prospects/:id/edit` — sudah ada

---

## 3. Alur Data

```
Google Form → Google Apps Script → POST /api/gform/webhook
                                           ↓
                    ┌──────────────────────────────────┐
                    │  GformWebhookService              │
                    │  - Parse semua jawaban form        │
                    │  - Auto-create/update Customer      │
                    │    (level sesuai jawaban form)      │
                    │  - Auto-create Prospect             │
                    │  - Simpan semua jawaban              │
                    └──────────────────────────────────┘
                                           ↓
                               Customer + Prospect terbuat
                               (level low/medium/hot)
                                           ↓
                    ┌──────────────────────────────────┐
                    │  Halaman Kualifikasi              │
                    │  (/prospects/qualification)       │
                    │                                   │
                    │  LOW       MEDIUM       HOT       │
                    │  ┌────┐    ┌────┐     ┌────┐     │
                    │  │card│ →  │card│ →  │card│ →    │
                    │  │card│    │card│     │card│  Full│
                    │  └────┘    └────┘     └────┘  akses│
                    └──────────────────────────────────┘
                                           ↓
                          HOT → bisa diedit penuh di CRM
                          LOW/MEDIUM → hanya lihat & promote
```

---

## 4. Detail Implementasi

### 4.1. Sidebar: Sub-menu "Kualifikasi"

**File: `frontend/src/config/nav-items.ts`**

Tambahkan children ke item "Prospek":

```typescript
{
  label: 'Prospek',
  path: '/prospects',
  icon: 'person',
  permissions: [PERMISSIONS.PROSPECT_READ],
  children: [
    { 
      label: 'Daftar Prospek', 
      path: '/prospects', 
      icon: 'list_alt',
      permissions: [PERMISSIONS.PROSPECT_READ] 
    },
    { 
      label: 'Kualifikasi', 
      path: '/prospects/qualification', 
      icon: 'trending_up',
      permissions: [PERMISSIONS.PROSPECT_READ] 
    },
  ]
}
```

**File: `frontend/src/components/layout/Sidebar.tsx`**

Tambah render untuk parent item dengan children:
- Jika `item.children` ada → render sebagai tombol expandable
- Klik parent toggle → buka/tutup sub-list
- Sub-list punya indentasi
- Active state untuk sub-item yang aktif
- Icon arrow expand/collapse di kanan
- Saat `collapsed`: parent tetap tampil, children tidak dirender

### 4.2. Route Baru

**File: `frontend/src/routes/router.tsx`**

```typescript
const ProspectQualificationPage = LazyLoadPermission(
  lazy(() => import('@/features/prospects/ProspectQualificationPage')),
  ['prospect:read']
);

// Di route group prospects:
<Route path="prospects/qualification" element={<ProspectQualificationPage />} />
```

### 4.3. Halaman Kualifikasi (Kanban per Level)

**File baru: `frontend/src/features/prospects/ProspectQualificationPage.tsx`**

**Tampilan:**
- Header: judul "Kualifikasi Prospek"
- 3 kolom Kanban: **LOW** (slate) | **MEDIUM** (amber) | **HOT** (red)
- Setiap kolom punya count badge + daftar kartu

**Kartu per prospek:**
- Nama customer/prospek
- Level badge dengan warna
- Sumber: "Google Forms" atau "Manual"
- Timestamp
- PIC marketing
- Tombol aksi:
  - LOW → "Naikkan ke Medium"
  - MEDIUM → "Naikkan ke Hot"
  - HOT → "Kelola di CRM" (link ke detail/edit)

**Logic promote:** `customerStore.updateCustomer(customerId, { level: 'medium' })`

### 4.4. Google Forms Webhook (Backend)

**File baru:** `backend/src/gform/gform.module.ts`
**File baru:** `backend/src/gform/gform.controller.ts`
**File baru:** `backend/src/gform/gform.service.ts`

**Endpoint:** `POST /api/gform/webhook`
**Auth:** API Key (header `x-api-key`)

**Contoh payload:**
```json
{
  "form_id": "google-form-id",
  "submission_id": "uniq-123",
  "submitted_at": "2026-07-16T10:00:00Z",
  "answers": {
    "nama_customer": "PT. Maju Bersama",
    "pic_name": "Budi Santoso",
    "pic_position": "Procurement Manager",
    "pic_phone": "08123456789",
    "pic_email": "budi@example.com",
    "kota": "Jakarta",
    "industri": "Telekomunikasi",
    "kebutuhan": "Pengadaan server dan jaringan",
    "level": "low"
  }
}
```

**Logic GformService:**
1. Validasi API Key
2. Parse answers → mapping field
3. Cek duplikat customer (by name + phone)
4. Create/update Customer with data + level dari form
5. Create Prospect dengan status Lead
6. Simpan jawaban sebagai ProspectAnswer
7. Return response

### 4.5. Level-based Access Gate

**File: `frontend/src/features/prospects/ProspectFormPage.tsx`**

```typescript
const customerLevel = customerMode === 'existing' 
  ? selectedCustomer?.level 
  : newCustLevel || existingProspect?.customerData?.level;

const isEditable = !customerLevel || customerLevel === 'hot';
```

- Jika `low/medium` → form read-only + banner info
- Jika `hot` atau null (baru) → editable penuh

**File: `backend/src/prospects/prospects.service.ts`**

Validasi di `update()`:
```typescript
if (customer?.level && customer.level !== 'hot') {
  throw new ForbiddenException('Hanya customer level Hot yang bisa diedit.');
}
```

### 4.6. Promote Level Endpoint

**Controller:**
```typescript
@Put(':id/promote')
async promote(@Param('id') id: string, @Body('level') level: CustomerLevel, @Req() req: any) {
  return this.service.promoteLevel(id, level, req.user);
}
```

**Service:**
```typescript
async promoteLevel(prospectId: string, newLevel: CustomerLevel, user: any) {
  const prospect = await this.get(prospectId, user);
  // Validasi hanya naik, tidak turun
  const levelOrder = { low: 0, medium: 1, hot: 2 };
  if (customer?.level && levelOrder[newLevel] <= levelOrder[customer.level]) {
    throw new BadRequestException('Level hanya bisa dinaikkan');
  }
  return this.prisma.customer.update({
    where: { id: prospect.customerId },
    data: { level: newLevel }
  });
}
```

---

## 5. Daftar File

### Diubah:
1. `frontend/src/config/nav-items.ts`
2. `frontend/src/components/layout/Sidebar.tsx`
3. `frontend/src/routes/router.tsx`
4. `frontend/src/features/prospects/ProspectFormPage.tsx`
5. `backend/src/prospects/prospects.service.ts`
6. `backend/src/prospects/prospects.controller.ts`

### Dibuat Baru:
1. `frontend/src/features/prospects/ProspectQualificationPage.tsx`
2. `backend/src/gform/gform.module.ts`
3. `backend/src/gform/gform.controller.ts`
4. `backend/src/gform/gform.service.ts`

---

## 6. Urutan Implementasi

1. Sidebar + Navigasi (nav-items.ts + Sidebar.tsx + router.tsx)
2. Halaman Kualifikasi (ProspectQualificationPage.tsx)
3. Promote Endpoint (backend controller + service)
4. Access Gate (ProspectFormPage.tsx)
5. Google Forms Webhook (gform module)
6. Backend Validation (ProspectsService.update)

---

## 7. Verification

1. **Sidebar**: klik "Prospek" → sub-menu muncul, klik "Kualifikasi" → navigasi
2. **Kualifikasi**: 3 kolom dengan kartu sesuai level, promote berfungsi
3. **Access Gate**: prospek low/medium read-only, hot editable
4. **Webhook**: `POST /api/gform/webhook` → customer + prospect terbuat
5. **End-to-end**: Google Form → webhook → muncul di kolom → promote → edit
