import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { InputConfigGroup, InputOption, InputConfigGroupKey } from '@/types/input-config';
import { masterDataService } from '@/services/master-data';
import { inputConfigService } from '@/services/inputConfigService';

function camelToSnakeKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    result[snakeKey] = obj[key];
    // handle nested options array
    if (snakeKey === 'options' && Array.isArray(obj[key])) {
      result[snakeKey] = (obj[key] as Record<string, unknown>[]).map((o) => camelToSnakeKeys(o));
    }
  }
  return result;
}

interface InputConfigState {
  groups: InputConfigGroup[];
  loading: boolean;
  initialized: boolean;

  getGroup: (key: InputConfigGroupKey) => InputConfigGroup | undefined;
  getActiveOptions: (key: InputConfigGroupKey) => InputOption[];
  fetchGroups: () => Promise<void>;

  addOption: (groupKey: InputConfigGroupKey, option: InputOption) => Promise<void>;
  updateOption: (groupKey: InputConfigGroupKey, value: string, data: Partial<InputOption>) => Promise<void>;
  deleteOption: (groupKey: InputConfigGroupKey, value: string) => Promise<void>;
  toggleOption: (groupKey: InputConfigGroupKey, value: string) => Promise<void>;
  reorderOptions: (groupKey: InputConfigGroupKey, optionIds: string[]) => Promise<void>;
}

export const useInputConfigStore = create<InputConfigState>()(
  persist(
    (set, get) => ({
      groups: [],
      loading: false,
      initialized: false,

      fetchGroups: async () => {
        set({ loading: true });
        try {
          const res = await masterDataService.get('inputConfigGroups', { perPage: 50 });
          const body: any = res.data || {};
          let list: any[] = [];
          if (Array.isArray(body)) {
            list = body;
          } else if (body.data && Array.isArray(body.data)) {
            list = body.data;
          }
          set({ groups: list.map((item: any) => camelToSnakeKeys(item)) as unknown as InputConfigGroup[], loading: false, initialized: true });
        } catch (err) {
          console.error('[inputConfigStore] fetchGroups failed:', err);
          set({ loading: false, initialized: true });
        }
      },

      getGroup: (key) => get().groups.find((g) => g.key === key),

      getActiveOptions: (key) => {
        const group = get().groups.find((g) => g.key === key);
        if (!group) return [];
        return group.options
          .filter((o) => o.is_active)
          .sort((a, b) => a.sort_order - b.sort_order);
      },

      addOption: async (groupKey, option) => {
        const group = get().groups.find((g) => g.key === groupKey);
        if (!group) {
          throw new Error(`Grup "${groupKey}" tidak ditemukan.`);
        }
        try {
          await inputConfigService.createOption({
            groupId: group.id,
            value: option.value,
            label: option.label,
            sortOrder: option.sort_order,
            isActive: option.is_active,
            colorHex: option.color_hex,
          });
          await get().fetchGroups();
        } catch (err) {
          console.error('[inputConfigStore] addOption failed:', err);
          throw err;
        }
      },

      updateOption: async (groupKey, value, data) => {
        const group = get().groups.find((g) => g.key === groupKey);
        if (!group) {
          throw new Error(`Grup "${groupKey}" tidak ditemukan.`);
        }
        const option = group.options.find((o) => o.value === value);
        if (!option || !option.id) {
          throw new Error(`Opsi "${value}" tidak memiliki id (belum tersimpan di server).`);
        }
        try {
          await inputConfigService.updateOption(option.id, {
            label: data.label,
            sortOrder: data.sort_order,
            isActive: data.is_active,
            colorHex: data.color_hex,
          });
          await get().fetchGroups();
        } catch (err) {
          console.error('[inputConfigStore] updateOption failed:', err);
          throw err;
        }
      },

      deleteOption: async (groupKey, value) => {
        const group = get().groups.find((g) => g.key === groupKey);
        if (!group) {
          throw new Error(`Grup "${groupKey}" tidak ditemukan.`);
        }
        const option = group.options.find((o) => o.value === value);
        if (!option || !option.id) {
          throw new Error(`Opsi "${value}" tidak memiliki id (belum tersimpan di server).`);
        }
        try {
          await inputConfigService.deleteOption(option.id);
          await get().fetchGroups();
        } catch (err) {
          console.error('[inputConfigStore] deleteOption failed:', err);
          throw err;
        }
      },

      toggleOption: async (groupKey, value) => {
        const group = get().groups.find((g) => g.key === groupKey);
        if (!group) {
          throw new Error(`Grup "${groupKey}" tidak ditemukan.`);
        }
        const option = group.options.find((o) => o.value === value);
        if (!option || !option.id) {
          throw new Error(`Opsi "${value}" tidak memiliki id (belum tersimpan di server).`);
        }
        try {
          await inputConfigService.updateOption(option.id, {
            isActive: !option.is_active,
          });
          await get().fetchGroups();
        } catch (err) {
          console.error('[inputConfigStore] toggleOption failed:', err);
          throw err;
        }
      },

      reorderOptions: async (groupKey, optionValues) => {
        const group = get().groups.find((g) => g.key === groupKey);
        if (!group) {
          throw new Error(`Grup "${groupKey}" tidak ditemukan.`);
        }
        try {
          for (let i = 0; i < optionValues.length; i++) {
            const opt = group.options.find((o) => o.value === optionValues[i]);
            if (opt?.id) {
              await inputConfigService.updateOption(opt.id, { sortOrder: i + 1 });
            }
          }
          await get().fetchGroups();
        } catch (err) {
          console.error('[inputConfigStore] reorderOptions failed:', err);
          throw err;
        }
      },
    }),
    {
      name: 'kinetic-input-config',
      version: 5,
      partialize: (state) => {
        const { loading, initialized, ...rest } = state as any;
        return rest;
      },
      migrate: (persisted: unknown, version: number) => {
        const current = (persisted || {}) as any;
        if (version < 5) return { groups: [] };
        return { groups: current.groups || [] };
      },
    },
  ),
);
