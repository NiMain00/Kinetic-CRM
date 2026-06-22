# 059 — NON-FUNCTIONAL REQUIREMENTS
## KINETIC CRM — Kebutuhan Non-Fungsional Terukur

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 059 |
| **Nama Dokumen** | Non-Functional Requirements |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Klasifikasi** | Confidential / Internal |
| **Sumber Utama** | BA Review STMS v1.0 |
| **Sumber Sekunder** | 000_DOCUMENT_INDEX.md, FE Spec STMS v1.0 |
| **Dokumen Terkait** | 020 (Authorization Enforcement Spec), 057 (Full API Endpoint Specification), 058 (Frontend Architecture and Component Library), 060 (Docker Deployment and Operations), 052 (Audit Trail Module) |
| **Status** | Final — Siap Digunakan |

**Dibaca oleh:** Engineering, QA, DevOps, Security Reviewer, UAT Team, Project Manager

---

## 1. PURPOSE

Dokumen ini mendefinisikan **seluruh kebutuhan non-fungsional** yang wajib dipenuhi KINETIC CRM, dengan target yang **terukur dan dapat diverifikasi** oleh QA melalui pengujian otomatis maupun manual. Setiap target di dokumen ini dinyatakan dalam angka, SLA/SLO, atau metrik konkret — tidak ada istilah ambigu seperti "cepat", "optimal", atau "memadai". Dokumen ini menjadi acuan tunggal untuk Definition of Done terkait non-functional aspect di seluruh modul KINETIC CRM.

---

## 2. SCOPE

### In Scope
- Target performa terukur (FCP, LCP, TTI, API response time, dashboard load time, search response time, export processing time)
- Target performa frontend (bundle size, lazy loading, code splitting, asset optimization)
- Target performa backend (concurrent users, throughput, query performance, background job)
- Target ketersediaan sistem (uptime, maintenance window)
- Target skalabilitas dan reliabilitas
- Kebutuhan keamanan terukur (autentikasi, otorisasi, enkripsi, audit trail, session security)
- Target aksesibilitas (WCAG, keyboard nav, screen reader)
- Kompatibilitas browser
- Target responsive design
- Kebutuhan logging, monitoring, alerting
- Kebutuhan backup dan disaster recovery
- Kebutuhan retensi data
- Kebutuhan kepatuhan (compliance)
- Acceptance metrics ringkas untuk UAT

### Out of Scope
- Detail implementasi middleware otorisasi → 020
- Detail kontrak endpoint API → 057
- Detail prosedur operasional Docker/deployment → 060

---

## 3. PERFORMANCE REQUIREMENTS

Seluruh target diukur pada kondisi jaringan **4G dengan throughput minimum 5 Mbps** dan perangkat client setara **mid-range smartphone tahun 2022** (4 GB RAM), kecuali dinyatakan lain. Pengukuran dilakukan dengan Lighthouse CI (frontend) dan APM tooling backend (mis. New Relic/Datadog/OpenTelemetry-compatible) pada environment staging yang setara produksi.

| Metrik | Target | Justifikasi Bisnis | Justifikasi Teknis |
|---|---|---|---|
| **First Contentful Paint (FCP)** | ≤ 1.8 detik (p75) | Cabang sering input data dari lokasi proyek dengan koneksi terbatas; first paint lambat meningkatkan abandonment saat submit RKS di lapangan | Konsisten dengan Core Web Vitals "Good" threshold Google (≤1.8s) |
| **Largest Contentful Paint (LCP)** | ≤ 2.5 detik (p75) | Dashboard adalah halaman pertama yang dilihat seluruh role setiap login; keterlambatan render widget utama menurunkan kepercayaan terhadap data real-time | Core Web Vitals "Good" threshold |
| **Time To Interactive (TTI)** | ≤ 3.5 detik (p75) | Form prospek dan RKS memiliki banyak field interaktif; TTI tinggi menyebabkan klik prematur sebelum JS siap, menimbulkan bug perception | Diukur via Lighthouse CI pada halaman `/prospects/new` sebagai representative complex page |
| **API Response Time — read endpoint (GET list/detail)** | p95 ≤ 500 ms | SLA approval (CFG-05) menghitung hari kerja; latensi backend yang tidak terkontrol mendistorsi pengalaman SLA meski SLA bisnis tetap akurat di DB | Diukur dari saat request diterima load balancer hingga response dikirim, exclude network latency client |
| **API Response Time — write endpoint (POST/PATCH/PUT)** | p95 ≤ 800 ms | Operasi state-transition (submit, approve, reject) memengaruhi banyak entitas terkait (timeline, notifikasi, audit log) dalam satu transaction | Termasuk waktu commit transaction DB dan trigger audit log synchronous (lihat 020 §10.4) |
| **Dashboard Load Time (full widget render)** | ≤ 2 detik (p75) untuk widget di atas fold; ≤ 4 detik untuk seluruh widget | Dashboard adalah landing page seluruh role; FE Spec §4.1 menetapkan skeleton loading sebagai mitigasi, tetapi waktu render aktual tetap harus terbatas | Diukur dari `GET /api/v1/dashboard/summary` response time + client render time |
| **Search Response Time (filter/search di DataTable)** | p95 ≤ 400 ms untuk dataset ≤ 10.000 baris per tabel | FE Spec menetapkan server-side pagination dan filtering (5.1); pencarian yang lambat pada modul Prospek/Proyek yang sering difilter mengganggu produktivitas harian cabang | Termasuk waktu query DB dengan index yang sesuai (lihat 055) |
| **Export Processing Time (Excel/PDF, ≤ 5.000 baris)** | ≤ 15 detik dari request hingga job status `completed` | Laporan Win/Loss dan Pipeline (GAP11) dipakai management untuk rapat; proses lambat tanpa indikasi progress menurunkan kepercayaan pada fitur | Diukur end-to-end dari `POST /reports/{type}/export` hingga `GET /exports/{id}` mengembalikan `completed` (lihat 057 §19.4–19.5) |
| **Export Processing Time (> 5.000 baris, hingga 50.000 baris)** | ≤ 90 detik | Skala data historis bertambah seiring waktu operasional sistem | Job dieksekusi async di background worker, tidak memblokir request HTTP |
| **AI Feature Response Time (tender summary, analysis)** | p95 ≤ 6 detik | Fitur AI (010/011) bersifat assistive, bukan blocking workflow; pengguna dapat menunggu sedikit lebih lama dibanding operasi CRUD inti | Termasuk round-trip ke Gemini API; circuit breaker diterapkan jika melebihi 10 detik (lihat 010 — Retry Strategy) |

**Inferred Requirement IR-059-01:** BA Review dan FE Spec tidak menetapkan threshold performa numerik eksplisit di manapun. Seluruh angka di atas diturunkan dari (a) Core Web Vitals standar industri untuk FCP/LCP/TTI, (b) konvensi umum SLA backend enterprise B2B untuk response time API, dan (c) kebutuhan implisit dari fitur yang sudah dispesifikasi (skeleton loading FE Spec §4.1 mengindikasikan kesadaran akan latensi, server-side pagination §5.1 mengindikasikan kebutuhan performa terukur pada dataset besar). Tanpa angka eksplisit ini, QA tidak akan memiliki acceptance criteria yang dapat diuji untuk performa.

---

## 4. FRONTEND PERFORMANCE REQUIREMENTS

| Metrik | Target | Justifikasi |
|---|---|---|
| **Initial Bundle Size (JS, gzip)** | ≤ 250 KB untuk initial route (`/login` + shell) | Mobile-first strategy (FE Spec §1.3) menyiratkan kebutuhan device dengan bandwidth terbatas; bundle besar memperlambat FCP terutama di koneksi 4G |
| **Initial Bundle Size (CSS, gzip)** | ≤ 50 KB | Tailwind CSS dengan purge/JIT mode aktif (lihat 058 §3.6) seharusnya menghasilkan CSS final yang kecil |
| **Per-Route Lazy Chunk Size (gzip)** | ≤ 150 KB per modul bisnis | Feature-first folder structure (058 §3.1) mengharuskan setiap modul (`prospects/`, `projects/`, `config/`) dimuat sebagai chunk terpisah |
| **Lazy Loading Strategy** | 100% route-level lazy loading untuk seluruh modul bisnis di luar Auth dan Dashboard | Konsisten dengan 058 §3.1 (Scalability Principle: lazy loading per route); Dashboard dan Auth dimuat eager karena selalu diakses di awal sesi |
| **Code Splitting Strategy** | Vendor chunk dipisah dari application chunk; chunk vendor (React, React Router, TanStack Table, Recharts) di-cache browser dengan `Cache-Control: max-age=31536000, immutable` dan content-hash filename | Vendor library jarang berubah antar deployment; caching agresif mengurangi waktu loading pada visit berulang |
| **Asset Optimization Strategy — gambar** | Format WebP dengan fallback PNG/JPEG; lazy-load gambar di luar viewport; ukuran maksimum 200 KB per gambar setelah kompresi | Mengurangi payload halaman dengan banyak ilustrasi (empty state, halaman error) |
| **Asset Optimization Strategy — font** | Maksimum 2 font family, subset karakter Latin saja, format WOFF2, `font-display: swap` | Mencegah Flash of Invisible Text (FOIT) yang memperlambat perceived FCP |
| **Time to First Byte (TTFB) untuk static asset** | ≤ 200 ms (di-serve via Nginx dengan gzip/brotli compression aktif, sesuai 058 §1.1 Containerisasi) | Nginx Alpine sudah ditetapkan FE Spec sebagai serving layer; kompresi wajib aktif untuk asset teks (JS/CSS/HTML/SVG) |

---

## 5. BACKEND PERFORMANCE REQUIREMENTS

| Metrik | Target | Justifikasi |
|---|---|---|
| **Concurrent Users (sustained)** | Minimum 200 concurrent active sessions tanpa degradasi response time di atas threshold §3 | Estimasi berdasarkan struktur organisasi multi-cabang (BA Review B.3): asumsi konservatif 50 cabang × rata-rata 4 user aktif bersamaan pada jam sibuk |
| **Concurrent Users (peak burst)** | Mampu menangani lonjakan hingga 400 concurrent users selama maksimum 15 menit (mis. deadline tender massal di akhir bulan) tanpa error rate naik di atas 1% | Pola bisnis tender cenderung memiliki deadline yang terkonsentrasi di tanggal tertentu |
| **Throughput (requests per second)** | Minimum 150 RPS pada endpoint read-heavy (`GET /prospects`, `GET /projects`, `GET /dashboard/summary`) pada instance backend tunggal | Berdasarkan concurrent users target × rata-rata 0.75 request/user/detik pada jam sibuk |
| **Query Performance — single table lookup (indexed)** | p99 ≤ 50 ms | Standar query performance dengan index primary/foreign key yang benar (lihat 055) |
| **Query Performance — join kompleks (laporan, dashboard aggregation)** | p95 ≤ 300 ms | Laporan Win/Loss dan Progress vs Target melibatkan join multi-tabel (projects, branches, periods, targets); index composite wajib dirancang sesuai 055 |
| **Query Performance — full-text search (`search` filter)** | p95 ≤ 200 ms pada dataset hingga 100.000 baris | Memerlukan index khusus (`GIN`/`pg_trgm` untuk PostgreSQL, atau full-text index MySQL) — didetailkan di 055 |
| **Background Job Performance — notification dispatch (in-app)** | ≤ 5 detik dari trigger event hingga notifikasi tersimpan dan dapat dipoll client | FR090 (notifikasi in-app) memerlukan latensi rendah agar approval pending terlihat segera oleh approver |
| **Background Job Performance — SLA escalation check** | Dijalankan setiap 15 menit (scheduled job), dengan waktu eksekusi penuh ≤ 60 detik untuk seluruh proyek aktif | Engine SLA (041) memerlukan evaluasi periodik hari kerja; interval 15 menit cukup granular untuk eskalasi T-1 hari tanpa membebani DB dengan polling berlebihan |
| **Background Job Performance — export generation** | Lihat target Export Processing Time di §3 | Dijalankan di worker queue terpisah (lihat 060) agar tidak memblokir request API utama |
| **Database Connection Pool** | Minimum 20, maksimum 100 koneksi per instance backend, dengan idle timeout 300 detik | Mencegah connection exhaustion saat load tinggi sekaligus menghindari koneksi menganggur berlebihan |

**Inferred Requirement IR-059-02:** BA Review tidak menyebutkan jumlah user atau cabang aktual. Estimasi concurrent users di atas adalah asumsi konservatif berbasis struktur multi-cabang yang disebutkan dalam BA Review (B.3) dan FE Spec (role `cabang` per cabang). Estimasi ini harus divalidasi ulang dengan data riil jumlah cabang dan user dari pihak bisnis sebelum sprint planning final (063), dan dicantumkan di sini sebagai baseline awal yang dapat direvisi.

---

## 6. AVAILABILITY REQUIREMENTS

| Metrik | Target | Justifikasi |
|---|---|---|
| **Uptime Target (production)** | 99.5% per bulan kalender (maksimum downtime ~3 jam 39 menit/bulan) | Sistem ini bukan sistem mission-critical 24/7 (bukan sistem keuangan real-time), namun downtime memengaruhi proses approval yang terikat SLA hari kerja; 99.5% adalah standar wajar untuk aplikasi internal enterprise B2B Fase 1 |
| **Uptime Target (jam kerja, 08:00–18:00 hari kerja WIB)** | 99.9% (maksimum downtime ~26 menit/bulan pada jam kerja) | Mayoritas aktivitas input dan approval terjadi pada jam kerja; downtime di luar jam kerja berdampak lebih rendah terhadap SLA bisnis |
| **Scheduled Maintenance Window** | Maksimum 4 jam per bulan, dijadwalkan di luar jam kerja (22:00–06:00 WIB) dan diumumkan minimum 48 jam sebelumnya via in-app banner | Mengakomodasi kebutuhan deployment dan database maintenance tanpa mengganggu SLA approval di jam kerja |
| **Planned Downtime Exclusion** | Scheduled maintenance window TIDAK dihitung sebagai downtime dalam kalkulasi uptime 99.5% | Konvensi standar SLA — downtime terencana dan dikomunikasikan berbeda dari outage tak terencana |
| **Recovery Time Objective (RTO)** | ≤ 1 jam untuk outage non-disaster (mis. crash aplikasi, restart container) | Sesuai dengan health check dan auto-restart strategy yang didefinisikan di 060 (GAP15) |
| **Mean Time To Detect (MTTD)** | ≤ 5 menit, melalui health check endpoint dipoll setiap 60 detik (lihat §15 Monitoring) | Deteksi cepat mengurangi total downtime sebelum recovery dimulai |

---

## 7. SCALABILITY REQUIREMENTS

| Aspek | Target | Justifikasi |
|---|---|---|
| **Horizontal Scaling — Backend** | Backend API harus stateless (session disimpan di DB/Redis, bukan in-memory server) sehingga dapat di-scale ke multiple instance di belakang load balancer tanpa sticky session | Konsisten dengan arsitektur container (060) dan kebutuhan high availability |
| **Horizontal Scaling — Database** | Read-replica didukung secara arsitektural untuk query read-heavy (laporan, dashboard) pada saat jumlah cabang melebihi 100 | Antisipasi pertumbuhan organisasi (BA Review menyebutkan dukungan multi-company di masa depan, MD01) |
| **Data Volume Scalability** | Sistem harus tetap memenuhi target performa §3 dan §5 hingga 500.000 baris di tabel `projects`, 2.000.000 baris di tabel `audit_logs`, dan 1.000.000 baris di tabel `notifications` tanpa redesain skema | Estimasi 5 tahun operasional dengan asumsi pertumbuhan 100 proyek/bulan rata-rata across seluruh cabang |
| **Module Addition Scalability** | Penambahan modul bisnis baru tidak boleh menyebabkan regresi performa pada modul yang sudah ada, diverifikasi dengan automated performance regression test di CI pipeline | Konsisten dengan prinsip Scalability di 058 §3.1 ("penambahan modul baru tidak boleh mengubah modul yang sudah ada kecuali via titik ekstensi resmi") |
| **Branch/Organization Scalability** | Struktur hierarki organisasi (Company→Division→Department→Branch) harus mendukung minimum 500 branch aktif tanpa degradasi pada query scope filtering (lihat 020 §3.4) | BA Review menetapkan kebutuhan multi-cabang sebagai gap kritikal (MD01-MD03); desain harus tidak membatasi skala pertumbuhan cabang |

---

## 8. RELIABILITY REQUIREMENTS

| Aspek | Target | Justifikasi |
|---|---|---|
| **Error Rate (API, keseluruhan)** | ≤ 0.5% dari total request per hari menghasilkan HTTP 5xx | Standar reliability untuk aplikasi enterprise internal; dipantau via APM (lihat §15) |
| **Data Consistency — Transactional Integrity** | 100% operasi multi-step (approve LPHS + update timeline + trigger notifikasi + audit log) dieksekusi dalam satu database transaction; tidak ada partial write yang diizinkan | Sesuai pola di 020 §10.4 (audit log synchronous dalam transaction yang sama) |
| **Idempotency** | Endpoint state-transition (`submit`, `approve`, `reject`, `cancel`) wajib idempotent terhadap double-click/double-submit dari client — request kedua dengan state yang sama mengembalikan `409 Conflict` (`APPROVAL_ALREADY_PROCESSED`), bukan duplikasi data | Mencegah duplikasi approval/notifikasi akibat retry otomatis frontend atau koneksi tidak stabil di lapangan |
| **Graceful Degradation — AI Feature Failure** | Jika AI Service Layer/Gemini API gagal merespons, fitur AI menampilkan fallback message tanpa menghentikan/memblokir alur kerja inti (submit, approve, dll. tetap berfungsi normal) | Sesuai prinsip "AI Service Layer sebagai perantara" (010); AI bersifat assistive, bukan dependency kritikal alur bisnis |
| **Retry Strategy — External Integration** | Maksimum 3 retry dengan exponential backoff (1s, 2s, 4s) untuk panggilan ke layanan eksternal (Gemini API, SMTP Fase 2); request gagal permanen setelah retry ke-3 dikembalikan sebagai error terdefinisi, bukan timeout tanpa pesan | Konsisten dengan 010 (Retry Strategy AI Service Layer) |
| **Data Loss Prevention** | Recovery Point Objective (RPO) ≤ 1 jam — maksimum 1 jam data yang dapat hilang pada skenario disaster, dijamin melalui kombinasi transaction log dan backup terjadwal (lihat §19) | Standar RPO wajar untuk sistem transaksional non-finansial dengan backup berkala |

---

## 9. SECURITY REQUIREMENTS

Kebutuhan keamanan berikut melengkapi (bukan menggantikan) detail enforcement teknis di **020_AUTHORIZATION_ENFORCEMENT_SPEC.md** — dokumen ini menyatakan target/SLA yang harus dipenuhi, 020 menjelaskan bagaimana.

### 9.1 Authentication

| Requirement | Target Terukur |
|---|---|
| Password complexity | Minimum 8 karakter, mengandung minimum 1 huruf dan 1 angka (lihat 057 §5.5) |
| Password hashing | bcrypt (cost factor ≥ 12) atau argon2id; tidak ada plaintext atau MD5/SHA1 di manapun |
| Account lockout | Terkunci otomatis setelah 5 percobaan gagal berturut-turut dalam window 15 menit; durasi lockout 15 menit (FR001, lihat 057 §5.1) |
| JWT token expiry — access token | 8 jam |
| JWT token expiry — refresh token | 7 hari |
| Token signing algorithm | Minimum HS256; RS256 direkomendasikan untuk produksi (lihat 020 §11.4) |
| Multi-session handling | Sistem mendukung multiple concurrent session per user (login dari device berbeda), dengan kemampuan admin melakukan force-logout per session (lihat 057 §6.7-6.8) |

### 9.2 Authorization

| Requirement | Target Terukur |
|---|---|
| Permission check coverage | 100% endpoint API tercakup oleh Route Permission Middleware (020 §6.1); tidak ada endpoint "open by omission" |
| Permission cache invalidation latency | ≤ 5 menit (TTL cache) atau immediate pada perubahan eksplisit oleh admin (IR-020-03) |
| IDOR test coverage | 100% endpoint yang menerima resource ID di path wajib memiliki test case ownership/scope violation di test suite (lihat 062, dan AC-020-03) |

### 9.3 Encryption

| Requirement | Target Terukur |
|---|---|
| Data in transit | TLS 1.2 minimum, TLS 1.3 direkomendasikan, untuk seluruh komunikasi client-server dan server-ke-AI provider |
| Data at rest — sensitive config | Field bertanda `isSecret=true` (API key, credential) dienkripsi dengan AES-256 sebelum disimpan di database (lihat 057 §17.14) |
| Data at rest — password | Hash, tidak ada bentuk reversible apapun |
| Cookie security | Cookie sesi (`kinetic_refresh_token`) wajib `HttpOnly`, `Secure`, `SameSite=Strict` |
| Secret rotation | API key/credential eksternal dapat dirotasi tanpa downtime/redeploy (CFG-14, lihat 057 §17.14) |

### 9.4 Audit Trail

| Requirement | Target Terukur |
|---|---|
| Audit log coverage | 100% event pada katalog 020 §10.2 tercatat tanpa terlewat (diverifikasi via AC-020-10) |
| Audit log write latency | Synchronous dalam transaction yang sama dengan operasi bisnis (020 §10.4); tidak ada delay async untuk operasi data-changing |
| Audit log immutability | 0% endpoint UPDATE/DELETE tersedia untuk tabel `audit_logs` (IR-057-06) |
| Audit log retention | Minimum 5 tahun untuk audit log terkait approval dan transaksi bisnis, sesuai kebutuhan jejak audit tender (lihat §17 Data Retention) |

### 9.5 Session Security

| Requirement | Target Terukur |
|---|---|
| Idle session timeout | 30 menit tanpa aktivitas memicu auto-logout di sisi client (refresh token tetap valid untuk re-login cepat) |
| Session revocation propagation | ≤ 1 request cycle — begitu admin melakukan force-logout atau mengubah role, request berikutnya dari user tersebut langsung ditolak (020 §6.3) |
| Concurrent session limit | Tidak dibatasi jumlah device per user di Fase 1 (Inferred Requirement IR-059-03: BA Review tidak menyebutkan kebutuhan single-device login; pembatasan device dapat menyulitkan staf cabang yang berpindah perangkat di lapangan, sehingga Fase 1 tidak membatasi, namun visibility dan kemampuan force-logout per session tetap disediakan admin) |

---

## 10. ACCESSIBILITY REQUIREMENTS

| Requirement | Target Terukur |
|---|---|
| **WCAG Compliance Target** | WCAG 2.1 Level AA untuk seluruh halaman yang termasuk In Scope di 014_UI_SCREEN_CATALOG |
| **Keyboard Navigation** | 100% elemen interaktif (button, link, form field, menu item) dapat diakses dan dioperasikan murni via keyboard (Tab, Shift+Tab, Enter, Esc, Arrow keys pada komponen seperti Select/Dropdown); tab order logis sesuai 058 §1.3 |
| **Screen Reader Support** | Seluruh komponen kustom (Modal, Drawer, Dropdown, DataTable) memiliki ARIA role, label, dan state yang sesuai (`role="dialog"`, `aria-expanded`, `aria-label` untuk icon-only button — sesuai 058 §3.5 dan FE Spec §1.3); diverifikasi dengan NVDA (Windows) dan VoiceOver (macOS) pada seluruh halaman kritikal (Login, Dashboard, Form Prospek, Approval Review) |
| **Color Contrast Ratio** | Minimum 4.5:1 untuk teks normal, 3:1 untuk teks besar (≥18pt), sesuai WCAG AA, termasuk pada status badge berwarna (FE Spec §5.1 color-coded badge) |
| **Focus Indicator** | Seluruh elemen fokus-able memiliki visible focus indicator (outline atau ring) dengan kontras minimum 3:1 terhadap background |
| **Focus Trap pada Modal/Drawer** | 100% Modal dan SlideDrawer (approval review panel) menerapkan focus trap — fokus tidak dapat keluar ke elemen di belakang overlay menggunakan Tab, sesuai 058 §3.5 |
| **Form Error Announcement** | Error validasi inline diumumkan ke screen reader via `aria-live="polite"` atau `role="alert"` saat muncul |
| **Reduced Motion Support** | Animasi non-esensial (transisi, skeleton shimmer) menghormati `prefers-reduced-motion: reduce` |

**Inferred Requirement IR-059-04:** BA Review dan FE Spec tidak secara eksplisit menyebut target WCAG level, namun 058 §3.5 menetapkan accessibility sebagai "syarat masuk komponen ke pustaka" dan FE Spec §1.3 sudah mensyaratkan `aria-label` dan `role`. WCAG 2.1 AA dipilih sebagai standar industri minimum untuk aplikasi enterprise B2B yang dapat diaudit secara objektif oleh QA, alih-alih dibiarkan tanpa target terukur.

---

## 11. BROWSER COMPATIBILITY REQUIREMENTS

| Browser | Versi Minimum Didukung | Catatan |
|---|---|---|
| Google Chrome | 2 versi major terakhir (rolling) | Browser utama yang diasumsikan mayoritas pengguna korporat |
| Mozilla Firefox | 2 versi major terakhir (rolling) | |
| Microsoft Edge (Chromium-based) | 2 versi major terakhir (rolling) | Umum di lingkungan korporat Windows |
| Safari (macOS) | 2 versi major terakhir (rolling) | Untuk pengguna macOS |
| Safari (iOS) | 2 versi major terakhir (rolling) | Kritikal untuk role `cabang` yang mengakses dari mobile di lapangan |
| Chrome Android | 2 versi major terakhir (rolling) | Kritikal untuk role `cabang` di lapangan |
| Internet Explorer (semua versi) | **Tidak didukung** | Stack React 18 + Vite tidak kompatibel dengan IE; tidak ada polyfill yang disediakan |

**Definisi "2 versi major terakhir (rolling)":** Pada saat rilis, dukungan mencakup versi browser stabil terbaru dan satu versi sebelumnya, dievaluasi ulang setiap quarter sebagai bagian dari maintenance cycle.

**Minimum viewport width yang diuji:** 360px (Android low-end), 390px (iPhone standar), hingga 2560px (desktop wide).

---

## 12. RESPONSIVE DESIGN REQUIREMENTS

Mengacu langsung pada breakpoint yang sudah ditetapkan FE Spec §1.3 dan prinsip Mobile Responsive First di 058 §3.6.

| Breakpoint | Lebar | Target Layout |
|---|---|---|
| Base (mobile) | < 640px | Single column; sidebar menjadi off-canvas drawer (FE Spec §2.2); tabel beralih ke card-list view jika kolom > 4 |
| `sm` | ≥ 640px | Dua kolom mulai diterapkan pada form sederhana |
| `md` | ≥ 768px | Sidebar tetap off-canvas hingga `md`; layout dua kolom pada form kompleks (FE Spec §5.2 — form prospek) |
| `lg` | ≥ 1024px | Sidebar persistent (FE Spec §2.2: 260px lebar, collapsible ke 64px); grid dashboard 3 kolom (FE Spec §4.1) |
| `xl` | ≥ 1280px | Grid dashboard hingga 4 kolom; data table menampilkan seluruh kolom tanpa horizontal scroll pada layar kritikal |

**Target Terukur Tambahan:**
- 100% halaman In Scope (014) lolos uji responsif manual pada 3 breakpoint representative: 375px (mobile), 768px (tablet), 1440px (desktop) tanpa horizontal overflow yang tidak diinginkan.
- Touch target minimum 44×44px untuk seluruh elemen interaktif pada viewport < 768px (kompatibel dengan pedoman WCAG 2.5.5 dan kebutuhan praktis penggunaan di lapangan oleh role `cabang`).

---

## 13. LOGGING REQUIREMENTS

| Aspek | Target Terukur |
|---|---|
| **Application Log Format** | Structured JSON log (bukan plain text) dengan field wajib: `timestamp`, `level`, `service`, `requestId`, `userId` (jika ada), `message` |
| **Log Level Usage** | `ERROR` untuk exception tak tertangani dan kegagalan operasi bisnis kritikal; `WARN` untuk kondisi degradasi (mis. retry AI provider); `INFO` untuk lifecycle request/response; `DEBUG` hanya aktif di environment non-produksi |
| **Request/Response Logging** | 100% request API dicatat dengan `requestId`, `method`, `path`, `statusCode`, `durationMs`; body request **tidak** dicatat untuk endpoint yang mengandung field sensitif (password, token) |
| **Correlation ID** | Setiap request diberi `requestId` unik (UUID) yang diteruskan melalui seluruh layer (middleware → service → DB query log) untuk mempermudah tracing satu request penuh |
| **Log Retention — application log** | Minimum 90 hari di log storage aktif (searchable), arsip hingga 1 tahun di cold storage |
| **Log Retention — audit log** | Lihat §9.4 dan §17 (terpisah dari application log, retensi lebih lama) |
| **Sensitive Data Masking** | Field `password`, `token`, `apiKey`, nomor identitas, dan field bertanda `isSecret` di-mask otomatis pada seluruh log output (`***MASKED***`) |

---

## 14. MONITORING REQUIREMENTS

| Aspek | Target Terukur |
|---|---|
| **Health Check Endpoint** | `GET /api/v1/health` mengembalikan status `200 OK` dengan detail health DB, cache, dan AI provider connectivity; dipoll oleh container orchestrator setiap 30 detik (GAP15, lihat 060) |
| **Uptime Monitoring Interval** | External uptime check setiap 60 detik dari minimum 1 lokasi monitoring eksternal |
| **APM Coverage** | 100% endpoint API utama (dari katalog 057) terinstrumentasi dengan distributed tracing untuk mengukur p50/p95/p99 response time secara berkelanjutan |
| **Database Monitoring** | Query lambat (> 1 detik) otomatis di-log dengan query plan untuk investigasi (slow query log diaktifkan) |
| **Resource Monitoring** | CPU, memory, disk usage per container dipantau dengan interval sampling 60 detik; alert dikonfigurasi pada §15 |
| **AI Service Layer Monitoring** | Rate request, error rate, dan latency per panggilan ke Gemini API dipantau terpisah dari metrik API inti, sesuai prinsip cost control terpusat (010) |
| **Real User Monitoring (RUM)** | FCP, LCP, TTI aktual dari browser pengguna sungguhan dikumpulkan (bukan hanya synthetic test) untuk memvalidasi target §3 di kondisi produksi nyata |

---

## 15. ALERTING REQUIREMENTS

| Kondisi Alert | Threshold | Channel | Severity |
|---|---|---|---|
| API error rate 5xx | > 1% dalam window 5 menit | In-app ops dashboard + email on-call | Critical |
| API response time p95 | > 2× target §3 selama 10 menit berturut-turut | Email on-call | Warning |
| Health check gagal | 3 kali berturut-turut (90 detik) | Email + auto-restart trigger (lihat 060) | Critical |
| Database connection pool exhaustion | > 90% pool terpakai selama 5 menit | Email on-call | Critical |
| Disk usage | > 85% kapasitas | Email on-call | Warning |
| Disk usage | > 95% kapasitas | Email on-call + SMS (jika tersedia Fase 2) | Critical |
| AI provider error rate | > 10% request gagal dalam window 15 menit | Email tim AI/Integration | Warning |
| SLA approval mendekati breach | T-1 hari kerja sebelum SLA habis (CFG-06) | In-app notification ke approver + eskalasi role (lihat 041) | Business-level (bukan infra alert) |
| Failed login attempt anomali | > 20 percobaan gagal dari satu IP dalam 10 menit | Email security/admin | Warning (indikasi brute force) |
| Backup job gagal | Setiap kegagalan backup terjadwal | Email on-call + DevOps | Critical |

---

## 16. BACKUP REQUIREMENTS

| Aspek | Target Terukur |
|---|---|
| **Database Backup Frequency — Full** | Setiap hari pukul 02:00 WIB (di luar jam kerja) |
| **Database Backup Frequency — Incremental/Transaction Log** | Setiap 1 jam |
| **Backup Retention** | 30 hari rolling untuk daily backup; 12 bulan untuk monthly snapshot (snapshot tanggal 1 setiap bulan dipertahankan lebih lama) |
| **Document/File Storage Backup** | Setiap hari, mencakup seluruh dokumen yang diupload (RKS, LPHS, dll., lihat 048) |
| **Backup Verification** | Restoration test otomatis dijalankan minimum 1× per bulan terhadap environment staging untuk memverifikasi integritas backup |
| **Backup Encryption** | Backup data dienkripsi at-rest dengan algoritma yang sama dengan §9.3 (AES-256) |
| **Backup Storage Location** | Disimpan terpisah dari server produksi (off-site atau storage terenkripsi terpisah) untuk melindungi dari kegagalan infrastruktur tunggal |

---

## 17. DISASTER RECOVERY REQUIREMENTS

| Aspek | Target Terukur |
|---|---|
| **Recovery Time Objective (RTO) — Disaster (kehilangan total environment produksi)** | ≤ 8 jam untuk memulihkan layanan inti (login, dashboard, prospek, proyek, approval) dari backup terakhir |
| **Recovery Point Objective (RPO) — Disaster** | ≤ 1 jam, ditentukan oleh frekuensi incremental backup (§16) |
| **Disaster Recovery Drill** | Dijalankan minimum 1× per 6 bulan dengan skenario simulasi: restore database dari backup ke environment terisolasi dan verifikasi data dapat diakses dan konsisten |
| **Failover Documentation** | Runbook tertulis untuk prosedur restore tersedia dan diuji aktualitasnya pada setiap drill (bagian dari 060) |
| **Communication Plan saat Disaster** | In-app banner dan/atau halaman status terpisah mengkomunikasikan estimasi waktu pemulihan kepada pengguna selama insiden berlangsung |

---

## 18. DATA RETENTION REQUIREMENTS

| Jenis Data | Retensi Aktif (Searchable) | Retensi Arsip | Justifikasi |
|---|---|---|---|
| Data transaksional (Prospek, Proyek, RKS, LPHS) | Tidak ada batas waktu (selama bisnis berjalan); soft-delete saja | N/A — tidak ada hard delete otomatis | Data tender adalah aset bisnis jangka panjang untuk analisis win rate historis |
| Audit Log | 5 tahun aktif | Tidak ditentukan batas maksimum (lihat 052 untuk kebijakan retensi detail) | Kebutuhan jejak audit untuk kepatuhan dan investigasi sengketa tender yang dapat muncul beberapa tahun kemudian |
| Application Log (non-audit) | 90 hari aktif | 1 tahun cold storage | Lihat §13 |
| Notifikasi In-App | 1 tahun aktif, kemudian di-arsipkan/dihapus otomatis | N/A | Notifikasi bersifat operasional jangka pendek, bukan dokumen bisnis primer |
| Session/Token (`active_sessions`) | Dihapus otomatis setelah `expires_at` + 7 hari grace period | N/A | Mengurangi ukuran tabel session tanpa mengganggu kebutuhan audit jangka pendek |
| Dokumen Upload (RKS, LPHS, dll.) | Sama dengan data transaksional terkait — tidak ada batas waktu otomatis | N/A | Dokumen tender adalah bukti legal/kontraktual |
| Export File (hasil generate Excel/PDF) | 7 hari setelah generate, kemudian dihapus otomatis dari storage (lihat 057 §19.5 `expiresAt`) | N/A | File export bersifat sementara/disposable, bukan dokumen sumber |
| AI Request/Response Cache | 1 jam (lihat 057 §22.1) | Tidak diarsipkan | Cache bersifat optimasi performa, bukan data bisnis primer |

**Inferred Requirement IR-059-05:** BA Review tidak menyebut periode retensi spesifik kecuali untuk audit log (GAP16 menyebut kebutuhan export CSV, mengindikasikan kebutuhan retensi jangka panjang). Periode retensi data transaksional "tidak terbatas" diturunkan dari sifat bisnis tender di mana data historis adalah input penting untuk analitik win rate dan kompetitor (BA Review B.1, MD07-MD09); soft-delete dipilih sebagai mekanisme agar data tetap dapat direstorasi tanpa mengasumsikan kebijakan compliance spesifik yang tidak disebutkan sumber.

---

## 19. COMPLIANCE REQUIREMENTS

| Aspek | Target Terukur |
|---|---|
| **OWASP Top 10 Coverage** | Seluruh kategori OWASP Top 10 (2021) diverifikasi melalui security testing sebelum go-live (Injection, Broken Authentication, Sensitive Data Exposure, XXE, Broken Access Control, Security Misconfiguration, XSS, Insecure Deserialization, Using Components with Known Vulnerabilities, Insufficient Logging & Monitoring) |
| **Dependency Vulnerability Scanning** | Otomatis dijalankan di CI pipeline pada setiap build; build gagal jika ditemukan vulnerability severity Critical atau High tanpa patch tersedia |
| **Data Privacy — PII Handling** | Field yang mengandung data pribadi (nama, email, nomor telepon user/customer) tidak ditampilkan di log aplikasi (§13) maupun pesan error generik yang berisiko terekspos ke client yang salah |
| **Audit-Readiness** | Audit log (052) dan dokumen ini bersama-sama menyediakan jejak yang dapat diaudit pihak ketiga (mis. auditor internal perusahaan) sewaktu-waktu tanpa rekonstruksi manual |
| **Software License Compliance** | Seluruh dependency pihak ketiga (lihat 006 Tech Stack) menggunakan lisensi permisif (MIT, Apache 2.0, BSD) yang kompatibel dengan penggunaan komersial internal; tidak ada dependency berlisensi copyleft kuat (GPL) yang dapat membatasi distribusi internal |

**Inferred Requirement IR-059-06:** BA Review dan FE Spec tidak menyebutkan kerangka kepatuhan regulasi spesifik (mis. tidak disebutkan kebutuhan terhadap UU PDP Indonesia secara eksplisit). Mengingat sistem ini menyimpan data pribadi user dan customer (nama, kontak), penerapan prinsip data minimization dan masking pada logging (§13, §19) diadopsi sebagai praktik baik yang konsisten dengan prinsip umum perlindungan data pribadi, tanpa mengklaim kepatuhan penuh terhadap regulasi spesifik yang tidak diminta sumber dokumen.

---

## 20. ACCEPTANCE METRICS

Tabel ringkas berikut menjadi checklist UAT/QA sign-off sebelum go-live, merujuk balik ke bagian terkait di atas.

| # | Metrik | Target | Metode Verifikasi | Referensi |
|---|---|---|---|---|
| 1 | LCP halaman Dashboard | ≤ 2.5s (p75) | Lighthouse CI, 10x run, ambil p75 | §3 |
| 2 | API response time read endpoint | p95 ≤ 500ms | Load test k6/JMeter, 200 concurrent VU, durasi 10 menit | §3, §5 |
| 3 | API response time write endpoint | p95 ≤ 800ms | Load test sama dengan #2 | §3 |
| 4 | Export 5.000 baris | ≤ 15 detik | Manual test + automated timer pada test suite | §3 |
| 5 | Initial bundle size | ≤ 250 KB gzip | `vite build` + bundle analyzer report di CI | §4 |
| 6 | Concurrent users sustained | 200 user tanpa degradasi > threshold #2/#3 | Load test k6/JMeter | §5 |
| 7 | Uptime bulanan | ≥ 99.5% | Laporan uptime monitoring eksternal, dievaluasi bulanan | §6 |
| 8 | Error rate 5xx harian | ≤ 0.5% | Dashboard APM, agregasi harian | §8 |
| 9 | Password hashing | bcrypt cost ≥12 / argon2id, 0 plaintext ditemukan | Code review + automated security scan | §9.1 |
| 10 | IDOR test coverage | 100% endpoint resource-by-id memiliki test case | Test coverage report dari test suite (062) | §9.2, AC-020-03 |
| 11 | Audit log coverage | 100% event katalog 020§10.2 tercatat, 0 yang terlewat pada test skenario AC-020-10 | Test case otomatis AC-020-10 | §9.4 |
| 12 | WCAG 2.1 AA | 0 critical violation pada axe-core scan di seluruh halaman In Scope 014 | Automated accessibility scan (axe-core) + manual screen reader test | §10 |
| 13 | Keyboard navigation | 100% elemen interaktif dapat dioperasikan tanpa mouse pada 5 halaman kritikal (Login, Dashboard, Form Prospek, Approval Review, Config) | Manual QA test dengan keyboard only | §10 |
| 14 | Browser compatibility | 0 critical bug pada matrix browser §11 | Cross-browser manual test (BrowserStack atau setara) | §11 |
| 15 | Responsive layout | 0 horizontal overflow tak diinginkan pada 375px/768px/1440px di seluruh halaman In Scope 014 | Manual visual regression test | §12 |
| 16 | Health check & auto-restart | Container otomatis restart dalam ≤ 90 detik setelah 3x health check gagal | Chaos test: kill process, ukur waktu recovery | §14, §15 |
| 17 | Backup restoration | Restore berhasil dan data terverifikasi konsisten pada drill bulanan | Restoration test ke staging, checksum/count row verification | §16 |
| 18 | Disaster recovery drill | RTO ≤ 8 jam tercapai pada simulasi | DR drill semesteran dengan log waktu setiap tahap | §17 |
| 19 | Dependency vulnerability scan | 0 Critical/High severity tanpa patch pada saat go-live | CI pipeline scan report (mis. Snyk/Dependabot/Trivy) | §19 |
| 20 | Data retention audit log | Tidak ada record audit log yang terhapus sebelum 5 tahun pada pengujian retention policy job | Test job retensi terhadap data seeded dengan timestamp masa lalu | §18 |

---

## 21. INFERRED REQUIREMENTS — RINGKASAN

| Kode | Ringkasan | Bagian |
|---|---|---|
| IR-059-01 | Threshold performa numerik (FCP/LCP/TTI/API/dashboard/search/export) diturunkan dari Core Web Vitals dan konvensi SLA enterprise karena sumber tidak menyebut angka eksplisit | §3 |
| IR-059-02 | Estimasi concurrent users (200 sustained/400 peak) adalah baseline konservatif berbasis struktur multi-cabang BA Review, perlu divalidasi ulang dengan data riil sebelum sprint planning final | §5 |
| IR-059-03 | Tidak ada pembatasan jumlah device/session per user di Fase 1 karena kebutuhan mobilitas staf cabang, dengan kompensasi kemampuan force-logout oleh admin | §9.5 |
| IR-059-04 | WCAG 2.1 Level AA dipilih sebagai target terukur karena sumber hanya menyebut accessibility secara prinsip tanpa level spesifik | §10 |
| IR-059-05 | Retensi data transaksional "tidak terbatas" dengan soft-delete diturunkan dari sifat bisnis tender yang membutuhkan data historis untuk analitik win rate dan kompetitor jangka panjang | §18 |
| IR-059-06 | Praktik data minimization pada logging diadopsi sebagai baik-praktik umum perlindungan data pribadi, tanpa mengklaim kepatuhan terhadap regulasi spesifik yang tidak disebutkan sumber | §19 |
