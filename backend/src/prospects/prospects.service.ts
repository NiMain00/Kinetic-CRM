import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProspectsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params?: any) {
    const where: any = { deletedAt: null };
    if (params?.status) where.status = params.status;
    if (params?.search) {
      where.OR = [{ name: { contains: params.search } }, { client: { contains: params.search } }];
    }

    const page = params?.page || 1;
    const perPage = 20;
    const [data, total] = await Promise.all([
      this.prisma.prospect.findMany({
        where, skip: (page - 1) * perPage, take: perPage, orderBy: { createdAt: 'desc' },
        include: { customer: true, category: true, branchRel: true, ownerUser: { select: { id: true, fullName: true } } },
      }),
      this.prisma.prospect.count({ where }),
    ]);
    return { data, total, page, perPage };
  }

  async get(id: string) {
    const prospect = await this.prisma.prospect.findFirst({
      where: { id, deletedAt: null }, include: {
        customer: true, category: true, branchRel: true, project: true,
        createdBy: { select: { id: true, fullName: true } },
        ownerUser: { select: { id: true, fullName: true } },
        answers: { include: { question: true } },
        reviewQuestions: true, reviewNotes: true, timelineEvents: { orderBy: { time: 'desc' } },
      },
    });
    if (!prospect) throw new NotFoundException('Prospect not found');
    return prospect;
  }

  async create(data: any) {
    return this.prisma.prospect.create({ data });
  }

  async update(id: string, data: any) {
    await this.get(id);
    // Map projectId (frontend) ke convertedToProjectId (Prisma model)
    const mapped = { ...data };
    if (mapped.projectId !== undefined) {
      mapped.convertedToProjectId = mapped.projectId;
      delete mapped.projectId;
    }
    return this.prisma.prospect.update({ where: { id }, data: mapped });
  }

  async delete(id: string) {
    await this.get(id);
    return this.prisma.prospect.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
