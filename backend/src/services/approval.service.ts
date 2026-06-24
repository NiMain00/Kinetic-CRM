import { prisma } from '../config/database';
import { AppError } from '../utils/errors';

function elapsedSince(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Baru saja';
  const hours = Math.floor(mins / 60);
  if (hours < 1) return `${mins} menit`;
  const days = Math.floor(hours / 24);
  if (days < 1) return `${hours} jam`;
  if (days < 30) return `${days} hari`;
  return `${Math.floor(days / 30)} bulan`;
}

function computeSlaStatus(createdAt: Date, slaDeadline?: Date | null): string {
  if (!slaDeadline) return 'Normal';
  const now = Date.now();
  const remaining = slaDeadline.getTime() - now;
  if (remaining < 0) return 'Overdue';
  const total = slaDeadline.getTime() - createdAt.getTime();
  if (remaining < total * 0.25) return 'Near Deadline';
  return 'Normal';
}

function mapResourceType(resourceType: string): string {
  if (resourceType === 'project') return 'Proyek';
  if (resourceType === 'prospect') return 'Prospek';
  return resourceType;
}

export class ApprovalService {
  async list(params: {
    status?: string;
    resourceType?: string;
    assignedToUserId?: string;
    page: number;
    perPage: number;
  }) {
    const where: any = {};

    if (params.status) where.status = params.status;
    if (params.resourceType) where.resourceType = params.resourceType;
    if (params.assignedToUserId) where.assignedToUserId = params.assignedToUserId;

    const [items, total] = await Promise.all([
      prisma.approval.findMany({
        where,
        skip: (params.page - 1) * params.perPage,
        take: params.perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          stage: { select: { label: true, stageCode: true } },
          assignedUser: { select: { id: true, name: true } },
          assignedRole: { select: { id: true, code: true, name: true } },
          decider: { select: { id: true, name: true } },
        },
      }),
      prisma.approval.count({ where }),
    ]);

    const projectIds = items
      .filter((a) => a.resourceType === 'project')
      .map((a) => a.resourceId);

    const projects = projectIds.length > 0
      ? await prisma.project.findMany({
          where: { id: { in: projectIds } },
          select: { id: true, name: true, createdBy: true },
        })
      : [];

    const projectMap = new Map(projects.map((p) => [p.id, p.name]));
    const requesterIds = projects.map((p) => p.createdBy).filter(Boolean);
    const requesters = requesterIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: requesterIds as string[] } },
          select: { id: true, name: true },
        })
      : [];
    const requesterMap = new Map(requesters.map((r) => [r.id, r.name]));

    const data = items.map((a) => {
      const name = a.resourceType === 'project'
        ? projectMap.get(a.resourceId) || a.resourceId
        : a.resourceId;
      const requesterName = a.resourceType === 'project'
        ? requesterMap.get(projects.find((p) => p.id === a.resourceId)?.createdBy || '') || null
        : null;

      return {
        id: a.id,
        name,
        resourceType: mapResourceType(a.resourceType),
        resourceId: a.resourceId,
        stage: a.stage?.label || a.stage?.stageCode || '-',
        requestor: requesterName ? { name: requesterName } : null,
        assignee: a.assignedUser ? { id: a.assignedUser.id, name: a.assignedUser.name } : null,
        status: a.status,
        slaStatus: computeSlaStatus(a.createdAt, a.slaDeadline),
        waitingSince: elapsedSince(a.createdAt),
        createdAt: a.createdAt.toISOString(),
        slaDeadline: a.slaDeadline?.toISOString() || null,
        decidedAt: a.decidedAt?.toISOString() || null,
        decisionComment: a.decisionComment,
      };
    });

    return {
      data,
      pagination: {
        page: params.page,
        perPage: params.perPage,
        totalItems: total,
        totalPages: Math.ceil(total / params.perPage),
      },
    };
  }

  async get(id: string) {
    const approval = await prisma.approval.findUnique({
      where: { id },
      include: {
        stage: { select: { label: true, stageCode: true } },
        assignedUser: { select: { id: true, name: true } },
        assignedRole: { select: { id: true, code: true, name: true } },
        assignedDept: { select: { id: true, name: true } },
        decider: { select: { id: true, name: true } },
        reassignments: {
          orderBy: { reassignedAt: 'desc' },
          include: {
            previousAssignee: { select: { id: true, name: true } },
            newAssignee: { select: { id: true, name: true } },
            reassigner: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!approval) {
      throw new AppError(404, 'APPROVAL_NOT_FOUND', 'Approval tidak ditemukan.');
    }

    return approval;
  }

  async decide(id: string, data: { decision: 'approved' | 'rejected'; comment?: string }, userId: string) {
    const approval = await prisma.approval.findUnique({ where: { id } });
    if (!approval) {
      throw new AppError(404, 'APPROVAL_NOT_FOUND', 'Approval tidak ditemukan.');
    }
    if (approval.status !== 'pending') {
      throw new AppError(400, 'APPROVAL_ALREADY_DECIDED', 'Approval ini sudah diproses.');
    }

    return prisma.approval.update({
      where: { id },
      data: {
        status: data.decision === 'approved' ? 'approved' : 'rejected',
        decisionComment: data.comment || null,
        decidedBy: userId,
        decidedAt: new Date(),
      },
      include: {
        stage: { select: { label: true, stageCode: true } },
        assignedUser: { select: { id: true, name: true } },
        decider: { select: { id: true, name: true } },
      },
    });
  }

  async reassign(id: string, data: { newAssigneeUserId: string; reason: string }, userId: string) {
    const approval = await prisma.approval.findUnique({ where: { id } });
    if (!approval) {
      throw new AppError(404, 'APPROVAL_NOT_FOUND', 'Approval tidak ditemukan.');
    }

    const updated = await prisma.approval.update({
      where: { id },
      data: { assignedToUserId: data.newAssigneeUserId },
    });

    await prisma.approvalReassignment.create({
      data: {
        approvalId: id,
        previousAssigneeUserId: approval.assignedToUserId,
        newAssigneeUserId: data.newAssigneeUserId,
        reason: data.reason,
        reassignedBy: userId,
      },
    });

    return updated;
  }
}
