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
    let session = authCache.get<{ userId: string }>(cacheKey);
    if (!session) {
      const dbSession = await this.prisma.activeSession.findFirst({
        where: { userId: payload.sub, tokenJti: payload.jti, revokedAt: null },
        select: { userId: true },
      });
      if (dbSession) {
        session = dbSession;
        authCache.set(cacheKey, session);
      }
    }
    if (!session) {
      throw new UnauthorizedException('Sesi tidak valid atau sudah logout');
    }

    const userCacheKey = `user:${payload.sub}`;
    let user: any = authCache.get<any>(userCacheKey);
    if (!user) {
      const dbUser = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          orgUnit: true,
          userRoles: { include: { role: true } },
        },
      });
      if (dbUser) {
        user = dbUser;
        authCache.set(userCacheKey, user);
      }
    }
    if (!user || user.deletedAt || user.isLocked || user.status === 'inactive') {
      throw new UnauthorizedException('Akun tidak aktif');
    }

    const { passwordHash, ...safeUser } = user;
    return { ...safeUser, jti: payload.jti };
  }
}
