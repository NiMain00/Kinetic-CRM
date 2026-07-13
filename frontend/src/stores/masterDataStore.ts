import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MasterItem } from '@/types/domain/master-item';
import { masterDataService } from '@/services/master-data';

export interface MasterCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  requires_lphs: boolean;
  requires_rks: boolean;
  default_workflow_type: 'tender' | 'prospecting';
  color_hex: string;
  sort_order: number;
  is_active: boolean;
}

export interface MasterCompetitor {
  id: string;
  name: string;
  code: string;
  min_price: number;
  max_price: number;
  industry_id: string | null;
  bidang_usaha: string;
  website: string;
  advantages: string;
  description: string;
  notes: string;
  is_active: boolean;
}

export interface MasterDocType {
  id: string;
  name: string;
  code: string;
  description: string;
  category: string;
  is_active: boolean;
}

export interface MasterQuestion {
  id: string;
  question_text: string;
  question_type_id: string;
  context: 'prospect' | 'rks' | 'both';
  category: string;
  is_required: boolean;
  sort_order: number;
  placeholder_text: string;
  help_text: string;
  is_active: boolean;
  options?: string[];
}

export interface MasterHoliday {
  id: string;
  name: string;
  date: string;
  type: 'national' | 'regional';
  year: number;
  is_active: boolean;
}

export interface MasterLossReason {
  id: string;
  name: string;
  code: string;
  category: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

export interface MasterPeriod {
  id: string;
  name: string;
  code: string;
  type: 'monthly' | 'quarterly' | 'semester' | 'annual';
  year: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_locked: boolean;
  notes: string;
}

export interface MasterCustomer {
  id: string;
  name: string;
  code: string;
  type: 'swasta' | 'bumn' | 'pemerintah' | 'asing';
  industry_id: string | null;
  pic_name: string;
  pic_email: string;
  pic_phone: string;
  address: string;
  city: string;
  province: string;
  npwp: string;
  notes: string;
  is_active: boolean;
}

export interface MasterIndustry {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

export interface MasterProjectStatus {
  id: string;
  code: string;
  label: string;
  description: string;
  color_hex: string;
  text_color_hex: string;
  sort_order: number;
  is_system: boolean;
  is_terminal: boolean;
  is_active: boolean;
  applicable_to: string;
}

export interface MasterDocumentType {
  id: string;
  name: string;
  code: string;
  description: string;
  allowed_extensions: string[];
  max_size_mb: number;
  is_required_at_stage: string[] | null;
  applicable_to: string;
  sort_order: number;
  is_system: boolean;
  is_active: boolean;
}

export interface MasterQuestionType {
  id: string;
  name: string;
  code: string;
  description: string;
  has_options: boolean;
  validation_config: string;
  is_system: boolean;
  is_active: boolean;
}

export interface MasterDepartment {
  id: string;
  name: string;
  code: string;
  head: string;
  division: string;
  status: boolean;
}

export interface MasterUser {
  id: string;
  name: string;
  branch: string;
  username: string;
  email: string;
  role: string;
  roleColor: string;
  active: boolean;
  avatarColor: string;
}

export interface MasterAuditLog {
  id: string;
  time: string;
  user: string;
  userInitials: string;
  action: string;
  actionColor: string;
  entity: string;
  entityName: string;
  impact: 'Low' | 'Medium' | 'High';
  beforeJson: string;
  afterJson: string;
}

export interface MasterApprovalLevel {
  id: string;
  name: string;
  code: string;
  level_number: number;
  escalates_to_level_id: string | null;
  description: string;
  is_active: boolean;
}

export interface MasterNotifTemplate {
  id: string;
  event_code: string;
  event_name: string;
  template_inapp: string;
  recipient_roles: string[];
  available_variables: string[];
  is_active: boolean;
  is_system: boolean;
}

export interface MasterRole {
  id: string;
  name: string;
  permissions: string[];
  description: string;
}

type EntityType = 'categories' | 'competitors' | 'docTypes' | 'questions' | 'holidays' | 'lossReasons' | 'periods' | 'customers' | 'industries' | 'projectStatuses' | 'documentTypes' | 'questionTypes' | 'departments' | 'users' | 'auditLogs' | 'approvalLevels' | 'notifTemplates' | 'roles' | 'items';

interface MasterDataState {
  categories: MasterCategory[];
  competitors: MasterCompetitor[];
  docTypes: MasterDocType[];
  questions: MasterQuestion[];
  holidays: MasterHoliday[];
  lossReasons: MasterLossReason[];
  periods: MasterPeriod[];
  customers: MasterCustomer[];
  industries: MasterIndustry[];
  projectStatuses: MasterProjectStatus[];
  documentTypes: MasterDocumentType[];
  questionTypes: MasterQuestionType[];
  departments: MasterDepartment[];
  users: MasterUser[];
  auditLogs: MasterAuditLog[];
  approvalLevels: MasterApprovalLevel[];
  notifTemplates: MasterNotifTemplate[];
  roles: MasterRole[];
  items: MasterItem[];
  loading: Record<string, boolean>;
  fetchEntity: (entity: EntityType) => Promise<void>;
  fetchQuestions: () => Promise<void>;
  getData: <T>(entity: EntityType) => T[];
  addData: <T extends Record<string, any> = Record<string, any>>(entity: EntityType, item: T) => Promise<void>;
  updateData: <T extends Record<string, any> = Record<string, any>>(entity: EntityType, id: string, data: Partial<T>) => Promise<void>;
  deleteData: (entity: EntityType, id: string) => Promise<void>;
}

function camelToSnakeKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    result[snakeKey] = obj[key];
    // handle nested questionOptions array
    if (snakeKey === 'question_options' && Array.isArray(obj[key])) {
      result.options = (obj[key] as Record<string, unknown>[]).map((o) => o.optionLabel as string);
    }
  }
  return result;
}

// Field relasi yang tidak punya kolom skalar di Prisma → di-strip saat write ke API
const RELATION_ONLY_FIELDS: Record<string, string[]> = {
  roles: ['permissions'],
  questions: ['options'],
};

function snakeToCamelKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_m, c) => c.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

// Siapkan payload untuk API: convert snake→camel, strip id & field relasi
function toApiPayload(entity: EntityType, item: Record<string, unknown>): Record<string, unknown> {
  const stripped: Record<string, unknown> = { ...item };
  delete stripped.id;
  const relationFields = RELATION_ONLY_FIELDS[entity];
  if (relationFields) {
    for (const f of relationFields) delete stripped[f];
  }
  return snakeToCamelKeys(stripped);
}

export const useMasterDataStore = create<MasterDataState>()(
  persist(
    (set, get) => ({
      categories: [],
      competitors: [],
      docTypes: [],
      questions: [],
      holidays: [],
      lossReasons: [],
      periods: [],
      customers: [],
      industries: [],
      projectStatuses: [],
      documentTypes: [],
      questionTypes: [],
      departments: [],
      users: [],
      auditLogs: [],
      approvalLevels: [],
      notifTemplates: [],
      roles: [],
      items: [],
      loading: {},

      fetchEntity: async (entity) => {
        set((s) => ({ loading: { ...s.loading, [entity]: true } }));
        try {
          const res = await masterDataService.get(entity, { perPage: 200 });
          let data = res.data?.data || res.data || [];
          const list = Array.isArray(data) ? data : [];
          // transform camelCase API keys → snake_case untuk konsistensi dengan frontend
          const normalized = list.map((item: any) => {
            const transformed = camelToSnakeKeys(item);
            // pastikan field name terisi dari full_name untuk user entity
            if (entity === 'users' && !transformed.name && transformed.full_name) {
              transformed.name = transformed.full_name;
            }
            return transformed;
          });
          set((s) => ({ [entity]: normalized as any, loading: { ...s.loading, [entity]: false } } as any));
        } catch {
          set((s) => ({ loading: { ...s.loading, [entity]: false } }));
        }
      },

      fetchQuestions: async () => {
        set((s) => ({ loading: { ...s.loading, questions: true } }));
        try {
          const res = await masterDataService.get('questions', { perPage: 200 });
          let data = res.data?.data || res.data || [];
          const raw = Array.isArray(data) ? data : [];
          const list = raw.map((item: any) => {
            const q: Record<string, unknown> = {};
            q.id = item.id;
            q.question_text = item.questionText || '';
            q.question_type_id = item.questionTypeId || '';
            q.context = item.context || 'prospect';
            q.category = item.category || '';
            q.is_required = item.isRequired ?? false;
            q.sort_order = item.sortOrder ?? 0;
            q.placeholder_text = item.placeholderText || '';
            q.help_text = item.helpText || '';
            q.is_active = item.isActive !== false;
            q.options = Array.isArray(item.questionOptions)
              ? item.questionOptions.map((o: any) => o.optionLabel || '')
              : [];
            return q as any;
          });
          set((s) => ({ questions: list, loading: { ...s.loading, questions: false } } as any));
        } catch {
          set((s) => ({ loading: { ...s.loading, questions: false } }));
        }
      },

      getData: <T>(entity: EntityType) => get()[entity] as unknown as T[],
      addData: async <T extends Record<string, any>>(entity: EntityType, item: T) => {
        try {
          await masterDataService.create(entity, toApiPayload(entity, item));
          await get().fetchEntity(entity);
        } catch (err) {
          console.error(`[masterDataStore] addData(${entity}) failed:`, err);
          throw err;
        }
      },
      updateData: async <T extends { id: string }>(entity: EntityType, id: string, data: Partial<T>) => {
        try {
          await masterDataService.update(entity, id, toApiPayload(entity, data as Record<string, unknown>));
          await get().fetchEntity(entity);
        } catch (err) {
          console.error(`[masterDataStore] updateData(${entity}) failed:`, err);
          throw err;
        }
      },
      deleteData: async (entity: EntityType, id: string) => {
        try {
          await masterDataService.delete(entity, id);
          await get().fetchEntity(entity);
        } catch (err) {
          console.error(`[masterDataStore] deleteData(${entity}) failed:`, err);
          throw err;
        }
      },
    }),
    {
      name: 'kinetic-master-data',
      version: 10,
      partialize: (state) => {
        const { loading, ...rest } = state as any;
        return rest;
      },
      migrate: (persisted: unknown, version: number) => {
        const current = (persisted || {}) as any;
        return current;
      },
    },
  ),
);
