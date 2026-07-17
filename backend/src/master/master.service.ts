import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const ENTITY_MAP: Record<string, string> = {
  industries: 'industry',
  categories: 'projectCategory',
  competitors: 'competitor',
  questionTypes: 'questionType',
  questions: 'question',
  projectStatuses: 'projectStatusDefinition',
  periods: 'period',
  holidays: 'holiday',
  lossReasons: 'lossReason',
  documentTypes: 'documentType',
  departments: 'orgUnit',
  users: 'user',
  roles: 'role',
  items: 'masterItem',
  auditLogs: 'auditLog',
  approvalLevels: 'approvalChainLevel',
  notifTemplates: 'notificationTemplate',
  approvals: 'approval',
  approvalChains: 'approvalChain',
  dealLineItems: 'dealLineItem',
  procurements: 'procurement',
  procurementItems: 'procurementItem',
  projectRequirements: 'projectRequirementItem',
  suppliers: 'supplier',
  rfqs: 'rfq',
  tasks: 'task',
  inputConfigGroups: 'inputConfigGroup',
  inputConfigOptions: 'inputConfigOption',
  entityRelations: 'entityRelation',
  projectMembers: 'projectMember',
  projectDepartments: 'projectDepartment',
  rfqQuotes: 'rfqQuote',
  supplierEvaluations: 'supplierEvaluation',
};

// Entities that support soft-delete (have a deletedAt column) — filtered out of list/get
const SOFT_DELETE_ENTITIES = new Set([
  'departments',
  'users',
  'competitors',
  'questions',
  'items',
  'procurements',
  'prospects',
  'projects',
]);

@Injectable()
export class MasterService {
  constructor(private readonly prisma: PrismaService) {}

  private getModel(entity: string) {
    const modelName = ENTITY_MAP[entity];
    if (!modelName) throw new NotFoundException(`Unknown entity: ${entity}`);
    return (this.prisma as any)[modelName];
  }

  private getInclude(entity: string) {
    if (entity === 'inputConfigGroups') return { options: { orderBy: { sortOrder: 'asc' as const } } };
    if (entity === 'questions') return { questionOptions: { orderBy: { sortOrder: 'asc' as const } } };
    return undefined;
  }

  async list(entity: string, params?: any) {
    const model = this.getModel(entity);
    const where: any = {};
    if (SOFT_DELETE_ENTITIES.has(entity)) where.deletedAt = null;
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search } },
        { code: { contains: params.search } },
      ];
    }
    if (params?.is_active !== undefined) {
      where.isActive = params.is_active === 'true' || params.is_active === true;
    }
    const page = Number(params?.page) || 1;
    const perPage = Math.min(Number(params?.perPage) || 50, 100);
    try {
      const [data, total] = await Promise.all([
        model.findMany({
          where,
          skip: (page - 1) * perPage,
          take: perPage,
          orderBy: { createdAt: 'desc' },
          include: this.getInclude(entity),
        }),
        model.count({ where }),
      ]);
      return { data, total, page, perPage };
    } catch (err: any) {
      // Fallback for entities whose model lacks a `createdAt` column.
      if (String(err?.message ?? '').includes('createdAt')) {
        const [data, total] = await Promise.all([
          model.findMany({
            where,
            skip: (page - 1) * perPage,
            take: perPage,
            include: this.getInclude(entity),
          }),
          model.count({ where }),
        ]);
        return { data, total, page, perPage };
      }
      throw err;
    }
  }

  async get(entity: string, id: string) {
    const model = this.getModel(entity);
    const where: any = { id };
    if (SOFT_DELETE_ENTITIES.has(entity)) where.deletedAt = null;
    const record = await model.findUnique({ where, include: this.getInclude(entity) });
    if (!record) throw new NotFoundException(`${entity} not found`);
    return record;
  }

  async create(entity: string, data: any) {
    const model = this.getModel(entity);
    try {
      return await model.create({ data });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        const target = err.meta?.target || 'field';
        throw new Error(`Duplicate value for ${target}. ${entity} dengan nilai tersebut sudah ada.`);
      }
      console.error(`[master] create ${entity} failed:`, err?.message || err);
      throw new Error(`Gagal membuat ${entity}: ${err?.message || 'unknown error'}`);
    }
  }

  async update(entity: string, id: string, data: any) {
    const model = this.getModel(entity);
    await this.get(entity, id);
    return model.update({ where: { id }, data });
  }

  async delete(entity: string, id: string) {
    const model = this.getModel(entity);
    await this.get(entity, id);
    // Only entities with a `deletedAt` column can be soft-deleted; the rest
    // (e.g. entityRelations, join tables) must be hard-deleted.
    if (SOFT_DELETE_ENTITIES.has(entity)) {
      return model.update({ where: { id }, data: { deletedAt: new Date() } });
    }
    return model.delete({ where: { id } });
  }
}
