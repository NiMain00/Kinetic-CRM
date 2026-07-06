import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  async getRoles() {
    return this.prisma.role.findMany({
      include: {
        rolePermissions: { include: { permission: true } },
      },
    });
  }

  async getPermissions() {
    return this.prisma.permission.findMany();
  }

  async assignRole(userId: string, roleId: string, scopeType: string, scopeId?: string) {
    // Pastikan roleId valid
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException(`Role ${roleId} not found`);
    }
    return this.prisma.userRole.create({
      data: { userId, roleId, scopeType: scopeType as any, scopeId },
    });
  }

  async removeUserRole(userRoleId: string) {
    return this.prisma.userRole.delete({ where: { id: userRoleId } });
  }

  async getUserRoles(userId: string) {
    return this.prisma.userRole.findMany({
      where: { userId },
      include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
    });
  }

  async getWorkflowStages() {
    return this.prisma.workflowStage.findMany({
      include: { slaConfig: true },
    });
  }
}
