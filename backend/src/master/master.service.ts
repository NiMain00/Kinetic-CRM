import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CacheEntry {
  data: any;
  timestamp: number;
}

const MASTER_CACHE_TTL_MS = 5 * 60 * 1000;
const masterCache = new Map<string, CacheEntry>();

function getCachedOrFetch<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
  const cached = masterCache.get(key);
  if (cached && Date.now() - cached.timestamp < MASTER_CACHE_TTL_MS) {
    return Promise.resolve(cached.data);
  }
  return fetchFn().then((data) => {
    masterCache.set(key, { data, timestamp: Date.now() });
    return data;
  });
}

function invalidateMasterCache(entity?: string) {
  if (entity) {
    for (const key of masterCache.keys()) {
      if (key.startsWith(entity)) masterCache.delete(key);
    }
  } else {
    masterCache.clear();
  }
}

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
    if (entity === 'procurements') return { timelineEvents: { orderBy: { time: 'desc' as const } } };
    return undefined;
  }

  async listAll() {
    const cached = masterCache.get('all');
    if (cached && Date.now() - cached.timestamp < MASTER_CACHE_TTL_MS) {
      return cached.data;
    }
    const entities = [
      'industries', 'categories', 'competitors', 'questionTypes',
      'projectStatuses', 'periods', 'holidays', 'lossReasons',
      'documentTypes', 'departments', 'users', 'approvalLevels',
      'notifTemplates', 'roles', 'auditLogs', 'questions',
    ];
    const entries: [string, any][] = await Promise.all(
      entities.map(async (e) => [e, (await this.list(e, { perPage: 100 })).data] as [string, any]),
    );
    const result = Object.fromEntries(entries);
    masterCache.set('all', { data: result, timestamp: Date.now() });
    return result;
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

    const isCacheable = !params?.search && params?.is_active === undefined && page === 1;
    const cacheKey = isCacheable ? `${entity}:list:${perPage}` : null;

    if (cacheKey) {
      const cached = masterCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < MASTER_CACHE_TTL_MS) {
        return cached.data;
      }
    }

    const fetchData = async () => {
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
    };

    const result = await fetchData();
    if (cacheKey) {
      masterCache.set(cacheKey, { data: result, timestamp: Date.now() });
    }
    return result;
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
      const result = await model.create({ data });
      invalidateMasterCache(entity);
      return result;
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

    // Handle timelineEvents khusus untuk procurement
    if (entity === 'procurements' && data.timelineEvents?.create) {
      const events = Array.isArray(data.timelineEvents.create) ? data.timelineEvents.create : [data.timelineEvents.create];
      delete data.timelineEvents;
      for (const evt of events) {
        try {
          evt.procurementId = id;
          await this.prisma.procurementTimelineEvent.create({ data: evt });
        } catch (e) {
          console.error('[timeline] Gagal menyimpan event pengadaan:', e?.message || e);
        }
      }
    }

    const result = await model.update({ where: { id }, data });
    invalidateMasterCache(entity);
    return result;
  }

  async delete(entity: string, id: string) {
    const model = this.getModel(entity);
    await this.get(entity, id);
    let result: any;
    if (SOFT_DELETE_ENTITIES.has(entity)) {
      result = await model.update({ where: { id }, data: { deletedAt: new Date() } });
    } else {
      result = await model.delete({ where: { id } });
    }
    invalidateMasterCache(entity);
    return result;
  }
}
