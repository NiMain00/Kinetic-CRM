import { prisma } from '../config/database';
import { AppError } from '../utils/errors';

export class ProjectService {
  async list(params: {
    search?: string;
    statusId?: string;
    branchId?: string;
    customerId?: string;
    categoryId?: string;
    projectType?: string;
    page: number;
    perPage: number;
  }) {
    const where: any = { deletedAt: null };

    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { customer: { name: { contains: params.search } } },
      ];
    }
    if (params.statusId) where.statusId = params.statusId;
    if (params.branchId) where.branchId = params.branchId;
    if (params.customerId) where.customerId = params.customerId;
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.projectType) where.projectType = params.projectType;

    const [items, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip: (params.page - 1) * params.perPage,
        take: params.perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, code: true } },
          branch: { select: { id: true, name: true, code: true } },
          category: { select: { id: true, name: true } },
          status: { select: { id: true, code: true, label: true, color: true } },
          creator: { select: { id: true, name: true } },
          priceSubmission: { select: { ourPrice: true } },
          tenderResult: { select: { result: true, finalPrice: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return {
      data: items.map((p) => ({
        id: p.id,
        name: p.name,
        projectType: p.projectType,
        customer: p.customer,
        branch: p.branch,
        category: p.category,
        status: p.status,
        creator: p.creator,
        deadlineTender: p.deadlineTender,
        tenderNumber: p.tenderNumber,
        tenderName: p.tenderName,
        pricing: p.priceSubmission,
        winnerDetails: p.tenderResult,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      pagination: {
        page: params.page,
        perPage: params.perPage,
        totalItems: total,
        totalPages: Math.ceil(total / params.perPage),
      },
    };
  }

  async get(id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, code: true, type: true } },
        branch: { select: { id: true, name: true, code: true } },
        category: { select: { id: true, name: true } },
        status: { select: { id: true, code: true, label: true, color: true } },
        creator: { select: { id: true, name: true } },
        canceller: { select: { id: true, name: true } },
        prospect: { select: { id: true, name: true } },
        priceSubmission: true,
        projectCompetitors: { include: { competitor: { select: { id: true, name: true } } } },
        tenderResult: { include: { lossReason: { select: { id: true, code: true, label: true } } } },
        deliveryTarget: true,
        timelineEvents: { orderBy: { occurredAt: 'desc' }, take: 50 },
        rks: true,
        lphsSios: { include: { departmentReviews: true } },
      },
    });

    if (!project || project.deletedAt) {
      throw new AppError(404, 'PROJECT_NOT_FOUND', 'Proyek tidak ditemukan.');
    }

    return project;
  }

  async create(data: {
    prospectId?: string | null;
    name: string;
    projectType: string;
    customerId: string;
    branchId: string;
    categoryId: string;
    statusId: string;
    deadlineTender?: string | null;
    tenderNumber?: string | null;
    tenderName?: string | null;
    estimatedValue?: number;
    marginPercentage?: number;
    createdBy: string;
  }) {
    const project = await prisma.project.create({
      data: {
        name: data.name,
        projectType: data.projectType,
        customerId: data.customerId,
        branchId: data.branchId,
        categoryId: data.categoryId,
        statusId: data.statusId,
        prospectId: data.prospectId || null,
        deadlineTender: data.deadlineTender ? new Date(data.deadlineTender) : null,
        tenderNumber: data.tenderNumber || null,
        tenderName: data.tenderName || null,
        createdBy: data.createdBy,
      },
      include: {
        customer: { select: { id: true, name: true, code: true } },
        branch: { select: { id: true, name: true, code: true } },
        category: { select: { id: true, name: true } },
        status: { select: { id: true, code: true, label: true, color: true } },
        creator: { select: { id: true, name: true } },
      },
    });

    if (data.estimatedValue) {
      await prisma.priceSubmission.create({
        data: {
          projectId: project.id,
          ourPrice: data.estimatedValue,
          marginPercentage: data.marginPercentage || null,
          submittedBy: data.createdBy,
        },
      });
    }

    await prisma.projectTimelineEvent.create({
      data: {
        projectId: project.id,
        eventType: 'project_created',
        actorId: data.createdBy,
        description: `Proyek "${project.name}" dibuat.`,
      },
    });

    return project;
  }

  async update(id: string, data: {
    name?: string;
    projectType?: string;
    customerId?: string;
    branchId?: string;
    categoryId?: string;
    statusId?: string;
    deadlineTender?: string | null;
    tenderNumber?: string | null;
    tenderName?: string | null;
  }, userId: string) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project || project.deletedAt) {
      throw new AppError(404, 'PROJECT_NOT_FOUND', 'Proyek tidak ditemukan.');
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.projectType !== undefined && { projectType: data.projectType }),
        ...(data.customerId !== undefined && { customerId: data.customerId }),
        ...(data.branchId !== undefined && { branchId: data.branchId }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.statusId !== undefined && { statusId: data.statusId }),
        ...(data.deadlineTender !== undefined && { deadlineTender: data.deadlineTender ? new Date(data.deadlineTender) : null }),
        ...(data.tenderNumber !== undefined && { tenderNumber: data.tenderNumber }),
        ...(data.tenderName !== undefined && { tenderName: data.tenderName }),
      },
      include: {
        customer: { select: { id: true, name: true, code: true } },
        branch: { select: { id: true, name: true, code: true } },
        category: { select: { id: true, name: true } },
        status: { select: { id: true, code: true, label: true, color: true } },
        creator: { select: { id: true, name: true } },
      },
    });

    await prisma.projectTimelineEvent.create({
      data: {
        projectId: id,
        eventType: 'project_updated',
        actorId: userId,
        description: `Proyek "${updated.name}" diperbarui.`,
      },
    });

    return updated;
  }

  async delete(id: string) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new AppError(404, 'PROJECT_NOT_FOUND', 'Proyek tidak ditemukan.');
    }

    await prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async cancel(id: string, reason: string, userId: string) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project || project.deletedAt) {
      throw new AppError(404, 'PROJECT_NOT_FOUND', 'Proyek tidak ditemukan.');
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        cancelledAt: new Date(),
        cancellationReason: reason,
        cancelledBy: userId,
      },
    });

    await prisma.projectTimelineEvent.create({
      data: {
        projectId: id,
        eventType: 'project_cancelled',
        actorId: userId,
        description: `Proyek dibatalkan. Alasan: ${reason}`,
      },
    });

    return updated;
  }
}
