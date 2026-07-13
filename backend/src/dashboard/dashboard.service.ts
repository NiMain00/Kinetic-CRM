import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId?: string) {
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
  }

  async getWinLossTrend() {
    const now = new Date();
    const months: { label: string; index: number; year: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleString('en', { month: 'short' }),
        index: d.getMonth(),
        year: d.getFullYear(),
      });
    }

    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const wonResults = await this.prisma.tenderResult.findMany({
      where: { result: 'won', decidedAt: { gte: sixMonthsAgo } },
      select: { decidedAt: true },
    });
    const lostResults = await this.prisma.tenderResult.findMany({
      where: { result: 'lost', decidedAt: { gte: sixMonthsAgo } },
      select: { decidedAt: true },
    });

    if (wonResults.length > 0 || lostResults.length > 0) {
      return months.map((m) => {
        const win = wonResults.filter(
          (r) => r.decidedAt.getMonth() === m.index && r.decidedAt.getFullYear() === m.year,
        ).length;
        const lose = lostResults.filter(
          (r) => r.decidedAt.getMonth() === m.index && r.decidedAt.getFullYear() === m.year,
        ).length;
        return { month: m.label, win, lose };
      });
    }

    const projects = await this.prisma.project.findMany({
      where: { deletedAt: null, createdAt: { gte: sixMonthsAgo } },
      select: { status: true, createdAt: true },
    });

    return months.map((m) => {
      const win = projects.filter(
        (p) =>
          p.status === 'Selesai' &&
          p.createdAt.getMonth() === m.index &&
          p.createdAt.getFullYear() === m.year,
      ).length;
      const lose = projects.filter(
        (p) =>
          ['Dibatalkan', 'Kalah'].includes(p.status) &&
          p.createdAt.getMonth() === m.index &&
          p.createdAt.getFullYear() === m.year,
      ).length;
      return { month: m.label, win, lose };
    });
  }

  async getStatusDistribution() {
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
  }

  async getCriticalDeadlines() {
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
  }

  async getApprovalPending(limit?: number) {
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
  }
}
