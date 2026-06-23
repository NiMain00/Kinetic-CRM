import { prisma } from '../config/database';

export class UserRepository {
  async findByUsername(username: string) {
    return prisma.user.findFirst({
      where: { username, deletedAt: null },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async updateLastLogin(id: string, ip: string) {
    return prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date(), lastLoginIp: ip },
    });
  }

  async incrementFailedLogin(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    const newCount = (user?.failedLoginCount || 0) + 1;
    const shouldLock = newCount >= 5;

    return prisma.user.update({
      where: { id },
      data: {
        failedLoginCount: newCount,
        ...(shouldLock && {
          isLocked: true,
          lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
        }),
      },
    });
  }

  async resetFailedLogin(id: string) {
    return prisma.user.update({
      where: { id },
      data: { failedLoginCount: 0, isLocked: false, lockedUntil: null },
    });
  }

  async unlock(id: string) {
    return prisma.user.update({
      where: { id },
      data: { isLocked: false, lockedUntil: null, failedLoginCount: 0 },
    });
  }

  async updatePasswordHash(id: string, passwordHash: string) {
    return prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }
}
