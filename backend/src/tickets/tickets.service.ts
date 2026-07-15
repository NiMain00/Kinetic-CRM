import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async listByProspect(prospectId: string) {
    return this.prisma.ticket.findMany({
      where: { prospectId },
      orderBy: { createdAt: 'desc' },
      include: {
        fromUser: { select: { id: true, fullName: true } },
        toUser: { select: { id: true, fullName: true } },
      },
    });
  }

  async get(id: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async create(data: {
    title: string;
    prospectId: string;
    fromUserId: string;
    toUserId: string;
    priority?: string;
    notes?: string;
  }) {
    return this.prisma.ticket.create({
      data: {
        title: data.title,
        prospectId: data.prospectId,
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        priority: (data.priority as any) || 'medium',
        notes: data.notes,
        status: 'open',
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
  }) {
    await this.get(id);
    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.priority) updateData.priority = data.priority;
    if (data.progress !== undefined) updateData.progress = data.progress;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.title) updateData.title = data.title;
    if (data.status === 'resolved' || data.status === 'closed') {
      updateData.resolvedAt = new Date();
    }
    return this.prisma.ticket.update({ where: { id }, data: updateData });
  }

  async delete(id: string) {
    await this.get(id);
    return this.prisma.ticket.delete({ where: { id } });
  }
}
