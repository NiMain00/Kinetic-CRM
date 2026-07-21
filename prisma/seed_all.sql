-- ============================================================
-- SEED DATA: Prospects, Projects, Procurement + Timeline Events
-- Jalankan di Supabase SQL Editor
-- ============================================================

DO $$
DECLARE
  actor_id TEXT;
  actor_name TEXT;
BEGIN
  SELECT id INTO actor_id FROM "users" ORDER BY created_at ASC LIMIT 1;
  IF actor_id IS NULL THEN actor_id := 'system'; END IF;
  actor_name := 'System';

  -- ============================================================
  -- PROSPECTS (8 prospek)
  -- ============================================================
  INSERT INTO "prospects" (id, name, client, status, prospect_type, branch, estimated_value, description, created_by_user_id, owner_user_id, created_at, updated_at) VALUES
    (gen_random_uuid()::text, 'Pengadaan Server Data Center', 'PT Telkom Indonesia', 'approved', 'tender', 'Jakarta', 25000000000, 'Prospek pengadaan server untuk data center baru', actor_id, actor_id, '2025-11-01', '2025-11-01'),
    (gen_random_uuid()::text, 'Sistem Jaringan Fiber Optik', 'PT Indosat', 'potensial', 'tender', 'Bandung', 15000000000, 'Pembangunan jaringan fiber optik area Jabodetabek', actor_id, actor_id, '2025-11-15', '2025-11-15'),
    (gen_random_uuid()::text, 'Aplikasi Mobile Perbankan', 'PT Bank Mandiri', 'lead', 'tender', 'Jakarta', 30000000000, 'Pengembangan aplikasi mobile banking', actor_id, actor_id, '2025-12-01', '2025-12-01'),
    (gen_random_uuid()::text, 'Sistem Keamanan Cyber', 'PT Pertamina', 'potensial', 'tender', 'Surabaya', 18000000000, 'Implementasi sistem keamanan siber terintegrasi', actor_id, actor_id, '2025-12-10', '2025-12-10'),
    (gen_random_uuid()::text, 'Smart Office Solution', 'PT Angkasa Pura', 'waiting_supervisor', 'tender', 'Medan', 8000000000, 'Solusi kantor pintar untuk bandara', actor_id, actor_id, '2026-01-05', '2026-01-05'),
    (gen_random_uuid()::text, 'Cloud Infrastructure', 'PT Bank BNI', 'potensial', 'tender', 'Jakarta', 22000000000, 'Migrasi infrastruktur ke cloud hybrid', actor_id, actor_id, '2026-01-15', '2026-01-15'),
    (gen_random_uuid()::text, 'Sistem ERP Keuangan', 'PT Kimia Farma', 'lead', 'non_tender', 'Bandung', 5000000000, 'Implementasi ERP untuk divisi keuangan', actor_id, actor_id, '2026-02-01', '2026-02-01'),
    (gen_random_uuid()::text, 'IoT Industri Manufaktur', 'PT Semen Indonesia', 'waiting_supervisor', 'tender', 'Makassar', 12000000000, 'Sistem IoT untuk monitoring produksi', actor_id, actor_id, '2026-02-10', '2026-02-10');

  -- ============================================================
  -- PROJECTS (8 proyek)
  -- ============================================================
  INSERT INTO "projects" (id, code, name, client, type, location, status, progress, estimated_value, author, created_by_user_id, owner_user_id, date, created_at, updated_at) VALUES
    (gen_random_uuid()::text, 'PRJ-001', 'Pengadaan Server HPC', 'PT Telkom Indonesia', 'tender', 'Jakarta', 'Selesai', 100, 20000000000, actor_name, actor_id, actor_id, '2025-01-15', '2025-01-15', '2025-06-01'),
    (gen_random_uuid()::text, 'PRJ-002', 'Jaringan Fiber Optik', 'PT Indosat', 'tender', 'Bandung', 'Selesai', 100, 15000000000, actor_name, actor_id, actor_id, '2025-02-01', '2025-02-01', '2025-06-10'),
    (gen_random_uuid()::text, 'PRJ-003', 'Platform Big Data', 'PT Bank Mandiri', 'tender', 'Jakarta', 'BAST', 90, 28000000000, actor_name, actor_id, actor_id, '2025-03-01', '2025-03-01', '2025-07-05'),
    (gen_random_uuid()::text, 'PRJ-004', 'Sistem Keamanan Siber', 'PT Pertamina', 'tender', 'Surabaya', 'Pelaksanaan', 60, 18000000000, actor_name, actor_id, actor_id, '2025-04-01', '2025-04-01', '2025-05-25'),
    (gen_random_uuid()::text, 'PRJ-005', 'Infrastruktur Cloud Hybrid', 'PT Bank BNI', 'tender', 'Jakarta', 'Menunggu PO', 30, 22000000000, actor_name, actor_id, actor_id, '2025-05-01', '2025-05-01', '2025-06-15'),
    (gen_random_uuid()::text, 'PRJ-006', 'Aplikasi Mobile Banking', 'PT Bank Mandiri', 'tender', 'Jakarta', 'Negosiasi', 20, 30000000000, actor_name, actor_id, actor_id, '2025-06-01', '2025-06-01', '2025-06-28'),
    (gen_random_uuid()::text, 'PRJ-007', 'Smart Office Solution', 'PT Angkasa Pura', 'tender', 'Medan', 'Approved', 10, 8000000000, actor_name, actor_id, actor_id, '2025-07-01', '2025-07-01', '2025-07-15'),
    (gen_random_uuid()::text, 'PRJ-008', 'IoT Industri Manufaktur', 'PT Semen Indonesia', 'tender', 'Makassar', 'RKS', 5, 12000000000, actor_name, actor_id, actor_id, '2025-08-01', '2025-08-01', '2025-08-06');

  -- ============================================================
  -- PROJECT TIMELINE EVENTS (untuk analytics)
  -- ============================================================

  -- PRJ-001: Completed (full cycle)
  INSERT INTO "project_timeline_events" (id, project_id, title, actor, type, time, event_key, event_label, previous_status, next_status, actor_user_id, occurred_at, duration_minutes, prev_val, new_val) VALUES
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-001'), 'Status: Dibuat', actor_id, 'status_change', '2025-01-15', 'CREATED', 'Dibuat', NULL, 'Dibuat', actor_id, '2025-01-15', NULL, NULL, 'Dibuat'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-001'), 'Status berubah: Dibuat → RKS', actor_id, 'status_change', '2025-01-20', 'RKS_DITERIMA', 'RKS', 'Dibuat', 'RKS', actor_id, '2025-01-20', 7200, 'Dibuat', 'RKS'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-001'), 'Status berubah: RKS → Review RKS', actor_id, 'status_change', '2025-01-24', 'RKS_REVIEW', 'Review RKS', 'RKS', 'Review RKS', actor_id, '2025-01-24', 5760, 'RKS', 'Review RKS'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-001'), 'Status berubah: Review RKS → Approved', actor_id, 'status_change', '2025-01-28', 'RKS_APPROVED', 'Approved', 'Review RKS', 'Approved', actor_id, '2025-01-28', 5760, 'Review RKS', 'Approved'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-001'), 'Status berubah: Approved → Penawaran Dikirim', actor_id, 'status_change', '2025-02-05', 'PENAWARAN_DIKIRIM', 'Penawaran Dikirim', 'Approved', 'Penawaran Dikirim', actor_id, '2025-02-05', 11520, 'Approved', 'Penawaran Dikirim'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-001'), 'Status berubah: Penawaran Dikirim → Negosiasi', actor_id, 'status_change', '2025-02-10', 'NEGOSIASI', 'Negosiasi', 'Penawaran Dikirim', 'Negosiasi', actor_id, '2025-02-10', 7200, 'Penawaran Dikirim', 'Negosiasi'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-001'), 'Status berubah: Negosiasi → Menunggu PO', actor_id, 'status_change', '2025-02-18', 'MENUNGGU_PO', 'Menunggu PO', 'Negosiasi', 'Menunggu PO', actor_id, '2025-02-18', 11520, 'Negosiasi', 'Menunggu PO'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-001'), 'Status berubah: Menunggu PO → PO Diterima', actor_id, 'status_change', '2025-03-05', 'PO_DITERIMA', 'PO Diterima', 'Menunggu PO', 'PO Diterima', actor_id, '2025-03-05', 20160, 'Menunggu PO', 'PO Diterima'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-001'), 'Status berubah: PO Diterima → Pelaksanaan', actor_id, 'status_change', '2025-03-10', 'PELAKSANAAN', 'Pelaksanaan', 'PO Diterima', 'Pelaksanaan', actor_id, '2025-03-10', 7200, 'PO Diterima', 'Pelaksanaan'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-001'), 'Status berubah: Pelaksanaan → BAST', actor_id, 'status_change', '2025-05-15', 'BAST', 'BAST', 'Pelaksanaan', 'BAST', actor_id, '2025-05-15', 93600, 'Pelaksanaan', 'BAST'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-001'), 'Status berubah: BAST → Selesai', actor_id, 'status_change', '2025-06-01', 'SELESAI', 'Selesai', 'BAST', 'Selesai', actor_id, '2025-06-01', 24480, 'BAST', 'Selesai');

  -- PRJ-002: Completed (full cycle)
  INSERT INTO "project_timeline_events" (id, project_id, title, actor, type, time, event_key, event_label, previous_status, next_status, actor_user_id, occurred_at, duration_minutes, prev_val, new_val) VALUES
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-002'), 'Status: Dibuat', actor_id, 'status_change', '2025-02-01', 'CREATED', 'Dibuat', NULL, 'Dibuat', actor_id, '2025-02-01', NULL, NULL, 'Dibuat'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-002'), 'Status berubah: Dibuat → RKS', actor_id, 'status_change', '2025-02-05', 'RKS_DITERIMA', 'RKS', 'Dibuat', 'RKS', actor_id, '2025-02-05', 5760, 'Dibuat', 'RKS'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-002'), 'Status berubah: RKS → Review RKS', actor_id, 'status_change', '2025-02-09', 'RKS_REVIEW', 'Review RKS', 'RKS', 'Review RKS', actor_id, '2025-02-09', 5760, 'RKS', 'Review RKS'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-002'), 'Status berubah: Review RKS → Approved', actor_id, 'status_change', '2025-02-13', 'RKS_APPROVED', 'Approved', 'Review RKS', 'Approved', actor_id, '2025-02-13', 5760, 'Review RKS', 'Approved'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-002'), 'Status berubah: Approved → Penawaran Dikirim', actor_id, 'status_change', '2025-02-20', 'PENAWARAN_DIKIRIM', 'Penawaran Dikirim', 'Approved', 'Penawaran Dikirim', actor_id, '2025-02-20', 10080, 'Approved', 'Penawaran Dikirim'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-002'), 'Status berubah: Penawaran Dikirim → Negosiasi', actor_id, 'status_change', '2025-02-25', 'NEGOSIASI', 'Negosiasi', 'Penawaran Dikirim', 'Negosiasi', actor_id, '2025-02-25', 7200, 'Penawaran Dikirim', 'Negosiasi'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-002'), 'Status berubah: Negosiasi → Menunggu PO', actor_id, 'status_change', '2025-03-05', 'MENUNGGU_PO', 'Menunggu PO', 'Negosiasi', 'Menunggu PO', actor_id, '2025-03-05', 11520, 'Negosiasi', 'Menunggu PO'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-002'), 'Status berubah: Menunggu PO → PO Diterima', actor_id, 'status_change', '2025-03-12', 'PO_DITERIMA', 'PO Diterima', 'Menunggu PO', 'PO Diterima', actor_id, '2025-03-12', 10080, 'Menunggu PO', 'PO Diterima'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-002'), 'Status berubah: PO Diterima → Pelaksanaan', actor_id, 'status_change', '2025-03-18', 'PELAKSANAAN', 'Pelaksanaan', 'PO Diterima', 'Pelaksanaan', actor_id, '2025-03-18', 8640, 'PO Diterima', 'Pelaksanaan'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-002'), 'Status berubah: Pelaksanaan → BAST', actor_id, 'status_change', '2025-05-20', 'BAST', 'BAST', 'Pelaksanaan', 'BAST', actor_id, '2025-05-20', 89280, 'Pelaksanaan', 'BAST'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-002'), 'Status berubah: BAST → Selesai', actor_id, 'status_change', '2025-06-10', 'SELESAI', 'Selesai', 'BAST', 'Selesai', actor_id, '2025-06-10', 30240, 'BAST', 'Selesai');

  -- PRJ-003: Near completion (at BAST)
  INSERT INTO "project_timeline_events" (id, project_id, title, actor, type, time, event_key, event_label, previous_status, next_status, actor_user_id, occurred_at, duration_minutes, prev_val, new_val) VALUES
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-003'), 'Status: Dibuat', actor_id, 'status_change', '2025-03-01', 'CREATED', 'Dibuat', NULL, 'Dibuat', actor_id, '2025-03-01', NULL, NULL, 'Dibuat'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-003'), 'Status berubah: Dibuat → RKS', actor_id, 'status_change', '2025-03-05', 'RKS_DITERIMA', 'RKS', 'Dibuat', 'RKS', actor_id, '2025-03-05', 5760, 'Dibuat', 'RKS'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-003'), 'Status berubah: RKS → Review RKS', actor_id, 'status_change', '2025-03-10', 'RKS_REVIEW', 'Review RKS', 'RKS', 'Review RKS', actor_id, '2025-03-10', 7200, 'RKS', 'Review RKS'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-003'), 'Status berubah: Review RKS → Approved', actor_id, 'status_change', '2025-03-14', 'RKS_APPROVED', 'Approved', 'Review RKS', 'Approved', actor_id, '2025-03-14', 5760, 'Review RKS', 'Approved'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-003'), 'Status berubah: Approved → Penawaran Dikirim', actor_id, 'status_change', '2025-03-22', 'PENAWARAN_DIKIRIM', 'Penawaran Dikirim', 'Approved', 'Penawaran Dikirim', actor_id, '2025-03-22', 11520, 'Approved', 'Penawaran Dikirim'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-003'), 'Status berubah: Penawaran Dikirim → Negosiasi', actor_id, 'status_change', '2025-03-28', 'NEGOSIASI', 'Negosiasi', 'Penawaran Dikirim', 'Negosiasi', actor_id, '2025-03-28', 8640, 'Penawaran Dikirim', 'Negosiasi'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-003'), 'Status berubah: Negosiasi → Menunggu PO', actor_id, 'status_change', '2025-04-10', 'MENUNGGU_PO', 'Menunggu PO', 'Negosiasi', 'Menunggu PO', actor_id, '2025-04-10', 18720, 'Negosiasi', 'Menunggu PO'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-003'), 'Status berubah: Menunggu PO → PO Diterima', actor_id, 'status_change', '2025-04-20', 'PO_DITERIMA', 'PO Diterima', 'Menunggu PO', 'PO Diterima', actor_id, '2025-04-20', 14400, 'Menunggu PO', 'PO Diterima'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-003'), 'Status berubah: PO Diterima → Pelaksanaan', actor_id, 'status_change', '2025-04-25', 'PELAKSANAAN', 'Pelaksanaan', 'PO Diterima', 'Pelaksanaan', actor_id, '2025-04-25', 7200, 'PO Diterima', 'Pelaksanaan'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-003'), 'Status berubah: Pelaksanaan → BAST', actor_id, 'status_change', '2025-07-05', 'BAST', 'BAST', 'Pelaksanaan', 'BAST', actor_id, '2025-07-05', 100800, 'Pelaksanaan', 'BAST');

  -- PRJ-004: Mid-flow (at Pelaksanaan)
  INSERT INTO "project_timeline_events" (id, project_id, title, actor, type, time, event_key, event_label, previous_status, next_status, actor_user_id, occurred_at, duration_minutes, prev_val, new_val) VALUES
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-004'), 'Status: Dibuat', actor_id, 'status_change', '2025-04-01', 'CREATED', 'Dibuat', NULL, 'Dibuat', actor_id, '2025-04-01', NULL, NULL, 'Dibuat'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-004'), 'Status berubah: Dibuat → RKS', actor_id, 'status_change', '2025-04-06', 'RKS_DITERIMA', 'RKS', 'Dibuat', 'RKS', actor_id, '2025-04-06', 7200, 'Dibuat', 'RKS'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-004'), 'Status berubah: RKS → Review RKS', actor_id, 'status_change', '2025-04-10', 'RKS_REVIEW', 'Review RKS', 'RKS', 'Review RKS', actor_id, '2025-04-10', 5760, 'RKS', 'Review RKS'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-004'), 'Status berubah: Review RKS → Approved', actor_id, 'status_change', '2025-04-15', 'RKS_APPROVED', 'Approved', 'Review RKS', 'Approved', actor_id, '2025-04-15', 7200, 'Review RKS', 'Approved'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-004'), 'Status berubah: Approved → Penawaran Dikirim', actor_id, 'status_change', '2025-04-22', 'PENAWARAN_DIKIRIM', 'Penawaran Dikirim', 'Approved', 'Penawaran Dikirim', actor_id, '2025-04-22', 10080, 'Approved', 'Penawaran Dikirim'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-004'), 'Status berubah: Penawaran Dikirim → Negosiasi', actor_id, 'status_change', '2025-04-28', 'NEGOSIASI', 'Negosiasi', 'Penawaran Dikirim', 'Negosiasi', actor_id, '2025-04-28', 8640, 'Penawaran Dikirim', 'Negosiasi'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-004'), 'Status berubah: Negosiasi → Menunggu PO', actor_id, 'status_change', '2025-05-10', 'MENUNGGU_PO', 'Menunggu PO', 'Negosiasi', 'Menunggu PO', actor_id, '2025-05-10', 17280, 'Negosiasi', 'Menunggu PO'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-004'), 'Status berubah: Menunggu PO → PO Diterima', actor_id, 'status_change', '2025-05-20', 'PO_DITERIMA', 'PO Diterima', 'Menunggu PO', 'PO Diterima', actor_id, '2025-05-20', 14400, 'Menunggu PO', 'PO Diterima'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-004'), 'Status berubah: PO Diterima → Pelaksanaan', actor_id, 'status_change', '2025-05-25', 'PELAKSANAAN', 'Pelaksanaan', 'PO Diterima', 'Pelaksanaan', actor_id, '2025-05-25', 7200, 'PO Diterima', 'Pelaksanaan');

  -- PRJ-005: Stuck at Menunggu PO (bottleneck)
  INSERT INTO "project_timeline_events" (id, project_id, title, actor, type, time, event_key, event_label, previous_status, next_status, actor_user_id, occurred_at, duration_minutes, prev_val, new_val) VALUES
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-005'), 'Status: Dibuat', actor_id, 'status_change', '2025-05-01', 'CREATED', 'Dibuat', NULL, 'Dibuat', actor_id, '2025-05-01', NULL, NULL, 'Dibuat'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-005'), 'Status berubah: Dibuat → RKS', actor_id, 'status_change', '2025-05-05', 'RKS_DITERIMA', 'RKS', 'Dibuat', 'RKS', actor_id, '2025-05-05', 5760, 'Dibuat', 'RKS'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-005'), 'Status berubah: RKS → Review RKS', actor_id, 'status_change', '2025-05-10', 'RKS_REVIEW', 'Review RKS', 'RKS', 'Review RKS', actor_id, '2025-05-10', 7200, 'RKS', 'Review RKS'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-005'), 'Status berubah: Review RKS → Approved', actor_id, 'status_change', '2025-05-15', 'RKS_APPROVED', 'Approved', 'Review RKS', 'Approved', actor_id, '2025-05-15', 7200, 'Review RKS', 'Approved'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-005'), 'Status berubah: Approved → Penawaran Dikirim', actor_id, 'status_change', '2025-05-22', 'PENAWARAN_DIKIRIM', 'Penawaran Dikirim', 'Approved', 'Penawaran Dikirim', actor_id, '2025-05-22', 10080, 'Approved', 'Penawaran Dikirim'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-005'), 'Status berubah: Penawaran Dikirim → Negosiasi', actor_id, 'status_change', '2025-05-28', 'NEGOSIASI', 'Negosiasi', 'Penawaran Dikirim', 'Negosiasi', actor_id, '2025-05-28', 8640, 'Penawaran Dikirim', 'Negosiasi'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-005'), 'Status berubah: Negosiasi → Menunggu PO', actor_id, 'status_change', '2025-06-15', 'MENUNGGU_PO', 'Menunggu PO', 'Negosiasi', 'Menunggu PO', actor_id, '2025-06-15', 25920, 'Negosiasi', 'Menunggu PO');

  -- PRJ-006: At Negosiasi
  INSERT INTO "project_timeline_events" (id, project_id, title, actor, type, time, event_key, event_label, previous_status, next_status, actor_user_id, occurred_at, duration_minutes, prev_val, new_val) VALUES
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-006'), 'Status: Dibuat', actor_id, 'status_change', '2025-06-01', 'CREATED', 'Dibuat', NULL, 'Dibuat', actor_id, '2025-06-01', NULL, NULL, 'Dibuat'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-006'), 'Status berubah: Dibuat → RKS', actor_id, 'status_change', '2025-06-05', 'RKS_DITERIMA', 'RKS', 'Dibuat', 'RKS', actor_id, '2025-06-05', 5760, 'Dibuat', 'RKS'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-006'), 'Status berubah: RKS → Review RKS', actor_id, 'status_change', '2025-06-10', 'RKS_REVIEW', 'Review RKS', 'RKS', 'Review RKS', actor_id, '2025-06-10', 7200, 'RKS', 'Review RKS'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-006'), 'Status berubah: Review RKS → Approved', actor_id, 'status_change', '2025-06-15', 'RKS_APPROVED', 'Approved', 'Review RKS', 'Approved', actor_id, '2025-06-15', 7200, 'Review RKS', 'Approved'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-006'), 'Status berubah: Approved → Penawaran Dikirim', actor_id, 'status_change', '2025-06-22', 'PENAWARAN_DIKIRIM', 'Penawaran Dikirim', 'Approved', 'Penawaran Dikirim', actor_id, '2025-06-22', 10080, 'Approved', 'Penawaran Dikirim'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-006'), 'Status berubah: Penawaran Dikirim → Negosiasi', actor_id, 'status_change', '2025-06-28', 'NEGOSIASI', 'Negosiasi', 'Penawaran Dikirim', 'Negosiasi', actor_id, '2025-06-28', 8640, 'Penawaran Dikirim', 'Negosiasi');

  -- PRJ-007: At Approved
  INSERT INTO "project_timeline_events" (id, project_id, title, actor, type, time, event_key, event_label, previous_status, next_status, actor_user_id, occurred_at, duration_minutes, prev_val, new_val) VALUES
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-007'), 'Status: Dibuat', actor_id, 'status_change', '2025-07-01', 'CREATED', 'Dibuat', NULL, 'Dibuat', actor_id, '2025-07-01', NULL, NULL, 'Dibuat'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-007'), 'Status berubah: Dibuat → RKS', actor_id, 'status_change', '2025-07-05', 'RKS_DITERIMA', 'RKS', 'Dibuat', 'RKS', actor_id, '2025-07-05', 5760, 'Dibuat', 'RKS'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-007'), 'Status berubah: RKS → Review RKS', actor_id, 'status_change', '2025-07-09', 'RKS_REVIEW', 'Review RKS', 'RKS', 'Review RKS', actor_id, '2025-07-09', 5760, 'RKS', 'Review RKS'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-007'), 'Status berubah: Review RKS → Approved', actor_id, 'status_change', '2025-07-15', 'RKS_APPROVED', 'Approved', 'Review RKS', 'Approved', actor_id, '2025-07-15', 8640, 'Review RKS', 'Approved');

  -- PRJ-008: At RKS
  INSERT INTO "project_timeline_events" (id, project_id, title, actor, type, time, event_key, event_label, previous_status, next_status, actor_user_id, occurred_at, duration_minutes, prev_val, new_val) VALUES
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-008'), 'Status: Dibuat', actor_id, 'status_change', '2025-08-01', 'CREATED', 'Dibuat', NULL, 'Dibuat', actor_id, '2025-08-01', NULL, NULL, 'Dibuat'),
    (gen_random_uuid()::text, (SELECT id FROM "projects" WHERE code='PRJ-008'), 'Status berubah: Dibuat → RKS', actor_id, 'status_change', '2025-08-06', 'RKS_DITERIMA', 'RKS', 'Dibuat', 'RKS', actor_id, '2025-08-06', 7200, 'Dibuat', 'RKS');

  -- ============================================================
  -- MASTER ITEMS (untuk procurement_items)
  -- ============================================================
  INSERT INTO "master_items" (id, sku, name, type, unit, category_id, category_name, base_price, created_at, updated_at) VALUES
    (gen_random_uuid()::text, 'SRV-HPE-DL380', 'Server HPE ProLiant DL380', 'barang', 'unit', 'hardware', 'Hardware', 350000000, '2025-01-01', '2025-01-01'),
    (gen_random_uuid()::text, 'STO-HPE-NIMBLE', 'Storage Array HPE Nimble', 'barang', 'unit', 'hardware', 'Hardware', 500000000, '2025-01-01', '2025-01-01'),
    (gen_random_uuid()::text, 'CBL-FO-SM', 'Kabel Fiber Optik Single Mode', 'barang', 'meter', 'hardware', 'Hardware', 250000, '2025-01-01', '2025-01-01'),
    (gen_random_uuid()::text, 'PTCH-PNL-48', 'Patch Panel 48 Port', 'barang', 'unit', 'hardware', 'Hardware', 3500000, '2025-01-01', '2025-01-01'),
    (gen_random_uuid()::text, 'SW-CISCO-2960', 'Switch Managed Cisco 2960', 'barang', 'unit', 'hardware', 'Hardware', 85000000, '2025-01-01', '2025-01-01'),
    (gen_random_uuid()::text, 'SRV-ORACLE-EXA', 'Server Database Oracle Exadata', 'barang', 'unit', 'hardware', 'Hardware', 1500000000, '2025-01-01', '2025-01-01'),
    (gen_random_uuid()::text, 'FW-CISCO-5585', 'Firewall Cisco ASA 5585', 'barang', 'unit', 'hardware', 'Hardware', 450000000, '2025-01-01', '2025-01-01'),
    (gen_random_uuid()::text, 'UPS-APC-3000', 'UPS APC 3000VA', 'barang', 'unit', 'hardware', 'Hardware', 45000000, '2025-01-01', '2025-01-01'),
    (gen_random_uuid()::text, 'AC-SPLIT-2PK', 'AC Split 2PK', 'barang', 'unit', 'hardware', 'Hardware', 12000000, '2025-01-01', '2025-01-01');

  -- ============================================================
  -- PROCUREMENT (5 pengadaan)
  -- ============================================================
  INSERT INTO "procurements" (id, code, source_project_id, client, contract_value, location, status, progress, created_by, created_by_user_id, created_at, updated_at) VALUES
    (gen_random_uuid()::text, 'PENG-001', (SELECT id FROM "projects" WHERE code='PRJ-001'), 'PT Telkom Indonesia', 5000000000, 'Jakarta', 'Progress', 75, actor_name, actor_id, '2025-03-20', '2025-06-01'),
    (gen_random_uuid()::text, 'PENG-002', (SELECT id FROM "projects" WHERE code='PRJ-002'), 'PT Indosat', 3000000000, 'Bandung', 'Progress', 50, actor_name, actor_id, '2025-04-15', '2025-06-10'),
    (gen_random_uuid()::text, 'PENG-003', (SELECT id FROM "projects" WHERE code='PRJ-003'), 'PT Bank Mandiri', 8000000000, 'Jakarta', 'draft', 20, actor_name, actor_id, '2025-05-01', '2025-05-01'),
    (gen_random_uuid()::text, 'PENG-004', (SELECT id FROM "projects" WHERE code='PRJ-004'), 'PT Pertamina', 4000000000, 'Surabaya', 'draft', 10, actor_name, actor_id, '2025-06-01', '2025-06-01'),
    (gen_random_uuid()::text, 'PENG-005', NULL, 'PT Pelindo', 2000000000, 'Jakarta', 'Closed', 100, actor_name, actor_id, '2025-01-10', '2025-04-01');

  -- ============================================================
  -- PROCUREMENT ITEMS
  -- ============================================================
  INSERT INTO "procurement_items" (id, procurement_id, master_item_id, quantity, unit_price, total_price, status, created_at, updated_at) VALUES
    (gen_random_uuid()::text, (SELECT id FROM "procurements" WHERE code='PENG-001'), (SELECT id FROM "master_items" WHERE sku='SRV-HPE-DL380'), 10, 350000000, 3500000000, 'received', '2025-03-20', '2025-06-01'),
    (gen_random_uuid()::text, (SELECT id FROM "procurements" WHERE code='PENG-001'), (SELECT id FROM "master_items" WHERE sku='STO-HPE-NIMBLE'), 2, 500000000, 1000000000, 'received', '2025-03-20', '2025-06-01'),
    (gen_random_uuid()::text, (SELECT id FROM "procurements" WHERE code='PENG-002'), (SELECT id FROM "master_items" WHERE sku='CBL-FO-SM'), 5000, 250000, 1250000000, 'ordered', '2025-04-15', '2025-06-10'),
    (gen_random_uuid()::text, (SELECT id FROM "procurements" WHERE code='PENG-002'), (SELECT id FROM "master_items" WHERE sku='PTCH-PNL-48'), 20, 3500000, 70000000, 'ordered', '2025-04-15', '2025-06-10'),
    (gen_random_uuid()::text, (SELECT id FROM "procurements" WHERE code='PENG-002'), (SELECT id FROM "master_items" WHERE sku='SW-CISCO-2960'), 15, 85000000, 1275000000, 'pending', '2025-04-15', '2025-06-10'),
    (gen_random_uuid()::text, (SELECT id FROM "procurements" WHERE code='PENG-003'), (SELECT id FROM "master_items" WHERE sku='SRV-ORACLE-EXA'), 3, 1500000000, 4500000000, 'pending', '2025-05-01', '2025-05-01'),
    (gen_random_uuid()::text, (SELECT id FROM "procurements" WHERE code='PENG-004'), (SELECT id FROM "master_items" WHERE sku='FW-CISCO-5585'), 5, 450000000, 2250000000, 'pending', '2025-06-01', '2025-06-01'),
    (gen_random_uuid()::text, (SELECT id FROM "procurements" WHERE code='PENG-005'), (SELECT id FROM "master_items" WHERE sku='UPS-APC-3000'), 25, 45000000, 1125000000, 'received', '2025-01-10', '2025-04-01'),
    (gen_random_uuid()::text, (SELECT id FROM "procurements" WHERE code='PENG-005'), (SELECT id FROM "master_items" WHERE sku='AC-SPLIT-2PK'), 15, 12000000, 180000000, 'received', '2025-01-10', '2025-04-01');

  -- ============================================================
  -- PERMISSIONS — tambahkan analytics:view jika belum ada
  -- ============================================================
  INSERT INTO "permissions" (id, code, name, module, created_at)
  SELECT gen_random_uuid()::text, 'analytics:view', 'View Analytics', 'analytics', NOW()
  WHERE NOT EXISTS (SELECT 1 FROM "permissions" WHERE code = 'analytics:view');

  RAISE NOTICE '✅ Seed data berhasil dibuat';
END $$;
