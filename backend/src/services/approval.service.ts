import { prisma } from '../config/database';
import { AppError } from '../utils/errors';

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

    return {
      data: items,
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
