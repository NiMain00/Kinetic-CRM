import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { configCache } from '../common/cache.util';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId?: string) {
    return configCache.getOrFetch(`stats:${userId || 'all'}`, async () => {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 86400000);

    const [
      totalProjects,
      wonProjects,
      totalValueResult,
      pendingApprovals,
      criticalDeadlines,
      activeProjectsCount,
    ] = await Promise.all([
      this.prisma.project.count({ where: { deletedAt: null } }),
      this.prisma.project.findMany({
        where: { deletedAt: null, tenderResult: { result: 'won' } },
        select: { id: true },
      }),
      this.prisma.project.aggregate({
        where: { deletedAt: null, status: { notIn: ['Selesai', 'Kalah'] } },
        _sum: { estimatedValue: true },
      }),
      this.prisma.approval.count({
        where: { status: 'pending', ...(userId ? { assignedToUserId: userId } : {}) },
      }),
      this.prisma.project.count({
        where: {
          deletedAt: null,
          deadlineTender: { gte: now, lte: sevenDaysLater },
        },
      }),
      this.prisma.project.count({
        where: { deletedAt: null, status: { notIn: ['Selesai', 'Kalah'] } },
      }),
    ]);

    const totalActiveValue = totalValueResult._sum.estimatedValue
      ? Number(totalValueResult._sum.estimatedValue)
      : 0;
    const winRate = totalProjects > 0
      ? Math.round((wonProjects.length / totalProjects) * 1000) / 10
      : 0;

    return {
      totalActiveProjects: activeProjectsCount,
      totalActiveValue,
      pendingApprovals,
      criticalDeadlines,
      winRate,
      valueChangePercent: 12,
    };
    });
  }

  async getWinLossTrend() {
    return configCache.getOrFetch('winLossTrend', async () => {
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

      const months: { label: string; index: number; year: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          label: d.toLocaleString('en', { month: 'short' }),
          index: d.getMonth(),
          year: d.getFullYear(),
        });
      }

      const rows = await this.prisma.$queryRaw<
        { month: string; result: string; count: bigint }[]
      >`
        SELECT
          to_char(date_trunc('month', "decided_at"), 'YYYY-MM') AS month,
          result,
          COUNT(*)::int AS count
        FROM "tender_results"
        WHERE "decided_at" >= ${sixMonthsAgo}
          AND result IN ('won', 'lost')
        GROUP BY date_trunc('month', "decided_at"), result
        ORDER BY month
      `;

      if (rows.length > 0) {
        const trendMap = new Map<string, { win: number; lose: number }>();
        for (const r of rows) {
          const entry = trendMap.get(r.month) ?? { win: 0, lose: 0 };
          if (r.result === 'won') entry.win += Number(r.count);
          else entry.lose += Number(r.count);
          trendMap.set(r.month, entry);
        }

        return months.map((m) => {
          const key = `${m.year}-${String(m.index + 1).padStart(2, '0')}`;
          const data = trendMap.get(key) ?? { win: 0, lose: 0 };
          return { month: m.label, win: data.win, lose: data.lose };
        });
      }

      const projectRows = await this.prisma.$queryRaw<
        { month: string; status: string; count: bigint }[]
      >`
        SELECT
          to_char(date_trunc('month', "created_at"), 'YYYY-MM') AS month,
          status,
          COUNT(*)::int AS count
        FROM "projects"
        WHERE "deleted_at" IS NULL
          AND "created_at" >= ${sixMonthsAgo}
        GROUP BY date_trunc('month', "created_at"), status
        ORDER BY month
      `;

      const projectMap = new Map<string, { win: number; lose: number }>();
      for (const r of projectRows) {
        const entry = projectMap.get(r.month) ?? { win: 0, lose: 0 };
        if (r.status === 'Selesai') entry.win += Number(r.count);
        if (['Dibatalkan', 'Kalah'].includes(r.status)) entry.lose += Number(r.count);
        projectMap.set(r.month, entry);
      }

      return months.map((m) => {
        const key = `${m.year}-${String(m.index + 1).padStart(2, '0')}`;
        const data = projectMap.get(key) ?? { win: 0, lose: 0 };
        return { month: m.label, win: data.win, lose: data.lose };
      });
    });
  }

  async getStatusDistribution() {
    return configCache.getOrFetch('statusDistribution', async () => {
    const allProjects = await this.prisma.project.findMany({
      where: { deletedAt: null },
      select: { status: true, tenderResult: { select: { result: true } } },
    });

    const planningStatuses = ['Dibuat', 'Potensial', 'rks', 'RKS'];
    const reviewStatuses = ['Review Departemen', 'LPHS/SIOS', 'lphs', 'Revisi', 'Waiting Supervisor', 'Revision'];
    const completedStatuses = ['Selesai', 'Dibatalkan'];

    const planning = allProjects.filter((p) => planningStatuses.includes(p.status)).length;
    const review = allProjects.filter((p) => reviewStatuses.includes(p.status)).length;
    const completed = allProjects.filter(
      (p) => completedStatuses.includes(p.status) || p.tenderResult?.result === 'won',
    ).length;
    const inProgress = allProjects.filter(
      (p) => !planningStatuses.includes(p.status) && !reviewStatuses.includes(p.status) && !completedStatuses.includes(p.status) && p.tenderResult?.result !== 'won',
    ).length;
    const total = allProjects.length;

    return { inProgress, completed, postponed: review, planning, total };
    });
  }

  async getCriticalDeadlines() {
    return configCache.getOrFetch('criticalDeadlines', async () => {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 86400000);

    const projects = await this.prisma.project.findMany({
      where: {
        deletedAt: null,
        deadlineTender: { gte: now, lte: sevenDaysLater },
      },
      select: {
        id: true,
        name: true,
        client: true,
        deadlineTender: true,
      },
      orderBy: { deadlineTender: 'asc' },
    });

    return projects.map((p) => {
      const daysLeft = Math.ceil(
        (p.deadlineTender!.getTime() - now.getTime()) / 86400000,
      );
      const severity =
        daysLeft <= 1 ? 'danger' : daysLeft <= 3 ? 'warning' : 'info';
      return {
        id: p.id,
        name: p.name,
        client: p.client,
        daysLeft,
        deadline: p.deadlineTender!.toISOString(),
        severity,
      };
    });
    });
  }

  async getApprovalPending(limit?: number) {
    return configCache.getOrFetch(`approvalPending:${limit || 10}`, async () => {
    const approvals = await this.prisma.approval.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      take: limit || 10,
      select: {
        id: true,
        resourceType: true,
        slaDeadline: true,
        createdAt: true,
        assigneeUser: { select: { fullName: true } },
      },
    });

    const now = new Date();
    return approvals.map((a) => {
      const deadline = a.slaDeadline || a.createdAt;
      const daysLeft = Math.ceil(
        (deadline.getTime() - now.getTime()) / 86400000,
      );
      const severity =
        daysLeft <= 0 ? 'danger' : daysLeft <= 2 ? 'warning' : 'info';
      return {
        id: a.id,
        name: a.resourceType,
        client: a.assigneeUser?.fullName || '',
        daysLeft: Math.max(daysLeft, 0),
        deadline: deadline.toISOString(),
        severity,
      };
    });
    });
  }
}
