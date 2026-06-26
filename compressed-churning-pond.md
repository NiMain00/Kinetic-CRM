# Plan: Fitur Project Chat - Single Communication Platform

## Context
Kinetic CRM diminta menjadi single communication platform agar user tidak perlu pindah ke WhatsApp/Telegram untuk berkomunikasi. Fitur chat akan diintegrasikan ke dalam halaman setiap project, sehingga seluruh diskusi terdokumentasi langsung di konteks project yang sedang dikerjakan.

**Kebutuhan:**
- Chat per Project (real-time)
- Mention user (@user)
- Upload dan berbagi file/gambar
- Notifikasi pesan dan mention
- Histori komunikasi tersimpan pada project terkait
- Akses dari Sidebar Navigation

---

## Tech Stack Summary
- **Frontend:** React 19 + Vite + TypeScript + TailwindCSS 4
- **State:** Zustand + TanStack React Query
- **Routing:** React Router DOM 7
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod
- **Backend:** Node.js (terpisah, API di `VITE_API_BASE_URL`)
- **Database:** MySQL + Redis
- **File Upload:** Sudah ada fitur upload di config (`ConfigUploadPage`)

---

## Approach: Chat Tab di Project Detail Page

Fitur chat akan ditambahkan sebagai **tab baru** di halaman `ProjectDetailPage`, tepatnya di `frontend/src/features/projects/tabs/`. Ini adalah approach paling natural karena:
1. User sudah familiar dengan tab-based UI di project detail
2. Chat langsung dalam konteks project yang sedang dikerjakan
3. Tidak perlu navigasi terpisah, semua ada di satu halaman

---

## File Changes

### 1. Database Schema (Backend SQL)

Buat file `frontend/src/features/projects/tabs/../../scripts/` atau langsung di backend:
- **`project_messages`** - Tabel utama pesan chat
  - `id` (INT, PK, AUTO_INCREMENT)
  - `project_id` (INT, FK → projects)
  - `sender_id` (INT, FK → users)
  - `content` (TEXT) - konten pesan
  - `message_type` (ENUM: 'text', 'file', 'image')
  - `file_url` (VARCHAR, NULL) - untuk file/image
  - `file_name` (VARCHAR, NULL) - nama file asli
  - `file_size` (INT, NULL) - ukuran file
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)

- **`project_message_mentions`** - Relasi mention
  - `id` (INT, PK)
  - `message_id` (INT, FK → project_messages)
  - `user_id` (INT, FK → users)

- **`project_message_reads`** - Tracking baca pesan
  - `id` (INT, PK)
  - `message_id` (INT, FK → project_messages)
  - `user_id` (INT, FK → users)
  - `read_at` (TIMESTAMP)

### 2. Backend API Endpoints

**Chat API (project-scoped):**
- `GET /api/projects/:projectId/messages` - Ambil pesan (pagination, infinite scroll)
- `POST /api/projects/:projectId/messages` - Kirim pesan baru
- `POST /api/projects/:projectId/messages/:messageId/read` - Tandai sudah dibaca
- `GET /api/projects/:projectId/messages/unread-count` - Jumlah belum dibaca
- `POST /api/projects/:projectId/upload` - Upload file untuk chat

### 3. Frontend Files

#### a. Chat Feature Module
```
frontend/src/features/projects/tabs/
├── ChatTab.tsx                    # Main chat tab container
├── components/
│   ├── ChatMessageList.tsx        # List pesan dengan auto-scroll
│   ├── ChatMessageItem.tsx        # Single message bubble
│   ├── ChatInput.tsx              # Input area + file upload + @mention
│   ├── ChatMentionPopup.tsx       # Dropdown autocomplete saat ketik @
│   ├── ChatFilePreview.tsx        # Preview file/gambar di chat
│   └── ChatHeader.tsx             # Header dengan info project & online indicator
```

#### b. Services
```
frontend/src/services/
├── chatService.ts                 # API calls untuk chat
```

#### c. Store (Zustand)
```
frontend/src/stores/
├── chatStore.ts                   # State management chat
```

#### d. Types
```
frontend/src/types/
├── chat.ts                        # TypeScript interfaces
```

#### e. Integrations
- **`ProjectDetailPage.tsx`** - Tambah tab "Diskusi" / "Chat"
- **`nav-items.ts`** - Tambah badge/unread count di sidebar (opsional, untuk notifikasi)
- **`App.tsx`** - Tambah chat context provider

### 4. UI Components Detail

#### ChatTab.tsx (Main Container)
- Layout: Sidebar kiri (info project + anggota) + Area chat kanan
- Infinite scroll ke atas untuk load histori lama
- Auto-scroll ke bawah saat ada pesan baru
- Unread indicator jika ada pesan baru

#### ChatMessageItem.tsx
- Avatar pengirim
- Nama + timestamp
- Konten pesan (text dengan markdown sederhana)
- Preview file/gambar jika ada attachment
- Highlight jika current user di-mention
- Indikator "read" (✓✓)

#### ChatInput.tsx
- Textarea auto-resize
- Tombol kirim (Enter untuk send, Shift+Enter untuk newline)
- Tombol upload file (drag & drop juga)
- @mention autocomplete (trigger ketik `@`)
- Typing indicator

#### ChatMentionPopup.tsx
- Muncul saat user ketik `@`
- Filter user berdasarkan ketikan
- Tampilkan avatar + nama + role
- Pilih user untuk insert mention

### 5. Real-time Strategy

Karena project ini sudah menggunakan React Query, ada beberapa opsi:

**Opsi A: Polling (Recommended untuk MVP)**
- Poll setiap 3-5 detik untuk pesan baru
- Gunakan `staleTime` React Query yang pendek
- Simple dan tidak perlu infrastruktur tambahan
- Cukup untuk jumlah user tidak terlalu banyak

**Opsi B: WebSocket (Future Enhancement)**
- Butuh WebSocket server (bisa pakai Socket.io)
- Real-time sebenarnya
- Lebih kompleks setup

**Rekomendasi:** Mulai dengan Opsi A (Polling), upgrade ke WebSocket nanti jika dibutuhkan.

### 6. File Upload Strategy

Gunakan pattern yang sudah ada di `ConfigUploadPage`:
- Preview gambar sebelum upload
- Upload ke endpoint yang sudah ada
- Progress indicator
- Batasi ukuran file (configurable dari `STORAGE_MAX_UPLOAD_MB`)

### 7. Notification Integration

Integrasikan dengan sistem notifikasi yang sudah ada di `NotificationsPage`:
- Saat ada pesan baru → buat notifikasi untuk anggota project
- Saat ada mention → notifikasi khusus untuk yang di-mention
- Tampilkan unread badge di sidebar (opsional)

---

## Implementation Steps

### Phase 1: Backend Setup (2-3 hari)
1. Buat database migration untuk tabel `project_messages`, `project_message_mentions`, `project_message_reads`
2. Buat API endpoints untuk chat (GET/POST messages, upload, unread count)
3. Buat endpoint untuk mention dan read tracking
4. Test API dengan Postman/curl

### Phase 2: Frontend - Chat Core (3-4 hari)
1. Buat TypeScript types untuk chat
2. Buat chatService.ts untuk API calls
3. Buat chatStore.ts untuk state management
4. Buat ChatTab.tsx sebagai container utama
5. Buat ChatMessageList.tsx dan ChatMessageItem.tsx
6. Buat ChatInput.tsx dengan basic functionality

### Phase 3: Advanced Features (2-3 hari)
1. Implementasi @mention dengan autocomplete popup
2. Implementasi file upload dengan preview
3. Implementasi infinite scroll untuk histori
4. Implementasi unread indicator dan read tracking
5. Auto-scroll behavior

### Phase 4: Integration & Polish (1-2 hari)
1. Integrasikan ChatTab ke ProjectDetailPage sebagai tab baru
2. Tambah badge unread di sidebar (opsional)
3. Tambah notifikasi untuk pesan baru
4. Testing end-to-end
5. UI/UX polish (loading states, empty states, error handling)

---

## Key Files to Modify

| File | Change |
|------|--------|
| `frontend/src/features/projects/ProjectDetailPage.tsx` | Tambah tab "Diskusi" |
| `frontend/src/features/projects/tabs/` | Tambah folder `components/` dan file chat |
| `frontend/src/services/` | Tambah `chatService.ts` |
| `frontend/src/stores/` | Tambah `chatStore.ts` |
| `frontend/src/types/` | Tambah `chat.ts` |
| `frontend/src/routes/nav-items.ts` | (opsional) Tambah badge di sidebar |

---

## Reusable Components

Existing components yang bisa dipakai ulang:
- `frontend/src/components/shared/` - Shared UI components (Modal, Badge, dll)
- `frontend/src/components/layout/AppLayout.tsx` - Layout pattern
- ConfigUploadPage pattern untuk file upload
- NotificationPage pattern untuk notifikasi

---

## Verification Plan

1. **Unit Test:** Test chatService API calls
2. **Component Test:** Test ChatMessageItem render dengan various message types
3. **Integration Test:** Test kirim pesan → muncul di list
4. **E2E Test:** Login → Buka Project → Buka Tab Chat → Kirim pesan → Verify muncul
5. **File Upload Test:** Upload gambar → Verify preview → Verify download
6. **Mention Test:** Ketik @ → Verify autocomplete muncul → Pilih user → Verify highlight
7. **Responsive Test:** Test di mobile dan desktop
8. **Performance Test:** Test dengan banyak pesan (100+ messages)

---

## Dependencies

Tidak perlu install package baru! Semua sudah ada:
- React Query untuk data fetching
- Zustand untuk state management
- Lucide React untuk icons
- TailwindCSS untuk styling
- Axios untuk HTTP requests

---

## Risk & Mitigation

| Risk | Mitigation |
|------|------------|
| Real-time delay | Mulai dengan polling 3-5 detik, upgrade ke WebSocket nanti |
| File size terlalu besar | Gunakan config `STORAGE_MAX_UPLOAD_MB` yang sudah ada |
| Performance dengan banyak pesan | Implementasi pagination/infinite scroll |
| Mobile experience | Responsive design dengan TailwindCSS |

---

## Future Enhancements (Phase 2)

1. **WebSocket** untuk real-time sebenarnya
2. **Typing indicator** - "User sedang mengetik..."
3. **Message reply** - Balas pesan tertentu
4. **Message edit/delete** - Edit/hapus pesan
5. **Emoji reaction** - React dengan emoji
6. **Thread/Organized discussion** - Thread per topik
7. **Integration dengan RKS/BOQ** - Link pesan ke dokumen project
8. **Search in chat** - Cari pesan berdasarkan keyword
9. **Export chat history** - Export ke PDF/Excel
