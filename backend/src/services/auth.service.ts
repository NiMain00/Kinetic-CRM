import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/user.repository';
import { SessionRepository } from '../repositories/session.repository';
import { TokenService } from './token.service';
import { AppError } from '../utils/errors';
import { prisma } from '../config/database';

const BCRYPT_ROUNDS = 12;
const LOCKOUT_THRESHOLD = 5;

export class AuthService {
  private userRepo = new UserRepository();
  private sessionRepo = new SessionRepository();
  private tokenService = new TokenService();

  async login(username: string, password: string, ip: string, userAgent?: string) {
    const user = await this.userRepo.findByUsername(username);
    if (!user) {
      throw new AppError(401, 'AUTH_INVALID_CREDENTIALS', 'Username atau password salah.');
    }

    if (!user.isActive) {
      throw new AppError(403, 'AUTH_ACCOUNT_INACTIVE', 'Akun tidak aktif. Hubungi administrator.');
    }

    if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
      const remaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new AppError(423, 'AUTH_ACCOUNT_LOCKED', `Akun terkunci. Coba lagi dalam ${remaining} menit.`);
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      const updated = await this.userRepo.incrementFailedLogin(user.id);
      const remaining = LOCKOUT_THRESHOLD - updated.failedLoginCount;
      if (remaining > 0) {
        throw new AppError(401, 'AUTH_INVALID_CREDENTIALS', `Username atau password salah. ${remaining} percobaan tersisa.`);
      }
      throw new AppError(423, 'AUTH_ACCOUNT_LOCKED', 'Akun terkunci karena terlalu banyak percobaan gagal. Coba lagi dalam 15 menit.');
    }

    await this.userRepo.resetFailedLogin(user.id);
    await this.userRepo.updateLastLogin(user.id, ip);

    const role = await prisma.role.findUnique({ where: { id: user.roleId } });
    if (!role) {
      throw new AppError(500, 'INTERNAL_ERROR', 'Role pengguna tidak ditemukan.');
    }

    const permissions = await this.loadPermissions(user.roleId);
    const accessToken = this.tokenService.generateAccessToken(user, role.code, permissions);
    const refreshToken = this.tokenService.generateRefreshToken();
    const refreshTokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const expiresAt = this.tokenService.getRefreshTokenExpiry();

    await this.sessionRepo.create({
      userId: user.id,
      refreshTokenHash,
      jti: this.tokenService.verifyAccessToken(accessToken).jti,
      ipAddress: ip,
      userAgent,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: role.code,
        roleName: role.name,
        branchId: user.branchId,
        departmentId: user.departmentId,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  async logout(refreshToken: string) {
    const hash = this.tokenService.hashRefreshToken(refreshToken);
    await this.sessionRepo.revokeByRefreshTokenHash(hash);
  }

  async me(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Pengguna tidak ditemukan.');
    }

    const role = await prisma.role.findUnique({ where: { id: user.roleId } });
    const permissions = await this.loadPermissions(user.roleId);

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: role?.code || '',
      roleName: role?.name || '',
      branchId: user.branchId,
      departmentId: user.departmentId,
      mustChangePassword: user.mustChangePassword,
      permissions,
    };
  }

  async refresh(refreshToken: string, ip: string, userAgent?: string) {
    const hash = this.tokenService.hashRefreshToken(refreshToken);
    const session = await this.sessionRepo.findByRefreshTokenHash(hash);

    if (!session || session.revokedAt) {
      throw new AppError(401, 'AUTH_REFRESH_INVALID', 'Refresh token tidak valid.');
    }

    if (session.expiresAt < new Date()) {
      throw new AppError(401, 'AUTH_REFRESH_EXPIRED', 'Refresh token sudah kedaluwarsa.');
    }

    const user = await this.userRepo.findById(session.userId);
    if (!user || !user.isActive) {
      throw new AppError(403, 'AUTH_ACCOUNT_INACTIVE', 'Akun tidak aktif.');
    }

    const role = await prisma.role.findUnique({ where: { id: user.roleId } });
    const permissions = await this.loadPermissions(user.roleId);
    await this.sessionRepo.revokeByRefreshTokenHash(hash);

    const accessToken = this.tokenService.generateAccessToken(user, role?.code || '', permissions);
    const newRefreshToken = this.tokenService.generateRefreshToken();
    const newRefreshTokenHash = this.tokenService.hashRefreshToken(newRefreshToken);
    const expiresAt = this.tokenService.getRefreshTokenExpiry();

    await this.sessionRepo.create({
      userId: user.id,
      refreshTokenHash: newRefreshTokenHash,
      jti: this.tokenService.verifyAccessToken(accessToken).jti,
      ipAddress: ip,
      userAgent,
      expiresAt,
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Pengguna tidak ditemukan.');
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new AppError(401, 'AUTH_INVALID_CREDENTIALS', 'Password saat ini salah.');
    }

    this.validatePasswordStrength(newPassword);

    const hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.userRepo.updatePasswordHash(userId, hash);
    await this.sessionRepo.revokeAllForUser(userId);
  }

  private async loadPermissions(roleId: string): Promise<string[]> {
    const mappings = await prisma.rolePermission.findMany({
      where: { roleId },
    });
    const permissionIds = mappings.map((m) => m.permissionId);
    if (permissionIds.length === 0) return [];
    const permissions = await prisma.permission.findMany({
      where: { id: { in: permissionIds } },
    });
    return permissions.map((p) => p.code);
  }

  private validatePasswordStrength(password: string) {
    if (password.length < 8) {
      throw new AppError(400, 'AUTH_WEAK_PASSWORD', 'Password minimal 8 karakter.');
    }
    if (!/[A-Z]/.test(password)) {
      throw new AppError(400, 'AUTH_WEAK_PASSWORD', 'Password harus mengandung huruf besar.');
    }
    if (!/[a-z]/.test(password)) {
      throw new AppError(400, 'AUTH_WEAK_PASSWORD', 'Password harus mengandung huruf kecil.');
    }
    if (!/\d/.test(password)) {
      throw new AppError(400, 'AUTH_WEAK_PASSWORD', 'Password harus mengandung angka.');
    }
  }
}
