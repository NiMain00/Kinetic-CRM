import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from './config.service';

@UseGuards(AuthGuard('jwt'))
@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  // SLA Policies
  @Get('sla-policies')
  listSlaPolicies() {
    return this.configService.listSlaPolicies();
  }
  @Post('sla-policies')
  createSlaPolicy(@Body() dto: any) {
    return this.configService.createSlaPolicy(dto);
  }
  @Put('sla-policies/:id')
  updateSlaPolicy(@Param('id') id: string, @Body() dto: any) {
    return this.configService.updateSlaPolicy(id, dto);
  }
  @Delete('sla-policies/:id')
  deleteSlaPolicy(@Param('id') id: string) {
    return this.configService.deleteSlaPolicy(id);
  }

  // KPI Targets
  @Get('kpi-targets')
  listKpiTargets() {
    return this.configService.listKpiTargets();
  }
  @Post('kpi-targets')
  createKpiTarget(@Body() dto: any) {
    return this.configService.createKpiTarget(dto);
  }
  @Put('kpi-targets/:id')
  updateKpiTarget(@Param('id') id: string, @Body() dto: any) {
    return this.configService.updateKpiTarget(id, dto);
  }
  @Delete('kpi-targets/:id')
  deleteKpiTarget(@Param('id') id: string) {
    return this.configService.deleteKpiTarget(id);
  }

  // Connectors
  @Get('connectors')
  listConnectors() {
    return this.configService.listConnectors();
  }
  @Post('connectors')
  createConnector(@Body() dto: any) {
    return this.configService.createConnector(dto);
  }
  @Put('connectors/:id')
  updateConnector(@Param('id') id: string, @Body() dto: any) {
    return this.configService.updateConnector(id, dto);
  }
  @Delete('connectors/:id')
  deleteConnector(@Param('id') id: string) {
    return this.configService.deleteConnector(id);
  }

  // Org Units
  @Get('org-units')
  listOrgUnits() {
    return this.configService.listOrgUnits();
  }
  @Post('org-units')
  createOrgUnit(@Body() dto: any) {
    return this.configService.createOrgUnit(dto);
  }
  @Put('org-units/:id')
  updateOrgUnit(@Param('id') id: string, @Body() dto: any) {
    return this.configService.updateOrgUnit(id, dto);
  }
  @Delete('org-units/:id')
  deleteOrgUnit(@Param('id') id: string) {
    return this.configService.deleteOrgUnit(id);
  }

  // Project Phases
  @Get('project-phases')
  listProjectPhases() {
    return this.configService.listProjectPhases();
  }
  @Post('project-phases')
  createProjectPhase(@Body() dto: any) {
    return this.configService.createProjectPhase(dto);
  }
  @Put('project-phases/:id')
  updateProjectPhase(@Param('id') id: string, @Body() dto: any) {
    return this.configService.updateProjectPhase(id, dto);
  }
  @Delete('project-phases/:id')
  deleteProjectPhase(@Param('id') id: string) {
    return this.configService.deleteProjectPhase(id);
  }

  // Workflows
  @Get('workflows')
  listWorkflows() {
    return this.configService.listWorkflows();
  }
  @Put('workflows/:entityType')
  saveWorkflow(@Param('entityType') entityType: string, @Body() dto: { steps: any[] }) {
    return this.configService.saveWorkflow(entityType, dto.steps || []);
  }

  // Upload Config
  @Get('upload')
  getUploadConfig() {
    return this.configService.getUploadConfig();
  }
  @Put('upload')
  updateUploadConfig(@Body() dto: any) {
    return this.configService.updateUploadConfig(dto);
  }
}
