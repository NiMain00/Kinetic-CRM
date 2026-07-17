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

  async getAllUserRoles() {
    return this.prisma.userRole.findMany({
      include: {
        user: { select: { id: true, username: true, fullName: true, email: true } },
        role: { select: { id: true, name: true } },
      },
    });
  }

  async getWorkflowStages() {
    return this.prisma.workflowStage.findMany({
      include: { slaConfig: true, stageDepartments: true },
    });
  }

  async getStageDepartments(stageId: string) {
    return this.prisma.workflowStageDepartment.findMany({
      where: { stageId },
    });
  }

  async setStageDepartments(
    stageId: string,
    assignments: { departmentCode: string; accessLevel: string }[],
  ) {
    await this.prisma.workflowStageDepartment.deleteMany({ where: { stageId } });
    if (assignments.length > 0) {
      await this.prisma.workflowStageDepartment.createMany({
        data: assignments.map((a) => ({
          stageId,
          departmentCode: a.departmentCode,
          accessLevel: a.accessLevel as any,
        })),
      });
    }
    return this.prisma.workflowStageDepartment.findMany({ where: { stageId } });
  }

  // ── Departments (OrgUnit) ──
  async getDepartments() {
    return this.prisma.orgUnit.findMany({ where: { deletedAt: null } });
  }

  async createDepartment(data: {
    code: string;
    name: string;
    description?: string;
    isActive?: boolean;
    unitType?: string;
  }) {
    return this.prisma.orgUnit.create({
      data: {
        code: data.code,
        name: data.name,
        unitType: (data.unitType as any) || 'department',
        isActive: data.isActive ?? true,
        description: data.description || null,
      },
    });
  }

  async updateDepartment(
    id: string,
    data: { code?: string; name?: string; description?: string; isActive?: boolean },
  ) {
    return this.prisma.orgUnit.update({
      where: { id },
      data: {
        ...(data.code !== undefined ? { code: data.code } : {}),
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
      },
    });
  }

  async deleteDepartment(id: string) {
    return this.prisma.orgUnit.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ── Roles ──
  async createRole(data: { name: string; description?: string }) {
    return this.prisma.role.create({
      data: { name: data.name, description: data.description ?? null },
      include: { rolePermissions: { include: { permission: true } } },
    });
  }

  async updateRole(id: string, data: { name?: string; description?: string }) {
    return this.prisma.role.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
      },
      include: { rolePermissions: { include: { permission: true } } },
    });
  }

  async deleteRole(id: string) {
    return this.prisma.role.delete({ where: { id } });
  }

  // ── Permissions ──
  async createPermission(data: {
    code: string;
    name: string;
    module: string;
    description?: string;
  }) {
    return this.prisma.permission.create({
      data: { code: data.code, name: data.name, module: data.module, description: data.description ?? null },
    });
  }

  async updatePermission(
    id: string,
    data: { code?: string; name?: string; module?: string; description?: string },
  ) {
    return this.prisma.permission.update({
      where: { id },
      data: {
        ...(data.code !== undefined ? { code: data.code } : {}),
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.module !== undefined ? { module: data.module } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
      },
    });
  }

  async deletePermission(id: string) {
    return this.prisma.permission.delete({ where: { id } });
  }

  // ── Workflow Stages ──
  async createStage(data: {
    code: string;
    name: string;
    module: string;
    sequence: number;
    ownerDepartmentCode: string;
    prevDepartmentCode?: string | null;
  }) {
    return this.prisma.workflowStage.create({
      data: {
        code: data.code,
        name: data.name,
        module: data.module,
        sequence: data.sequence,
        ownerDepartmentCode: data.ownerDepartmentCode,
        prevDepartmentCode: data.prevDepartmentCode ?? null,
      },
    });
  }

  async updateStage(
    id: string,
    data: {
      code?: string;
      name?: string;
      module?: string;
      sequence?: number;
      ownerDepartmentCode?: string;
      prevDepartmentCode?: string | null;
    },
  ) {
    return this.prisma.workflowStage.update({
      where: { id },
      data: {
        ...(data.code !== undefined ? { code: data.code } : {}),
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.module !== undefined ? { module: data.module } : {}),
        ...(data.sequence !== undefined ? { sequence: data.sequence } : {}),
        ...(data.ownerDepartmentCode !== undefined ? { ownerDepartmentCode: data.ownerDepartmentCode } : {}),
        ...(data.prevDepartmentCode !== undefined ? { prevDepartmentCode: data.prevDepartmentCode } : {}),
      },
    });
  }

  async deleteStage(id: string) {
    return this.prisma.workflowStage.delete({ where: { id } });
  }

  // ── Role Permissions (replace full set for a role) ──
  async setRolePermissions(
    roleId: string,
    assignments: {
      permissionId: string;
      scopeType?: string;
      scopeId?: string;
      accessLevel?: string;
    }[],
  ) {
    await this.prisma.rolePermission.deleteMany({ where: { roleId } });
    if (assignments.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: assignments.map((a) => ({
          roleId,
          permissionId: a.permissionId,
          scopeType: (a.scopeType as any) ?? 'global',
          scopeId: a.scopeId ?? null,
          accessLevel: (a.accessLevel as any) ?? 'write',
        })),
      });
    }
    return this.getRoles();
  }
}
