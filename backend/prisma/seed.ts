import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

const ROLES = [
  { code: 'admin', name: 'Administrator' },
  { code: 'management', name: 'Management' },
  { code: 'pm', name: 'Project Manager' },
  { code: 'department', name: 'Reviewer Departemen' },
  { code: 'cabang', name: 'Staf Cabang' },
];

const PERMISSIONS = [
  { code: 'prospects.read', resource: 'prospects', action: 'read', label: 'Lihat Prospek' },
  { code: 'prospects.create', resource: 'prospects', action: 'create', label: 'Buat Prospek' },
  { code: 'prospects.update', resource: 'prospects', action: 'update', label: 'Ubah Prospek' },
  { code: 'prospects.delete', resource: 'prospects', action: 'delete', label: 'Hapus Prospek' },
  { code: 'prospects.submit', resource: 'prospects', action: 'submit', label: 'Submit Prospek' },
  { code: 'prospects.approve', resource: 'prospects', action: 'approve', label: 'Setujui Prospek' },
  { code: 'prospects.reject', resource: 'prospects', action: 'reject', label: 'Tolak Prospek' },

  { code: 'projects.read', resource: 'projects', action: 'read', label: 'Lihat Proyek' },
  { code: 'projects.create', resource: 'projects', action: 'create', label: 'Buat Proyek' },
  { code: 'projects.update', resource: 'projects', action: 'update', label: 'Ubah Proyek' },
  { code: 'projects.cancel', resource: 'projects', action: 'cancel', label: 'Batalkan Proyek' },

  { code: 'projects.rks.read', resource: 'projects', action: 'rks.read', label: 'Lihat RKS' },
  { code: 'projects.rks.update', resource: 'projects', action: 'rks.update', label: 'Ubah RKS' },
  { code: 'projects.rks.submit', resource: 'projects', action: 'rks.submit', label: 'Submit RKS' },
  { code: 'projects.rks.approve', resource: 'projects', action: 'rks.approve', label: 'Setujui RKS' },
  { code: 'projects.rks.reject', resource: 'projects', action: 'rks.reject', label: 'Tolak RKS' },

  { code: 'projects.lphs.read', resource: 'projects', action: 'lphs.read', label: 'Lihat LPHS/SIOS' },
  { code: 'projects.lphs.update', resource: 'projects', action: 'lphs.update', label: 'Ubah LPHS/SIOS' },
  { code: 'projects.lphs.submit', resource: 'projects', action: 'lphs.submit', label: 'Submit LPHS/SIOS' },
  { code: 'projects.lphs.approve', resource: 'projects', action: 'lphs.approve', label: 'Setujui LPHS/SIOS' },

  { code: 'approvals.read', resource: 'approvals', action: 'read', label: 'Lihat Approval' },
  { code: 'approvals.approve', resource: 'approvals', action: 'approve', label: 'Setujui' },
  { code: 'approvals.reject', resource: 'approvals', action: 'reject', label: 'Tolak' },
  { code: 'approvals.revise', resource: 'approvals', action: 'revise', label: 'Revisi' },
  { code: 'approvals.reassign', resource: 'approvals', action: 'reassign', label: 'Alihkan Approval' },

  { code: 'reports.read', resource: 'reports', action: 'read', label: 'Lihat Laporan' },
  { code: 'reports.export', resource: 'reports', action: 'export', label: 'Ekspor Laporan' },

  { code: 'kpi.read', resource: 'kpi', action: 'read', label: 'Lihat KPI' },
  { code: 'kpi.update', resource: 'kpi', action: 'update', label: 'Ubah KPI' },

  { code: 'config.org.read', resource: 'config', action: 'org.read', label: 'Lihat Organisasi' },
  { code: 'config.org.update', resource: 'config', action: 'org.update', label: 'Ubah Organisasi' },
  { code: 'config.roles.read', resource: 'config', action: 'roles.read', label: 'Lihat Role' },
  { code: 'config.roles.update', resource: 'config', action: 'roles.update', label: 'Ubah Role' },

  { code: 'admin.users.read', resource: 'admin', action: 'users.read', label: 'Lihat Pengguna' },
  { code: 'admin.users.create', resource: 'admin', action: 'users.create', label: 'Buat Pengguna' },
  { code: 'admin.users.update', resource: 'admin', action: 'users.update', label: 'Ubah Pengguna' },
  { code: 'admin.users.deactivate', resource: 'admin', action: 'users.deactivate', label: 'Nonaktifkan Pengguna' },

  { code: 'documents.read', resource: 'documents', action: 'read', label: 'Lihat Dokumen' },
  { code: 'documents.upload', resource: 'documents', action: 'upload', label: 'Unggah Dokumen' },
  { code: 'documents.download', resource: 'documents', action: 'download', label: 'Unduh Dokumen' },

  { code: 'notifications.read', resource: 'notifications', action: 'read', label: 'Lihat Notifikasi' },

  { code: 'audit.read', resource: 'audit', action: 'read', label: 'Lihat Audit Log' },

  { code: 'dashboard.read', resource: 'dashboard', action: 'read', label: 'Lihat Dashboard' },
  { code: 'ai:access', resource: 'ai', action: 'access', label: 'Akses AI' },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: PERMISSIONS.map((p) => p.code),
  management: [
    'dashboard.read',
    'prospects.read', 'projects.read', 'projects.create', 'projects.update',
    'projects.rks.read', 'projects.lphs.read',
    'approvals.read', 'approvals.approve', 'approvals.reject',
    'reports.read', 'reports.export',
    'kpi.read',
    'documents.read', 'notifications.read', 'audit.read',
  ],
  pm: [
    'dashboard.read',
    'prospects.read', 'prospects.create', 'prospects.update', 'prospects.submit',
    'projects.read', 'projects.create', 'projects.update', 'projects.cancel',
    'projects.rks.read', 'projects.rks.update', 'projects.rks.submit',
    'projects.lphs.read', 'projects.lphs.update', 'projects.lphs.submit',
    'approvals.read', 'approvals.approve', 'approvals.reject', 'approvals.revise',
    'reports.read', 'reports.export',
    'kpi.read', 'kpi.update',
    'documents.read', 'documents.upload', 'documents.download',
    'notifications.read',
  ],
  department: [
    'dashboard.read',
    'prospects.read', 'projects.read',
    'projects.rks.read', 'projects.lphs.read', 'projects.lphs.update', 'projects.lphs.approve',
    'approvals.read', 'approvals.approve', 'approvals.reject', 'approvals.revise',
    'reports.read',
    'kpi.read',
    'documents.read', 'documents.upload', 'documents.download',
    'notifications.read',
  ],
  cabang: [
    'prospects.read', 'prospects.create', 'prospects.update', 'prospects.submit',
    'projects.read', 'projects.create', 'projects.update',
    'projects.rks.read', 'projects.rks.update', 'projects.rks.submit',
    'projects.lphs.read', 'projects.lphs.update',
    'reports.read',
    'documents.read', 'documents.upload', 'documents.download',
    'notifications.read',
  ],
};

async function main() {
  console.log('Seeding database...');

  // 1. Seed Roles
  const roleMap: Record<string, string> = {};
  for (const role of ROLES) {
    const existing = await prisma.role.findUnique({ where: { code: role.code } });
    if (existing) {
      roleMap[role.code] = existing.id;
    } else {
      const created = await prisma.role.create({
        data: { ...role, id: uuidv4(), isSystemDefault: true },
      });
      roleMap[role.code] = created.id;
    }
  }
  console.log(`  Seeded ${ROLES.length} roles`);

  // 2. Seed Permissions
  const permMap: Record<string, string> = {};
  for (const perm of PERMISSIONS) {
    const existing = await prisma.permission.findUnique({ where: { code: perm.code } });
    if (existing) {
      permMap[perm.code] = existing.id;
    } else {
      const created = await prisma.permission.create({
        data: { ...perm, id: uuidv4() },
      });
      permMap[perm.code] = created.id;
    }
  }
  console.log(`  Seeded ${PERMISSIONS.length} permissions`);

  // 3. Seed Role-Permission mappings
  let rpCount = 0;
  for (const [roleCode, permCodes] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleMap[roleCode];
    for (const permCode of permCodes) {
      const permissionId = permMap[permCode];
      if (!permissionId) continue;

      const existing = await prisma.rolePermission.findFirst({
        where: { roleId, permissionId },
      });
      if (!existing) {
        await prisma.rolePermission.create({
          data: { id: uuidv4(), roleId, permissionId },
        });
        rpCount++;
      }
    }
  }
  console.log(`  Seeded ${rpCount} role-permission mappings`);

  // 4. Seed Admin User
  const adminUsername = 'admin';
  const existingAdmin = await prisma.user.findUnique({ where: { username: adminUsername } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin123!', BCRYPT_ROUNDS);
    await prisma.user.create({
      data: {
        id: uuidv4(),
        name: 'Administrator',
        username: adminUsername,
        email: 'admin@kinetic-crm.com',
        passwordHash,
        roleId: roleMap['admin'],
        isActive: true,
        isLocked: false,
        mustChangePassword: false,
      },
    });
    console.log('  Seeded admin user (admin / Admin123!)');
  } else {
    console.log('  Admin user already exists, skipping');
  }

  // 5. Seed Project Categories
  const categories = [
    { name: 'IT Infrastructure', requiresLphs: true },
    { name: 'Telecommunication', requiresLphs: true },
    { name: 'Security System', requiresLphs: false },
    { name: 'Network & Connectivity', requiresLphs: true },
    { name: 'Data Center', requiresLphs: true },
    { name: 'IoT & Smart Systems', requiresLphs: false },
  ];
  const categoryMap: Record<string, string> = {};
  for (const cat of categories) {
    const existing = await prisma.projectCategory.findUnique({ where: { name: cat.name } });
    if (existing) {
      categoryMap[cat.name] = existing.id;
    } else {
      const created = await prisma.projectCategory.create({ data: { ...cat, id: uuidv4() } });
      categoryMap[cat.name] = created.id;
    }
  }
  console.log(`  Seeded ${categories.length} project categories`);

  // 6. Seed Project Status Definitions
  const statuses = [
    { code: 'created', label: 'Dibuat', color: '#6B7280', displayOrder: 1, isTerminal: false },
    { code: 'submit_rks', label: 'RKS Disubmit', color: '#2563A8', displayOrder: 2, isTerminal: false },
    { code: 'review_department', label: 'Review Departemen', color: '#7C3AED', displayOrder: 3, isTerminal: false },
    { code: 'lphs_sios', label: 'LPHS/SIOS', color: '#4338CA', displayOrder: 4, isTerminal: false },
    { code: 'revision', label: 'Revisi', color: '#D97706', displayOrder: 5, isTerminal: false },
    { code: 'submit_harga', label: 'Input Harga', color: '#0D9488', displayOrder: 6, isTerminal: false },
    { code: 'pengumuman_pemenang', label: 'Pengumuman Pemenang', color: '#EA580C', displayOrder: 7, isTerminal: false },
    { code: 'target_delivery', label: 'Target Delivery', color: '#0284C7', displayOrder: 8, isTerminal: false },
    { code: 'selesai', label: 'Selesai', color: '#16A34A', displayOrder: 9, isTerminal: true },
    { code: 'cancelled', label: 'Dibatalkan', color: '#9F1239', displayOrder: 10, isTerminal: true },
  ];
  const statusMap: Record<string, string> = {};
  for (const st of statuses) {
    const existing = await prisma.projectStatusDefinition.findUnique({ where: { code: st.code } });
    if (existing) {
      statusMap[st.code] = existing.id;
    } else {
      const created = await prisma.projectStatusDefinition.create({ data: { ...st, id: uuidv4() } });
      statusMap[st.code] = created.id;
    }
  }
  console.log(`  Seeded ${statuses.length} project status definitions`);

  // 7. Seed Period Definitions
  const periods = [
    { name: 'Q1 2025', startDate: new Date('2025-01-01'), endDate: new Date('2025-03-31'), isClosed: true },
    { name: 'Q2 2025', startDate: new Date('2025-04-01'), endDate: new Date('2025-06-30'), isClosed: true },
    { name: 'Q3 2025', startDate: new Date('2025-07-01'), endDate: new Date('2025-09-30'), isClosed: false },
    { name: 'Q4 2025', startDate: new Date('2025-10-01'), endDate: new Date('2025-12-31'), isClosed: false },
    { name: 'H1 2025', startDate: new Date('2025-01-01'), endDate: new Date('2025-06-30'), isClosed: true },
    { name: 'H2 2025', startDate: new Date('2025-07-01'), endDate: new Date('2025-12-31'), isClosed: false },
    { name: 'FY 2025', startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31'), isClosed: false },
    { name: 'Q1 2026', startDate: new Date('2026-01-01'), endDate: new Date('2026-03-31'), isClosed: false },
    { name: 'Q2 2026', startDate: new Date('2026-04-01'), endDate: new Date('2026-06-30'), isClosed: false },
    { name: 'H1 2026', startDate: new Date('2026-01-01'), endDate: new Date('2026-06-30'), isClosed: false },
  ];
  for (const p of periods) {
    const existing = await prisma.periodDefinition.findFirst({ where: { name: p.name } });
    if (!existing) {
      await prisma.periodDefinition.create({ data: { ...p, id: uuidv4() } });
    }
  }
  console.log(`  Seeded ${periods.length} period definitions`);

  // 8. Seed Holidays (Indonesian national holidays 2025-2026)
  const holidays = [
    { date: new Date('2025-01-01'), description: 'Tahun Baru Masehi', isRecurringAnnually: true },
    { date: new Date('2025-01-27'), description: 'Isra Miraj', isRecurringAnnually: false },
    { date: new Date('2025-03-31'), description: 'Hari Raya Idul Fitri', isRecurringAnnually: false },
    { date: new Date('2025-04-01'), description: 'Hari Raya Idul Fitri', isRecurringAnnually: false },
    { date: new Date('2025-04-18'), description: 'Wafat Isa Almasih', isRecurringAnnually: true },
    { date: new Date('2025-05-01'), description: 'Hari Buruh Internasional', isRecurringAnnually: true },
    { date: new Date('2025-05-12'), description: 'Hari Raya Waisak', isRecurringAnnually: false },
    { date: new Date('2025-05-29'), description: 'Kenaikan Isa Almasih', isRecurringAnnually: true },
    { date: new Date('2025-06-01'), description: 'Hari Lahir Pancasila', isRecurringAnnually: true },
    { date: new Date('2025-06-07'), description: 'Idul Adha', isRecurringAnnually: false },
    { date: new Date('2025-08-17'), description: 'Hari Kemerdekaan RI', isRecurringAnnually: true },
    { date: new Date('2025-12-25'), description: 'Hari Raya Natal', isRecurringAnnually: true },
    { date: new Date('2026-01-01'), description: 'Tahun Baru Masehi', isRecurringAnnually: true },
    { date: new Date('2026-03-21'), description: 'Hari Raya Idul Fitri', isRecurringAnnually: false },
    { date: new Date('2026-03-22'), description: 'Hari Raya Idul Fitri', isRecurringAnnually: false },
    { date: new Date('2026-05-01'), description: 'Hari Buruh Internasional', isRecurringAnnually: true },
    { date: new Date('2026-05-21'), description: 'Kenaikan Isa Almasih', isRecurringAnnually: true },
    { date: new Date('2026-06-01'), description: 'Hari Lahir Pancasila', isRecurringAnnually: true },
    { date: new Date('2026-08-17'), description: 'Hari Kemerdekaan RI', isRecurringAnnually: true },
    { date: new Date('2026-12-25'), description: 'Hari Raya Natal', isRecurringAnnually: true },
  ];
  for (const h of holidays) {
    const existing = await prisma.holiday.findUnique({ where: { date: h.date } });
    if (!existing) {
      await prisma.holiday.create({ data: { ...h, id: uuidv4() } });
    }
  }
  console.log(`  Seeded ${holidays.length} holidays`);

  // 9. Seed Loss Reasons
  const lossReasons = [
    { code: 'HARGA_TERLALU_TINGGI', label: 'Harga Penawaran Terlalu Tinggi' },
    { code: 'HARGA_TIDAK_KOMPETITIF', label: 'Harga Tidak Kompetitif vs Kompetitor' },
    { code: 'SPESIFIKASI_TEKNIS', label: 'Tidak Memenuhi Spesifikasi Teknis' },
    { code: 'PENGALAMAN_KURANG', label: 'Pengalaman / Track Record Kurang' },
    { code: 'RELASI_KOMPETITOR', label: 'Kompetitor Memiliki Hubungan Lebih Baik dengan Client' },
    { code: 'EVALUASI_ADMIN', label: 'Tidak Lulus Evaluasi Administrasi' },
    { code: 'DOK_TIDAK_LENGKAP', label: 'Dokumen Tidak Lengkap' },
    { code: 'KETERLAMBATAN', label: 'Keterlambatan Pengiriman Dokumen' },
    { code: 'BATALKAN_CLIENT', label: 'Tender Dibatalkan oleh Client' },
    { code: 'TIDAK_DIKETAHUI', label: 'Alasan Tidak Diketahui' },
    { code: 'LAINNYA', label: 'Alasan Lain (isi keterangan)' },
  ];
  for (const lr of lossReasons) {
    const existing = await prisma.lossReason.findUnique({ where: { code: lr.code } });
    if (!existing) {
      await prisma.lossReason.create({ data: { ...lr, id: uuidv4() } });
    }
  }
  console.log(`  Seeded ${lossReasons.length} loss reasons`);

  // 10. Seed Notification Templates
  const notifTemplates = [
    { eventCode: 'prospect.submitted', templateText: 'Prospek {{prospectName}} telah disubmit oleh {{cabangName}}. Mohon direview.', channel: 'in_app' },
    { eventCode: 'prospect.revision_sent', templateText: 'PM meminta revisi untuk prospek {{prospectName}}. Silakan lengkapi.', channel: 'in_app' },
    { eventCode: 'prospect.approved', templateText: 'Prospek {{prospectName}} telah disetujui. Silakan konversi ke proyek.', channel: 'in_app' },
    { eventCode: 'project.created', templateText: 'Proyek baru {{projectName}} telah dibuat.', channel: 'in_app' },
    { eventCode: 'project.rks_submitted', templateText: 'RKS untuk proyek {{projectName}} telah disubmit.', channel: 'in_app' },
    { eventCode: 'project.rks_approved', templateText: 'RKS untuk proyek {{projectName}} telah disetujui.', channel: 'in_app' },
    { eventCode: 'project.lphs_dept_requested', templateText: 'Review LPHS/SIOS untuk proyek {{projectName}} diminta.', channel: 'in_app' },
    { eventCode: 'project.lphs_dept_approved', templateText: 'Departemen telah menyetujui LPHS/SIOS proyek {{projectName}}.', channel: 'in_app' },
    { eventCode: 'project.lphs_pm_approved', templateText: 'PM telah menyetujui LPHS/SIOS proyek {{projectName}}.', channel: 'in_app' },
    { eventCode: 'project.winner_inputted_win', templateText: 'Proyek {{projectName}} dinyatakan MENANG.', channel: 'in_app' },
    { eventCode: 'project.winner_inputted_lose', templateText: 'Proyek {{projectName}} dinyatakan KALAH.', channel: 'in_app' },
    { eventCode: 'project.cancelled', templateText: 'Proyek {{projectName}} telah dibatalkan.', channel: 'in_app' },
    { eventCode: 'project.deadline_approaching', templateText: 'Deadline tender proyek {{projectName}} tinggal {{daysLeft}} hari lagi.', channel: 'in_app' },
    { eventCode: 'approval.sla_warning', templateText: 'SLA approval untuk {{resourceType}} mendekati batas. Segera ditindaklanjuti.', channel: 'in_app' },
    { eventCode: 'approval.sla_overdue', templateText: 'SLA approval untuk {{resourceType}} telah terlampaui!', channel: 'in_app' },
    { eventCode: 'approval.escalated', templateText: 'Approval untuk {{resourceType}} telah dieskalasi ke level lebih tinggi.', channel: 'in_app' },
    { eventCode: 'approval.reassigned', templateText: 'Approval untuk {{resourceType}} telah dialihkan ke {{newAssignee}}.', channel: 'in_app' },
  ];
  for (const nt of notifTemplates) {
    const existing = await prisma.notificationTemplate.findUnique({ where: { eventCode: nt.eventCode } });
    if (!existing) {
      await prisma.notificationTemplate.create({ data: { ...nt, id: uuidv4() } });
    }
  }
  console.log(`  Seeded ${notifTemplates.length} notification templates`);

  // 11. Seed Sample SLA Configs (for approval stages)
  const stages = await prisma.approvalWorkflowStage.findMany();
  if (stages.length === 0) {
    const approvalRoleId = roleMap['pm'];
    const sampleStages = [
      { stageCode: 'rks_approval', label: 'RKS Approval', approverRoleId: approvalRoleId, displayOrder: 1 },
      { stageCode: 'lphs_pm_approval', label: 'LPHS PM Approval', approverRoleId: approvalRoleId, displayOrder: 2 },
      { stageCode: 'lphs_dept_review', label: 'LPHS Department Review', approverRoleId: roleMap['department'], displayOrder: 3 },
      { stageCode: 'lphs_final_approval', label: 'LPHS Final Approval', approverRoleId: roleMap['management'], displayOrder: 4 },
    ];
    for (const st of sampleStages) {
      const created = await prisma.approvalWorkflowStage.create({ data: { ...st, id: uuidv4() } });
      const existingSla = await prisma.slaConfiguration.findUnique({ where: { stageId: created.id } });
      if (!existingSla) {
        await prisma.slaConfiguration.create({ data: { id: uuidv4(), stageId: created.id, slaWorkingDays: 5, isEnforcementActive: true } });
      }
    }
    console.log('  Seeded sample SLA configs');
  } else {
    console.log('  Approval stages already exist, skipping SLA configs');
  }

  // 12. Seed Company
  const companyId = await (async () => {
    const existing = await prisma.company.findUnique({ where: { name: 'PT Kinetic Solusi Integrasi' } });
    if (existing) return existing.id;
    const c = await prisma.company.create({
      data: { id: uuidv4(), name: 'PT Kinetic Solusi Integrasi', address: 'Jl. Sudirman No. 123, Jakarta Pusat', isActive: true },
    });
    console.log('  Seeded company: PT Kinetic Solusi Integrasi');
    return c.id;
  })();

  // 13. Seed Divisions
  const divisionData = [
    { name: 'Divisi Infrastruktur', code: 'INF' },
    { name: 'Divisi Teknologi Informasi', code: 'TI' },
    { name: 'Divisi Konsultansi', code: 'KON' },
  ];
  const divisionMap: Record<string, string> = {};
  for (const d of divisionData) {
    const existing = await prisma.division.findUnique({ where: { code: d.code } });
    if (existing) { divisionMap[d.code] = existing.id; continue; }
    const created = await prisma.division.create({
      data: { id: uuidv4(), companyId, name: d.name, code: d.code, isActive: true },
    });
    divisionMap[d.code] = created.id;
  }
  console.log(`  Seeded ${divisionData.length} divisions`);

  // 14. Seed Departments
  const deptData = [
    { name: 'Engineering', code: 'ENG', divisionCode: 'INF' },
    { name: 'Project Management Office', code: 'PMO', divisionCode: 'INF' },
    { name: 'Software Development', code: 'SWD', divisionCode: 'TI' },
    { name: 'Network & Security', code: 'NET', divisionCode: 'TI' },
    { name: 'IT Support', code: 'IT', divisionCode: 'TI' },
    { name: 'Legal & Finance', code: 'LEG', divisionCode: 'KON' },
    { name: 'Operations', code: 'OPS', divisionCode: 'KON' },
    { name: 'Quality Assurance', code: 'QA', divisionCode: 'KON' },
    { name: 'Field Operations', code: 'FLD-OPS', divisionCode: 'INF' },
    { name: 'Marketing', code: 'MKT', divisionCode: 'KON' },
  ];
  const deptMap: Record<string, string> = {};
  for (const d of deptData) {
    const existing = await prisma.department.findUnique({ where: { code: d.code } });
    if (existing) { deptMap[d.code] = existing.id; continue; }
    const created = await prisma.department.create({
      data: { id: uuidv4(), divisionId: divisionMap[d.divisionCode], name: d.name, code: d.code, isActive: true },
    });
    deptMap[d.code] = created.id;
  }
  console.log(`  Seeded ${deptData.length} departments`);

  // 15. Seed Branches
  const branchData = [
    { name: 'Head Office', code: 'HO', city: 'Jakarta Pusat', divisionCode: 'KON' },
    { name: 'Jakarta Pusat', code: 'JKT-PUSAT', city: 'Jakarta Pusat', divisionCode: 'INF' },
    { name: 'Jakarta Selatan', code: 'JKT-SELATAN', city: 'Jakarta Selatan', divisionCode: 'TI' },
    { name: 'Bandung', code: 'BDG', city: 'Bandung', divisionCode: 'INF' },
    { name: 'Surabaya', code: 'SBY', city: 'Surabaya', divisionCode: 'TI' },
    { name: 'Medan', code: 'MDN', city: 'Medan', divisionCode: 'INF' },
  ];
  const branchMap: Record<string, string> = {};
  for (const b of branchData) {
    const existing = await prisma.branch.findUnique({ where: { code: b.code } });
    if (existing) { branchMap[b.code] = existing.id; continue; }
    const created = await prisma.branch.create({
      data: { id: uuidv4(), divisionId: divisionMap[b.divisionCode], name: b.name, code: b.code, city: b.city, isActive: true },
    });
    branchMap[b.code] = created.id;
  }
  console.log(`  Seeded ${branchData.length} branches`);

  // 16. Seed Positions
  const positionData = [
    { name: 'Staff', approvalLevel: 1 },
    { name: 'Supervisor', approvalLevel: 2 },
    { name: 'Project Manager', approvalLevel: 3 },
    { name: 'Head of Department', approvalLevel: 4 },
    { name: 'Branch Manager', approvalLevel: 4 },
    { name: 'Director', approvalLevel: 5 },
  ];
  const positionMap: Record<string, string> = {};
  for (const p of positionData) {
    const existing = await prisma.position.findUnique({ where: { name: p.name } });
    if (existing) { positionMap[p.name] = existing.id; continue; }
    const created = await prisma.position.create({
      data: { id: uuidv4(), name: p.name, approvalLevel: p.approvalLevel, isActive: true },
    });
    positionMap[p.name] = created.id;
  }
  console.log(`  Seeded ${positionData.length} positions`);

  // 17. Seed Non-Admin Users (matching frontend mock data)
  const sampleUsers = [
    { name: 'Eko Prasetyo', username: 'eko.p', email: 'eko.p@kinetic.co.id', roleCode: 'admin', branchCode: 'HO', deptCode: 'IT' },
    { name: 'Ahmad Sulistyo', username: 'asulistyo', email: 'ahmad.s@kinetic.co.id', roleCode: 'management', branchCode: 'JKT-PUSAT', deptCode: 'OPS' },
    { name: 'Bambang Permadi', username: 'bambang.pm', email: 'b.permadi@kinetic.co.id', roleCode: 'pm', branchCode: 'HO', deptCode: 'PMO' },
    { name: 'Rina Marlina', username: 'rina.ops', email: 'rina.marlina@kinetic.co.id', roleCode: 'department', branchCode: 'SBY', deptCode: 'OPS', isActive: false },
    { name: 'Doni Wahyudi', username: 'doni.admin', email: 'doni.w@kinetic.co.id', roleCode: 'admin', branchCode: 'HO', deptCode: 'IT' },
    { name: 'Siti Aminah', username: 'siti.am', email: 'siti.aminah@kinetic.co.id', roleCode: 'department', branchCode: 'JKT-SELATAN', deptCode: 'QA' },
    { name: 'Andi Wijaya', username: 'andi.w', email: 'andi.w@kinetic.co.id', roleCode: 'cabang', branchCode: 'BDG', deptCode: 'FLD-OPS' },
    { name: 'Dewi Sartika', username: 'dewi.s', email: 'dewi.s@kinetic.co.id', roleCode: 'management', branchCode: 'MDN', deptCode: 'OPS' },
  ];
  const userMap: Record<string, string> = {};
  for (const u of sampleUsers) {
    const existing = await prisma.user.findUnique({ where: { username: u.username } });
    if (existing) { userMap[u.username] = existing.id; continue; }
    const passwordHash = await bcrypt.hash('User123!', BCRYPT_ROUNDS);
    const created = await prisma.user.create({
      data: {
        id: uuidv4(), name: u.name, username: u.username, email: u.email,
        passwordHash, roleId: roleMap[u.roleCode],
        branchId: branchMap[u.branchCode], departmentId: deptMap[u.deptCode],
        isActive: u.isActive !== false, isLocked: false, mustChangePassword: false,
      },
    });
    userMap[u.username] = created.id;
  }
  console.log(`  Seeded ${sampleUsers.length} additional users`);

  // 18. Seed User Positions
  const userPositions = [
    { username: 'eko.p', positionName: 'Director' },
    { username: 'asulistyo', positionName: 'Branch Manager' },
    { username: 'bambang.pm', positionName: 'Project Manager' },
    { username: 'rina.ops', positionName: 'Head of Department' },
    { username: 'doni.admin', positionName: 'Supervisor' },
    { username: 'siti.am', positionName: 'Supervisor' },
    { username: 'andi.w', positionName: 'Staff' },
    { username: 'dewi.s', positionName: 'Branch Manager' },
  ];
  for (const up of userPositions) {
    const userId = userMap[up.username];
    const positionId = positionMap[up.positionName];
    if (!userId || !positionId) continue;
    const existing = await prisma.userPosition.findFirst({ where: { userId, positionId } });
    if (!existing) {
      await prisma.userPosition.create({
        data: { id: uuidv4(), userId, positionId, isBackup: false },
      });
    }
  }
  console.log(`  Seeded ${userPositions.length} user-position assignments`);

  // 19. Update Department heads & Branch PICs
  const deptHeadMap: Record<string, string> = {
    'ENG': 'bambang.pm', 'PMO': 'bambang.pm', 'SWD': 'doni.admin',
    'NET': 'doni.admin', 'IT': 'doni.admin', 'LEG': 'eko.p',
    'OPS': 'asulistyo', 'QA': 'siti.am', 'FLD-OPS': 'andi.w', 'MKT': 'dewi.s',
  };
  for (const [code, username] of Object.entries(deptHeadMap)) {
    const deptId = deptMap[code];
    const userId = userMap[username];
    if (deptId && userId) {
      await prisma.department.update({ where: { id: deptId }, data: { headUserId: userId } }).catch(() => {});
    }
  }
  const branchPicMap: Record<string, string> = {
    'HO': 'eko.p', 'JKT-PUSAT': 'asulistyo', 'JKT-SELATAN': 'siti.am',
    'BDG': 'andi.w', 'SBY': 'dewi.s', 'MDN': 'dewi.s',
  };
  for (const [code, username] of Object.entries(branchPicMap)) {
    const branchId = branchMap[code];
    const userId = userMap[username];
    if (branchId && userId) {
      await prisma.branch.update({ where: { id: branchId }, data: { picUserId: userId } }).catch(() => {});
    }
  }
  console.log('  Updated department heads and branch PICs');

  // 20. Seed Customers
  const customerData = [
    { name: 'PT Astra International Tbk', code: 'ASTRA', type: 'swasta', picContact: 'Budi Santoso', email: 'budi@astra.co.id', phone: '021-12345678', address: 'Jl. Jend. Sudirman Kav. 5-6, Jakarta Utara', isActive: true },
    { name: 'Bank Rakyat Indonesia', code: 'BRI', type: 'bumn', picContact: 'Siti Aminah', email: 'siti@bri.co.id', phone: '021-87654321', address: 'Jl. Jend. Sudirman Kav. 44-46, Jakarta Pusat', isActive: true },
    { name: 'Dinas Kesehatan Prov DKI', code: 'DINKES', type: 'pemerintah', picContact: 'Herry Setiawan', email: 'herry@dinkes-dki.go.id', phone: '021-5551234', address: 'Jl. Kesehatan No. 10, Jakarta Pusat', isActive: false },
    { name: 'Siemens Indonesia', code: 'SIEMENS', type: 'asing', picContact: 'John Doe', email: 'john.doe@siemens.com', phone: '021-9998877', address: 'Jl. HR Rasuna Said Kav. B-1, Jakarta Selatan', isActive: true },
    { name: 'PT Telekomunikasi Indonesia Tbk', code: 'TELKOM', type: 'bumn', picContact: 'Agus Wijaya', email: 'agus@telkom.co.id', phone: '021-6665551', address: 'Jl. Gatot Subroto Kav. 52, Jakarta Selatan', isActive: true },
    { name: 'PT Angkasa Pura II', code: 'AP2', type: 'bumn', picContact: 'Rina Kartika', email: 'rina@angkasapura2.co.id', phone: '021-5501234', address: 'Bandara Soekarno-Hatta, Tangerang', isActive: true },
    { name: 'Energi Bangsa Corp', code: 'EBC', type: 'swasta', picContact: 'Bambang Sutejo', email: 'bambang@energi-bangsa.com', phone: '021-7778881', address: 'Jl. TB Simatupang Kav. 18, Jakarta Selatan', isActive: true },
    { name: 'PT Pertamina (Persero)', code: 'PERTAMINA', type: 'bumn', picContact: 'Dwi Hartono', email: 'dwi@pertamina.com', phone: '021-3334441', address: 'Jl. Medan Merdeka Timur 1A, Jakarta Pusat', isActive: true },
  ];
  const customerMap: Record<string, string> = {};
  for (const c of customerData) {
    const existing = await prisma.customer.findUnique({ where: { name: c.name } });
    if (existing) { customerMap[c.code] = existing.id; continue; }
    const created = await prisma.customer.create({ data: { id: uuidv4(), ...c } });
    customerMap[c.code] = created.id;
  }
  console.log(`  Seeded ${customerData.length} customers`);

  // 21. Seed Competitors
  const competitorData = [
    { name: 'PT Astra Modern Ltd', shortCode: 'AMT', businessField: 'Konstruksi & Infrastruktur', description: 'Kompetitor utama di bidang konstruksi dengan pengalaman luas.', status: 'active' },
    { name: 'Global Enterprise Solutions', shortCode: 'GES', businessField: 'Teknologi Informasi', description: 'Solusi TI enterprise dengan sertifikasi internasional.', status: 'active' },
    { name: 'PT Nippon Power Corp', shortCode: 'NPC', businessField: 'Kelistrikan & Power', description: 'Teknologi mutakhir di bidang kelistrikan dan power system.', status: 'active' },
    { name: 'PT Tekno Konstruksi Indonesia', shortCode: 'TKI', businessField: 'Konstruksi', description: 'Pemain lokal dengan harga kompetitif dan track record tepat waktu.', status: 'active' },
  ];
  for (const c of competitorData) {
    const existing = await prisma.competitor.findUnique({ where: { name: c.name } });
    if (!existing) {
      await prisma.competitor.create({ data: { id: uuidv4(), ...c } });
    }
  }
  console.log(`  Seeded ${competitorData.length} competitors`);

  // 22. Seed Question Types (GAP-03 Critical)
  const qtypeData = [
    { code: 'text', label: 'Teks Singkat' },
    { code: 'textarea', label: 'Teks Panjang / Paragraf' },
    { code: 'radio', label: 'Pilihan Tunggal (Radio)' },
    { code: 'checkbox', label: 'Pilihan Banyak (Checkbox)' },
    { code: 'select', label: 'Dropdown Pilihan' },
    { code: 'number', label: 'Angka / Numerik' },
    { code: 'date', label: 'Tanggal' },
  ];
  const qtypeMap: Record<string, string> = {};
  for (const qt of qtypeData) {
    const existing = await prisma.questionType.findUnique({ where: { code: qt.code } });
    if (existing) { qtypeMap[qt.code] = existing.id; continue; }
    const created = await prisma.questionType.create({
      data: { id: uuidv4(), code: qt.code, label: qt.label, isActive: true },
    });
    qtypeMap[qt.code] = created.id;
  }
  console.log(`  Seeded ${qtypeData.length} question types`);

  // 23. Seed Questions + Options
  const questionData = [
    { text: 'Nama Lengkap Sesuai KTP', typeCode: 'text', context: 'prospect', categoryLabel: 'Data Pribadi', isRequired: true, displayOrder: 1 },
    { text: 'Apakah domisili sesuai dengan domisili usaha?', typeCode: 'radio', context: 'prospect', categoryLabel: 'Lokasi', isRequired: true, displayOrder: 2 },
    { text: 'Jenis badan usaha', typeCode: 'select', context: 'prospect', categoryLabel: 'Legalitas', isRequired: true, displayOrder: 3 },
    { text: 'Estimasi omzet bulanan', typeCode: 'text', context: 'prospect', categoryLabel: 'Keuangan', isRequired: false, displayOrder: 4 },
    { text: 'Upload foto tempat usaha', typeCode: 'radio', context: 'prospect', categoryLabel: 'Verifikasi Fisik', isRequired: true, displayOrder: 5 },
    { text: 'Apakah proyek ini memerlukan RKS?', typeCode: 'radio', context: 'rks', categoryLabel: 'Dokumen', isRequired: true, displayOrder: 1 },
    { text: 'Jelaskan ruang lingkup pekerjaan', typeCode: 'textarea', context: 'rks', categoryLabel: 'Teknis', isRequired: true, displayOrder: 2 },
    { text: 'Estimasi waktu pelaksanaan (hari)', typeCode: 'number', context: 'both', categoryLabel: 'Jadwal', isRequired: true, displayOrder: 3 },
    { text: 'Apakah ada persyaratan khusus?', typeCode: 'textarea', context: 'rks', categoryLabel: 'Lainnya', isRequired: false, displayOrder: 4 },
    { text: 'Kategori proyek yang diminati', typeCode: 'select', context: 'both', categoryLabel: 'Kategori', isRequired: true, displayOrder: 5 },
  ];
  for (const q of questionData) {
    const existing = await prisma.question.findFirst({ where: { text: q.text } });
    if (existing) continue;
    const typeId = qtypeMap[q.typeCode];
    if (!typeId) continue;
    const question = await prisma.question.create({
      data: { id: uuidv4(), text: q.text, questionTypeId: typeId, context: q.context, categoryLabel: q.categoryLabel, isRequired: q.isRequired, displayOrder: q.displayOrder, isActive: true },
    });
    // Seed options for radio/select questions
    if (q.typeCode === 'radio' || q.typeCode === 'select') {
      let options: { label: string; order: number }[] = [];
      if (q.text === 'Apakah domisili sesuai dengan domisili usaha?') {
        options = [{ label: 'Ya', order: 1 }, { label: 'Tidak', order: 2 }];
      } else if (q.text === 'Jenis badan usaha') {
        options = [{ label: 'PT', order: 1 }, { label: 'CV', order: 2 }, { label: 'Firma', order: 3 }, { label: 'Koperasi', order: 4 }];
      } else if (q.text === 'Upload foto tempat usaha') {
        options = [{ label: 'Sudah', order: 1 }, { label: 'Belum', order: 2 }];
      } else if (q.text === 'Apakah proyek ini memerlukan RKS?') {
        options = [{ label: 'Ya', order: 1 }, { label: 'Tidak', order: 2 }];
      } else if (q.text === 'Kategori proyek yang diminati') {
        options = [
          { label: 'IT Infrastructure', order: 1 }, { label: 'Telecommunication', order: 2 },
          { label: 'Security System', order: 3 }, { label: 'Network & Connectivity', order: 4 },
          { label: 'Data Center', order: 5 }, { label: 'IoT & Smart Systems', order: 6 },
        ];
      }
      for (const opt of options) {
        await prisma.questionOption.create({
          data: { id: uuidv4(), questionId: question.id, optionLabel: opt.label, displayOrder: opt.order },
        });
      }
    }
  }
  console.log(`  Seeded ${questionData.length} questions with options`);

  // 24. Seed Document Types (matching frontend mock)
  const docTypeData = [
    { code: 'RKS', label: 'Dokumen Tender / RKS', appliesToStage: 'tender' },
    { code: 'LPHS', label: 'Draft LPHS', appliesToStage: 'lphs' },
    { code: 'SPK', label: 'Surat Perintah Kerja', appliesToStage: 'delivery' },
    { code: 'SURAT_KALAH', label: 'Surat Kekalahan', appliesToStage: 'winner' },
    { code: 'HARGA', label: 'Dokumen Harga Penawaran', appliesToStage: 'pricing' },
    { code: 'INVOICE', label: 'Invoice / Tagihan', appliesToStage: 'delivery' },
  ];
  for (const dt of docTypeData) {
    const existing = await prisma.documentTypeDefinition.findUnique({ where: { code: dt.code } });
    if (!existing) {
      await prisma.documentTypeDefinition.create({
        data: { id: uuidv4(), code: dt.code, label: dt.label, appliesToStage: dt.appliesToStage, isActive: true },
      });
    }
  }
  console.log(`  Seeded ${docTypeData.length} document types`);

  // 25. Seed Approval Level Definitions
  const approvalLevels = [
    { level: 1, label: 'Staff', description: 'Level approval staf' },
    { level: 2, label: 'Supervisor', description: 'Level approval supervisor' },
    { level: 3, label: 'Manager', description: 'Level approval manager' },
    { level: 4, label: 'Director', description: 'Level approval direktur' },
    { level: 5, label: 'Executive', description: 'Level approval eksekutif' },
  ];
  for (const al of approvalLevels) {
    const existing = await prisma.approvalLevelDefinition.findUnique({ where: { level: al.level } });
    if (!existing) {
      await prisma.approvalLevelDefinition.create({
        data: { id: uuidv4(), level: al.level, label: al.label, description: al.description },
      });
    }
  }
  console.log(`  Seeded ${approvalLevels.length} approval level definitions`);

  // 26. Seed Dummy Prospects
  const prospectData = [
    { name: 'Modernisasi Data Center - Jakarta Pusat', customerCode: 'TELKOM', categoryName: 'Data Center', branchCode: 'JKT-PUSAT', username: 'andi.w', description: 'Upgrade infrastruktur server dan storage untuk mendukung transformasi digital.', estimatedValue: 2500000000, estimatedDate: '2025-08-15', status: 'Prospecting' },
    { name: 'Implementasi Jaringan FO - Bandung', customerCode: 'TELKOM', categoryName: 'Network & Connectivity', branchCode: 'BDG', username: 'andi.w', description: 'Pemasangan jaringan fiber optik untuk 50 titik di area Bandung Timur.', estimatedValue: 875000000, estimatedDate: '2025-09-01', status: 'Waiting PM' },
    { name: 'Sistem Keamanan Terpadu - Kantor Pusat', customerCode: 'BRI', categoryName: 'Security System', branchCode: 'HO', username: 'bambang.pm', description: 'Integration of CCTV, access control, and fire alarm systems.', estimatedValue: 1500000000, estimatedDate: '2025-07-30', status: 'Revision' },
    { name: 'Upgrade Jaringan Bank BRI - Regional', customerCode: 'BRI', categoryName: 'IT Infrastructure', branchCode: 'SBY', username: 'bambang.pm', description: 'Modernisasi perangkat jaringan untuk 20 cabang di Jawa Timur.', estimatedValue: 3200000000, estimatedDate: '2025-10-20', status: 'Approved' },
    { name: 'Smart Office Solution - Pertamina', customerCode: 'PERTAMINA', categoryName: 'IoT & Smart Systems', branchCode: 'JKT-SELATAN', username: 'siti.am', description: 'Implementasi IoT untuk monitoring energi dan otomatisasi gedung.', estimatedValue: null, estimatedDate: null, status: 'Prospecting' },
    { name: 'DC Backup Power - Astra', customerCode: 'ASTRA', categoryName: 'Data Center', branchCode: 'HO', username: 'eko.p', description: 'Pengadaan dan instalasi UPS serta generator backup untuk data center.', estimatedValue: 4500000000, estimatedDate: '2025-12-01', status: 'Waiting PM' },
    { name: 'Jaringan Komunikasi Bandara - AP II', customerCode: 'AP2', categoryName: 'Telecommunication', branchCode: 'MDN', username: 'dewi.s', description: 'Pembangunan infrastruktur komunikasi serat optik di 5 bandara.', estimatedValue: 7800000000, estimatedDate: '2026-01-15', status: 'Prospecting' },
  ];
  let prospectCount = 0;
  for (const pd of prospectData) {
    const customerId = customerMap[pd.customerCode];
    const categoryId = categoryMap[pd.categoryName];
    const branchId = branchMap[pd.branchCode];
    const userId = userMap[pd.username];
    if (!customerId || !categoryId || !branchId || !userId) {
      console.log(`    Skipping prospect "${pd.name}": missing reference data`);
      continue;
    }
    const existing = await prisma.prospect.findFirst({ where: { name: pd.name } });
    if (!existing) {
      await prisma.prospect.create({
        data: {
          id: uuidv4(),
          name: pd.name,
          customerId,
          branchId,
          categoryId,
          description: pd.description,
          estimatedValue: pd.estimatedValue,
          estimatedDate: pd.estimatedDate ? new Date(pd.estimatedDate) : null,
          status: pd.status,
          createdBy: userId,
        },
      });
      prospectCount++;
    }
  }
  console.log(`  Seeded ${prospectCount} dummy prospects`);

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
