import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params?: any) {
    const where: any = { deletedAt: null };
    if (params?.status) where.status = params.status;
    if (params?.type) where.type = params.type;
    if (params?.search) {
      where.OR = [{ name: { contains: params.search } }, { code: { contains: params.search } }, { client: { contains: params.search } }];
    }
    if (params?.result) {
      where.tenderResult = { result: params.result };
    }
    if (params?.excludeResult) {
      const excluded = params.excludeResult.split(',');
      where.NOT = [
        { tenderResult: { result: { in: excluded } } },
      ];
    }

    const page = params?.page || 1;
    const perPage = params?.perPage || 200;
    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where, skip: (page - 1) * perPage, take: perPage, orderBy: { createdAt: 'desc' },
        include: {
          members: { include: { user: { select: { id: true, fullName: true } } } },
          rks: true, lphsSios: true, priceSubmission: true, tenderResult: true, deliveryTarget: true,
          category: true, statusDef: true, ownerUser: { select: { id: true, fullName: true } },
        },
      }),
      this.prisma.project.count({ where }),
    ]);
    return { data, total, page, perPage };
  }

  async get(id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: {
        members: { include: { user: { select: { id: true, fullName: true } } } },
        rks: { include: { reviewQuestions: true, reviewNotes: true } },
        lphsSios: { include: { departmentReviews: { include: { department: true, reviewer: { select: { id: true, fullName: true } } } }, targetedRevisions: true } },
        priceSubmission: true, projectCompetitors: { include: { competitor: true } },
        tenderResult: true, deliveryTarget: true,
        timelineEvents: { orderBy: { time: 'desc' }, include: { actorUser: { select: { fullName: true } } } },
        category: true, statusDef: true, prospect: true,
        createdBy: { select: { id: true, fullName: true } },
        ownerUser: { select: { id: true, fullName: true } },
        tasks: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async create(data: any) {
    try {
      return await this.prisma.project.create({ data });
    } catch (err) {
      console.error('Prisma create project error:', err);
      throw err;
    }
  }

  async update(id: string, data: any) {
    await this.get(id);
    const oneToOneRelations = ['lphsSios', 'priceSubmission', 'tenderResult', 'deliveryTarget', 'rks'];
    const prismaOps = new Set(['upsert', 'create', 'update', 'delete', 'disconnect', 'connect']);
    const nested: any = {};
    for (const key of oneToOneRelations) {
      if (data[key] !== undefined) {
        const isPrismaOp = data[key] && typeof data[key] === 'object' && Object.keys(data[key]).some(k => prismaOps.has(k));
        nested[key] = isPrismaOp ? data[key] : { upsert: { create: data[key], update: data[key] } };
        delete data[key];
      }
    }
    return this.prisma.project.update({ where: { id }, data: { ...data, ...nested } });
  }

  async delete(id: string) {
    await this.get(id);
    return this.prisma.$transaction(async (tx) => {
      await tx.procurement.updateMany({
        where: { sourceProjectId: id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      return tx.project.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    });
  }
}
