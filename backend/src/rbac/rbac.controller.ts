import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
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

  @Get('users/:userId/roles')
  async getUserRoles(@Param('userId') userId: string) {
    return this.rbacService.getUserRoles(userId);
  }

  @Get('workflow-stages')
  async getWorkflowStages() {
    return this.rbacService.getWorkflowStages();
  }
}
