import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Kinetic CRM...');

  // ── ORG UNITS ──────────────────────────────────────────────────
  const company = await prisma.orgUnit.upsert({
    where: { code: 'KINETIC' },
    update: {},
    create: {
      id: 'org-company', name: 'PT. Kinetic Cerdas Indonesia', code: 'KINETIC',
      unitType: 'company', city: 'Jakarta', province: 'DKI Jakarta',
      address: 'Jl. Sudirman No. 123', isActive: true, sortOrder: 0,
    },
  });

  const divOps = await prisma.orgUnit.upsert({
    where: { code: 'DIV-OPS' },
    update: {},
    create: {
      id: 'org-div-ops', name: 'Divisi Operasional', code: 'DIV-OPS',
      unitType: 'division', parentId: company.id, city: 'Jakarta', isActive: true, sortOrder: 1,
    },
  });

  const divSales = await prisma.orgUnit.upsert({
    where: { code: 'DIV-SALES' },
    update: {},
    create: {
      id: 'org-div-sales', name: 'Divisi Sales & Marketing', code: 'DIV-SALES',
      unitType: 'division', parentId: company.id, city: 'Jakarta', isActive: true, sortOrder: 2,
    },
  });

  const branchJkt = await prisma.orgUnit.upsert({
    where: { code: 'JKT' },
    update: {},
    create: {
      id: 'org-branch-jkt', name: 'Cabang Jakarta Pusat', code: 'JKT',
      unitType: 'branch', parentId: divSales.id, city: 'Jakarta Pusat', isActive: true, sortOrder: 1,
    },
  });

  const branchBdg = await prisma.orgUnit.upsert({
    where: { code: 'BDG' },
    update: {},
    create: {
      id: 'org-branch-bdg', name: 'Cabang Bandung', code: 'BDG',
      unitType: 'branch', parentId: divSales.id, city: 'Bandung', isActive: true, sortOrder: 2,
    },
  });

  const deptPM = await prisma.orgUnit.upsert({
    where: { code: 'DEPT-PM' },
    update: {},
    create: {
      id: 'dept-pm', name: 'Project Management', code: 'DEPT-PM',
      unitType: 'department', parentId: divOps.id, city: 'Jakarta', isActive: true, sortOrder: 1,
    },
  });

  const deptMarketing = await prisma.orgUnit.upsert({
    where: { code: 'DEPT-MKT' },
    update: {},
    create: {
      id: 'dept-marketing', name: 'Marketing', code: 'DEPT-MKT',
      unitType: 'department', parentId: divSales.id, city: 'Jakarta', isActive: true, sortOrder: 2,
    },
  });

  const deptFinance = await prisma.orgUnit.upsert({
    where: { code: 'DEPT-FIN' },
    update: {},
    create: {
      id: 'dept-finance', name: 'Finance', code: 'DEPT-FIN',
      unitType: 'department', parentId: divOps.id, city: 'Jakarta', isActive: true, sortOrder: 3,
    },
  });

  const deptIT = await prisma.orgUnit.upsert({
    where: { code: 'DEPT-IT' },
    update: {},
    create: {
      id: 'dept-it', name: 'Information Technology', code: 'DEPT-IT',
      unitType: 'department', parentId: divOps.id, city: 'Jakarta', isActive: true, sortOrder: 4,
    },
  });

  const deptProcurement = await prisma.orgUnit.upsert({
    where: { code: 'DEPT-PROC' },
    update: {},
    create: {
      id: 'dept-procurement', name: 'Procurement', code: 'DEPT-PROC',
      unitType: 'department', parentId: divOps.id, city: 'Jakarta', isActive: true, sortOrder: 5,
    },
  });

  // ── ROLES ───────────────────────────────────────────────────────
  const roleData = [
    { id: 'role-superadmin', name: 'Super Admin', isSystem: true },
    { id: 'role-director', name: 'Director', isSystem: true },
    { id: 'role-admin', name: 'Admin', isSystem: true },
    { id: 'role-pm', name: 'PM', isSystem: true },
    { id: 'role-bm', name: 'Branch Manager', isSystem: true },
    { id: 'role-depthead', name: 'Dept Head', isSystem: true },
    { id: 'role-management', name: 'Management', isSystem: true },
    { id: 'role-reviewer', name: 'Reviewer', isSystem: true },
    { id: 'role-staff', name: 'Staff', isSystem: true },
    { id: 'role-pm-viewer', name: 'Project Viewer', isSystem: false },
    { id: 'role-pm-contrib', name: 'Project Contributor', isSystem: false },
    { id: 'role-pm-manager', name: 'Project Manager', isSystem: false },
  ];

  const roles: Record<string, any> = {};
  for (const r of roleData) {
    roles[r.id] = await prisma.role.upsert({
      where: { id: r.id }, update: {}, create: r,
    });
  }

  // ── PERMISSIONS ────────────────────────────────────────────────
  const permissionData = [
    { id: 'perm-user-read', code: 'user:read', name: 'Read Users', module: 'user' },
    { id: 'perm-user-write', code: 'user:write', name: 'Create/Edit Users', module: 'user' },
    { id: 'perm-user-delete', code: 'user:delete', name: 'Delete Users', module: 'user' },
    { id: 'perm-prospect-read', code: 'prospect:read', name: 'Read Prospects', module: 'prospect' },
    { id: 'perm-prospect-write', code: 'prospect:write', name: 'Create/Edit Prospects', module: 'prospect' },
    { id: 'perm-prospect-delete', code: 'prospect:delete', name: 'Delete Prospects', module: 'prospect' },
    { id: 'perm-project-read', code: 'project:read', name: 'Read Projects', module: 'project' },
    { id: 'perm-project-write', code: 'project:write', name: 'Create/Edit Projects', module: 'project' },
    { id: 'perm-project-delete', code: 'project:delete', name: 'Delete Projects', module: 'project' },
    { id: 'perm-customer-read', code: 'customer:read', name: 'Read Customers', module: 'customer' },
    { id: 'perm-customer-write', code: 'customer:write', name: 'Create/Edit Customers', module: 'customer' },
    { id: 'perm-rbac-read', code: 'rbac:read', name: 'Read RBAC', module: 'rbac' },
    { id: 'perm-rbac-write', code: 'rbac:write', name: 'Manage RBAC', module: 'rbac' },
    { id: 'perm-rks-read', code: 'rks:read', name: 'Read RKS', module: 'rks' },
    { id: 'perm-rks-write', code: 'rks:write', name: 'Manage RKS', module: 'rks' },
    { id: 'perm-lphs-read', code: 'lphs:read', name: 'Read LPHS', module: 'lphs' },
    { id: 'perm-lphs-write', code: 'lphs:write', name: 'Manage LPHS', module: 'lphs' },
    { id: 'perm-procurement-read', code: 'procurement:read', name: 'Read Procurement', module: 'procurement' },
    { id: 'perm-procurement-write', code: 'procurement:write', name: 'Manage Procurement', module: 'procurement' },
    { id: 'perm-report-read', code: 'report:read', name: 'Read Reports', module: 'report' },
    { id: 'perm-settings-read', code: 'settings:read', name: 'Read Settings', module: 'settings' },
    { id: 'perm-settings-write', code: 'settings:write', name: 'Manage Settings', module: 'settings' },
    { id: 'perm-master-read', code: 'master:read', name: 'Read Master Data', module: 'master' },
    { id: 'perm-master-write', code: 'master:write', name: 'Manage Master Data', module: 'master' },
  ];

  for (const p of permissionData) {
    await prisma.permission.upsert({ where: { id: p.id }, update: {}, create: p });
  }

  // ── ROLE PERMISSIONS ────────────────────────────────────────────
  await prisma.rolePermission.deleteMany();
  const allPermIds = permissionData.map(p => p.id);
  const rpData = [];
  for (const roleId of ['role-superadmin', 'role-director', 'role-admin']) {
    for (const permId of allPermIds) {
      rpData.push({ roleId, permissionId: permId, scopeType: 'global' as const, accessLevel: 'write' as const });
    }
  }
  await prisma.rolePermission.createMany({ data: rpData });

  // ── WORKFLOW STAGES ─────────────────────────────────────────────
  const stageData = [
    { id: 'stage-prospecting', code: 'prospecting', name: 'Prospecting', module: 'prospect', sequence: 1, ownerDepartmentCode: 'DEPT-MKT' },
    { id: 'stage-supervisor-review', code: 'supervisor_review', name: 'Supervisor Review', module: 'prospect', sequence: 2, ownerDepartmentCode: 'DEPT-MKT', prevDepartmentCode: 'DEPT-MKT' },
    { id: 'stage-in-project', code: 'in_project', name: 'In Project', module: 'project', sequence: 3, ownerDepartmentCode: 'DEPT-PM', prevDepartmentCode: 'DEPT-MKT' },
    { id: 'stage-rks', code: 'rks', name: 'RKS', module: 'project', sequence: 4, ownerDepartmentCode: 'DEPT-PM', prevDepartmentCode: 'DEPT-PM' },
    { id: 'stage-lphs', code: 'lphs', name: 'LPHS/SIOS', module: 'project', sequence: 5, ownerDepartmentCode: 'DEPT-PM', prevDepartmentCode: 'DEPT-PM' },
    { id: 'stage-pricing', code: 'pricing', name: 'Pricing', module: 'project', sequence: 6, ownerDepartmentCode: 'DEPT-FIN', prevDepartmentCode: 'DEPT-PM' },
    { id: 'stage-tender', code: 'tender', name: 'Tender', module: 'project', sequence: 7, ownerDepartmentCode: 'DEPT-PM', prevDepartmentCode: 'DEPT-FIN' },
    { id: 'stage-closed', code: 'closed', name: 'Closed', module: 'project', sequence: 8, ownerDepartmentCode: 'DEPT-PM', prevDepartmentCode: 'DEPT-PM' },
    { id: 'stage-cancelled', code: 'cancelled', name: 'Cancelled', module: 'project', sequence: 9, ownerDepartmentCode: 'DEPT-PM' },
  ];

  for (const s of stageData) {
    await prisma.workflowStage.upsert({ where: { id: s.id }, update: {}, create: s });
  }

  // ── USERS ───────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('admin123', 10);
  const staffHash = await bcrypt.hash('staff123', 10);

  const userData = [
    { id: 'user-1', username: 'superadmin', fullName: 'Super Administrator', email: 'superadmin@kinetic.id', passwordHash, phone: '0811-1111-1111', orgUnitId: deptIT.id },
    { id: 'user-2', username: 'bambang', fullName: 'Bambang Permadi', email: 'bambang@kinetic.id', passwordHash, phone: '0812-2222-2222', orgUnitId: deptPM.id },
    { id: 'user-3', username: 'rina', fullName: 'Rina Marlina', email: 'rina@kinetic.id', passwordHash, phone: '0813-3333-3333', orgUnitId: deptMarketing.id },
    { id: 'user-4', username: 'deni', fullName: 'Deni Saputra', email: 'deni@kinetic.id', passwordHash: staffHash, phone: '0814-4444-4444', orgUnitId: deptFinance.id },
    { id: 'user-5', username: 'siti', fullName: 'Siti Rahmawati', email: 'siti@kinetic.id', passwordHash: staffHash, phone: '0815-5555-5555', orgUnitId: deptProcurement.id },
    { id: 'user-6', username: 'ahmad', fullName: 'Ahmad Sulistyo', email: 'ahmad@kinetic.id', passwordHash: staffHash, phone: '0816-6666-6666', orgUnitId: deptPM.id },
  ];

  for (const u of userData) {
    await prisma.user.upsert({ where: { id: u.id }, update: {}, create: u as any });
  }

  // ── USER ROLES ──────────────────────────────────────────────────
  const userRoleData = [
    { userId: 'user-1', roleId: 'role-superadmin', scopeType: 'global' as const },
    { userId: 'user-2', roleId: 'role-pm', scopeType: 'department' as const, scopeId: deptPM.id },
    { userId: 'user-3', roleId: 'role-bm', scopeType: 'department' as const, scopeId: deptMarketing.id },
    { userId: 'user-4', roleId: 'role-staff', scopeType: 'department' as const, scopeId: deptFinance.id },
    { userId: 'user-5', roleId: 'role-staff', scopeType: 'department' as const, scopeId: deptProcurement.id },
    { userId: 'user-6', roleId: 'role-staff', scopeType: 'department' as const, scopeId: deptPM.id },
  ];

  for (const ur of userRoleData) {
    await prisma.userRole.create({ data: ur });
  }

  // ── MASTER DATA ─────────────────────────────────────────────────
  const industries = [
    { id: 'ind-telekom', name: 'Telekomunikasi', code: 'TELEKOM' },
    { id: 'ind-finance', name: 'Perbankan & Keuangan', code: 'FINANCE' },
    { id: 'ind-energy', name: 'Energi & Sumber Daya', code: 'ENERGY' },
    { id: 'ind-government', name: 'Pemerintahan', code: 'GOVERNMENT' },
    { id: 'ind-manufacturing', name: 'Manufaktur', code: 'MFG' },
    { id: 'ind-healthcare', name: 'Kesehatan', code: 'HEALTH' },
    { id: 'ind-education', name: 'Pendidikan', code: 'EDUCATION' },
    { id: 'ind-oilgas', name: 'Minyak & Gas', code: 'OILGAS' },
  ];
  for (const i of industries) {
    await prisma.industry.upsert({ where: { id: i.id }, update: {}, create: i });
  }

  const projectCategories = [
    { id: 'cat-infra', name: 'Infrastruktur', code: 'INFRA', defaultWorkflowType: 'tender' },
    { id: 'cat-it', name: 'Teknologi Informasi', code: 'IT', defaultWorkflowType: 'tender' },
    { id: 'cat-consulting', name: 'Konsultansi', code: 'CONSULT', defaultWorkflowType: 'prospecting' },
    { id: 'cat-security', name: 'Keamanan', code: 'SECURITY', defaultWorkflowType: 'tender' },
    { id: 'cat-energy', name: 'Energi', code: 'ENERGY', defaultWorkflowType: 'tender' },
  ];
  for (const c of projectCategories) {
    await prisma.projectCategory.upsert({ where: { id: c.id }, update: {}, create: c });
  }

  const docTypes = [
    { id: 'doctype-rks', name: 'RKS Document', code: 'RKS', allowedExtensions: '.pdf,.doc,.docx', applicableTo: 'project' },
    { id: 'doctype-lphs', name: 'LPHS Document', code: 'LPHS', allowedExtensions: '.pdf,.xls,.xlsx', applicableTo: 'project' },
    { id: 'doctype-sios', name: 'SIOS Document', code: 'SIOS', allowedExtensions: '.pdf', applicableTo: 'project' },
    { id: 'doctype-spk', name: 'SPK/Contract', code: 'SPK', allowedExtensions: '.pdf,.doc,.docx', applicableTo: 'project' },
    { id: 'doctype-boq', name: 'BOQ', code: 'BOQ', allowedExtensions: '.xls,.xlsx', applicableTo: 'project' },
    { id: 'doctype-prospect', name: 'Prospect Document', code: 'PROSPECT', allowedExtensions: '.pdf,.doc,.docx,.jpg,.png', applicableTo: 'prospect' },
  ];
  for (const d of docTypes) {
    await prisma.documentType.upsert({ where: { id: d.id }, update: {}, create: d });
  }

  const competitors = [
    { id: 'comp-1', name: 'Infrastructure Alpha', code: 'ALPHA' },
    { id: 'comp-2', name: 'BuildCore Systems', code: 'BUILDCORE' },
    { id: 'comp-3', name: 'TechSolusi Nusantara', code: 'TSN' },
    { id: 'comp-4', name: 'Global Digital Services', code: 'GDS' },
  ];
  for (const c of competitors) {
    await prisma.competitor.upsert({ where: { id: c.id }, update: {}, create: c });
  }

  const questionTypes = [
    { id: 'qt-text', name: 'Text', code: 'text', hasOptions: false },
    { id: 'qt-textarea', name: 'Text Area', code: 'textarea', hasOptions: false },
    { id: 'qt-radio', name: 'Radio', code: 'radio', hasOptions: true },
    { id: 'qt-checkbox', name: 'Checkbox', code: 'checkbox', hasOptions: true },
    { id: 'qt-select', name: 'Select', code: 'select', hasOptions: true },
    { id: 'qt-number', name: 'Number', code: 'number', hasOptions: false },
    { id: 'qt-date', name: 'Date', code: 'date', hasOptions: false },
  ];
  for (const q of questionTypes) {
    await prisma.questionType.upsert({ where: { id: q.id }, update: {}, create: q });
  }

  const questions = [
    { id: 'q-001', questionText: 'Unit apa yang akan diadakan?', questionTypeId: 'qt-text', context: 'prospect' as const, category: 'Data Pribadi', isRequired: true, sortOrder: 1, placeholderText: 'Contoh: AC Central, Server, Kendaraan Operasional', helpText: 'Sebutkan secara spesifik jenis unit yang dibutuhkan.' },
    { id: 'q-002', questionText: 'Jelaskan spesifikasi teknis unit yang dibutuhkan secara detail.', questionTypeId: 'qt-textarea', context: 'prospect' as const, category: 'Teknis', isRequired: true, sortOrder: 2, placeholderText: 'Deskripsikan spesifikasi minimal...', helpText: 'Semakin detail spesifikasi, semakin akurat penawaran yang diterima.' },
    { id: 'q-003', questionText: 'Kategori pengadaan unit ini termasuk?', questionTypeId: 'qt-radio', context: 'both' as const, category: 'Legalitas', isRequired: true, sortOrder: 3 },
    { id: 'q-004', questionText: 'Metode pengadaan apa yang akan digunakan?', questionTypeId: 'qt-select', context: 'prospect' as const, category: 'Legalitas', isRequired: true, sortOrder: 4, helpText: 'Pilih metode yang sesuai dengan kebijakan perusahaan.' },
    { id: 'q-005', questionText: 'Fasilitas pendukung apa saja yang diperlukan?', questionTypeId: 'qt-checkbox', context: 'both' as const, category: 'Teknis', isRequired: false, sortOrder: 5, helpText: 'Pilih semua yang relevan dengan kebutuhan unit.' },
    { id: 'q-006', questionText: 'Berapa estimasi anggaran yang tersedia untuk unit ini?', questionTypeId: 'qt-number', context: 'prospect' as const, category: 'Keuangan', isRequired: true, sortOrder: 6, placeholderText: 'Contoh: 500000000', helpText: 'Dalam satuan Rupiah penuh (tanpa titik/koma).' },
    { id: 'q-007', questionText: 'Target waktu unit mulai beroperasi?', questionTypeId: 'qt-date', context: 'both' as const, category: 'Jadwal', isRequired: true, sortOrder: 7, helpText: 'Perkiraan tanggal unit siap digunakan.' },
    { id: 'q-008', questionText: 'Lokasi pengiriman / instalasi unit?', questionTypeId: 'qt-text', context: 'prospect' as const, category: 'Lokasi', isRequired: true, sortOrder: 8, placeholderText: 'Contoh: Jakarta Pusat, Kantor Cabang Bandung', helpText: 'Sebutkan lokasi tempat unit akan dikirim/diinstalasi.' },
    { id: 'q-009', questionText: 'Apakah tersedia lahan / ruang khusus untuk unit ini?', questionTypeId: 'qt-radio', context: 'rks' as const, category: 'Verifikasi Fisik', isRequired: true, sortOrder: 9, helpText: 'Pastikan infrastruktur pendukung sudah siap.' },
    { id: 'q-010', questionText: 'Sebutkan syarat garansi dan layanan purna jual yang diharapkan.', questionTypeId: 'qt-textarea', context: 'rks' as const, category: 'Dokumen', isRequired: false, sortOrder: 10, placeholderText: 'Contoh: Garansi 3 tahun, response time 1x24 jam...', helpText: 'Cantumkan ketentuan garansi minimal yang harus dipenuhi vendor.' },
    { id: 'q-011', questionText: 'Berapa estimasi volume / jumlah unit yang dibutuhkan?', questionTypeId: 'qt-number', context: 'prospect' as const, category: 'Keuangan', isRequired: true, sortOrder: 11, placeholderText: 'Contoh: 5', helpText: 'Isikan jumlah unit yang akan diadakan.' },
    { id: 'q-012', questionText: 'Sumber dana pengadaan unit ini berasal dari?', questionTypeId: 'qt-select', context: 'prospect' as const, category: 'Keuangan', isRequired: true, sortOrder: 12, helpText: 'Pilih sumber pendanaan yang berlaku.' },
    { id: 'q-013', questionText: 'Dokumen pendukung apa saja yang sudah tersedia?', questionTypeId: 'qt-checkbox', context: 'both' as const, category: 'Dokumen', isRequired: false, sortOrder: 13, helpText: 'Centang dokumen yang sudah dimiliki.' },
    { id: 'q-014', questionText: 'Apakah unit ini merupakan pengadaan ulang (replacement)?', questionTypeId: 'qt-radio', context: 'prospect' as const, category: 'Lainnya', isRequired: false, sortOrder: 14, helpText: 'Pengadaan ulang berarti mengganti unit lama yang sudah tidak layak.' },
    { id: 'q-015', questionText: 'Tanggal perkiraan pengiriman (estimasi) kapan?', questionTypeId: 'qt-date', context: 'rks' as const, category: 'Jadwal', isRequired: true, sortOrder: 15, placeholderText: '', helpText: 'Perkiraan tanggal pengiriman dari vendor ke lokasi.' },
  ];

  const questionOptions = [
    { id: 'qopt-001', questionId: 'q-003', optionLabel: 'Barang (Aset Tetap)', sortOrder: 0 },
    { id: 'qopt-002', questionId: 'q-003', optionLabel: 'Jasa Konsultasi', sortOrder: 1 },
    { id: 'qopt-003', questionId: 'q-003', optionLabel: 'Barang Habis Pakai', sortOrder: 2 },
    { id: 'qopt-004', questionId: 'q-003', optionLabel: 'Sewa / Leasing', sortOrder: 3 },
    { id: 'qopt-005', questionId: 'q-004', optionLabel: 'Tender Terbuka', sortOrder: 0 },
    { id: 'qopt-006', questionId: 'q-004', optionLabel: 'Tender Terbatas', sortOrder: 1 },
    { id: 'qopt-007', questionId: 'q-004', optionLabel: 'Penunjukan Langsung', sortOrder: 2 },
    { id: 'qopt-008', questionId: 'q-004', optionLabel: 'E-Purchasing (Katalog)', sortOrder: 3 },
    { id: 'qopt-009', questionId: 'q-005', optionLabel: 'Instalasi / Setting', sortOrder: 0 },
    { id: 'qopt-010', questionId: 'q-005', optionLabel: 'Pelatihan Operator', sortOrder: 1 },
    { id: 'qopt-011', questionId: 'q-005', optionLabel: 'Maintenance Berkala', sortOrder: 2 },
    { id: 'qopt-012', questionId: 'q-005', optionLabel: 'Suku Cadang Awal', sortOrder: 3 },
    { id: 'qopt-013', questionId: 'q-005', optionLabel: 'Dokumentasi Teknis', sortOrder: 4 },
    { id: 'qopt-014', questionId: 'q-009', optionLabel: 'Ya, tersedia', sortOrder: 0 },
    { id: 'qopt-015', questionId: 'q-009', optionLabel: 'Tidak, perlu persiapan', sortOrder: 1 },
    { id: 'qopt-016', questionId: 'q-009', optionLabel: 'Sedang dalam proses', sortOrder: 2 },
    { id: 'qopt-017', questionId: 'q-012', optionLabel: 'APBN / APBD', sortOrder: 0 },
    { id: 'qopt-018', questionId: 'q-012', optionLabel: 'Anggaran Perusahaan (Internal)', sortOrder: 1 },
    { id: 'qopt-019', questionId: 'q-012', optionLabel: 'Kredit Investasi Bank', sortOrder: 2 },
    { id: 'qopt-020', questionId: 'q-012', optionLabel: 'Kerjasama Pihak Ketiga (KSO)', sortOrder: 3 },
    { id: 'qopt-021', questionId: 'q-013', optionLabel: 'KAK (Kerangka Acuan Kerja)', sortOrder: 0 },
    { id: 'qopt-022', questionId: 'q-013', optionLabel: 'RAB (Rencana Anggaran Biaya)', sortOrder: 1 },
    { id: 'qopt-023', questionId: 'q-013', optionLabel: 'Gambar Teknis / Denah', sortOrder: 2 },
    { id: 'qopt-024', questionId: 'q-013', optionLabel: 'Surat Penawaran Vendor', sortOrder: 3 },
    { id: 'qopt-025', questionId: 'q-013', optionLabel: 'Izin / Rekomendasi Terkait', sortOrder: 4 },
    { id: 'qopt-026', questionId: 'q-014', optionLabel: 'Ya, replacement', sortOrder: 0 },
    { id: 'qopt-027', questionId: 'q-014', optionLabel: 'Bukan, pengadaan baru', sortOrder: 1 },
  ];

  for (const q of questions) {
    await prisma.question.upsert({ where: { id: q.id }, update: {}, create: q });
  }
  for (const o of questionOptions) {
    await prisma.questionOption.upsert({ where: { id: o.id }, update: {}, create: o });
  }

  const lossReasons = [
    { id: 'lr-price', name: 'Harga lebih tinggi', code: 'HARGA', category: 'harga' as const },
    { id: 'lr-tech', name: 'Kelemahan teknis', code: 'TEKNIS', category: 'teknis' as const },
    { id: 'lr-admin', name: 'Administrasi tidak lengkap', code: 'ADMIN', category: 'administrasi' as const },
    { id: 'lr-ref', name: 'Referensi kurang', code: 'REFERENSI', category: 'lainnya' as const },
    { id: 'lr-rel', name: 'Relasi kompetitor lebih kuat', code: 'RELASI', category: 'lainnya' as const },
    { id: 'lr-other', name: 'Lainnya', code: 'LAINNYA', category: 'lainnya' as const },
  ];
  for (const l of lossReasons) {
    await prisma.lossReason.upsert({ where: { id: l.id }, update: {}, create: l });
  }

  const projectStatuses = [
    { id: 'ps-prospecting', code: 'prospecting', label: 'Prospecting', colorHex: '#6B7280', textColorHex: '#FFFFFF', sortOrder: 1, isSystem: true, isTerminal: false, applicableTo: 'prospect' },
    { id: 'ps-waiting-supervisor', code: 'waiting_supervisor', label: 'Waiting Supervisor', colorHex: '#F59E0B', textColorHex: '#FFFFFF', sortOrder: 2, isSystem: true, isTerminal: false, applicableTo: 'prospect' },
    { id: 'ps-approved', code: 'approved', label: 'Approved', colorHex: '#10B981', textColorHex: '#FFFFFF', sortOrder: 3, isSystem: true, isTerminal: false, applicableTo: 'prospect' },
    { id: 'ps-rks', code: 'rks', label: 'RKS', colorHex: '#3B82F6', textColorHex: '#FFFFFF', sortOrder: 4, isSystem: true, isTerminal: false, applicableTo: 'project' },
    { id: 'ps-lphs', code: 'lphs', label: 'LPHS/SIOS', colorHex: '#8B5CF6', textColorHex: '#FFFFFF', sortOrder: 5, isSystem: true, isTerminal: false, applicableTo: 'project' },
    { id: 'ps-pricing', code: 'pricing', label: 'Pricing', colorHex: '#EC4899', textColorHex: '#FFFFFF', sortOrder: 6, isSystem: true, isTerminal: false, applicableTo: 'project' },
    { id: 'ps-tender', code: 'tender', label: 'Tender', colorHex: '#F97316', textColorHex: '#FFFFFF', sortOrder: 7, isSystem: true, isTerminal: false, applicableTo: 'project' },
    { id: 'ps-won', code: 'won', label: 'Won', colorHex: '#10B981', textColorHex: '#FFFFFF', sortOrder: 8, isSystem: true, isTerminal: true, applicableTo: 'project' },
    { id: 'ps-lost', code: 'lost', label: 'Lost', colorHex: '#EF4444', textColorHex: '#FFFFFF', sortOrder: 9, isSystem: true, isTerminal: true, applicableTo: 'project' },
    { id: 'ps-cancelled', code: 'cancelled', label: 'Cancelled', colorHex: '#9CA3AF', textColorHex: '#FFFFFF', sortOrder: 10, isSystem: true, isTerminal: true, applicableTo: 'both' },
  ];
  for (const ps of projectStatuses) {
    await prisma.projectStatusDefinition.upsert({ where: { id: ps.id }, update: {}, create: ps });
  }

  // ── CUSTOMERS ───────────────────────────────────────────────────
  const customerData = [
    { id: 'C001', name: 'PT. Telkom Indonesia Tbk.', code: 'TELKOM', type: 'bumn' as const, city: 'Bandung', npwp: '01.234.567.8-091.000', picName: 'Budi Santoso', picPosition: 'Procurement Manager', picPhone: '0812-3456-7890', picEmail: 'budi@telkom.co.id', industryId: 'ind-telekom' },
    { id: 'C002', name: 'PT. Telekom Nusantara', code: 'TELKON', type: 'bumn' as const, city: 'Jakarta Selatan', npwp: '02.345.678.9-092.001', picName: 'Siti Aminah', picPosition: 'IT Director', picPhone: '0813-4567-8901', picEmail: 'siti@telkomnusantara.co.id', industryId: 'ind-telekom' },
    { id: 'C003', name: 'Energi Bangsa Corp', code: 'EBC', type: 'swasta' as const, city: 'Jakarta Pusat', picName: 'Rizky Pratama', picPosition: 'CEO', picPhone: '0814-5678-9012', picEmail: 'rizky@ebc.co.id', industryId: 'ind-energy' },
    { id: 'C004', name: 'Secure City Group', code: 'SCG', type: 'swasta' as const, city: 'Jakarta Timur', picName: 'Dian Permata', picPosition: 'Security Manager', picPhone: '0815-6789-0123', industryId: 'ind-telekom' },
    { id: 'C005', name: 'Pemerintah Provinsi DKI Jakarta', code: 'PEMDKI', type: 'pemerintah' as const, city: 'Jakarta Pusat', picName: 'Bambang Sutejo', picPosition: 'Kepala Dinas', picPhone: '021-1234567', industryId: 'ind-government' },
    { id: 'C006', name: 'Global Tech Solutions', code: 'GTS', type: 'asing' as const, city: 'Jakarta Selatan', npwp: '04.567.890.1-094.003', picName: 'John Smith', picPosition: 'Regional Manager', picPhone: '0817-8901-2345', industryId: 'ind-telekom' },
  ];
  for (const c of customerData) {
    await prisma.customer.upsert({ where: { id: c.id }, update: {}, create: c as any });
  }

  // ── PROSPECTS ───────────────────────────────────────────────────
  const prospectData = [
    { id: 'prosp-1', name: 'Data Center Modernization', client: 'PT. Telekom Nusantara', customerId: 'C002', status: 'Potensial' as const, potensiUnit: 3, estimatedValue: 1250000000, branch: 'Jakarta Pusat', branchId: branchJkt.id, createdByUserId: 'user-1', departmentId: deptMarketing.id, currentStageId: 'stage-prospecting', ownerUserId: 'user-1' },
    { id: 'prosp-2', name: 'High-Voltage Cable Supply', client: 'Energi Bangsa Corp', customerId: 'C003', status: 'Approved' as const, potensiUnit: 5, estimatedValue: 3400000000, branch: 'Bandung', branchId: branchBdg.id, createdByUserId: 'user-1', departmentId: deptMarketing.id, currentStageId: 'stage-prospecting', ownerUserId: 'user-1' },
    { id: 'prosp-3', name: 'Surveillance System Phase 2', client: 'Secure City Group', customerId: 'C004', status: 'Waiting_Supervisor' as const, potensiUnit: 2, estimatedValue: 850000000, branch: 'Jakarta Pusat', branchId: branchJkt.id, createdByUserId: 'user-2', departmentId: deptPM.id, currentStageId: 'stage-supervisor-review', ownerUserId: 'user-2' },
  ];
  for (const p of prospectData) {
    await prisma.prospect.upsert({ where: { id: p.id }, update: {}, create: p as any });
  }

  // ── PROJECTS ────────────────────────────────────────────────────
  const projectData = [
    {
      id: 'PR-2025-001', code: 'PR-2025-001', name: 'Pembangunan Infrastruktur Data Center - Tahap II',
      client: 'PT. Telkom Indonesia Tbk.', type: 'tender' as const, location: 'Gatot Subroto, Jakarta',
      status: 'lphs', phase: 'LPHS/SIOS', progress: 65, estimatedValue: 4250000000, deadlineTender: new Date('2026-06-25'),
      branch: 'Jakarta Pusat', branchId: branchJkt.id, departmentId: deptPM.id, categoryId: 'cat-infra',
      createdByUserId: 'user-2', ownerUserId: 'user-2', author: 'Bambang Permadi', date: new Date('2025-02-24'),
      currentStageId: 'stage-lphs',
    },
    {
      id: 'PR-2025-002', code: 'PR-2025-002', name: 'Network Infrastructure Upgrade - Pemerintah Provinsi DKI',
      client: 'Pemerintah Provinsi DKI Jakarta', type: 'tender' as const, location: 'Balai Kota, Jakarta',
      status: 'rks', phase: 'RKS', progress: 30, estimatedValue: 2800000000, deadlineTender: new Date('2026-08-15'),
      branch: 'Jakarta Pusat', branchId: branchJkt.id, departmentId: deptPM.id, categoryId: 'cat-it',
      createdByUserId: 'user-2', ownerUserId: 'user-2', author: 'Bambang Permadi', date: new Date('2025-03-10'),
      currentStageId: 'stage-rks',
    },
  ];
  for (const p of projectData) {
    await prisma.project.upsert({ where: { id: p.id }, update: {}, create: p as any });
  }

  // ── RKS ─────────────────────────────────────────────────────────
  await prisma.rks.upsert({
    where: { id: 'rks-1' },
    update: {},
    create: {
      id: 'rks-1', projectId: 'PR-2025-002',
      nomorTender: 'TND/2025/HQ/0043', namaTender: 'Network Infrastructure Upgrade - Pemerintah Provinsi DKI',
      deadlineTender: new Date('2026-08-15'), aanwijzing: 'Ya, Terjadwal', workLocation: 'Balai Kota, Jakarta',
      mainScope: 'Pengadaan dan instalasi perangkat jaringan fiber optic, switch, router, dan firewall untuk 20 titik kantor wilayah.',
      additionalNotes: 'Perhatikan persyaratan TKDN minimal 40%.', status: 'draft',
    },
  });

  // ── LPHS ────────────────────────────────────────────────────────
  await prisma.lphsSios.upsert({
    where: { id: 'lphs-1' },
    update: {},
    create: {
      id: 'lphs-1', projectId: 'PR-2025-001',
      status: 'draft', lphsFileName: 'LPHS_Telkom_v2.pdf', lphsFileSize: '3.4 MB',
      siosFileName: 'SIOS_Infra_TahapII.pdf', siosFileSize: '1.2 MB',
      selectedDepartments: JSON.stringify([deptIT.id, deptFinance.id]),
      pmApprovalStatus: 'approved', pmApprovedAt: new Date('2025-03-10'), pmApprovedBy: 'user-2',
      mgmtApprovalStatus: 'reviewing', overallStatus: 'dept_review', submittedAt: new Date('2025-03-08'),
    },
  });

  // ── PRICE SUBMISSION ────────────────────────────────────────────
  await prisma.priceSubmission.upsert({
    where: { id: 'price-1' },
    update: {},
    create: {
      id: 'price-1', projectId: 'PR-2025-001',
      ourPrice: 4250000000, marginPercentage: 18.4, submittedBy: 'user-2',
      note: 'Harga penawaran sudah termasuk biaya perizinan lingkungan.',
      referenceUrl: 'https://kinetic.sharepoint.com/projects/prj-2025-001/internal-calc',
    },
  });

  // ── PROJECT MEMBERS ─────────────────────────────────────────────
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: 'PR-2025-001', userId: 'user-2' } },
    update: {},
    create: { projectId: 'PR-2025-001', userId: 'user-2', roleId: 'role-pm', departmentId: deptPM.id, assignedBy: 'user-1' },
  });

  // ── INPUT CONFIG GROUPS ─────────────────────────────────────────
  const inputConfigGroups = [
    { id: 'icg-customer-types', key: 'customer_types', name: 'Tipe Pelanggan', description: 'Klasifikasi tipe pelanggan', category: 'form' as const, isSystem: true },
    { id: 'icg-project-types', key: 'project_types', name: 'Tipe Proyek', description: 'Klasifikasi jenis proyek / pengadaan', category: 'form' as const, isSystem: true },
    { id: 'icg-escalation-roles', key: 'escalation_roles', name: 'Peran Eskalasi SLA', description: 'Role yang menerima notifikasi eskalasi SLA', category: 'sla' as const, isSystem: true },
    { id: 'icg-sla-entity-types', key: 'sla_entity_types', name: 'Tipe Entitas SLA', description: 'Entitas yang dapat dikaitkan dengan SLA', category: 'sla' as const, isSystem: true },
    { id: 'icg-sla-units', key: 'sla_units', name: 'Satuan SLA', description: 'Satuan waktu untuk perhitungan SLA', category: 'sla' as const, isSystem: true },
    { id: 'icg-prospect-filter-tabs', key: 'prospect_filter_tabs', name: 'Tab Filter Prospek', description: 'Tab filter pada halaman daftar prospek', category: 'filter' as const, isSystem: true },
    { id: 'icg-pipeline-tabs', key: 'pipeline_tabs', name: 'Tab Pipeline', description: 'Tab filter pada halaman pipeline proyek', category: 'filter' as const, isSystem: true },
    { id: 'icg-account-statuses', key: 'account_statuses', name: 'Status Akun', description: 'Status akun pengguna', category: 'filter' as const, isSystem: true },
    { id: 'icg-workflow-entity-tabs', key: 'workflow_entity_tabs', name: 'Tab Entitas Workflow', description: 'Tab filter pada halaman konfigurasi workflow', category: 'workflow' as const, isSystem: true },
  ];
  for (const g of inputConfigGroups) {
    await prisma.inputConfigGroup.upsert({ where: { id: g.id }, update: {}, create: g });
  }

  const inputConfigOptions = [
    // ── customer_types ──
    { id: 'ico-ct-1', groupId: 'icg-customer-types', value: 'swasta', label: 'Swasta', sortOrder: 1, colorHex: '#3B82F6' },
    { id: 'ico-ct-2', groupId: 'icg-customer-types', value: 'bumn', label: 'BUMN / BUMD', sortOrder: 2, colorHex: '#10B981' },
    { id: 'ico-ct-3', groupId: 'icg-customer-types', value: 'pemerintah', label: 'Pemerintah', sortOrder: 3, colorHex: '#F59E0B' },
    { id: 'ico-ct-4', groupId: 'icg-customer-types', value: 'asing', label: 'Asing', sortOrder: 4, colorHex: '#8B5CF6' },
    // ── project_types ──
    { id: 'ico-pt-1', groupId: 'icg-project-types', value: 'tender', label: 'Tender', sortOrder: 1, colorHex: '#EF4444' },
    { id: 'ico-pt-2', groupId: 'icg-project-types', value: 'prospecting', label: 'Prospecting', sortOrder: 2, colorHex: '#3B82F6' },
    { id: 'ico-pt-3', groupId: 'icg-project-types', value: 'pengadaan_langsung', label: 'Pengadaan Langsung', sortOrder: 3, colorHex: '#10B981' },
    { id: 'ico-pt-4', groupId: 'icg-project-types', value: 'lelang', label: 'Lelang Umum', sortOrder: 4, colorHex: '#F59E0B' },
    { id: 'ico-pt-5', groupId: 'icg-project-types', value: 'swakelola', label: 'Swakelola', sortOrder: 5, colorHex: '#8B5CF6' },
    // ── escalation_roles ──
    { id: 'ico-er-1', groupId: 'icg-escalation-roles', value: 'pm', label: 'Project Manager', sortOrder: 1 },
    { id: 'ico-er-2', groupId: 'icg-escalation-roles', value: 'branch_manager', label: 'Branch Manager', sortOrder: 2 },
    { id: 'ico-er-3', groupId: 'icg-escalation-roles', value: 'dir_teknik', label: 'Direktur Teknik', sortOrder: 3 },
    { id: 'ico-er-4', groupId: 'icg-escalation-roles', value: 'dir_keuangan', label: 'Direktur Keuangan', sortOrder: 4 },
    { id: 'ico-er-5', groupId: 'icg-escalation-roles', value: 'super_admin', label: 'Super Admin', sortOrder: 5 },
    // ── sla_entity_types ──
    { id: 'ico-set-1', groupId: 'icg-sla-entity-types', value: 'prospek', label: 'Prospek', sortOrder: 1 },
    { id: 'ico-set-2', groupId: 'icg-sla-entity-types', value: 'rks', label: 'RKS', sortOrder: 2 },
    { id: 'ico-set-3', groupId: 'icg-sla-entity-types', value: 'lphs', label: 'LPHS', sortOrder: 3 },
    { id: 'ico-set-4', groupId: 'icg-sla-entity-types', value: 'pengadaan', label: 'Pengadaan', sortOrder: 4 },
    // ── sla_units ──
    { id: 'ico-su-1', groupId: 'icg-sla-units', value: 'jam', label: 'Jam', sortOrder: 1 },
    { id: 'ico-su-2', groupId: 'icg-sla-units', value: 'hari', label: 'Hari', sortOrder: 2 },
    { id: 'ico-su-3', groupId: 'icg-sla-units', value: 'minggu', label: 'Minggu', sortOrder: 3 },
    { id: 'ico-su-4', groupId: 'icg-sla-units', value: 'bulan', label: 'Bulan', sortOrder: 4 },
    // ── prospect_filter_tabs ──
    { id: 'ico-pft-1', groupId: 'icg-prospect-filter-tabs', value: 'all', label: 'Semua', sortOrder: 1 },
    { id: 'ico-pft-2', groupId: 'icg-prospect-filter-tabs', value: 'my_prospects', label: 'Prospek Saya', sortOrder: 2 },
    { id: 'ico-pft-3', groupId: 'icg-prospect-filter-tabs', value: 'recent', label: 'Terbaru', sortOrder: 3 },
    { id: 'ico-pft-4', groupId: 'icg-prospect-filter-tabs', value: 'needs_review', label: 'Perlu Review', sortOrder: 4 },
    { id: 'ico-pft-5', groupId: 'icg-prospect-filter-tabs', value: 'won', label: 'Menang', sortOrder: 5 },
    { id: 'ico-pft-6', groupId: 'icg-prospect-filter-tabs', value: 'lost', label: 'Hilang', sortOrder: 6 },
    // ── pipeline_tabs ──
    { id: 'ico-pl-1', groupId: 'icg-pipeline-tabs', value: 'all', label: 'Semua', sortOrder: 1 },
    { id: 'ico-pl-2', groupId: 'icg-pipeline-tabs', value: 'prospecting', label: 'Prospecting', sortOrder: 2 },
    { id: 'ico-pl-3', groupId: 'icg-pipeline-tabs', value: 'tender', label: 'Tender', sortOrder: 3 },
    { id: 'ico-pl-4', groupId: 'icg-pipeline-tabs', value: 'negotiation', label: 'Negosiasi', sortOrder: 4 },
    { id: 'ico-pl-5', groupId: 'icg-pipeline-tabs', value: 'won', label: 'Menang', sortOrder: 5 },
    { id: 'ico-pl-6', groupId: 'icg-pipeline-tabs', value: 'lost', label: 'Hilang', sortOrder: 6 },
    // ── account_statuses ──
    { id: 'ico-as-1', groupId: 'icg-account-statuses', value: 'active', label: 'Aktif', sortOrder: 1, colorHex: '#10B981' },
    { id: 'ico-as-2', groupId: 'icg-account-statuses', value: 'inactive', label: 'Non-Aktif', sortOrder: 2, colorHex: '#EF4444' },
    { id: 'ico-as-3', groupId: 'icg-account-statuses', value: 'suspended', label: 'Ditangguhkan', sortOrder: 3, colorHex: '#F59E0B' },
    // ── workflow_entity_tabs ──
    { id: 'ico-wet-1', groupId: 'icg-workflow-entity-tabs', value: 'prospek', label: 'Prospek', sortOrder: 1 },
    { id: 'ico-wet-2', groupId: 'icg-workflow-entity-tabs', value: 'rks', label: 'RKS', sortOrder: 2 },
    { id: 'ico-wet-3', groupId: 'icg-workflow-entity-tabs', value: 'lphs', label: 'LPHS', sortOrder: 3 },
  ];
  for (const o of inputConfigOptions) {
    await prisma.inputConfigOption.upsert({ where: { id: o.id }, update: {}, create: o });
  }

  console.log('Seed completed successfully!');
  console.log('Login credentials:');
  console.log('  superadmin / admin123  (Super Admin - full access)');
  console.log('  bambang   / admin123  (PM)');
  console.log('  rina      / admin123  (Branch Manager)');
  console.log('  deni      / staff123  (Staff - Finance)');
  console.log('  siti      / staff123  (Staff - Procurement)');
  console.log('  ahmad     / staff123  (Staff - PM)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
