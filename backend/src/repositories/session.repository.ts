import { prisma } from '../config/database';

interface CreateSessionData {
  userId: string;
  refreshTokenHash: string;
  jti: string;
  ipAddress: string;
  userAgent?: string;
  expiresAt: Date;
}

const MAX_SESSIONS_PER_USER = 3;

export class SessionRepository {
  async create(data: CreateSessionData) {
    const activeCount = await this.countActiveForUser(data.userId);
    if (activeCount >= MAX_SESSIONS_PER_USER) {
      await this.deleteOldestForUser(data.userId);
    }

    return prisma.activeSession.create({ data });
  }

  async findByRefreshTokenHash(refreshTokenHash: string) {
    return prisma.activeSession.findUnique({
      where: { refreshTokenHash },
      include: { User: true },
    });
  }

  async findByJti(jti: string) {
    return prisma.activeSession.findFirst({ where: { jti, revokedAt: null } });
  }

  async revokeByRefreshTokenHash(refreshTokenHash: string) {
    return prisma.activeSession.updateMany({
      where: { refreshTokenHash },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string) {
    return prisma.activeSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async countActiveForUser(userId: string) {
    return prisma.activeSession.count({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    });
  }

  async deleteOldestForUser(userId: string) {
    const oldest = await prisma.activeSession.findFirst({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    if (oldest) {
      await prisma.activeSession.delete({ where: { id: oldest.id } });
    }
  }

  async cleanupExpired() {
    return prisma.activeSession.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}
