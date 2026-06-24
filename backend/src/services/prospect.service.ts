import { prisma } from '../config/database';
import { AppError } from '../utils/errors';

export class ProspectService {
  async list(params: {
    search?: string;
    status?: string;
    branchId?: string;
    customerId?: string;
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
    if (params.status) {
      where.status = params.status;
    }
    if (params.branchId) {
      where.branchId = params.branchId;
    }
    if (params.customerId) {
      where.customerId = params.customerId;
    }

    const [items, total] = await Promise.all([
      prisma.prospect.findMany({
        where,
        skip: (params.page - 1) * params.perPage,
        take: params.perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, code: true } },
          branch: { select: { id: true, name: true, code: true } },
          category: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true } },
        },
      }),
      prisma.prospect.count({ where }),
    ]);

    return {
      data: items.map((p) => ({
        id: p.id,
        name: p.name,
        projectType: p.projectType,
        customer: p.customer,
        branch: p.branch,
        category: p.category,
        creator: p.creator,
        status: p.status,
        description: p.description,
        estimatedValue: p.estimatedValue,
        estimatedDate: p.estimatedDate,
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
    const prospect = await prisma.prospect.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, code: true, type: true } },
        branch: { select: { id: true, name: true, code: true } },
        category: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
        answers: { include: { question: true } },
      },
    });

    if (!prospect || prospect.deletedAt) {
      throw new AppError(404, 'PROSPECT_NOT_FOUND', 'Prospek tidak ditemukan.');
    }

    return {
      id: prospect.id,
      name: prospect.name,
      projectType: prospect.projectType,
      customer: prospect.customer,
      branch: prospect.branch,
      category: prospect.category,
      creator: prospect.creator,
      status: prospect.status,
      description: prospect.description,
      estimatedValue: prospect.estimatedValue,
      estimatedDate: prospect.estimatedDate,
      answers: prospect.answers,
      createdAt: prospect.createdAt,
      updatedAt: prospect.updatedAt,
    };
  }

  async create(data: {
    name: string;
    projectType?: string;
    customerId?: string | null;
    categoryId?: string | null;
    branchId?: string | null;
    description?: string | null;
    estimatedValue?: number | null;
    estimatedDate?: string | null;
    status?: string;
    createdBy: string;
  }) {
    const status = data.status || 'Prospecting';
    const prospect = await prisma.prospect.create({
      data: {
        name: data.name,
        customerId: data.customerId || null,
        categoryId: data.categoryId || null,
        branchId: data.branchId || null,
        description: data.description || null,
        estimatedValue: data.estimatedValue || null,
        estimatedDate: data.estimatedDate ? new Date(data.estimatedDate) : null,
        status,
        createdBy: data.createdBy,
      },
      include: {
        customer: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
      },
    });

    if (status === 'Waiting PM' && data.customerId && data.branchId && data.categoryId) {
      const statusDef = await prisma.projectStatusDefinition.findFirst({ where: { code: 'created' } });
      if (statusDef) {
        await prisma.project.create({
          data: {
            name: data.name,
            projectType: data.projectType || 'Prospecting',
            customerId: data.customerId,
            branchId: data.branchId,
            categoryId: data.categoryId,
            statusId: statusDef.id,
            prospectId: prospect.id,
            createdBy: data.createdBy,
          },
        });
      }
    }

    return prospect;
  }

  async update(id: string, data: {
    name?: string;
    projectType?: string;
    customerId?: string | null;
    categoryId?: string | null;
    branchId?: string | null;
    description?: string | null;
    estimatedValue?: number | null;
    estimatedDate?: string | null;
    status?: string;
  }, userId: string) {
    const prospect = await prisma.prospect.findUnique({ where: { id } });
    if (!prospect || prospect.deletedAt) {
      throw new AppError(404, 'PROSPECT_NOT_FOUND', 'Prospek tidak ditemukan.');
    }

    const updated = await prisma.prospect.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.customerId !== undefined && { customerId: data.customerId }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.branchId !== undefined && { branchId: data.branchId }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.estimatedValue !== undefined && { estimatedValue: data.estimatedValue }),
        ...(data.estimatedDate !== undefined && { estimatedDate: data.estimatedDate ? new Date(data.estimatedDate) : null }),
        ...(data.status !== undefined && { status: data.status }),
      },
      include: {
        customer: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
      },
    });

    const targetStatus = data.status || prospect.status;
    const customerId = data.customerId !== undefined ? data.customerId : prospect.customerId;
    const branchId = data.branchId !== undefined ? data.branchId : prospect.branchId;
    const categoryId = data.categoryId !== undefined ? data.categoryId : prospect.categoryId;

    if (targetStatus === 'Waiting PM' && customerId && branchId && categoryId) {
      const existingProject = await prisma.project.findFirst({ where: { prospectId: id } });
      if (!existingProject) {
        const statusDef = await prisma.projectStatusDefinition.findFirst({ where: { code: 'created' } });
        if (statusDef) {
          await prisma.project.create({
            data: {
              name: updated.name,
              projectType: data.projectType || 'Prospecting',
              customerId,
              branchId,
              categoryId,
              statusId: statusDef.id,
              prospectId: id,
              createdBy: userId,
            },
          });
        }
      }
    }

    return updated;
  }

  async delete(id: string) {
    const prospect = await prisma.prospect.findUnique({ where: { id } });
    if (!prospect) {
      throw new AppError(404, 'PROSPECT_NOT_FOUND', 'Prospek tidak ditemukan.');
    }

    await prisma.prospectAnswer.deleteMany({ where: { prospectId: id } });
    await prisma.prospectReviewNote.deleteMany({ where: { prospectId: id } });
    await prisma.prospectReviewQuestion.deleteMany({ where: { prospectId: id } });
    await prisma.prospect.delete({ where: { id } });
  }
}
