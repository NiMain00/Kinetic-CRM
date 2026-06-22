# 010 — AI INTEGRATION ARCHITECTURE
## KINETIC CRM — Arsitektur Integrasi AI (Gemini) sebagai Komponen Resmi

**Modul:** Architecture
**Sumber Utama:** Instruksi tambahan eksplisit stakeholder (AI Integration sebagai komponen arsitektur resmi, bukan env var semata)
**Dependensi Dokumen:** 005, 008, 009
**Dirujuk Oleh:** 011 (AI Features & Use Cases), 031 (Config Integrasi Eksternal), 057 (API Endpoint Spec), 060 (Docker Deployment), 052 (Audit Trail)

---

## 1. TUJUAN DOKUMEN

AI **bukan** fitur tempelan atau sekadar variabel environment di Docker Compose. Dokumen ini menetapkan AI Service Layer sebagai **komponen arsitektur kelas satu** KINETIC CRM, dengan kontrak desain yang sama formalnya dengan Database Layer atau Approval Engine.

---

## 2. AI SERVICE LAYER — DEFINISI DAN BATAS TANGGUNG JAWAB

### 2.1 Definisi

AI Service Layer adalah modul backend internal yang menjadi **satu-satunya pintu masuk** bagi seluruh kebutuhan kapabilitas AI generatif di KINETIC CRM. Modul ini:

- Mengekspos kontrak fungsi tingkat tinggi yang independen dari provider (`summarize()`, `analyze()`, `search()`, `extractInsight()`).
- Menyembunyikan seluruh detail teknis komunikasi dengan provider AI dari modul bisnis manapun.
- Bertanggung jawab atas retry, rate limiting, logging, cost control, dan keamanan permintaan AI.

### 2.2 Yang BUKAN Tanggung Jawab AI Service Layer

- Tidak menyimpan data bisnis (itu tetap tanggung jawab Database Layer).
- Tidak melakukan otorisasi/RBAC (itu tanggung jawab middleware Backend sebelum permintaan mencapai AI Service Layer).
- Tidak merender UI (itu tanggung jawab Frontend).

---

## 3. PROVIDER ABSTRACTION LAYER

### 3.1 Tujuan

Memungkinkan KINETIC CRM berganti atau menambah provider AI (OpenAI, Anthropic Claude, Azure OpenAI) tanpa mengubah kode modul bisnis maupun kontrak AI Service Layer yang dipakai modul bisnis.

### 3.2 Struktur Konseptual

```
AiServiceInterface (kontrak yang dilihat modul bisnis)
        │
        ▼
AiServiceImplementation (implementasi AI Service Layer)
        │
        ▼
ProviderAdapterInterface (kontrak internal antar-provider)
        │
        ├── GeminiAdapter        (aktif, Fase 1)
        ├── OpenAiAdapter        (placeholder struktur, tidak aktif)
        ├── ClaudeAdapter        (placeholder struktur, tidak aktif)
        └── AzureOpenAiAdapter   (placeholder struktur, tidak aktif)
```

### 3.3 Kontrak `ProviderAdapterInterface` (Spesifikasi Fungsional)

| Method | Parameter | Return | Keterangan |
|---|---|---|---|
| `generateText(prompt, options)` | prompt (string), options (max_tokens, temperature, model) | response text, token usage, status | Fungsi inti generasi teks |
| `generateEmbedding(text)` | text (string) | vector embedding | Untuk Smart Search semantik (011) |
| `healthCheck()` | — | boolean status | Untuk pengecekan ketersediaan provider sebelum eksekusi batch |

### 3.4 Pemilihan Provider

Provider aktif ditentukan oleh konfigurasi `AI_PROVIDER` (lihat 031 CFG-14 dan 060) — bukan hardcode di kode aplikasi. Mengganti provider berarti mengganti nilai konfigurasi dan memastikan adapter terkait sudah diimplementasikan, tanpa deployment ulang modul bisnis.

---

## 4. GEMINI API INTEGRATION (PROVIDER AKTIF FASE 1)

| Aspek | Spesifikasi |
|---|---|
| Model Default (teks/analisis) | `gemini-2.5-pro` |
| Model Embedding (Smart Search) | `text-embedding-004` |
| Protokol Komunikasi | HTTPS REST, server-to-server (Backend → Gemini), tidak pernah dari Frontend |
| Autentikasi ke Gemini | API Key (`GEMINI_API_KEY`), disimpan sebagai secret backend |
| Timeout Default | 60 detik (`AI_TIMEOUT`, dapat dikonfigurasi) |
| Format Request | JSON, mengikuti struktur request Gemini API resmi (`contents`, `generationConfig`) |
| Format Response yang Diproses | Teks hasil generasi diekstrak dari struktur response Gemini, divalidasi tidak kosong sebelum diteruskan ke Backend Controller |

---

## 5. FUTURE PROVIDER SUPPORT

| Provider | Status Fase 1 | Catatan Kesiapan |
|---|---|---|
| OpenAI API | Tidak aktif, struktur adapter disiapkan | Kontrak `ProviderAdapterInterface` sudah cukup generik untuk menampung model GPT |
| Anthropic Claude API | Tidak aktif, struktur adapter disiapkan | Sama seperti di atas |
| Azure OpenAI | Tidak aktif, struktur adapter disiapkan | Memerlukan parameter tambahan (endpoint resource, deployment name) yang diakomodasi melalui `options` pada `generateText()` |

**Kriteria penambahan provider baru di masa depan:**
1. Implementasikan `ProviderAdapterInterface` untuk provider baru.
2. Tambahkan nilai baru pada enum/master `AI_PROVIDER` melalui CFG-14.
3. Tidak ada perubahan pada AI Service Layer inti maupun modul bisnis manapun.

---

## 6. RETRY STRATEGY

| Parameter | Nilai Default | Konfigurasi |
|---|---|---|
| Maksimum Retry | 3 kali | `AI_MAX_RETRIES` |
| Strategi Backoff | Exponential backoff (mis. 1s, 2s, 4s) | Internal AI Service Layer |
| Kondisi Retry | Timeout, HTTP 5xx dari provider, rate limit response (HTTP 429) dari provider | — |
| Kondisi TIDAK Retry | HTTP 4xx selain 429 (mis. permintaan invalid), kegagalan validasi input | — |
| Setelah Retry Habis | Backend mengembalikan error terstruktur ke Frontend: *"Fitur AI sedang tidak tersedia, coba lagi nanti"* — operasi bisnis utama (simpan data) tetap berhasil terlepas dari status AI |

---

## 7. ERROR HANDLING

| Skenario Error | Penanganan |
|---|---|
| Provider AI down/timeout | Setelah retry habis, kembalikan error terstruktur; **jangan** memblokir operasi penyimpanan data bisnis yang sedang berjalan bersamaan |
| Response AI kosong/tidak valid | Anggap sebagai gagal, tidak ditampilkan ke user sebagai hasil valid |
| Rate limit internal terlampaui (lihat §8) | Tolak permintaan dengan pesan jelas sebelum mencapai provider, hemat kuota |
| API Key tidak valid/habis | Log sebagai critical error ke monitoring; tampilkan pesan generik ke user, detail hanya di log server |

---

## 8. RATE LIMITING

| Lapisan | Spesifikasi |
|---|---|
| Per User | Maksimum N permintaan AI per jam (nilai default dikonfigurasi melalui CFG-14, mis. 30/jam) — mencegah penyalahgunaan oleh satu akun |
| Global (Sistem) | Maksimum permintaan paralel ke provider untuk menghindari pelampauan kuota API Gemini di level akun |
| Strategi Penegakan | Token bucket atau sliding window counter disimpan di cache/tabel internal (mis. tabel `ai_rate_limit_counters` atau cache in-memory jika tersedia) |

---

## 9. MONITORING

| Metrik yang Dipantau | Tujuan |
|---|---|
| Jumlah request AI per fitur per hari | Memahami fitur AI mana yang paling dipakai |
| Tingkat keberhasilan (success rate) per provider | Deteksi degradasi layanan provider |
| Latensi rata-rata response AI | Validasi terhadap target performa (lihat 059 NFR) |
| Jumlah retry per request | Indikator kesehatan koneksi ke provider |
| Estimasi biaya harian/bulanan | Lihat §11 Cost Control |

Metrik di atas diekspos melalui endpoint internal monitoring atau log terstruktur yang dapat diagregasi oleh tooling observability di masa depan (di luar scope Fase 1 untuk dashboard monitoring dedicated).

---

## 10. LOGGING

- Setiap permintaan AI (berhasil maupun gagal) dicatat di `audit_logs` dengan `action = 'ai_request'`, `entity_type` sesuai fitur (mis. `'rks_summary'`), `user_id` pemohon, dan metadata tambahan (provider, durasi, status).
- **Isi prompt dan response AI tidak disimpan permanen di audit log** secara default, untuk menghindari duplikasi data sensitif yang sudah tersimpan di entitas aslinya — hanya metadata permintaan yang dicatat. *(Inferred Requirement — alasan: mencegah pembengkakan data dan duplikasi informasi sensitif; jika kebutuhan audit forensik penuh terhadap isi prompt diperlukan di masa depan, ini dapat diaktifkan sebagai konfigurasi tambahan.)*
- Log error teknis (timeout, response provider gagal parse) dicatat di log server PHP, terpisah dari audit log bisnis.

---

## 11. COST CONTROL

| Kontrol | Spesifikasi |
|---|---|
| Pembatasan Panjang Input | Maksimum karakter/token input yang dikirim ke provider per request (mencegah pengiriman dokumen sangat besar secara utuh; dokumen panjang dipotong/dirangkum bertingkat) |
| Pembatasan Panjang Output | `max_tokens` diset eksplisit per jenis fitur, tidak unlimited |
| Rate Limiting per User | Lihat §8 — mencegah satu user menghabiskan kuota |
| Pemilihan Model Sesuai Kebutuhan | Fitur volume tinggi/sederhana (mis. Smart Search embedding) menggunakan model yang lebih ringan dibanding fitur analisis kompleks (mis. Executive Dashboard Summary) |
| Monitoring Estimasi Biaya | Lihat §9 Monitoring |
| Toggle Global | `AI_ENABLED=false` dapat mematikan seluruh fitur AI secara instan tanpa redeploy, sebagai kill-switch darurat jika biaya melampaui ambang batas |

---

## 12. SECURITY POLICY

| Kontrol | Spesifikasi |
|---|---|
| Isolasi Kredensial | `GEMINI_API_KEY` hanya dapat diakses oleh AI Service Layer di backend; tidak pernah terkirim ke Frontend dalam bentuk apapun |
| Validasi Input | Permintaan AI tervalidasi role/permission di Backend Controller sebelum mencapai AI Service Layer (lihat 020) |
| Data Sensitif | Password, token, dan data kredensial pengguna tidak pernah dimasukkan ke dalam prompt yang dikirim ke provider eksternal |
| Audit | Lihat §10 Logging |
| Kepatuhan Data *(Inferred)* | Data customer yang dikirim sebagai konteks prompt (misal isi dokumen RKS untuk ringkasan) mengikuti kebijakan klasifikasi data perusahaan — *jika ada dokumen berlabel rahasia/confidential, fitur AI untuk dokumen tersebut harus dapat dinonaktifkan secara granular melalui konfigurasi (CFG-14), bukan hanya toggle global.* |

---

## 13. PROMPT MANAGEMENT

| Aspek | Spesifikasi |
|---|---|
| Lokasi Penyimpanan Template | Template prompt disimpan terpisah dari kode aplikasi (tabel `ai_prompt_templates` atau file konfigurasi terversi), **tidak di-hardcode** di dalam kelas AI Service Layer |
| Struktur Template | Setiap template memiliki: `feature_code` (mis. `rks_summary`), `template_text` (dengan placeholder, mis. `{document_content}`, `{project_name}`), `version`, `is_active` |
| Versioning Prompt | Perubahan template membuat versi baru (mengikuti prinsip versioning di 007), memungkinkan rollback jika prompt baru menghasilkan kualitas lebih buruk |
| Konsistensi Bahasa | Seluruh template prompt default menghasilkan output dalam Bahasa Indonesia, sesuai bahasa kerja pengguna sistem |

---

## 14. AI REQUEST LIFECYCLE (SIKLUS PENUH)

```
1. Frontend mengirim permintaan fitur AI (mis. klik tombol "Ringkas dengan AI")
2. Backend Controller menerima request:
   a. Validasi autentikasi & otorisasi (role, permission fitur AI)
   b. Validasi keberadaan data sumber (mis. dokumen RKS harus ada)
3. Backend Controller memanggil AI Service Layer melalui AiServiceInterface
4. AI Service Layer:
   a. Cek AI_ENABLED — jika false, kembalikan error "Fitur AI tidak aktif"
   b. Cek rate limit per user — jika terlampaui, tolak dengan pesan jelas
   c. Ambil template prompt sesuai feature_code dari Prompt Management
   d. Susun prompt final dengan data konteks (mis. isi dokumen, nama proyek)
   e. Panggil Provider Abstraction Layer → Provider Adapter aktif (GeminiAdapter)
5. Provider Adapter:
   a. Kirim request ke Gemini API
   b. Jika gagal & memenuhi kondisi retry → retry dengan exponential backoff
   c. Jika berhasil → parse response, ekstrak teks hasil
6. AI Service Layer:
   a. Validasi response tidak kosong
   b. Catat log permintaan (audit_logs: ai_request)
   c. Kembalikan hasil ke Backend Controller
7. Backend Controller mengembalikan response terstruktur ke Frontend
8. Frontend menampilkan hasil dalam panel/komponen khusus AI,
   dengan indikasi jelas bahwa ini adalah konten yang dihasilkan AI
   (bukan data asli/tervalidasi manusia)
```

---

## 15. INDIKATOR UI WAJIB UNTUK KONTEN AI (Inferred Requirement)

**Inferred Requirement:** Setiap konten yang dihasilkan AI (ringkasan, insight, analisis) harus ditampilkan dengan **label visual jelas** (misal ikon AI + teks "Dihasilkan oleh AI") dan tidak pernah menggantikan data asli yang diinput manusia. *Alasan: mencegah kebingungan pengguna antara data faktual (diinput manusia, diverifikasi) dan interpretasi/ringkasan AI yang bersifat probabilistik — terutama penting untuk fitur seperti Competitor Analysis atau KPI Insight yang dapat memengaruhi keputusan bisnis.* Detail penempatan UI per fitur ada di dokumen 011 dan 014 (UI Screen Catalog).

---

## 16. KESELARASAN DENGAN PRINSIP ARSITEKTUR GLOBAL (005, 009)

| Prinsip Global | Penerapan di AI Service Layer |
|---|---|
| Business Module tidak memanggil Gemini langsung | §2, §3 |
| Audit-by-design | §10 |
| Defense in depth | §12 (validasi di Backend Controller sebelum AI Service Layer) |
| Stateless backend | AI Service Layer tidak menyimpan state request antar panggilan; setiap request independen |
