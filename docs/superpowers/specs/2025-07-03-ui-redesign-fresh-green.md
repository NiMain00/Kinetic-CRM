# UI Redesign — Fresh Green

> **Scope**: Layout + Color palette redesign untuk seluruh aplikasi Kinetic CRM
> **Approach**: "Fresh Green" — hijau lebih segar dan ringan, layout lebih lega dan konsisten
> **Status**: Approved for implementation

---

## 1. Color Palette & Design Tokens

### Primary Color — Lebih Segar & Ringan

| Token | Value | Notes |
|-------|-------|-------|
| `--color-primary` | `#2E7D32` | Hijau daun — lebih cerah dari `#1B5E20` |
| `--color-primary-light` | `#4CAF50` | Hover state, ghost button |
| `--color-primary-lighter` | `#66BB6A` | Outline/ghost border |
| `--color-primary-dark` | `#1B5E20` | High-emphasis text only |
| `--color-primary-container` | `#E8F5E9` | Badge, selected state bg |
| `--color-primary-fixed` | `#C8E6C9` | Fixed bg elements |
| `--color-primary-fixed-dim` | `#A5D6A7` | |

### Surface — Lebih Hangat

| Token | Sekarang | Nanti |
|-------|----------|-------|
| `--color-background` | `#F9FAFB` | `#F8FAF8` |
| `--color-surface` | `#FFFFFF` | `#FFFFFF` (tetap) |
| `--color-surface-dim` | `#F3F4F6` | `#F1F5F1` |
| `--color-surface-container` | `#F3F4F6` | `#E8EDE8` |
| `--color-border` | `#E5E7EB` | `#E5E7EB` (tetap) |

### Dark Mode
Dark mode palette saat ini sudah cukup baik (`--color-primary: #81C784`). Tidak ada perubahan signifikan, hanya penyesuaian surface-container agar lebih kontras.

### Prinsip Penggunaan Warna
- **Primary** hanya untuk: tombol utama, link, active state, progress indicator
- **Primary-container** untuk: badge, selected row, notification dot
- **Surface** sebagai canvas putih bersih
- **Background** dengan sentuhan hijau hangat (bukan abu-abu dingin)

---

## 2. Layout — Sidebar & Topbar

### Sidebar
- **Default width**: 288px → **256px** (w-64)
- **Collapsed width**: 80px → **72px** (w-18)
- **Nav item active**: Garis accent hijau 3px di kiri + bg primary-container/30
- **Nav item hover**: bg-surface-container
- **Nav item normal**: text-on-surface-variant
- **Brand logo**: Kotak hijau tetap, lebih kecil (w-10 h-10)
- **Department badge**: bg-primary-container/30, text-primary
- **Collapse button**: Icon-only di bagian bawah

### Topbar
- **Height**: `h-14 sm:h-16` → `h-12 sm:h-14`
- **Search**: Full-width di desktop, icon di mobile
- **Icon buttons**: 32px wrapper, hover bg-surface-container
- **User avatar**: Border ring, tanpa teks nama di sebelahnya (tooltip saja)
- **Divider**: Garis tipis 1px, height 20px

### Main Content Spacing
```
Sekarang: px-3 sm:px-6 lg:px-8  py-4 sm:py-6
Nanti:    px-4 sm:px-8 lg:px-10 py-5 sm:py-8
```

---

## 3. Data Table (List Pages)

### Struktur
- **Row height**: `py-4` → `py-3` (+ `gap` antar kolom diperbaiki)
- **Header**: background `surface-dim`, sticky, semibold regular case
- **Hover**: bg `surface-container` + subtle shadow
- **Striped row**: Opsional `even:bg-surface-dim/30`
- **Selection**: Checkbox + row highlight hijau soft

### Filter Panel
- Filter berubah dari block statis menjadi **popover/drawer/slide-down**
- Trigger: satu tombol "Filter" dengan badge jumlah filter aktif
- Layout filter: grid 2-4 kolom, tergantung ruang

### Pagination
- Format: "Menampilkan 1-20 dari 156 data" + page numbers
- Posisi: Left-aligned info + right-aligned page controls

### Action Buttons
- Max 2 actions visible → sisanya di **overflow menu** (⋮)
- Export CSV jadi secondary button

---

## 4. Detail Pages (Procurement, Project)

### Sticky Header
- **Height lebih ramping**: `py-2 sm:py-3`
- **Breadcrumb**: icon home + chevron + current page
- **Back button**: ghost icon-only
- **Title**: Code (bold) + status badge + client subtitle
- **Shadow**: `shadow-sm` + border-bottom (lebih flat)

### Tab Navigation — Pills Style
- Tab active: bg-primary + text-white
- Tab available: transparan, hover fill
- Tab locked: icon lock + opacity 40%
- Tab disabled: cursor-not-allowed

### Konten Area
- Semua tab: padding seragam `p-6`, `max-w-6xl mx-auto`
- Card dalam tab: selalu pakai `Card` component dengan padding md
- Form fields: lebar konsisten, grid 2 kolom
- Section headers: `font-heading-section` + border-bottom + ikon

---

## 5. Form Elements

### Button
- **Radius**: `rounded-xl` → **`rounded-lg`** (8px)
- **Primary**: `bg-#2E7D32`, hover `bg-#4CAF50`
- **Padding md**: `px-4 py-2`
- **Variants**: primary, secondary, ghost, danger, success, warning, link
- **Loading**: spinner + pulse animation ringan
- **Ripple effect**: subtle pada active state

### Input & Select
- **Border**: `border-outline-variant` (lebih terang dari border)
- **Focus**: ring-2 + border color → primary
- **Padding**: `py-2` (lebih ramping)
- **Label**: uppercase tracking-wider, 11px font-size, semibold
- **Error**: border merah + icon warning di kanan
- **Placeholder**: `text-on-surface-variant/50` (lebih soft)
- **Select**: custom dropdown dengan chevron, height sama dengan input

### Modal
- **Animasi**: fade + scale, durasi 200ms
- **Header**: sticky dengan shadow tipis saat scroll
- **Footer**: sticky dengan border-top
- **Size**: sm(384px), md(448px), lg(672px), xl(896px)
- **Mobile**: bottom sheet mode dengan handle bar

---

## 6. Cards & Badges

### Card
- **Radius**: `rounded-2xl` → **`rounded-xl`** (seragam dengan button)
- **Shadow**: `shadow-card` (tetap), hover lebih smooth
- **Header**: icon + title + action pattern konsisten
- **Footer**: border tipis, action right-aligned

### Badge
- **Font-weight**: `font-bold`
- **Letter-spacing**: 0.3px
- **Style**: Soft background + bold text (**bukan** solid)
- **Pattern**: Color dot + text label (● Active, ● Overdue)
- **Variants**: default, success, warning, danger, info, primary, purple, gold, neutral, gradient

### Empty States
- Ilustrasi/icon besar + title + description + CTA button
- Search empty → saran filter berbeda
- Filter empty → tombol reset filter
- Data kosong → shortcut ke halaman terkait

---

## 7. Login Page

### Layout Dual-Panel
```
Panel Kiri (40%)             Panel Kanan (60%)
- bg-green-50/100            - bg-surface
- Logo + company name        - Form centered
- Tagline                    - Username + Password
- Pattern geometric subtle   - Remember me + Masuk
                              - Demo account selector
```

### Mobile
Panel kiri hilang → form full-width dengan background lebih terang.

---

## 8. Implementation Order

1. **Color tokens** — update `index.css` variables
2. **Sidebar + Topbar** — layout restructuring
3. **Form elements** — Button, Input, Select style alignment
4. **Cards, Badges, Empty States** — component updates
5. **Data Table** — row spacing, filter, pagination
6. **Detail pages** — tab pills, header, content spacing
7. **Login page** — dual-panel layout
8. **Dashboard** — post-MVP (skipped per request)

---

## Files to Modify

| File | Changes |
|------|---------|
| `frontend/src/index.css` | Color tokens, shadows, spacing |
| `frontend/src/components/layout/Sidebar.tsx` | Width, active state, spacing |
| `frontend/src/components/layout/Topbar.tsx` | Height, spacing, avatar |
| `frontend/src/components/layout/AppLayout.tsx` | Content padding |
| `frontend/src/components/ui/Button.tsx` | Radius, colors, padding |
| `frontend/src/components/ui/Input.tsx` | Border, padding, label, error |
| `frontend/src/components/ui/Select.tsx` | Border, padding, label |
| `frontend/src/components/ui/Modal.tsx` | Animation, sizes, mobile sheet |
| `frontend/src/components/ui/Card.tsx` | Radius, consistent padding |
| `frontend/src/components/ui/Badge.tsx` | Font-weight, letter-spacing, variants |
| `frontend/src/components/shared/DataTable.tsx` | Filter as popover, pagination |
| `frontend/src/components/shared/FilterPanel.tsx` | Convert to collapsible/drawer |
| `frontend/src/components/shared/EmptyState.tsx` | Icons, CTAs |
| `frontend/src/features/auth/LoginPage.tsx` | Dual-panel layout |
| `frontend/src/features/procurement/ProcurementDetailPage.tsx` | Tab pills, header |
| `frontend/src/features/projects/ProjectDetailPage.tsx` | Tab pills, header |
