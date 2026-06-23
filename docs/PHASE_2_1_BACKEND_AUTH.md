# Phase 2.1 — Backend Authentication Implementation Plan

> **Status:** Ready to implement
> **Risk:** Medium — auth changes affect all protected routes
> **Estimated effort:** 2-3 days
> **Dependencies:** Phase 2.2 (Prisma schema) ✅ done

---

## Overview

Implement full backend authentication with JWT access tokens, refresh token rotation, session management, account lockout, and RBAC enforcement. This is the **critical path blocker** — all subsequent API endpoints depend on auth being functional.

---

## Files to Create/Modify

| # | File | Action | Lines (est.) |
|---|------|--------|:------------:|
| 1 | `backend/prisma/schema.prisma` | Edit | ~10 |
| 2 | `backend/src/repositories/user.repository.ts` | Rewrite | ~80 |
| 3 | `backend/src/repositories/session.repository.ts` | **New** | ~70 |
| 4 | `backend/src/services/token.service.ts` | **New** | ~60 |
| 5 | `backend/src/services/auth.service.ts` | Rewrite | ~180 |
| 6 | `backend/src/api/v1/auth.routes.ts` | Rewrite | ~80 |
| 7 | `backend/src/validators/auth.schema.ts` | Expand | ~20 |
| 8 | `backend/src/app.ts` | Edit | ~3 |
| 9 | `backend/prisma/seed.ts` | Rewrite | ~120 |
| 10 | `frontend/src/services/api-client.ts` | Edit | ~15 |

**Total:** ~640 lines across 10 files

---

## 1. Prisma Schema Changes

### File: `backend/prisma/schema.prisma`

#### User model — Add fields

```diff
 model User {
   id               String   @id @default(uuid()) @db.Char(36)
   name             String   @db.VarChar(150)
   username         String   @unique @db.VarChar(50)
   email            String   @unique @db.VarChar(150)
   passwordHash     String   @db.VarChar(255)
   roleId           String   @db.Char(36)
   branchId         String?  @db.Char(36)
   departmentId     String?  @db.Char(36)
   isActive         Boolean  @default(true)
   isLocked         Boolean  @default(false)
   failedLoginCount Int      @default(0)
+  lastLoginIp      String?  @db.VarChar(45)
   lastLoginAt      DateTime?
+  mustChangePassword Boolean @default(false)
   createdAt        DateTime @default(now())
   updatedAt        DateTime @updatedAt
   deletedAt        DateTime?
 }
```

#### ActiveSession model — Align with refresh token design

```diff
 model ActiveSession {
-  id         String    @id @default(uuid()) @db.Char(36)
-  userId     String    @db.Char(36)
-  tokenJti   String    @unique @db.VarChar(255)
-  ipAddress  String    @db.VarChar(45)
-  userAgent  String?   @db.Text
-  expiresAt  DateTime
-  revokedAt  DateTime?
-  createdAt  DateTime  @default(now())
+  id                String    @id @default(uuid()) @db.Char(36)
+  userId            String    @db.Char(36)
+  jti               String    @db.VarChar(255)
+  refreshTokenHash  String    @unique @db.VarChar(255)
+  ipAddress         String    @db.VarChar(45)
+  userAgent         String?   @db.Text
+  expiresAt         DateTime
+  revokedAt         DateTime?
+  createdAt         DateTime  @default(now())
 }
```

#### Migration

```bash
cd backend
npx prisma migrate dev --name add-auth-fields
npx prisma generate
```

---

## 2. User Repository

### File: `backend/src/repositories/user.repository.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { prisma } from '../config/database';

const userWithRole = {
  include: {
    Role: true,
  },
};

export class UserRepository {
  async findByUsername(username: string) {
    return prisma.user.findFirst({
      where: { username: { equals: username, mode: 'insensitive' }, deletedAt: null },
      ...userWithRole,
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      ...userWithRole,
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
          lockedUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
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
```

---

## 3. Session Repository

### File: `backend/src/repositories/session.repository.ts` (new)

```typescript
import { PrismaClient } from '@prisma/client';
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
    // Enforce max sessions — evict oldest if exceeded
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
    return prisma.activeSession.findFirst({ where: { jti } });
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
```

---

## 4. Token Service

### File: `backend/src/services/token.service.ts` (new)

```typescript
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';

export interface AuthPayload {
  sub: string;
  name: string;
  username: string;
  role: string;
  roleId: string;
  branchId?: string;
  departmentId?: string;
  permissions: string[];
  jti: string;
  iss: string;
}

const ACCESS_TOKEN_EXPIRY = '8h';
const REFRESH_TOKEN_BYTES = 64;

export class TokenService {
  generateAccessToken(user: any, permissions: string[]): string {
    const payload: AuthPayload = {
      sub: user.id,
      name: user.name,
      username: user.username,
      role: user.Role.code,
      roleId: user.roleId,
      branchId: user.branchId,
      departmentId: user.departmentId,
      permissions,
      jti: uuidv4(),
      iss: 'kinetic-crm-api',
    };

    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  }

  generateRefreshToken(): string {
    return crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
  }

  hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  verifyAccessToken(token: string): AuthPayload {
    return jwt.verify(token, env.JWT_SECRET) as AuthPayload;
  }

  getRefreshTokenExpiry(): Date {
    // 7 days
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
}
```

---

## 5. Auth Service

### File: `backend/src/services/auth.service.ts`

```typescript
import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/user.repository';
import { SessionRepository } from '../repositories/session.repository';
import { TokenService } from './token.service';
import { AppError } from '../utils/errors';
import { prisma } from '../config/database';

const BCRYPT_ROUNDS = 12;
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export class AuthService {
  private userRepo = new UserRepository();
  private sessionRepo = new SessionRepository();
  private tokenService = new TokenService();

  async login(username: string, password: string, ip: string, userAgent?: string) {
    // 1. Find user by username (case-insensitive)
    const user = await this.userRepo.findByUsername(username);
    if (!user) {
      throw new AppError(401, 'AUTH_INVALID_CREDENTIALS', 'Username atau password salah.');
    }

    // 2. Check if account is active
    if (!user.isActive) {
      throw new AppError(403, 'AUTH_ACCOUNT_INACTIVE', 'Akun tidak aktif. Hubungi administrator.');
    }

    // 3. Check if account is locked
    if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
      const remaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new AppError(423, 'AUTH_ACCOUNT_LOCKED', `Akun terkunci. Coba lagi dalam ${remaining} menit.`);
    }

    // 4. Verify password
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      // Increment failed login count
      const updated = await this.userRepo.incrementFailedLogin(user.id);
      const remaining = LOCKOUT_THRESHOLD - updated.failedLoginCount;
      if (remaining > 0) {
        throw new AppError(401, 'AUTH_INVALID_CREDENTIALS', `Username atau password salah. ${remaining} percobaan tersisa.`);
      } else {
        throw new AppError(423, 'AUTH_ACCOUNT_LOCKED', 'Akun terkunci karena terlalu banyak percobaan gagal. Coba lagi dalam 15 menit.');
      }
    }

    // 5. Reset failed login on success
    await this.userRepo.resetFailedLogin(user.id);
    await this.userRepo.updateLastLogin(user.id, ip);

    // 6. Load permissions from RolePermission table
    const permissions = await this.loadPermissions(user.roleId);

    // 7. Generate tokens
    const accessToken = this.tokenService.generateAccessToken(user, permissions);
    const refreshToken = this.tokenService.generateRefreshToken();
    const refreshTokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const expiresAt = this.tokenService.getRefreshTokenExpiry();

    // 8. Store session
    await this.sessionRepo.create({
      userId: user.id,
      refreshTokenHash,
      jti: this.tokenService.verifyAccessToken(accessToken).jti,
      ipAddress: ip,
      userAgent,
      expiresAt,
    });

    // 9. Return
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.Role.code,
        roleName: user.Role.name,
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

    const permissions = await this.loadPermissions(user.roleId);

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.Role.code,
      roleName: user.Role.name,
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

    const user = session.User;
    if (!user.isActive) {
      throw new AppError(403, 'AUTH_ACCOUNT_INACTIVE', 'Akun tidak aktif.');
    }

    // Load fresh permissions
    const permissions = await this.loadPermissions(user.roleId);

    // Revoke old session, create new one
    await this.sessionRepo.revokeByRefreshTokenHash(hash);

    const accessToken = this.tokenService.generateAccessToken(user, permissions);
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
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId },
      include: { Permission: true },
    });
    return rolePermissions.map((rp) => rp.Permission.code);
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
```

---

## 6. Auth Routes

### File: `backend/src/api/v1/auth.routes.ts`

```typescript
import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../../services/auth.service';
import { authMiddleware, AuthPayload } from '../../middleware/auth.middleware';
import { loginSchema } from '../../validators/auth.schema';
import { AppError } from '../../utils/errors';

const router = Router();
const authService = new AuthService();

// POST /login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = loginSchema.parse(req.body);
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'];

    const result = await authService.login(body.username, body.password, ip, userAgent);

    res.json({
      success: true,
      data: result,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        error: { code: err.errorCode, message: err.message },
      });
    }
    next(err);
  }
});

// POST /logout
router.post('/logout', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AppError(400, 'AUTH_REFRESH_MISSING', 'Refresh token diperlukan.');
    }
    await authService.logout(refreshToken);
    res.json({ success: true, data: { message: 'Logout berhasil.' } });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        error: { code: err.errorCode, message: err.message },
      });
    }
    next(err);
  }
});

// GET /me
router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req.user as AuthPayload).sub;
    const user = await authService.me(userId);
    res.json({ success: true, data: user });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        error: { code: err.errorCode, message: err.message },
      });
    }
    next(err);
  }
});

// POST /refresh
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AppError(400, 'AUTH_REFRESH_MISSING', 'Refresh token diperlukan.');
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'];

    const result = await authService.refresh(refreshToken, ip, userAgent);

    res.json({
      success: true,
      data: result,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        error: { code: err.errorCode, message: err.message },
      });
    }
    next(err);
  }
});

// POST /change-password
router.post('/change-password', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req.user as AuthPayload).sub;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError(400, 'AUTH_PASSWORD_MISSING', 'Password lama dan baru diperlukan.');
    }

    await authService.changePassword(userId, currentPassword, newPassword);

    res.json({ success: true, data: { message: 'Password berhasil diubah. Silakan login kembali.' } });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        error: { code: err.errorCode, message: err.message },
      });
    }
    next(err);
  }
});

export default router;
```

---

## 7. Auth Validators

### File: `backend/src/validators/auth.schema.ts`

```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi.'),
  password: z.string().min(1, 'Password wajib diisi.'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8, 'Password minimal 8 karakter.'),
  newPassword: z
    .string()
    .min(8, 'Password minimal 8 karakter.')
    .regex(/[A-Z]/, 'Password harus mengandung huruf besar.')
    .regex(/[a-z]/, 'Password harus mengandung huruf kecil.')
    .regex(/\d/, 'Password harus mengandung angka.'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token wajib diisi.'),
});
```

---

## 8. App Router Mount

### File: `backend/src/app.ts`

```diff
+ import authRoutes from './api/v1/auth.routes';

  // ... existing middleware setup ...

  app.use('/health', healthRoutes);
  app.use('/api/v1/health', healthRoutes);
+ app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/ai', aiRoutes);

  app.use(errorHandler);
```

---

## 9. Seed Data

### File: `backend/prisma/seed.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

// 5 System Roles
const ROLES = [
  { code: 'admin', name: 'Administrator' },
  { code: 'management', name: 'Management' },
  { code: 'pm', name: 'Project Manager' },
  { code: 'department', name: 'Reviewer Departemen' },
  { code: 'cabang', name: 'Staf Cabang' },
];

// ~40 Base Permissions
const PERMISSIONS = [
  // Prospects
  { code: 'prospects.read', resource: 'prospects', action: 'read', label: 'Lihat Prospek' },
  { code: 'prospects.create', resource: 'prospects', action: 'create', label: 'Buat Prospek' },
  { code: 'prospects.update', resource: 'prospects', action: 'update', label: 'Ubah Prospek' },
  { code: 'prospects.delete', resource: 'prospects', action: 'delete', label: 'Hapus Prospek' },
  { code: 'prospects.submit', resource: 'prospects', action: 'submit', label: 'Submit Prospek' },
  { code: 'prospects.approve', resource: 'prospects', action: 'approve', label: 'Setujui Prospek' },
  { code: 'prospects.reject', resource: 'prospects', action: 'reject', label: 'Tolak Prospek' },

  // Projects
  { code: 'projects.read', resource: 'projects', action: 'read', label: 'Lihat Proyek' },
  { code: 'projects.create', resource: 'projects', action: 'create', label: 'Buat Proyek' },
  { code: 'projects.update', resource: 'projects', action: 'update', label: 'Ubah Proyek' },
  { code: 'projects.cancel', resource: 'projects', action: 'cancel', label: 'Batalkan Proyek' },

  // RKS
  { code: 'projects.rks.read', resource: 'projects', action: 'rks.read', label: 'Lihat RKS' },
  { code: 'projects.rks.update', resource: 'projects', action: 'rks.update', label: 'Ubah RKS' },
  { code: 'projects.rks.submit', resource: 'projects', action: 'rks.submit', label: 'Submit RKS' },
  { code: 'projects.rks.approve', resource: 'projects', action: 'rks.approve', label: 'Setujui RKS' },
  { code: 'projects.rks.reject', resource: 'projects', action: 'rks.reject', label: 'Tolak RKS' },

  // LPHS/SIOS
  { code: 'projects.lphs.read', resource: 'projects', action: 'lphs.read', label: 'Lihat LPHS/SIOS' },
  { code: 'projects.lphs.update', resource: 'projects', action: 'lphs.update', label: 'Ubah LPHS/SIOS' },
  { code: 'projects.lphs.submit', resource: 'projects', action: 'lphs.submit', label: 'Submit LPHS/SIOS' },
  { code: 'projects.lphs.approve', resource: 'projects', action: 'lphs.approve', label: 'Setujui LPHS/SIOS' },

  // Approvals
  { code: 'approvals.read', resource: 'approvals', action: 'read', label: 'Lihat Approval' },
  { code: 'approvals.approve', resource: 'approvals', action: 'approve', label: 'Setujui' },
  { code: 'approvals.reject', resource: 'approvals', action: 'reject', label: 'Tolak' },
  { code: 'approvals.revise', resource: 'approvals', action: 'revise', label: 'Revisi' },
  { code: 'approvals.reassign', resource: 'approvals', action: 'reassign', label: 'Alihkan Approval' },

  // Reports
  { code: 'reports.read', resource: 'reports', action: 'read', label: 'Lihat Laporan' },
  { code: 'reports.export', resource: 'reports', action: 'export', label: 'Ekspor Laporan' },

  // KPI
  { code: 'kpi.read', resource: 'kpi', action: 'read', label: 'Lihat KPI' },
  { code: 'kpi.update', resource: 'kpi', action: 'update', label: 'Ubah KPI' },

  // Config
  { code: 'config.org.read', resource: 'config', action: 'org.read', label: 'Lihat Organisasi' },
  { code: 'config.org.update', resource: 'config', action: 'org.update', label: 'Ubah Organisasi' },
  { code: 'config.roles.read', resource: 'config', action: 'roles.read', label: 'Lihat Role' },
  { code: 'config.roles.update', resource: 'config', action: 'roles.update', label: 'Ubah Role' },

  // Admin / Users
  { code: 'admin.users.read', resource: 'admin', action: 'users.read', label: 'Lihat Pengguna' },
  { code: 'admin.users.create', resource: 'admin', action: 'users.create', label: 'Buat Pengguna' },
  { code: 'admin.users.update', resource: 'admin', action: 'users.update', label: 'Ubah Pengguna' },
  { code: 'admin.users.deactivate', resource: 'admin', action: 'users.deactivate', label: 'Nonaktifkan Pengguna' },

  // Documents
  { code: 'documents.read', resource: 'documents', action: 'read', label: 'Lihat Dokumen' },
  { code: 'documents.upload', resource: 'documents', action: 'upload', label: 'Unggah Dokumen' },
  { code: 'documents.download', resource: 'documents', action: 'download', label: 'Unduh Dokumen' },

  // Notifications
  { code: 'notifications.read', resource: 'notifications', action: 'read', label: 'Lihat Notifikasi' },

  // Audit
  { code: 'audit.read', resource: 'audit', action: 'read', label: 'Lihat Audit Log' },
];

// Role-Permission mapping
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: PERMISSIONS.map((p) => p.code), // Admin gets everything
  management: [
    'prospects.read', 'projects.read', 'projects.create', 'projects.update',
    'projects.rks.read', 'projects.lphs.read',
    'approvals.read', 'approvals.approve', 'approvals.reject',
    'reports.read', 'reports.export',
    'kpi.read',
    'documents.read', 'notifications.read', 'audit.read',
  ],
  pm: [
    'prospects.read', 'prospects.create', 'prospects.update', 'prospects.submit',
    'projects.read', 'projects.create', 'projects.update', 'projects.cancel',
    'projects.rks.read', 'projects.rks.update', 'projects.rks.submit',
    'projects.lphs.read', 'projects.lphs.update', 'projects.lphs.submit',
    'approvals.read', 'approvals.approve', 'approvals.reject', 'approvals.revise',
    'reports.read', 'reports.export',
    'kpi.read', 'kpi.update',
    'documents.read', 'documents.upload', 'documents.download',
    'notifications.read',
  ],
  department: [
    'prospects.read', 'projects.read',
    'projects.rks.read', 'projects.lphs.read', 'projects.lphs.update', 'projects.lphs.approve',
    'approvals.read', 'approvals.approve', 'approvals.reject', 'approvals.revise',
    'reports.read',
    'kpi.read',
    'documents.read', 'documents.upload', 'documents.download',
    'notifications.read',
  ],
  cabang: [
    'prospects.read', 'prospects.create', 'prospects.update', 'prospects.submit',
    'projects.read', 'projects.create', 'projects.update',
    'projects.rks.read', 'projects.rks.update', 'projects.rks.submit',
    'projects.lphs.read', 'projects.lphs.update',
    'reports.read',
    'documents.read', 'documents.upload', 'documents.download',
    'notifications.read',
  ],
};

async function main() {
  console.log('Seeding database...');

  // 1. Seed Roles
  const roleMap: Record<string, string> = {};
  for (const role of ROLES) {
    const existing = await prisma.role.findUnique({ where: { code: role.code } });
    if (existing) {
      roleMap[role.code] = existing.id;
    } else {
      const created = await prisma.role.create({
        data: { ...role, id: uuidv4(), isSystemDefault: true },
      });
      roleMap[role.code] = created.id;
    }
  }
  console.log(`  Seeded ${ROLES.length} roles`);

  // 2. Seed Permissions
  const permMap: Record<string, string> = {};
  for (const perm of PERMISSIONS) {
    const existing = await prisma.permission.findUnique({ where: { code: perm.code } });
    if (existing) {
      permMap[perm.code] = existing.id;
    } else {
      const created = await prisma.permission.create({
        data: { ...perm, id: uuidv4() },
      });
      permMap[perm.code] = created.id;
    }
  }
  console.log(`  Seeded ${PERMISSIONS.length} permissions`);

  // 3. Seed Role-Permission mappings
  let rpCount = 0;
  for (const [roleCode, permCodes] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleMap[roleCode];
    for (const permCode of permCodes) {
      const permissionId = permMap[permCode];
      if (!permissionId) continue;

      const existing = await prisma.rolePermission.findFirst({
        where: { roleId, permissionId },
      });
      if (!existing) {
        await prisma.rolePermission.create({
          data: { id: uuidv4(), roleId, permissionId },
        });
        rpCount++;
      }
    }
  }
  console.log(`  Seeded ${rpCount} role-permission mappings`);

  // 4. Seed Admin User
  const adminUsername = 'admin';
  const existingAdmin = await prisma.user.findUnique({ where: { username: adminUsername } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin123!', BCRYPT_ROUNDS);
    await prisma.user.create({
      data: {
        id: uuidv4(),
        name: 'Administrator',
        username: adminUsername,
        email: 'admin@kinetic-crm.com',
        passwordHash,
        roleId: roleMap['admin'],
        isActive: true,
        isLocked: false,
        mustChangePassword: false,
      },
    });
    console.log('  Seeded admin user (admin / Admin123!)');
  } else {
    console.log('  Admin user already exists, skipping');
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

---

## 10. Frontend API Client — Refresh Interceptor

### File: `frontend/src/services/api-client.ts`

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — attempt refresh token flow
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh for login/refresh endpoints
    if (
      originalRequest.url === '/auth/login' ||
      originalRequest.url === '/auth/refresh' ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        // No refresh token — force logout
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = data.data;

        localStorage.setItem('auth_token', accessToken);
        localStorage.setItem('refresh_token', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed — force logout
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## Post-Implementation Verification

### Step-by-step testing

```bash
# 1. Run migration
cd backend
npx prisma migrate dev --name add-auth-fields
npx prisma generate

# 2. Seed database
npm run db:seed

# 3. Start backend
npm run dev

# 4. Test login
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}'

# Expected: { success: true, data: { accessToken, refreshToken, user: {...} } }

# 5. Test /me (use token from login response)
curl -X GET http://localhost:4000/api/v1/auth/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# Expected: { success: true, data: { id, name, username, role, permissions, ... } }

# 6. Test /refresh (use refreshToken from login response)
curl -X POST http://localhost:4000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<REFRESH_TOKEN>"}'

# Expected: { success: true, data: { accessToken, refreshToken } }

# 7. Test /change-password
curl -X POST http://localhost:4000/api/v1/auth/change-password \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"Admin123!","newPassword":"NewPass123!"}'

# 8. Test account lockout (5 failed logins)
for i in {1..6}; do
  curl -X POST http://localhost:4000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"wrong"}'
done

# Expected: 5th attempt returns 423 AUTH_ACCOUNT_LOCKED

# 9. Type check
npx tsc --noEmit
```

---

## Rollback Plan

If auth implementation causes issues:

1. **Quick rollback:** Comment out `app.use('/api/v1/auth', authRoutes)` in `app.ts`
2. **Database rollback:** `npx prisma migrate reset` (loses all data)
3. **Code rollback:** `git checkout -- src/api/v1/auth.routes.ts src/services/auth.service.ts`

---

## API Response Formats

### POST /api/v1/auth/login — Success
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "a1b2c3d4e5f6...",
    "user": {
      "id": "uuid",
      "name": "Administrator",
      "username": "admin",
      "email": "admin@kinetic-crm.com",
      "role": "admin",
      "roleName": "Administrator",
      "branchId": null,
      "departmentId": null,
      "mustChangePassword": false
    }
  },
  "meta": {
    "requestId": "req_1719000000000",
    "timestamp": "2025-06-22T00:00:00.000Z"
  }
}
```

### POST /api/v1/auth/login — Error
```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Username atau password salah. 3 percobaan tersisa."
  }
}
```

### GET /api/v1/auth/me — Success
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Administrator",
    "username": "admin",
    "email": "admin@kinetic-crm.com",
    "role": "admin",
    "roleName": "Administrator",
    "branchId": null,
    "departmentId": null,
    "mustChangePassword": false,
    "permissions": ["prospects.read", "prospects.create", "..."]
  }
}
```

---

## Auth Error Codes Reference

| HTTP | Code | Condition |
|------|------|-----------|
| 400 | `AUTH_WEAK_PASSWORD` | Password doesn't meet complexity requirements |
| 400 | `AUTH_PASSWORD_MISSING` | Missing currentPassword or newPassword |
| 400 | `AUTH_REFRESH_MISSING` | Missing refreshToken in body |
| 401 | `AUTH_INVALID_CREDENTIALS` | Wrong username or password |
| 401 | `AUTH_TOKEN_MISSING` | No Authorization header (from middleware) |
| 401 | `AUTH_TOKEN_INVALID` | Invalid/expired JWT (from middleware) |
| 401 | `AUTH_REFRESH_INVALID` | Refresh token not found or revoked |
| 401 | `AUTH_REFRESH_EXPIRED` | Refresh token expired |
| 403 | `AUTH_ACCOUNT_INACTIVE` | User account is disabled |
| 404 | `USER_NOT_FOUND` | User not found in DB |
| 423 | `AUTH_ACCOUNT_LOCKED` | Too many failed attempts, locked 15 min |

---

## Dependency Graph

```
Phase 2.1 (Auth) ← YOU ARE HERE
  │
  ├── repositories/user.repository.ts
  ├── repositories/session.repository.ts    (new)
  ├── services/token.service.ts             (new)
  ├── services/auth.service.ts              (depends on above 3)
  ├── api/v1/auth.routes.ts                 (depends on auth.service)
  ├── validators/auth.schema.ts             (standalone)
  ├── app.ts                                (mounts routes)
  ├── prisma/schema.prisma                  (schema changes)
  ├── prisma/seed.ts                        (depends on schema)
  └── frontend/src/services/api-client.ts   (standalone)
```
