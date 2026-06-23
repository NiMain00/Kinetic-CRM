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
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: PERMISSIONS.map((p) => p.code),
  management: [
    'prospects.read', 'projects.read', 'projects.create', 'projects.update',
    'projects.rks.read', 'projects.lphs.read',
    'approvals.read', 'approvals.approve', 'approvals.reject',
    'reports.read', 'reports.export',
    'kpi.read',
    'documents.read', 'notifications.read', 'audit.read',
  ],
  pm: [
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

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
