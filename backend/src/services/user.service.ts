import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { AppError } from '../utils/errors';

const BCRYPT_ROUNDS = 12;

export class UserService {
  async list(params: {
    search?: string;
    role?: string;
    branchId?: string;
    isActive?: boolean;
    page: number;
    perPage: number;
  }) {
    const where: any = { deletedAt: null };

    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { username: { contains: params.search } },
        { email: { contains: params.search } },
      ];
    }
    if (params.role) {
      where.Role = { code: params.role };
    }
    if (params.branchId) {
      where.branchId = params.branchId;
    }
    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (params.page - 1) * params.perPage,
        take: params.perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          Role: { select: { id: true, code: true, name: true } },
          branch: { select: { id: true, name: true, code: true } },
          department: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users.map((u) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        role: u.Role,
        branch: u.branch,
        department: u.department,
        isActive: u.isActive,
        isLocked: u.isLocked,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
      })),
      pagination: {
        page: params.page,
        perPage: params.perPage,
        totalItems: total,
        totalPages: Math.ceil(total / params.perPage),
      },
    };
  }

  async get(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        Role: { select: { id: true, code: true, name: true } },
        branch: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true, code: true } },
        userPositions: { include: { position: { select: { id: true, name: true } } } },
      },
    });

    if (!user || user.deletedAt) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Pengguna tidak ditemukan.');
    }

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.Role,
      branch: user.branch,
      department: user.department,
      positions: user.userPositions.map((up: any) => up.position),
      isActive: user.isActive,
      isLocked: user.isLocked,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }

  async create(data: {
    name: string;
    username: string;
    email: string;
    password: string;
    roleId?: string;
    role?: string;
    branchId?: string | null;
    departmentId?: string | null;
    isActive?: boolean;
  }) {
    const existingUsername = await prisma.user.findUnique({ where: { username: data.username } });
    if (existingUsername) {
      throw new AppError(409, 'USER_USERNAME_EXISTS', 'Username sudah digunakan.');
    }

    const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingEmail) {
      throw new AppError(409, 'USER_EMAIL_EXISTS', 'Email sudah digunakan.');
    }

    let roleId = data.roleId;
    if (!roleId && data.role) {
      const roleRecord = await prisma.role.findFirst({ where: { code: data.role } });
      if (roleRecord) roleId = roleRecord.id;
    }
    if (!roleId) {
      const defaultRole = await prisma.role.findFirst({ where: { code: 'cabang' } });
      roleId = defaultRole!.id;
    }

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        email: data.email,
        passwordHash,
        roleId,
        branchId: data.branchId || null,
        departmentId: data.departmentId || null,
        isActive: data.isActive !== false,
        isLocked: false,
        mustChangePassword: true,
      },
      include: {
        Role: { select: { id: true, code: true, name: true } },
        branch: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true, code: true } },
      },
    });

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.Role,
      branch: user.branch,
      department: user.department,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  async update(id: string, data: {
    name?: string;
    email?: string;
    roleId?: string;
    branchId?: string | null;
    departmentId?: string | null;
    isActive?: boolean;
  }) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Pengguna tidak ditemukan.');
    }

    if (data.email && data.email !== user.email) {
      const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
      if (existingEmail) {
        throw new AppError(409, 'USER_EMAIL_EXISTS', 'Email sudah digunakan.');
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.roleId !== undefined && { roleId: data.roleId }),
        ...(data.branchId !== undefined && { branchId: data.branchId }),
        ...(data.departmentId !== undefined && { departmentId: data.departmentId }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        Role: { select: { id: true, code: true, name: true } },
        branch: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true, code: true } },
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      username: updated.username,
      email: updated.email,
      role: updated.Role,
      branch: updated.branch,
      department: updated.department,
      isActive: updated.isActive,
    };
  }

  async resetPassword(id: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Pengguna tidak ditemukan.');
    }
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await prisma.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword: true },
    });
  }

  async setLock(id: string, locked: boolean) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Pengguna tidak ditemukan.');
    }
    await prisma.user.update({
      where: { id },
      data: { isLocked: locked },
    });
    if (locked) {
      await prisma.activeSession.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }

  async deactivate(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Pengguna tidak ditemukan.');
    }

    await prisma.activeSession.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await prisma.userPosition.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });
  }
}
