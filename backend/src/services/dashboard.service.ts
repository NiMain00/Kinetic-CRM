import { prisma } from '../config/database';

export class DashboardService {
  async getSummary() {
    const whereActive = { deletedAt: null };

    const totalProjects = await prisma.project.count({ where: whereActive });
    const totalProspects = await prisma.prospect.count({ where: whereActive });
    const pendingApprovals = await prisma.approval.count({
      where: { status: 'pending' },
    });

    const activeProjects = await prisma.project.findMany({
      where: { ...whereActive, cancelledAt: null },
      select: { priceSubmission: { select: { ourPrice: true } } },
    });
    const totalValue = activeProjects.reduce((sum, p) => {
      return sum + (p.priceSubmission?.ourPrice ? Number(p.priceSubmission.ourPrice) : 0);
    }, 0);

    const winTenders = await prisma.tenderResult.count({ where: { result: 'menang' } });
    const lossTenders = await prisma.tenderResult.count({ where: { result: 'kalah' } });
    const totalTenders = winTenders + lossTenders;
    const winRate = totalTenders > 0 ? Math.round((winTenders / totalTenders) * 1000) / 10 : 0;

    const approachingDeadline = await prisma.project.count({
      where: {
        ...whereActive,
        deadlineTender: { not: null, gte: new Date(), lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        cancelledAt: null,
      },
    });

    const projectsByStatus = await prisma.project.groupBy({
      by: ['statusId'],
      where: whereActive,
      _count: { id: true },
    });

    return {
      totalProjects,
      totalValue,
      pendingApprovals,
      totalProspects,
      winRate,
      approachingDeadline,
      projectsByStatus,
    };
  }

  async getPendingApprovals(userId: string) {
    return prisma.approval.findMany({
      where: { assignedToUserId: userId, status: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        stage: { select: { label: true, stageCode: true } },
        assignedUser: { select: { id: true, name: true } },
      },
    });
  }

  async getApproachingDeadline() {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const projects = await prisma.project.findMany({
      where: {
        deletedAt: null,
        cancelledAt: null,
        deadlineTender: { not: null, gte: now, lte: sevenDaysLater },
      },
      orderBy: { deadlineTender: 'asc' },
      take: 10,
      include: {
        customer: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      customer: p.customer?.name || '',
      branch: p.branch?.name || '',
      deadlineTender: p.deadlineTender,
    }));
  }
}
