import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(username: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }],
        deletedAt: null,
      },
      include: {
        orgUnit: true,
        userRoles: { include: { role: true } },
      },
    });

    if (!user || user.status === 'inactive' || user.isLocked) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: { increment: 1 } },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lastLoginAt: new Date() },
    });

    const payload = { sub: user.id, username: user.username };
    const token = this.jwtService.sign(payload);

    await this.prisma.activeSession.create({
      data: {
        userId: user.id,
        tokenJti: token,
        ipAddress: '',
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
      },
    });

    return { token, user };
  }

  async logout(userId: string, tokenJti: string) {
    await this.prisma.activeSession.updateMany({
      where: { userId, tokenJti, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        orgUnit: true,
        userRoles: {
          include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
        },
      },
    });
  }
}
