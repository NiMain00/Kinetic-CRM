# 009 — INTEGRATION ARCHITECTURE
## KINETIC CRM — Arsitektur Integrasi (Eksternal & AI)

**Modul:** Architecture
**Sumber Utama:** PRD §5.2 (Out of Scope Fase 1), BA Review §E (Future Enhancement Roadmap); Instruksi tambahan AI Integration
**Dependensi Dokumen:** 005, 008
**Dirujuk Oleh:** 010 (AI Integration Architecture), 047 (Email & External Notification), 064 (Future Enhancement Roadmap)

---

## 1. TUJUAN DOKUMEN

Mendefinisikan bagaimana KINETIC CRM berintegrasi dengan sistem/layanan di luar batasnya sendiri — baik integrasi AI (Fase 1, aktif) maupun integrasi eksternal lain (SMTP, SSO, ERP, WhatsApp/Teams — sebagian besar Fase 2/3, didesain penuh sekarang).

---

## 2. PRINSIP INTEGRASI UTAMA

1. **Tidak ada modul bisnis yang memanggil layanan eksternal secara langsung.** Setiap integrasi eksternal melalui lapisan abstraksi khusus (Service Layer / Adapter), agar penggantian provider tidak memengaruhi kode bisnis.
2. **Kredensial integrasi dikelola terpusat** melalui Konfigurasi Integrasi Eksternal (CFG-14 — lihat 031), bukan hardcode.
3. **Kegagalan layanan eksternal tidak boleh menghentikan operasi inti.** Jika Gemini API down, fitur AI gagal secara graceful (pesan error jelas) tanpa mengganggu kemampuan user menyimpan RKS/LPHS/dll.
4. **Setiap integrasi eksternal dicatat di audit log** (request, response status, durasi).

---

## 3. KOMPONEN INTEGRASI AI — PRINSIP ARSITEKTUR RESMI

### 3.1 Diagram Alur Wajib

Ini adalah **prinsip arsitektur resmi** yang berlaku di seluruh sistem dan tidak dapat dilewati oleh modul manapun:

```
┌─────────────┐
│  Frontend    │   (React SPA — tidak pernah menyimpan/memanggil API key AI)
└──────┬──────┘
       │ HTTPS (request fitur AI, mis. POST /api/v1/ai/summarize/rks/{id})
       ▼
┌─────────────────────┐
│   Backend API         │   (Controller memvalidasi role/permission,
│   (Business Module)   │    mengambil data dari DB, TIDAK memanggil
└──────┬───────────────┘    Gemini langsung)
       │ panggilan internal (function/method call dalam codebase)
       ▼
┌─────────────────────────────┐
│      AI SERVICE LAYER          │   (Provider-agnostic interface:
│  (Provider Abstraction Layer)  │    summarize(), analyze(), search())
└──────┬─────────────────────────┘
       │ HTTP request (server-to-server, dengan API key)
       ▼
┌─────────────────┐
│   Gemini API       │   (Provider AI aktif Fase 1)
└─────────────────┘
```

### 3.2 Aturan yang Tidak Dapat Dilanggar

> **Business Module tidak boleh memanggil Gemini API langsung.**

Implikasi konkret bagi Backend Developer:
- Kelas/modul seperti `ProspectController`, `ProjectService`, `LphsService`, dst. **tidak memiliki dependency** ke library/HTTP client Gemini.
- Satu-satunya cara modul bisnis mengakses kapabilitas AI adalah melalui interface `AiServiceInterface` (atau setara) yang diekspos AI Service Layer.
- Hal ini memungkinkan penggantian provider (Gemini → OpenAI/Claude/Azure OpenAI) di masa depan **tanpa mengubah satu baris pun kode modul bisnis** — hanya mengganti implementasi di balik `AiServiceInterface`.

Detail lengkap struktur internal AI Service Layer (retry, rate limit, prompt management, dst.) ada di dokumen 010.

---

## 4. KOMPONEN INTEGRASI LAIN (FASE 2/3 — DIDESAIN PENUH SEKARANG)

### 4.1 Integrasi SMTP (Notifikasi Email Eksternal)

| Aspek | Detail |
|---|---|
| Tujuan | Notifikasi approval pending dan deadline approaching melalui email (GAP18) |
| Fase Implementasi | Fase 2 |
| Arsitektur | Backend → Notification Service (internal) → SMTP Adapter → Server SMTP perusahaan |
| Desain Penuh | Lihat dokumen 047 |

### 4.2 Integrasi SSO (SAML / OAuth2)

| Aspek | Detail |
|---|---|
| Tujuan | Eliminasi password terpisah, integrasi dengan Active Directory/Google Workspace (GAP17) |
| Fase Implementasi | Fase 2 |
| Arsitektur | Backend → Auth Module diperluas dengan SSO Strategy Pattern (mendukung multiple Identity Provider) → Identity Provider eksternal |
| Desain Tingkat Tinggi | Lihat dokumen 064 |

### 4.3 Approval One-Click via Email Link

| Aspek | Detail |
|---|---|
| Tujuan | Mengurangi friksi approval untuk Management yang sering di luar kantor (GAP19) |
| Fase Implementasi | Fase 2 |
| Arsitektur | Notification Service → generate secure tokenized URL (expiry, single-use) → endpoint khusus `/api/v1/approvals/quick-action/{token}` yang melakukan approval tanpa login penuh, dengan validasi token ketat |
| Desain Penuh | Lihat dokumen 047 |

### 4.4 Notifikasi WhatsApp/Microsoft Teams

| Aspek | Detail |
|---|---|
| Tujuan | Menjangkau approver di channel yang biasa mereka pakai (GAP18 perluasan) |
| Fase Implementasi | Fase 3 |
| Arsitektur | Notification Service → Channel Adapter Pattern (in-app, email, WhatsApp Business API, Teams Webhook) — Notification Service tidak tahu detail teknis tiap channel, hanya memanggil adapter yang sesuai |
| Desain Tingkat Tinggi | Lihat dokumen 064 |

### 4.5 API Publik untuk Integrasi ERP/CRM Eksternal

| Aspek | Detail |
|---|---|
| Tujuan | Integrasi dengan SAP, Salesforce, atau sistem internal lain (GAP21 terkait) |
| Fase Implementasi | Fase 3 |
| Arsitektur | API `/api/v1/` yang sudah ada diperluas dengan API key terpisah untuk pihak ketiga, scope permission terbatas, dan dokumentasi OpenAPI publik |
| Desain Tingkat Tinggi | Lihat dokumen 064 |

---

## 5. POLA DESAIN YANG DIGUNAKAN LINTAS INTEGRASI

| Pola | Penerapan |
|---|---|
| **Adapter Pattern** | Setiap channel notifikasi eksternal (SMTP, WhatsApp, Teams) diimplementasikan sebagai adapter yang patuh pada interface yang sama |
| **Strategy Pattern** | SSO mendukung beberapa Identity Provider melalui strategy yang dapat ditukar |
| **Provider Abstraction Layer** | AI Service Layer mengabstraksi provider AI (Gemini, dan masa depan OpenAI/Claude/Azure) |
| **Circuit Breaker (konsep, Fase 2+)** | Jika provider eksternal gagal berulang kali dalam rentang waktu tertentu, sistem berhenti mencoba sementara untuk mencegah cascading failure — direkomendasikan diterapkan saat volume integrasi bertambah |

---

## 6. RINGKASAN STATUS INTEGRASI

| Integrasi | Status Fase 1 | Status Desain |
|---|---|---|
| Gemini AI | **Aktif, diimplementasikan** | Penuh — 010, 011 |
| SMTP Email | Tidak aktif | Penuh — 047 |
| SSO | Tidak aktif | Tingkat tinggi — 064 |
| Approval via Email Link | Tidak aktif | Penuh — 047 |
| WhatsApp/Teams | Tidak aktif | Tingkat tinggi — 064 |
| API Publik ERP/CRM | Tidak aktif | Tingkat tinggi — 064 |
