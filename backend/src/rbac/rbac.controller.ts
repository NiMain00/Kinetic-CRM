import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RbacService } from './rbac.service';

@UseGuards(AuthGuard('jwt'))
@Controller('rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('roles')
  async getRoles() {
    return this.rbacService.getRoles();
  }

  @Get('permissions')
  async getPermissions() {
    return this.rbacService.getPermissions();
  }

  @Post('user-roles')
  async assignRole(@Body() dto: { userId: string; roleId: string; scopeType: string; scopeId?: string }) {
    return this.rbacService.assignRole(dto.userId, dto.roleId, dto.scopeType, dto.scopeId);
  }

  @Delete('user-roles/:id')
  async removeUserRole(@Param('id') id: string) {
    return this.rbacService.removeUserRole(id);
  }

  @Get('user-roles')
  async getAllUserRoles() {
    return this.rbacService.getAllUserRoles();
  }

  @Get('users/:userId/roles')
  async getUserRoles(@Param('userId') userId: string) {
    return this.rbacService.getUserRoles(userId);
  }

  @Get('workflow-stages')
  async getWorkflowStages() {
    return this.rbacService.getWorkflowStages();
  }

  @Get('departments')
  async getDepartments() {
    return this.rbacService.getDepartments();
  }

  @Post('departments')
  async createDepartment(@Body() dto: { code: string; name: string; description?: string; isActive?: boolean; unitType?: string }) {
    return this.rbacService.createDepartment(dto);
  }

  @Put('departments/:id')
  async updateDepartment(
    @Param('id') id: string,
    @Body() dto: { code?: string; name?: string; description?: string; isActive?: boolean },
  ) {
    return this.rbacService.updateDepartment(id, dto);
  }

  @Delete('departments/:id')
  async deleteDepartment(@Param('id') id: string) {
    return this.rbacService.deleteDepartment(id);
  }

  @Post('roles')
  async createRole(@Body() dto: { name: string; description?: string }) {
    return this.rbacService.createRole(dto);
  }

  @Put('roles/:id')
  async updateRole(@Param('id') id: string, @Body() dto: { name?: string; description?: string }) {
    return this.rbacService.updateRole(id, dto);
  }

  @Delete('roles/:id')
  async deleteRole(@Param('id') id: string) {
    return this.rbacService.deleteRole(id);
  }

  @Put('roles/:id/permissions')
  async setRolePermissions(
    @Param('id') id: string,
    @Body() dto: { permissions: { permissionId: string; scopeType?: string; scopeId?: string; accessLevel?: string }[] },
  ) {
    return this.rbacService.setRolePermissions(id, dto.permissions || []);
  }

  @Post('permissions')
  async createPermission(@Body() dto: { code: string; name: string; module: string; description?: string }) {
    return this.rbacService.createPermission(dto);
  }

  @Put('permissions/:id')
  async updatePermission(
    @Param('id') id: string,
    @Body() dto: { code?: string; name?: string; module?: string; description?: string },
  ) {
    return this.rbacService.updatePermission(id, dto);
  }

  @Delete('permissions/:id')
  async deletePermission(@Param('id') id: string) {
    return this.rbacService.deletePermission(id);
  }

  @Post('workflow-stages')
  async createStage(
    @Body() dto: { code: string; name: string; module: string; sequence: number; ownerDepartmentCode: string; prevDepartmentCode?: string | null },
  ) {
    return this.rbacService.createStage(dto);
  }

  @Put('workflow-stages/:id')
  async updateStage(
    @Param('id') id: string,
    @Body() dto: { code?: string; name?: string; module?: string; sequence?: number; ownerDepartmentCode?: string; prevDepartmentCode?: string | null },
  ) {
    return this.rbacService.updateStage(id, dto);
  }

  @Delete('workflow-stages/:id')
  async deleteStage(@Param('id') id: string) {
    return this.rbacService.deleteStage(id);
  }
}
