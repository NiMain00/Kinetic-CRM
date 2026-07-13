import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const CONNECTOR_TYPE_MAP: Record<string, string> = {
  'Cloud Storage': 'Cloud_Storage',
  Cloud_Storage: 'Cloud_Storage',
};

function normalizeConnectorType(type: string): string {
  return CONNECTOR_TYPE_MAP[type] ?? type;
}

@Injectable()
export class ConfigService {
  constructor(private readonly prisma: PrismaService) {}

  // ── SLA Policies ──
  listSlaPolicies() {
    return this.prisma.slaPolicy.findMany();
  }
  createSlaPolicy(data: {
    name: string;
    entityType: string;
    warningThreshold: number;
    criticalThreshold: number;
    unit: string;
    escalationRole: string;
    active?: boolean;
  }) {
    return this.prisma.slaPolicy.create({ data });
  }
  updateSlaPolicy(
    id: string,
    data: Partial<{
      name: string;
      entityType: string;
      warningThreshold: number;
      criticalThreshold: number;
      unit: string;
      escalationRole: string;
      active: boolean;
    }>,
  ) {
    return this.prisma.slaPolicy.update({ where: { id }, data });
  }
  deleteSlaPolicy(id: string) {
    return this.prisma.slaPolicy.delete({ where: { id } });
  }

  // ── KPI Targets ──
  listKpiTargets() {
    return this.prisma.kpiTarget.findMany();
  }
  createKpiTarget(data: {
    name: string;
    category: string;
    targetValue: number;
    actualValue?: number;
    unit: string;
    period: string;
    description?: string;
  }) {
    return this.prisma.kpiTarget.create({ data });
  }
  updateKpiTarget(
    id: string,
    data: Partial<{
      name: string;
      category: string;
      targetValue: number;
      actualValue: number;
      unit: string;
      period: string;
      description: string;
    }>,
  ) {
    return this.prisma.kpiTarget.update({ where: { id }, data });
  }
  deleteKpiTarget(id: string) {
    return this.prisma.kpiTarget.delete({ where: { id } });
  }

  // ── Connectors ──
  listConnectors() {
    return this.prisma.connector.findMany();
  }
  createConnector(data: {
    name: string;
    type: string;
    description?: string;
    status?: string;
    active?: boolean;
    lastTested?: string;
    configJson?: string;
  }) {
    return this.prisma.connector.create({
      data: { ...data, type: normalizeConnectorType(data.type) } as any,
    });
  }
  updateConnector(
    id: string,
    data: Partial<{
      name: string;
      type: string;
      description: string;
      status: string;
      active: boolean;
      lastTested: string;
      configJson: string;
    }>,
  ) {
    const payload: any = { ...data };
    if (payload.type) payload.type = normalizeConnectorType(payload.type);
    return this.prisma.connector.update({ where: { id }, data: payload });
  }
  deleteConnector(id: string) {
    return this.prisma.connector.delete({ where: { id } });
  }

  // ── Org Units ──
  listOrgUnits() {
    return this.prisma.orgUnit.findMany({ where: { deletedAt: null } });
  }
  createOrgUnit(data: {
    code: string;
    name: string;
    unitType: string;
    parentId?: string | null;
    city?: string;
    province?: string;
    address?: string;
    phone?: string;
    isActive?: boolean;
    sortOrder?: number;
  }) {
    return this.prisma.orgUnit.create({ data: { ...data, unitType: data.unitType as any } });
  }
  updateOrgUnit(
    id: string,
    data: Partial<{
      code: string;
      name: string;
      unitType: string;
      parentId: string | null;
      city: string;
      province: string;
      address: string;
      phone: string;
      isActive: boolean;
      sortOrder: number;
    }>,
  ) {
    const payload: any = { ...data };
    if (payload.unitType) payload.unitType = payload.unitType;
    return this.prisma.orgUnit.update({ where: { id }, data: payload });
  }
  deleteOrgUnit(id: string) {
    return this.prisma.orgUnit.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ── Project Phases ──
  listProjectPhases() {
    return this.prisma.projectPhase.findMany({ orderBy: { order: 'asc' } });
  }
  createProjectPhase(data: {
    status: string;
    phase: string;
    order?: number;
    isActive?: boolean;
  }) {
    return this.prisma.projectPhase.create({ data });
  }
  updateProjectPhase(
    id: string,
    data: Partial<{ status: string; phase: string; order: number; isActive: boolean }>,
  ) {
    return this.prisma.projectPhase.update({ where: { id }, data });
  }
  deleteProjectPhase(id: string) {
    return this.prisma.projectPhase.delete({ where: { id } });
  }

  // ── Workflows (grouped by entityType) ──
  async listWorkflows() {
    const steps = await this.prisma.workflowStep.findMany({ orderBy: { order: 'asc' } });
    const groups: Record<string, any[]> = {};
    for (const s of steps) {
      if (!groups[s.entityType]) groups[s.entityType] = [];
      groups[s.entityType].push(s);
    }
    return Object.entries(groups).map(([entityType, steps]) => ({ entityType, steps }));
  }
  async saveWorkflow(
    entityType: string,
    steps: {
      id?: string;
      name: string;
      order: number;
      description?: string;
      assigneeRole: string;
      isRequired?: boolean;
      isActive?: boolean;
    }[],
  ) {
    await this.prisma.workflowStep.deleteMany({ where: { entityType } });
    if (steps.length > 0) {
      await this.prisma.workflowStep.createMany({
        data: steps.map((s) => ({
          entityType,
          name: s.name,
          order: s.order,
          description: s.description ?? null,
          assigneeRole: s.assigneeRole,
          isRequired: s.isRequired ?? true,
          isActive: s.isActive ?? true,
        })),
      });
    }
    return this.listWorkflows();
  }

  // ── Upload Config (single row, arrays <-> JSON text) ──
  async getUploadConfig() {
    const cfg = await this.prisma.uploadConfig.findFirst();
    if (!cfg) return null;
    return {
      ...cfg,
      allowedExtensions: this.parseArray(cfg.allowedExtensions),
      allowedMimeTypes: this.parseArray(cfg.allowedMimeTypes),
    };
  }
  async updateUploadConfig(data: {
    id?: string;
    maxFileSizeMb: number;
    allowedExtensions: string[];
    storagePath: string;
    maxFilesPerUpload: number;
    enableCompression: boolean;
    allowedMimeTypes: string[];
  }) {
    const payload = {
      maxFileSizeMb: data.maxFileSizeMb,
      allowedExtensions: JSON.stringify(data.allowedExtensions || []),
      storagePath: data.storagePath,
      maxFilesPerUpload: data.maxFilesPerUpload,
      enableCompression: data.enableCompression,
      allowedMimeTypes: JSON.stringify(data.allowedMimeTypes || []),
    };
    if (data.id) {
      return this.prisma.uploadConfig.update({ where: { id: data.id }, data: payload });
    }
    return this.prisma.uploadConfig.create({ data: payload });
  }

  private parseArray(value: string | null): string[] {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
