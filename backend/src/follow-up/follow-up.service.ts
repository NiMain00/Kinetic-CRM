import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FollowUpService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: { page?: number; perPage?: number; status?: string; priority?: string; toUserId?: string; search?: string }) {
    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.priority) where.priority = params.priority;
    if (params.toUserId) where.toUserId = params.toUserId;
    if (params.search) {
      where.OR = [
        { title: { contains: params.search } },
        { notes: { contains: params.search } },
      ];
    }
    const page = params.page || 1;
    const perPage = Number(params.perPage) || 20;
    const [data, total] = await Promise.all([
      this.prisma.followUpTask.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          fromUser: { select: { id: true, fullName: true } },
          toUser: { select: { id: true, fullName: true } },
          prospect: { select: { id: true, name: true, client: true, status: true } },
          customer: { select: { id: true, name: true, type: true } },
        },
      }),
      this.prisma.followUpTask.count({ where }),
    ]);
    return { data, total, page, perPage };
  }

  async listByProspect(prospectId: string) {
    return this.prisma.followUpTask.findMany({
      where: { prospectId },
      orderBy: { createdAt: 'desc' },
      include: {
        fromUser: { select: { id: true, fullName: true } },
        toUser: { select: { id: true, fullName: true } },
      },
    });
  }

  async get(id: string) {
    const task = await this.prisma.followUpTask.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Follow-up task not found');
    return task;
  }

  async create(data: {
    title: string;
    prospectId?: string;
    customerId?: string;
    fromUserId: string;
    toUserId: string;
    priority?: string;
    notes?: string;
    deadline?: string;
  }) {
    return this.prisma.followUpTask.create({
      data: {
        title: data.title,
        prospectId: data.prospectId,
        customerId: data.customerId,
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        priority: (data.priority as any) || 'medium',
        notes: data.notes,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        status: 'pending',
        progress: 0,
      },
    });
  }

  async update(id: string, data: {
    status?: string;
    priority?: string;
    progress?: number;
    notes?: string;
    title?: string;
    deadline?: string;
  }) {
    await this.get(id);
    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.priority) updateData.priority = data.priority;
    if (data.progress !== undefined) updateData.progress = data.progress;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.title) updateData.title = data.title;
    if (data.deadline) updateData.deadline = new Date(data.deadline);
    if (data.status === 'completed') {
      updateData.completedAt = new Date();
    }
    return this.prisma.followUpTask.update({ where: { id }, data: updateData });
  }

  async delete(id: string) {
    await this.get(id);
    return this.prisma.followUpTask.delete({ where: { id } });
  }
}
