import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, params: { page?: number; perPage?: number; type?: string; read?: boolean }) {
    const where: any = { recipientUserId: userId };
    if (params.type) where.type = params.type;
    if (params.read !== undefined) where.read = params.read;

    const page = params.page || 1;
    const perPage = params.perPage || 20;

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { data, total, page, perPage };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { recipientUserId: userId, read: false },
    });
    return { count };
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, recipientUserId: userId },
      data: { read: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { recipientUserId: userId, read: false },
      data: { read: true, readAt: new Date() },
    });
  }

  async create(data: {
    recipientUserId: string;
    title: string;
    message: string;
    type: string;
    entityId?: string;
    entityType?: string;
    icon?: string;
  }) {
    return this.prisma.notification.create({ data: data as any });
  }

  async delete(id: string, userId: string) {
    // Only allow the recipient to delete their own notification.
    return this.prisma.notification.deleteMany({
      where: { id, recipientUserId: userId },
    });
  }
}
