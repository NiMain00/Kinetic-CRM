# Procurement Module — Design Document

**Date:** 2026-07-02
**Project:** Kinetic CRM
**Status:** Draft

## 1. Purpose

Memisahkan proses **Pengadaan (Procurement)** dari modul **Proyek** yang saat ini mencakup tahapan setelah penentuan pemenang. Tujuan utama adalah menyelaraskan struktur sistem dengan pembagian tanggung jawab stakeholder:

| Stakeholder | Modul | Cakupan |
|---|---|---|
| Marketing | Prospek | Lead, Prospek, Follow Up, Kualifikasi |
| PM (Project Management) | Proyek | Sampai tahap Pemenang |
| Procurement (PO) | Pengadaan (NEW) | Purchase Request s/d Penutupan |

## 2. Data Flow

```
Prospek → Proyek (PM) → Pemenang → MENANG → Auto-create → Pengadaan (Procurement)
                                                            ↕ Manual create
```

- **Hybrid creation**: Saat proyek ditandai MENANG, entri Pengadaan auto-tercipta dengan inherit data (client, nilai kontrak, lokasi). Tim Procurement juga bisa membuat manual tanpa referensi proyek.
- **Existing projects**: Semua proyek yang sudah lewat tahap Pemenang akan dibuatkan entri Pengadaan saat refactor.

## 3. Route Design

```
/procurement                   → ProcurementListPage
/procurement/new               → ProcurementFormPage  (manual create)
/procurement/:procurementId    → ProcurementDetailPage (default tab: overview)
/procurement/:procurementId/:tab → Tab-specific view
```

Nav item baru di sidebar: **Proses Pengadaan** (`inventory_2` icon, permission `procurement_view`)

## 4. Data Model

### Procurement (new type)

```typescript
interface Procurement {
  id: string;
  code: string;                    // PR-2026-001
  sourceProjectId?: string;        // referensi ke project asal
  sourceProjectCode?: string;
  
  // Inherited dari project (auto-create)
  client: string;
  contractValue: number;
  location: string;
  
  // Status
  status: ProcurementStatus;
  phase: string;
  progress: number;
  
  // Timestamps
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  
  // Purchase Request
  prNumber?: string;
  prDate?: string;
  prNotes?: string;
  
  // Vendor Selection
  selectedVendor?: string;
  vendorPic?: string;
  vendorContact?: string;
  
  // Purchase Order
  poNumber?: string;
  poDate?: string;
  poValue?: number;
  poNotes?: string;
  
  // Delivery / Tracking
  targetStartDate?: string;
  targetEndDate?: string;
  unitReadyDate?: string;
  unitShippedDate?: string;
  unitReceivedDate?: string;
  actualEndDate?: string;
  deliveryNote?: string;
  isDelivered?: boolean;
  deliveredAt?: string;
  
  // Progress & Closing
  progressNotes?: string;
  isClosed?: boolean;
  closedAt?: string;
  closedBy?: string;
  
  // Timeline, Dokumen, Diskusi (separate dari project)
  timeline?: TimelineEvent[];
  documents?: DocGroup[];
}

type ProcurementStatus =
  | 'Draft'
  | 'Purchase Request'
  | 'Vendor Selection'
  | 'PO Process'
  | 'Delivery'
  | 'Progress'
  | 'Closed'
  | 'Cancelled';
```

## 5. Phase Workflow

```
Draft → Purchase Request → Vendor Selection → PO Process → Delivery → Progress → Closed
                                                                                    ↕
                                                                              Cancelled
```

| Tab | Phase | Sequential? |
|---|---|---|
| Overview | Draft | Ya (default) |
| Purchase Request | Purchase Request | Ya |
| Vendor Selection | Vendor Selection | Ya |
| PO | PO Process | Ya |
| Delivery | Delivery | Ya |
| Progress | Progress | Ya |
| Closing | Closed / Cancelled | Ya |
| Timeline | — | Tidak (always open) |
| Dokumen | — | Tidak (always open) |
| Diskusi | — | Tidak (always open) |

## 6. File Changes

### New files (16)

| Path | Description |
|---|---|
| `src/types/domain/procurement.ts` | Tipe data Procurement |
| `src/features/procurement/procurementStore.ts` | Zustand store (CRUD, persist) |
| `src/features/procurement/ProcurementListPage.tsx` | Daftar procurement (mirip ProjectListPage) |
| `src/features/procurement/ProcurementFormPage.tsx` | Form create manual |
| `src/features/procurement/ProcurementDetailPage.tsx` | Detail + PhaseStepper + tab nav + tab panels |
| `src/features/procurement/tabs/OverviewTab.tsx` | Ringkasan procurement |
| `src/features/procurement/tabs/PurchaseRequestTab.tsx` | Input PR number & notes |
| `src/features/procurement/tabs/VendorSelectionTab.tsx` | Pilih vendor & kontak |
| `src/features/procurement/tabs/PoTab.tsx` | Input PO number, PO date, nilai |
| `src/features/procurement/tabs/DeliveryTab.tsx` | Target delivery + tanggal PO, unit ready, terkirim, diterima |
| `src/features/procurement/tabs/ProgressTab.tsx` | Catatan progress |
| `src/features/procurement/tabs/ClosingTab.tsx` | Finalisasi & penutupan |
| `src/features/procurement/tabs/TimelineTab.tsx` | Riwayat aktivitas (copy pola dari project) |
| `src/features/procurement/tabs/DokumenTab.tsx` | Dokumen procurement (copy pola dari project) |
| `src/features/procurement/tabs/DiskusiTab.tsx` | Chat procurement (copy pola dari project) |

### Modified files (7)

| Path | Changes |
|---|---|
| `src/routes/router.tsx` | Tambah route group `/procurement/*` |
| `src/routes/nav-items.ts` | Tambah nav "Proses Pengadaan" dengan permission `procurement_view` |
| `src/stores/configStore.ts` | Potong project phases di `Pemenang`, tambah procurement phases |
| `src/hooks/useConfigData.ts` | Export procurement phases hooks |
| `src/features/projects/ProjectDetailPage.tsx` | Hapus tab Target Delivery, sesuaikan daftar tabs & phase logic |
| `src/features/projects/tabs/PemenangTab.tsx` | Tambah trigger auto-create procurement saat MENANG |
| `src/features/projects/tabs/DeliveryTab.tsx` | HAPUS — pindah ke procurement DeliveryTab |

### Deleted files (1)

| Path | Reason |
|---|---|
| `src/features/projects/tabs/DeliveryTab.tsx` | Dipindah ke `procurement/tabs/DeliveryTab.tsx` |

## 7. Access Control / Permissions

Permission baru untuk procurement (mirip pola existing):

```
procurement_view   — melihat daftar & detail procurement
procurement_edit   — mengedit data procurement
procurement_delete — menghapus procurement
```

Role default: `Department Procurement` mendapat semua permission procurement.

## 8. Migration Strategy

1. Semua proyek dengan status `Target Delivery`, `Executing`, atau `Selesai` yang memiliki `winnerDetails.outcome === 'menang'` akan dibuatkan entri Procurement.
2. Data delivery existing (startDate, endDate, note, isCompleted, etc.) akan di-copy ke procurement.
3. Data yang sudah dimigrasi akan tetap muncul di daftar procurement.
4. Proyek yang sudah dimigrasi tetap utuh (tidak dihapus) — hanya saja dari sisi PM dianggap closed.

## 9. Non-Changes

- ✅ Backend tidak disentuh — hanya frontend dengan mock data
- ✅ Modul Prospek tidak berubah
- ✅ Modul Proyek tetap utuh hanya dipotong di Pemenang
- ✅ Approval flow tidak berubah (masih terpisah)
