import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FollowUpService {
  constructor(private readonly prisma: PrismaService) {}

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
    prospectId: string;
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
