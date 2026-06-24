import { prisma } from '../config/database';
import { AppError } from '../utils/errors';

export class NotificationService {
  async list(params: { userId: string; page: number; perPage: number; unreadOnly?: boolean }) {
    const where: any = { recipientUserId: params.userId };
    if (params.unreadOnly) where.isRead = false;

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: (params.page - 1) * params.perPage,
        take: params.perPage,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
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

  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { recipientUserId: userId, isRead: false },
    });
  }

  async markRead(id: string, userId: string) {
    const notif = await prisma.notification.findUnique({ where: { id } });
    if (!notif || notif.recipientUserId !== userId) {
      throw new AppError(404, 'NOTIFICATION_NOT_FOUND', 'Notifikasi tidak ditemukan.');
    }

    return prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    await prisma.notification.updateMany({
      where: { recipientUserId: userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }}
