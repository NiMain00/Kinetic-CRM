# 062 — MASTER TEST CASE CATALOG
## KINETIC CRM — Katalog Test Case Lengkap (Positif, Negatif, Edge, Security, Infra, AI)

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 062 |
| **Nama Dokumen** | Master Test Case Catalog |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | PRD §12, BA Review (seluruh gap), semua dokumen modul |
| **Status** | Final |

---

## 1. TEST CASE TAXONOMY

| Kategori | Kode Prefix | Deskripsi |
|---|---|---|
| Authentication & Session | TC-AUTH | Login, logout, lockout, session timeout |
| Organization | TC-ORG | Hierarki organisasi CRUD |
| User Management | TC-USER | CRUD user, role assignment |
| Role & Permission | TC-ROLE | Permission matrix, scope enforcement |
| Prospek | TC-PROS | Lifecycle prospek, review, konversi |
| Proyek Core | TC-PROJ | CRUD proyek, cancel, at-risk |
| RKS | TC-RKS | Input RKS, review PM, revisi |
| LPHS/SIOS | TC-LPHS | Paralel review, targeted revision |
| Harga & Kompetitor | TC-BID | Input harga, kompetitor |
| Pemenang & Delivery | TC-WIN | Input hasil tender, delivery |
| Cancellation | TC-CANC | Pembatalan proyek |
| Approval Engine | TC-APR | Routing, backup, reassign |
| SLA | TC-SLA | Kalkulasi hari kerja, reminder, eskalasi |
| Notifikasi | TC-NOTIF | In-app, polling, event triggers |
| Dashboard | TC-DASH | Widget, scope per role |
| Laporan | TC-REPT | Win/loss, pipeline, export |
| Audit Log | TC-AUDT | Append-only, export CSV |
| KPI & Target | TC-KPI | Setting target, kalkulasi, skor |
| Master Data | TC-MAST | Customer, kompetitor, pertanyaan |
| Konfigurasi | TC-CFG | Status, workflow, SLA, role |
| Upload/Dokumen | TC-DOC | Upload, download, versioning |
| Security | TC-SEC | OWASP, injection, auth bypass |
| Infrastructure | TC-INFRA | Health check, backup, restore |
| AI Features | TC-AI | Gemini integration, error handling |
| Migration | TC-MIG | localStorage → DB, CSV import |

---

## 2. AUTHENTICATION & SESSION (TC-AUTH)

| TC ID | Nama | Tipe | Steps | Expected | Priority |
|---|---|---|---|---|---|
| TC-AUTH-01 | Login sukses | Positif | Input username+password benar → Submit | HTTP 200; token diterima; redirect /dashboard | Critical |
| TC-AUTH-02 | Login password salah | Negatif | Input password salah → Submit | HTTP 401; "Username atau password salah"; attempts_remaining menurun | Critical |
| TC-AUTH-03 | Login 5x gagal berturut | Edge | Gagalkan login 5 kali berturut | HTTP 423; locked_until diisi; pesan lockout | Critical |
| TC-AUTH-04 | Login akun terkunci | Negatif | Login saat locked | HTTP 423; sisa waktu lockout ditampilkan | High |
| TC-AUTH-05 | Login akun nonaktif | Negatif | Login dengan user is_active=0 | HTTP 403; "Akun tidak aktif" | High |
| TC-AUTH-06 | Session idle timeout warning | Edge | Idle selama WARN_MINUTES | Modal warning countdown tampil | High |
| TC-AUTH-07 | Klik "Lanjutkan" di warning | Positif | Klik lanjutkan saat warning tampil | Session diperpanjang; modal hilang | High |
| TC-AUTH-08 | Token expired, refresh valid | Edge | Access token expired; ada refresh token valid | Auto-refresh; tidak logout | High |
| TC-AUTH-09 | Refresh token expired | Edge | Keduanya expired | Logout paksa; redirect /login + toast | Critical |
| TC-AUTH-10 | Must change password | Edge | User baru login (must_change_password=true) | Redirect ke /profile/change-password; route lain blocked | High |
| TC-AUTH-11 | Logout | Positif | Klik Logout | Session diinvalidasi; redirect /login | Critical |
| TC-AUTH-12 | Multi-session | Edge | 2 browser login akun yang sama | Keduanya dapat token berbeda; keduanya valid | Medium |
| TC-AUTH-13 | Admin reset password user aktif | Positif | Admin reset password | Semua session user diinvalidasi; email terkirim; must_change_password=true | High |
| TC-AUTH-14 | Akses halaman tanpa login | Security | Akses /dashboard tanpa token | Redirect ke /login dengan state.from | Critical |
| TC-AUTH-15 | Login dengan SQL injection | Security | Username: `admin' OR '1'='1` | HTTP 401; tidak ada bypass | Critical |

---

## 3. ROLE & PERMISSION (TC-ROLE)

| TC ID | Nama | Tipe | Expected | Priority |
|---|---|---|---|---|
| TC-ROLE-01 | Cabang akses /reports | Security | HTTP 403 | Critical |
| TC-ROLE-02 | Dept coba approve RKS | Security | HTTP 403 | Critical |
| TC-ROLE-03 | Cabang lihat proyek cabang lain via URL | Security | HTTP 403 | Critical |
| TC-ROLE-04 | PM lihat semua proyek | Positif | Semua proyek dari semua cabang tampil | High |
| TC-ROLE-05 | Admin bypass semua permission | Positif | Admin bisa akses semua endpoint | High |
| TC-ROLE-06 | Ubah permission matrix; cache belum expired | Edge | Permission lama masih berlaku sampai TTL | Medium |
| TC-ROLE-07 | Ubah permission matrix; user re-login | Positif | Permission baru berlaku | Medium |

---

## 4. PROSPEK (TC-PROS)

| TC ID | Nama | Tipe | Expected | Priority |
|---|---|---|---|---|
| TC-PROS-01 | Buat prospek valid | Positif | Prospek tersimpan; status=prospecting | Critical |
| TC-PROS-02 | Buat prospek tanpa customer | Negatif | Error 422: "Customer wajib dipilih" | Critical |
| TC-PROS-03 | Simpan draft dengan pertanyaan required kosong | Edge | Berhasil; status=prospecting | High |
| TC-PROS-04 | Submit tanpa pertanyaan required | Negatif | Error 422; list field kosong | Critical |
| TC-PROS-05 | Submit valid → PM approve | Positif | Status=approved; Cabang dinotifikasi | Critical |
| TC-PROS-06 | PM kirim revisi | Positif | Status=revision; pertanyaan review tersimpan | Critical |
| TC-PROS-07 | Cabang jawab revisi → re-submit | Positif | Status=waiting_pm_approval | High |
| TC-PROS-08 | Konversi prospek approved ke proyek | Positif | Proyek baru terbuat; prospek status=converted | Critical |
| TC-PROS-09 | Hapus prospek non-draft | Negatif | Error: "Hanya draft yang bisa dihapus" | High |
| TC-PROS-10 | Cabang akses prospek cabang lain | Security | HTTP 403 | Critical |
| TC-PROS-11 | Pertanyaan dari DB (bukan localStorage) | Critical | Pertanyaan tetap muncul setelah clear localStorage | Critical |
| TC-PROS-12 | 3 putaran revisi berturut | Edge | Semua riwayat tersimpan di timeline | Medium |

---

## 5. PROYEK CORE (TC-PROJ)

| TC ID | Nama | Tipe | Expected | Priority |
|---|---|---|---|---|
| TC-PROJ-01 | Buat proyek tender valid | Positif | project_code auto-generated; status=created | Critical |
| TC-PROJ-02 | Buat proyek tanpa customer | Negatif | Error 422 | Critical |
| TC-PROJ-03 | Project code unik per tahun | Edge | 2 proyek sama tahun → code berbeda | High |
| TC-PROJ-04 | Proyek type=prospecting tidak ada tab RKS | Edge | Tab RKS tidak muncul | High |
| TC-PROJ-05 | Proyek stuck > 5 hari | Edge | At-risk=true; muncul di dashboard widget | High |
| TC-PROJ-06 | Cancel proyek dari status apapun (non-terminal) | Positif | is_cancelled=1; Cabang dinotifikasi | Critical |
| TC-PROJ-07 | Cancel proyek terminal (selesai) | Negatif | Error: "Tidak dapat membatalkan proyek selesai" | Critical |
| TC-PROJ-08 | Cabang coba cancel | Security | HTTP 403 | Critical |
| TC-PROJ-09 | Dashboard tidak hitung proyek cancelled | Positif | Count "Proyek Aktif" tidak include cancelled | Critical |
| TC-PROJ-10 | Timeline append-only | Security | Tidak ada endpoint DELETE timeline | High |

---

## 6. RKS (TC-RKS)

| TC ID | Nama | Tipe | Expected | Priority |
|---|---|---|---|---|
| TC-RKS-01 | Simpan draft RKS tanpa deadline | Positif | Tersimpan; status=draft | High |
| TC-RKS-02 | Submit RKS tanpa dokumen dan URL | Negatif | Error: "Dokumen atau URL wajib diisi" | Critical |
| TC-RKS-03 | Submit RKS deadline past | Negatif | Error: "Deadline tidak boleh masa lalu" | High |
| TC-RKS-04 | PM approve RKS | Positif | Status proyek → review_department | Critical |
| TC-RKS-05 | PM kirim revisi | Positif | Status=revision; Cabang dinotifikasi | Critical |
| TC-RKS-06 | Nomor tender duplikat per customer | Negatif | Error: "Nomor tender sudah digunakan" | High |
| TC-RKS-07 | Cabang edit RKS saat submitted | Negatif | Error: "RKS sedang dalam review" | High |

---

## 7. LPHS/SIOS — PARALEL & TARGETED REVISION (TC-LPHS)

| TC ID | Nama | Tipe | Expected | Priority |
|---|---|---|---|---|
| TC-LPHS-01 | Upload LPHS tanpa pilih dept | Negatif | Error: "Minimal 1 departemen" | Critical |
| TC-LPHS-02 | Ubah dept setelah upload | Negatif | Error: "Pilihan departemen terkunci" | High |
| TC-LPHS-03 | Dept review paralel sebelum PM approve | Positif | Status dept=reviewing; tidak error | Critical |
| TC-LPHS-04 | Dept submit final sebelum PM approve | Negatif | Error 422: "Tunggu PM selesai review" | Critical |
| TC-LPHS-05 | PM approve → Dept submit final | Positif | Berhasil; progress matrix update | Critical |
| TC-LPHS-06 | Targeted revision ke 1 dari 3 dept | Positif | Hanya 1 dept status=revision; 2 lain tetap approved | Critical |
| TC-LPHS-07 | Semua dept + PM approve | Positif | overall_status=mgmt_review; Management dinotif | Critical |
| TC-LPHS-08 | Management approve final | Positif | Status proyek → submit_harga | Critical |
| TC-LPHS-09 | Multiple targeted revision rounds | Edge | Semua log tersimpan; semua riwayat visible | Medium |

---

## 8. APPROVAL ENGINE (TC-APR)

| TC ID | Nama | Tipe | Expected | Priority |
|---|---|---|---|---|
| TC-APR-01 | Approve oleh non-assignee | Security | HTTP 403 | Critical |
| TC-APR-02 | Primary approver nonaktif | Edge | Auto-route ke backup approver | High |
| TC-APR-03 | Delegasi aktif untuk PM X | Edge | Approval diterima delegate PM X | High |
| TC-APR-04 | Admin reassign pending approval | Positif | Assignee baru; notifikasi terkirim | High |
| TC-APR-05 | Reassign approval yang sudah diputuskan | Negatif | Error: "Hanya pending yang bisa di-reassign" | Medium |
| TC-APR-06 | Cancel proyek → pending approval | Edge | Approval otomatis cancelled | High |

---

## 9. SLA ENGINE (TC-SLA)

| TC ID | Nama | Tipe | Steps | Expected | Priority |
|---|---|---|---|---|---|
| TC-SLA-01 | Kalkulasi 3 HK dari Senin, no holiday | Positif | Submit Senin → Deadline Kamis | Critical |
| TC-SLA-02 | Kalkulasi 3 HK, Senin libur nasional | Edge | Submit Kamis → Deadline Rabu minggu depan | Critical |
| TC-SLA-03 | Reminder 1 HK sebelum deadline | Positif | Cron: kirim reminder; flag disi | High |
| TC-SLA-04 | Tidak kirim reminder duplikat | Edge | Cron jalan 2x hari sama → 1 reminder saja | High |
| TC-SLA-05 | SLA terlampaui → overdue | Positif | sla_status=overdue; badge merah di inbox | Critical |
| TC-SLA-06 | Eskalasi setelah N hari overdue | Positif | Notif eskalasi ke management | High |
| TC-SLA-07 | Approval selesai sebelum deadline | Positif | resolved_at diisi; is_overdue=0 | High |
| TC-SLA-08 | SLA tidak di-enforce (is_enforced=false) | Edge | Tracking berjalan; tidak ada alert | Medium |

---

## 10. NOTIFIKASI (TC-NOTIF)

| TC ID | Nama | Tipe | Expected | Priority |
|---|---|---|---|---|
| TC-NOTIF-01 | Submit prospek → PM dinotifikasi | Positif | PM menerima notif in-app; badge +1 | Critical |
| TC-NOTIF-02 | Klik notifikasi | Positif | Navigate ke action_url; is_read=1 | High |
| TC-NOTIF-03 | "Tandai Semua Dibaca" | Positif | Semua is_read=1; badge=0 | High |
| TC-NOTIF-04 | Polling 60 detik ada notif baru | Positif | Toast "X notifikasi baru" | High |
| TC-NOTIF-05 | Deadline approaching cron | Positif | Cabang+PM terima notif | High |
| TC-NOTIF-06 | Tidak duplikat notif deadline per hari | Edge | 1 notif per proyek per hari | High |
| TC-NOTIF-07 | Notif tersimpan DB; offline user | Edge | User offline → notif tetap ada saat online | Critical |
| TC-NOTIF-08 | User nonaktif tidak terima notif | Edge | Notif tidak dikirim ke is_active=0 | High |

---

## 11. KPI & TARGET (TC-KPI)

| TC ID | Nama | Tipe | Expected | Priority |
|---|---|---|---|---|
| TC-KPI-01 | Set target bobot total 95% | Negatif | Error: "Total bobot harus 100%" | Critical |
| TC-KPI-02 | Set target per cabang per periode | Positif | Target tersimpan; dashboard tampil progress | Critical |
| TC-KPI-03 | Revisi target | Positif | Versi baru dibuat; lama is_current=0 | High |
| TC-KPI-04 | Revisi target periode terkunci | Negatif | Error: "Periode sudah terkunci" | High |
| TC-KPI-05 | Win rate hanya hitung proyek ada hasil | Edge | Proyek berjalan tidak masuk denominator | Critical |
| TC-KPI-06 | Over-achievement di-cap 100% | Edge | capped_pct tidak melebihi 100 | High |
| TC-KPI-07 | Composite score traffic light | Positif | ≥90=hijau; 60-89=kuning; <60=merah | High |
| TC-KPI-08 | Snapshot cron harian | Positif | kpi_snapshots terisi untuk semua scope+KPI | Medium |

---

## 12. UPLOAD & DOKUMEN (TC-DOC)

| TC ID | Nama | Tipe | Expected | Priority |
|---|---|---|---|---|
| TC-DOC-01 | Upload PDF valid | Positif | File tersimpan; record di DB; version=1 | Critical |
| TC-DOC-02 | Upload file > max size | Negatif | Error: "Ukuran melebihi batas X MB" | Critical |
| TC-DOC-03 | Upload ekstensi tidak diizinkan (.exe) | Negatif | Error: "Tipe file tidak diizinkan" | Critical |
| TC-DOC-04 | Upload ulang tipe sama → versioning | Positif | version=2; v1.is_latest=0 | Critical |
| TC-DOC-05 | Download file tanpa login | Security | HTTP 401 | Critical |
| TC-DOC-06 | Download file proyek tanpa akses | Security | HTTP 403 | Critical |
| TC-DOC-07 | Akses file via URL langsung | Security | HTTP 404 atau 403 | Critical |
| TC-DOC-08 | Versi histori semua bisa didownload | Positif | v1 dan v2 keduanya bisa didownload | High |
| TC-DOC-09 | Spoofing MIME type (.php rename .pdf) | Security | Error: MIME type tidak sesuai ekstensi | Critical |

---

## 13. SECURITY TEST CASES (TC-SEC)

| TC ID | Nama | Tipe | Expected | Priority |
|---|---|---|---|---|
| TC-SEC-01 | SQL Injection di login | Security | HTTP 401; tidak ada bypass | Critical |
| TC-SEC-02 | SQL Injection di search parameter | Security | Sanitized; tidak ada query manipulation | Critical |
| TC-SEC-03 | XSS di nama proyek | Security | HTML di-escape; tidak ada script execution | Critical |
| TC-SEC-04 | CSRF attack | Security | HTTP 403; CSRF token required | Critical |
| TC-SEC-05 | IDOR — akses resource lain via ID | Security | HTTP 403; scope enforcement | Critical |
| TC-SEC-06 | JWT manipulation (invalid signature) | Security | HTTP 401 | Critical |
| TC-SEC-07 | JWT expired | Security | HTTP 401; trigger refresh flow | Critical |
| TC-SEC-08 | Path traversal di upload | Security | Error; disallow `../` dalam filename | Critical |
| TC-SEC-09 | Brute force protection | Security | Lockout setelah 5 kali gagal | Critical |
| TC-SEC-10 | Sensitive data di log | Security | Password, API key tidak ada di log | Critical |
| TC-SEC-11 | API key di response body | Security | GEMINI_API_KEY tidak pernah dalam response | Critical |
| TC-SEC-12 | HTTP diakses (bukan HTTPS) | Security | Redirect ke HTTPS | High |
| TC-SEC-13 | Security headers | Security | X-Frame-Options, CSP, HSTS ada di response | High |
| TC-SEC-14 | Rate limiting login endpoint | Security | 429 setelah >10 req/menit dari satu IP | High |

---

## 14. INFRASTRUCTURE (TC-INFRA)

| TC ID | Nama | Tipe | Expected | Priority |
|---|---|---|---|---|
| TC-INFRA-01 | Health check semua service normal | Positif | HTTP 200; status=ok | Critical |
| TC-INFRA-02 | Health check MySQL down | Negatif | HTTP 503; database=error | Critical |
| TC-INFRA-03 | Health check Redis down | Negatif | HTTP 503; redis=error | High |
| TC-INFRA-04 | Container restart | Edge | Service kembali dalam <30 detik | High |
| TC-INFRA-05 | Backup database | Positif | File .sql.gz.enc terbuat; terupload ke S3 | Critical |
| TC-INFRA-06 | Restore dari backup | Positif | Data identik dengan production saat backup | Critical |
| TC-INFRA-07 | GEMINI_API_KEY tidak diset | Edge | AI endpoint HTTP 503; non-AI endpoints normal | High |

---

## 15. AI FEATURES (TC-AI)

| TC ID | Nama | Tipe | Expected | Priority |
|---|---|---|---|---|
| TC-AI-01 | AI Tender Summary endpoint | Positif | Ringkasan teks tender dihasilkan | High |
| TC-AI-02 | AI request saat rate limit tercapai | Edge | Error 429 dari Gemini → retry dengan backoff | High |
| TC-AI-03 | AI request saat API key invalid | Negatif | HTTP 503: "AI service configuration error" | High |
| TC-AI-04 | AI cost limit harian tercapai | Edge | AI disabled sementara; pesan "Batas biaya tercapai" | High |
| TC-AI-05 | AI dipanggil langsung tanpa AI Service Layer | Security | Tidak ada endpoint BE langsung ke Gemini API | High |
| TC-AI-06 | AI request tercatat di audit log | Positif | Audit log berisi: user, fitur AI, timestamp, status | Medium |
| TC-AI-07 | Gemini API timeout (>30 detik) | Edge | HTTP 504 ke client; retry N kali sebelum fail | High |

---

## 16. MIGRATION (TC-MIG)

| TC ID | Nama | Tipe | Expected | Priority |
|---|---|---|---|---|
| TC-MIG-01 | Import 50 customer CSV valid | Positif | 50 customer terbuat; batch_id tersimpan | High |
| TC-MIG-02 | Import CSV dengan baris invalid | Edge | Valid diimport; invalid di-skip + error report | High |
| TC-MIG-03 | dry_run import | Positif | Tidak ada perubahan DB; hanya preview+errors | High |
| TC-MIG-04 | Rollback batch import | Positif | DELETE by batch_id; 0 records tersisa | High |
| TC-MIG-05 | localStorage legacy detection | Positif | Banner migrasi muncul untuk Admin | Critical |
| TC-MIG-06 | Import localStorage ke DB | Positif | Pertanyaan di DB; localStorage bersih | Critical |
| TC-MIG-07 | Form prospek setelah localStorage migration | Positif | Pertanyaan dari DB; tidak dari localStorage | Critical |

---

## 17. TEST EXECUTION MATRIX (FASE 1 GO-LIVE)

| Priority | Total TC | Wajib Pass untuk Go-Live |
|---|---|---|
| Critical | 58 | 100% (0 failure diizinkan) |
| High | 67 | 95% (≤3 failure; harus ada workaround) |
| Medium | 24 | 85% (diperbolehkan sedikit failure non-blocking) |
| Low | 9 | Best effort |

### 17.1 Automated vs Manual

| Tipe | Target Coverage | Tool |
|---|---|---|
| Unit Test (backend) | 80% code coverage | PHPUnit / Jest |
| Integration Test (API) | Semua critical endpoints | Postman / Bruno Collection |
| E2E Test | Happy path per modul | Playwright |
| Security Scan | Semua OWASP Top 10 | OWASP ZAP + manual |
| Performance Test | p95 < 2 detik untuk list endpoints | k6 |

---

## 18. BUG SEVERITY CLASSIFICATION

| Severity | Deskripsi | SLA Perbaikan |
|---|---|---|
| P1 - Critical | Sistem tidak bisa digunakan; data loss; security breach | Dalam 4 jam (hotfix) |
| P2 - High | Fitur utama tidak berfungsi; workaround tidak ada | Dalam 1 hari kerja |
| P3 - Medium | Fitur terbatas; ada workaround | Dalam 3 hari kerja |
| P4 - Low | UI minor; tidak mempengaruhi fungsionalitas | Sprint berikutnya |

---

## 19. DEFINITION OF DONE (DoD) PER MODUL

Sebuah modul dianggap **Done** jika memenuhi semua kriteria berikut:

```
✓ Semua TC Critical di modul = PASS
✓ Semua TC High di modul ≥ 95% PASS
✓ Code review selesai (minimal 1 reviewer)
✓ API documentation diperbarui
✓ UI screen catalog diperbarui jika ada perubahan screen
✓ Tidak ada P1 atau P2 bug yang open
✓ Performance test: p95 < 2 detik untuk endpoint utama
✓ Security scan: tidak ada Critical atau High vulnerability
✓ Audit log bekerja untuk semua aksi yang harus dilog
```
