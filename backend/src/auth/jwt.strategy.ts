import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

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
    const session = await this.prisma.activeSession.findFirst({
      where: { userId: payload.sub, tokenJti: payload.jti, revokedAt: null },
    });
    if (!session) {
      throw new UnauthorizedException('Sesi tidak valid atau sudah logout');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.deletedAt || user.isLocked || user.status === 'inactive') {
      throw new UnauthorizedException('Akun tidak aktif');
    }

    const { passwordHash, ...safeUser } = user;
    return { ...safeUser, jti: payload.jti };
  }
}
