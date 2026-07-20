import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { authCache } from '../common/cache.util';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'change-me',
    });
  }

  async validate(payload: { sub: string; username: string; jti: string }) {
    const cacheKey = `session:${payload.jti}`;
    const cachedSession = authCache.get<{ userId: string }>(cacheKey);
    if (cachedSession) {
      // Session valid — try user cache next
      const cachedUser = authCache.get<any>(`user:${payload.sub}`);
      if (cachedUser) {
        return { ...cachedUser, jti: payload.jti };
      }
    }

    // Batch session + user lookup in a single query via Promise.all
    const [session, user] = await Promise.all([
      cachedSession
        ? Promise.resolve(cachedSession)
        : this.prisma.activeSession.findFirst({
            where: { userId: payload.sub, tokenJti: payload.jti, revokedAt: null },
            select: { userId: true },
          }),
      this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true, username: true, fullName: true, email: true,
          phone: true, avatarUrl: true, status: true, isLocked: true,
          orgUnitId: true, createdAt: true,
          orgUnit: { select: { id: true, name: true, code: true, unitType: true, parentId: true } },
          userRoles: { select: { id: true, roleId: true, scopeType: true, scopeId: true, role: { select: { id: true, name: true, description: true } } } },
        },
      }),
    ]);

    if (!session) {
      throw new UnauthorizedException('Sesi tidak valid atau sudah logout');
    }
    authCache.set(cacheKey, { userId: session.userId });

    if (!user || user.status === 'inactive' || user.isLocked) {
      throw new UnauthorizedException('Akun tidak aktif');
    }
    authCache.set(`user:${payload.sub}`, user);

    return { ...user, jti: payload.jti };
  }
}
