# Plan Perubahan Kinetic CRM

## Ringkasan

Tiga fitur utama:
1. Super Admin bisa approve semua di LPHS/SIOS & project
2. Tambah delete di semua master data
3. Notifikasi berfungsi

---

## 1. Super Admin Approval di LPHS/SIOS & Project

### Masalah

Di `LphsSiosTab.tsx:72-73`, Super Admin bisa approve PM dan Management level, TAPI **tidak bisa approve Dept Head level**.

```typescript
// SAAT INI:
const isDeptHead = userRole === 'Dept Head';  // Super Admin TIDAK include

// Seharusnya:
const isDeptHead = userRole === 'Dept Head' || isSuperAdmin;
```

### File yang Diubah

#### 1.1 `LphsSiosTab.tsx` - Fix Role Super Admin

- Line 72-73: Tambah `|| isSuperAdmin` ke variabel `isDeptHead`
- Ini memungkinkan Super Admin approve di semua level (PM, Dept Head, Management)

#### 1.2 `ReviewRksTab.tsx` - Tambah Role Check

Saat ini approve RKS **TANPA role check** (siapa saja bisa approve). Perlu:

- Import `useAuthStore` untuk get user role
- Tambah role guard: hanya PM, Admin, Super Admin yang bisa approve/revisi
- Tampilkan tombol approve/revisi hanya untuk role yang sesuai
- Untuk role lain, tampilkan tombol disabled atau sembunyikan

#### 1.3 `ProspectDetailPage.tsx` - Verifikasi Super Admin

Sudah ada `isSuperAdmin` check, tapi perlu verifikasi semua approval path bisa diakses Super Admin.

### Coverage Approval di Project (Lengkap)

| Approval | File | Status |
|----------|------|--------|
| Prospek submit/approve/revisi | `ProspectDetailPage.tsx` | Sudah ada |
| RKS approve/revisi | `ReviewRksTab.tsx` | **Perlu role check** |
| LPHS PM approve | `LphsSiosTab.tsx` | Sudah ada |
| LPHS Dept Head approve | `LphsSiosTab.tsx` | **Super Admin tidak bisa** |
| LPHS Management approve | `LphsSiosTab.tsx` | Sudah ada |

---

## 2. Tambah Delete di Semua Master Data

### Status Saat Ini

| Entity | Create | Edit | Delete | File |
|--------|:------:|:----:|:------:|------|
| Categories | Ya | Ya | **Tidak** | `MasterCategoryPage.tsx` |
| Competitors | Ya | Ya | Ya | `MasterCompetitorPage.tsx` |
| Customers | Ya | Ya | Ya | `MasterCustomerPage.tsx` |
| Doc Types | Ya | Ya | Ya | `MasterDocTypePage.tsx` |
| Questions | Ya | Ya | Ya | `MasterQuestionPage.tsx` |
| Holidays | Ya | Ya | Ya | `MasterHolidayPage.tsx` |
| Loss Reasons | Ya | Ya | Ya | `MasterLossReasonPage.tsx` |
| Periods | Ya | Ya | Ya | `MasterPeriodPage.tsx` |
| Notif Templates | Ya | Ya | **Tidak** | `ConfigNotifTemplatePage.tsx` |

### Yang Perlu Ditambah

1. **`MasterCategoryPage.tsx`** - Tambah delete button + confirmation dialog
2. **`ConfigNotifTemplatePage.tsx`** - Tambah delete button + confirmation dialog
3. **Semua page** - Pastikan ada confirmation dialog (beberapa langsung delete tanpa konfirmasi)

### Pattern Delete yang Konsisten

```tsx
// 1. Import deleteData dari store
const deleteData = useMasterDataStore((s) => s.deleteData);

// 2. State untuk confirmation
const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

// 3. Fungsi handleDelete
const handleDelete = (id: string) => {
  setDeleteConfirm(id);
};

const confirmDelete = (id: string) => {
  deleteData('entityType', id);
  toast.success('Data berhasil dihapus');
  setDeleteConfirm(null);
};

// 4. Button delete di tabel
<button onClick={() => handleDelete(c.id)}
  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-danger transition-colors cursor-pointer"
  title="Hapus">
  <span className="material-symbols-outlined icon-compact text-[18px]">delete</span>
</button>

// 5. Confirmation modal
{deleteConfirm && (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center">
    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
      <h3 className="font-bold text-sm text-slate-800 mb-2">Hapus Data?</h3>
      <p className="text-xs text-slate-500 mb-4">
        Data yang dihapus tidak dapat dikembalikan.
      </p>
      <div className="flex gap-3 justify-end">
        <button onClick={() => setDeleteConfirm(null)}
          className="px-4 py-2 rounded-lg border border-border text-xs font-semibold">
          Batal
        </button>
        <button onClick={() => confirmDelete(deleteConfirm)}
          className="px-4 py-2 bg-danger text-white text-xs font-bold rounded-lg">
          Hapus
        </button>
      </div>
    </div>
  </div>
)}
```

---

## 3. Notifikasi Berfungsi

### Masalah Saat Ini

- `notificationStore.ts` - Hanya punya `unreadCount` (11 baris)
- `NotificationsPage.tsx` - Data hardcoded 4 item bahasa Inggris
- `notifications.ts` service - Empty stub

### Yang Dibangun

#### 3.1 Notification Interface & Store (`notificationStore.ts`)

```typescript
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'approval' | 'revision' | 'status_change' | 'assignment' | 'system';
  read: boolean;
  createdAt: string;
  entityId?: string;
  entityType?: 'prospect' | 'project';
  icon: string;
  color: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}
```

#### 3.2 Notifications Page Rewrite (`NotificationsPage.tsx`)

- Ganti hardcoded data dengan fetch dari `useNotificationStore`
- Tampilkan notifikasi real dari store
- Mark as read / archive berfungsi
- Filter by type (approval, revision, status_change, system)
- Search berfungsi

#### 3.3 Notification Triggers

Tambah `addNotification()` call di file berikut:

| Event | File | Trigger |
|-------|------|---------|
| Prospek disubmit | `ProspectDetailPage.tsx` | Saat submit prospek ke PM |
| Prospek di-approve | `ProspectDetailPage.tsx` | Saat PM approve |
| Prospek revisi | `ProspectDetailPage.tsx` | Saat PM minta revisi |
| RKS disubmit | `RksTab.tsx` | Saat submit RKS |
| RKS di-approve | `ReviewRksTab.tsx` | Saat approve RKS |
| LPHS disubmit | `LphsSiosTab.tsx` | Saat submit draft |
| LPHS PM approve | `LphsSiosTab.tsx` | Saat PM approve |
| LPHS Dept approve | `LphsSiosTab.tsx` | Saat dept approve |
| LPHS Mgmt approve | `LphsSiosTab.tsx` | Saat mgmt approve |
| Project status change | `projectStore.ts` | Update project status |

#### 3.4 Template dari Master Data

Sudah ada 6 templates di `masterDataStore.ts` (NT-01 sampai NT-06):

1. `prospect.submitted` - Prospek disubmit ke PM
2. `prospect.revision_sent` - Revisi prospek dikirim
3. `prospect.approved` - Prospek disetujui
4. `project.rks_submitted` - RKS disubmit
5. `project.deadline_approaching` - Deadline mendekat
6. `project.cancelled` - Proyek dibatalkan

#### 3.5 Notification Badge di Sidebar

- Tampilkan `unreadCount` di sidebar navigation item "Notifikasi"
- Update badge real-time saat ada notifikasi baru

---

## Urutan Implementasi

### Phase 1: Super Admin Approval (~30 menit)

1. Fix `isDeptHead` di `LphsSiosTab.tsx:72-73`
2. Tambah role check di `ReviewRksTab.tsx`
3. Verifikasi `ProspectDetailPage.tsx` sudah lengkap

### Phase 2: Master Data Delete (~45 menit)

1. `MasterCategoryPage.tsx` - tambah delete + confirmation dialog
2. `ConfigNotifTemplatePage.tsx` - tambah delete + confirmation dialog
3. Review semua master data page, pastikan semua punya confirmation dialog

### Phase 3: Notifikasi (~1.5 jam)

1. Rewrite `notificationStore.ts` dengan interface & actions lengkap
2. Rewrite `NotificationsPage.tsx` fetch dari store
3. Tambah notification triggers di:
   - `ProspectDetailPage.tsx`
   - `ReviewRksTab.tsx`
   - `LphsSiosTab.tsx`
   - `projectStore.ts`
4. Update sidebar badge di layout

---

## File List Lengkap

### Phase 1 (3 file)

- `frontend/src/features/projects/tabs/LphsSiosTab.tsx`
- `frontend/src/features/projects/tabs/ReviewRksTab.tsx`
- `frontend/src/features/prospects/ProspectDetailPage.tsx` (verify)

### Phase 2 (2-3 file)

- `frontend/src/features/master-data/MasterCategoryPage.tsx`
- `frontend/src/features/config/ConfigNotifTemplatePage.tsx`
- (other pages - verify confirmation dialog exists)

### Phase 3 (6+ file)

- `frontend/src/stores/notificationStore.ts`
- `frontend/src/features/notifications/NotificationsPage.tsx`
- `frontend/src/features/projects/tabs/LphsSiosTab.tsx` (add notification triggers)
- `frontend/src/features/projects/tabs/ReviewRksTab.tsx` (add notification triggers)
- `frontend/src/features/prospects/ProspectDetailPage.tsx` (add notification triggers)
- `frontend/src/stores/projectStore.ts` (add notification on status change)
- `frontend/src/components/layout/AppLayout.tsx` (sidebar badge)

### Total: ~12-14 file diubah
