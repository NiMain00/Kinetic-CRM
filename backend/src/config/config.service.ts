import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { configCache } from '../common/cache.util';

const CONNECTOR_TYPE_MAP: Record<string, string> = {
  'Cloud Storage': 'Cloud_Storage',
  Cloud_Storage: 'Cloud_Storage',
};

function normalizeConnectorType(type: string): string {
  return CONNECTOR_TYPE_MAP[type] ?? type;
}

const cached =
  <T>(key: string, fn: () => Promise<T>) =>
  () =>
    configCache.getOrFetch(key, fn);

@Injectable()
export class ConfigService {
  constructor(private readonly prisma: PrismaService) {}

  // ── SLA Policies ──
  listSlaPolicies() {
    return configCache.getOrFetch('slaPolicies', () => this.prisma.slaPolicy.findMany());
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
    configCache.invalidate('slaPolicies');
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
    configCache.invalidate('slaPolicies');
    return this.prisma.slaPolicy.update({ where: { id }, data });
  }
  deleteSlaPolicy(id: string) {
    configCache.invalidate('slaPolicies');
    return this.prisma.slaPolicy.delete({ where: { id } });
  }

  // ── KPI Targets ──
  listKpiTargets() {
    return configCache.getOrFetch('kpiTargets', () => this.prisma.kpiTarget.findMany());
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
    configCache.invalidate('kpiTargets');
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
    configCache.invalidate('kpiTargets');
    return this.prisma.kpiTarget.update({ where: { id }, data });
  }
  deleteKpiTarget(id: string) {
    configCache.invalidate('kpiTargets');
    return this.prisma.kpiTarget.delete({ where: { id } });
  }

  // ── Connectors ──
  listConnectors() {
    return configCache.getOrFetch('connectors', () => this.prisma.connector.findMany());
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
    configCache.invalidate('connectors');
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
    configCache.invalidate('connectors');
    const payload: any = { ...data };
    if (payload.type) payload.type = normalizeConnectorType(payload.type);
    return this.prisma.connector.update({ where: { id }, data: payload });
  }
  deleteConnector(id: string) {
    configCache.invalidate('connectors');
    return this.prisma.connector.delete({ where: { id } });
  }

  // ── Org Units ──
  listOrgUnits() {
    return configCache.getOrFetch('orgUnits', () =>
      this.prisma.orgUnit.findMany({ where: { deletedAt: null } }),
    );
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
    configCache.invalidate('orgUnits');
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
    configCache.invalidate('orgUnits');
    const payload: any = { ...data };
    if (payload.unitType) payload.unitType = payload.unitType;
    return this.prisma.orgUnit.update({ where: { id }, data: payload });
  }
  deleteOrgUnit(id: string) {
    configCache.invalidate('orgUnits');
    return this.prisma.orgUnit.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ── Project Phases ──
  listProjectPhases() {
    return configCache.getOrFetch('projectPhases', () =>
      this.prisma.projectPhase.findMany({ orderBy: { order: 'asc' } }),
    );
  }
  createProjectPhase(data: {
    status: string;
    phase: string;
    order?: number;
    isActive?: boolean;
  }) {
    configCache.invalidate('projectPhases');
    return this.prisma.projectPhase.create({ data });
  }
  updateProjectPhase(
    id: string,
    data: Partial<{ status: string; phase: string; order: number; isActive: boolean }>,
  ) {
    configCache.invalidate('projectPhases');
    return this.prisma.projectPhase.update({ where: { id }, data });
  }
  deleteProjectPhase(id: string) {
    configCache.invalidate('projectPhases');
    return this.prisma.projectPhase.delete({ where: { id } });
  }

  // ── Workflows (grouped by entityType) ──
  listWorkflows() {
    return configCache.getOrFetch('workflows', async () => {
      const steps = await this.prisma.workflowStep.findMany({ orderBy: { order: 'asc' } });
      const groups: Record<string, any[]> = {};
      for (const s of steps) {
        if (!groups[s.entityType]) groups[s.entityType] = [];
        groups[s.entityType].push(s);
      }
      return Object.entries(groups).map(([entityType, steps]) => ({ entityType, steps }));
    });
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
    configCache.invalidate('workflows');
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
    const cfg = await configCache.getOrFetch('uploadConfig', () =>
      this.prisma.uploadConfig.findFirst(),
    );
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
    configCache.invalidate('uploadConfig');
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

  // ── Integration Configurations ──
  listIntegrations() {
    return configCache.getOrFetch('integrations', () =>
      this.prisma.integrationConfiguration.findMany({
        select: {
          id: true,
          key: true,
          isSecret: true,
          updatedAt: true,
          updatedBy: true,
        },
      }),
    );
  }

  async getIntegration(key: string) {
    const config = await this.prisma.integrationConfiguration.findUnique({
      where: { key },
    });
    if (!config) throw new NotFoundException(`Integration config '${key}' not found`);
    return config;
  }

  async upsertIntegration(key: string, data: { value: string; isSecret?: boolean }, userId: string) {
    configCache.invalidate('integrations');
    return this.prisma.integrationConfiguration.upsert({
      where: { key },
      create: {
        key,
        valueEncrypted: data.value,
        isSecret: data.isSecret ?? true,
        updatedBy: userId,
      },
      update: {
        valueEncrypted: data.value,
        isSecret: data.isSecret ?? true,
        updatedBy: userId,
      },
    });
  }

  async verifyIntegration(key: string, value: string): Promise<boolean> {
    const config = await this.prisma.integrationConfiguration.findUnique({
      where: { key },
    });
    if (!config) return false;
    return config.valueEncrypted === value;
  }

  async deleteIntegration(key: string) {
    configCache.invalidate('integrations');
    return this.prisma.integrationConfiguration.delete({ where: { key } });
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
