import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const STATUS_FLOW = [
  'Dibuat', 'RKS', 'Review RKS', 'Approved', 'Penawaran Dikirim',
  'Negosiasi', 'Menunggu PO', 'PO Diterima', 'Pelaksanaan', 'BAST', 'Selesai',
];

const EVENT_KEY_MAP: Record<string, string> = {
  Dibuat: 'CREATED',
  RKS: 'RKS_DITERIMA',
  'Review RKS': 'RKS_REVIEW',
  Approved: 'RKS_APPROVED',
  'Penawaran Dikirim': 'PENAWARAN_DIKIRIM',
  Negosiasi: 'NEGOSIASI',
  'Menunggu PO': 'MENUNGGU_PO',
  'PO Diterima': 'PO_DITERIMA',
  Pelaksanaan: 'PELAKSANAAN',
  BAST: 'BAST',
  Selesai: 'SELESAI',
};

const BRANCHES = ['Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Makassar'];
const CLIENTS = ['PT Telkom Indonesia', 'PT Pertamina', 'PT PLN', 'PT Angkasa Pura', 'PT Kereta Api Indonesia', 'PT Pelindo', 'PT Kimia Farma', 'PT Bio Farma'];
const PROJECT_NAMES = [
  'Pengadaan Server HPC', 'Sistem Keamanan Siber', 'Jaringan Fiber Optik', 'Platform Big Data',
  'Sistem ERP Terintegrasi', 'Infrastruktur Cloud Hybrid', 'Sistem IoT Industri', 'Aplikasi Mobile Banking',
  'Data Center Tier III', 'Sistem Manajemen Aset', 'Network Operation Center', 'Sistem E-Procurement',
  'Platform AI/ML', 'Sistem ERP Keuangan', 'Smart Office Solution',
];

async function seed() {
  console.log('Seeding analytics data...');

  // Get first user as system actor
  const systemUser = await prisma.user.findFirst();
  const actorId = systemUser?.id || 'system';
  const actorName = systemUser?.fullName || 'System';

  // Create 20+ projects with varied timelines
  const startDate = new Date('2025-01-01');

  for (let i = 0; i < 22; i++) {
    const name = PROJECT_NAMES[i % PROJECT_NAMES.length] + ` #${i + 1}`;
    const client = CLIENTS[i % CLIENTS.length];
    const branch = BRANCHES[i % BRANCHES.length];

    const project = await prisma.project.create({
      data: {
        code: `ANL-${String(i + 1).padStart(3, '0')}`,
        name,
        client,
        type: 'tender',
        location: branch,
        status: 'Dibuat',
        branch,
        estimatedValue: Math.floor(Math.random() * 5000000000 + 500000000),
        author: actorName,
        createdByUserId: actorId,
        ownerUserId: actorId,
        date: new Date(startDate.getTime() + i * 7 * 86400000),
      },
    });

    // Randomly determine how far this project goes in the flow
    const maxStatusIdx = Math.min(
      i < 5 ? 10 :  // first 5 = completed
      i < 10 ? 8 + Math.floor(Math.random() * 3) : // next 5 = near completion
      i < 15 ? 4 + Math.floor(Math.random() * 4) : // next 5 = mid-flow
      i < 20 ? 2 + Math.floor(Math.random() * 3) : 1, // last few = early stage
      STATUS_FLOW.length - 1,
    );

    let currentTime = new Date(project.date);
    let prevEventKey: string | null = null;
    let prevTime: Date | null = null;

    for (let s = 0; s <= maxStatusIdx; s++) {
      const status = s === 0 ? 'Dibuat' : STATUS_FLOW[s];
      // Update project status
      await prisma.project.update({
        where: { id: project.id },
        data: { status },
      });

      // Random duration between stages: 1-14 days, or intentionally longer for bottlenecks
      let daysToAdd: number;
      if (status === 'Menunggu PO' && i % 3 === 0) {
        // 1/3 of projects get stuck at Menunggu PO (bottleneck scenario)
        daysToAdd = 10 + Math.floor(Math.random() * 10);
      } else if (status === 'Negosiasi' && i % 4 === 0) {
        // 1/4 get stuck at Negosiasi
        daysToAdd = 7 + Math.floor(Math.random() * 8);
      } else if (status === 'Pelaksanaan' && i % 5 === 0) {
        daysToAdd = 30 + Math.floor(Math.random() * 20);
      } else {
        daysToAdd = 1 + Math.floor(Math.random() * 5);
      }

      currentTime = new Date(currentTime.getTime() + daysToAdd * 86400000);

      const eventKey = EVENT_KEY_MAP[status] || status.toUpperCase().replace(/\s+/g, '_');

      // Calculate duration from previous event
      let durationMinutes: number | null = null;
      if (prevTime) {
        durationMinutes = Math.round((currentTime.getTime() - prevTime.getTime()) / 60000);
      }

      await prisma.projectTimelineEvent.create({
        data: {
          projectId: project.id,
          title: `Status: ${status}`,
          actor: actorName,
          type: 'status_change',
          time: currentTime,
          eventKey,
          eventLabel: status,
          previousStatus: s > 0 ? STATUS_FLOW[s - 1] : null,
          nextStatus: status,
          actorUserId: actorId,
          occurredAt: currentTime,
          durationMinutes,
          prevVal: s > 0 ? STATUS_FLOW[s - 1] : null,
          newVal: status,
        },
      });

      prevEventKey = eventKey;
      prevTime = currentTime;
    }
  }

  console.log('✅ Seeded 22 projects with varied timeline data');
  console.log('   - Projects 1-5: completed (full cycle)');
  console.log('   - Projects 6-10: near completion');
  console.log('   - Projects 11-15: mid-flow');
  console.log('   - Projects 16-20: early stage');
  console.log('   - Some projects stuck at Menunggu PO / Negosiasi (bottleneck simulation)');
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
