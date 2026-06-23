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

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
