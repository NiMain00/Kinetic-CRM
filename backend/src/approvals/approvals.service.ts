import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApprovalsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params?: { type?: string; status?: string; page?: number; perPage?: number }) {
    const where: any = {};
    if (params?.status) where.status = params.status;
    if (params?.type) {
      if (params.type === 'Prospek') where.resourceType = 'prospect';
      else if (params.type === 'RKS') where.resourceType = 'rks';
      else if (params.type === 'LPHS') where.resourceType = 'lphs_sios';
    }
    const page = params?.page || 1;
    const perPage = Math.min(Number(params?.perPage) || 50, 100);
    const [data, total] = await Promise.all([
      this.prisma.approval.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        select: {
          id: true,
          resourceType: true,
          resourceId: true,
          status: true,
          assigneeUserId: true,
          createdAt: true,
          decidedAt: true,
          decisionComment: true,
          assigneeUser: { select: { id: true, fullName: true } },
          stage: { select: { id: true, name: true } },
        },
      }),
      this.prisma.approval.count({ where }),
    ]);
    return { data, total, page, perPage };
  }

  async get(id: string) {
    const approval = await this.prisma.approval.findUnique({
      where: { id },
      include: {
        assigneeUser: { select: { id: true, fullName: true } },
        stage: true,
      },
    });
    if (!approval) throw new NotFoundException('Approval not found');
    return approval;
  }

  async approve(id: string, userId: string, notes?: string) {
    const approval = await this.prisma.approval.findUnique({ where: { id } });
    if (!approval) throw new NotFoundException('Approval not found');
    return this.prisma.approval.update({
      where: { id },
      data: {
        status: 'approved',
        decidedBy: userId,
        decidedAt: new Date(),
        decisionComment: notes || null,
      },
    });
  }

  async reject(id: string, userId: string, notes?: string) {
    const approval = await this.prisma.approval.findUnique({ where: { id } });
    if (!approval) throw new NotFoundException('Approval not found');
    return this.prisma.approval.update({
      where: { id },
      data: {
        status: 'rejected',
        decidedBy: userId,
        decidedAt: new Date(),
        decisionComment: notes || null,
      },
    });
  }

  async addReview(id: string, data: { reviewNotes: string; status: 'approved' | 'revision' }) {
    const approval = await this.prisma.approval.findUnique({ where: { id } });
    if (!approval) throw new NotFoundException('Approval not found');
    return this.prisma.approval.update({
      where: { id },
      data: {
        status: data.status === 'approved' ? 'approved' : 'rejected',
        decisionComment: data.reviewNotes,
        decidedAt: new Date(),
      },
    });
  }
}
