import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { InputConfigGroup, InputOption, InputConfigGroupKey } from '@/types/input-config';
import { masterDataService } from '@/services/master-data';

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

  getGroup: (key: InputConfigGroupKey) => InputConfigGroup | undefined;
  getActiveOptions: (key: InputConfigGroupKey) => InputOption[];
  fetchGroups: () => Promise<void>;

  addOption: (groupKey: InputConfigGroupKey, option: InputOption) => void;
  updateOption: (groupKey: InputConfigGroupKey, value: string, data: Partial<InputOption>) => void;
  deleteOption: (groupKey: InputConfigGroupKey, value: string) => void;
  toggleOption: (groupKey: InputConfigGroupKey, value: string) => void;
  reorderOptions: (groupKey: InputConfigGroupKey, optionIds: string[]) => void;
}

export const useInputConfigStore = create<InputConfigState>()(
  persist(
    (set, get) => ({
      groups: [],
      loading: false,

      fetchGroups: async () => {
        set({ loading: true });
        try {
          const res = await masterDataService.get('inputConfigGroups', { perPage: 20 });
          const data = res.data?.data || res.data || [];
          const list = Array.isArray(data) ? data : [];
          set({ groups: list.map((item: any) => camelToSnakeKeys(item)) as unknown as InputConfigGroup[], loading: false });
        } catch {
          set({ loading: false });
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

      addOption: (groupKey, option) =>
        set((s) => ({
          groups: s.groups.map((g) =>
            g.key === groupKey
              ? { ...g, options: [...g.options, option] }
              : g,
          ),
        })),

      updateOption: (groupKey, value, data) =>
        set((s) => ({
          groups: s.groups.map((g) =>
            g.key === groupKey
              ? {
                  ...g,
                  options: g.options.map((o) =>
                    o.value === value ? { ...o, ...data } : o,
                  ),
                }
              : g,
          ),
        })),

      deleteOption: (groupKey, value) =>
        set((s) => ({
          groups: s.groups.map((g) =>
            g.key === groupKey
              ? { ...g, options: g.options.filter((o) => o.value !== value) }
              : g,
          ),
        })),

      toggleOption: (groupKey, value) =>
        set((s) => ({
          groups: s.groups.map((g) =>
            g.key === groupKey
              ? {
                  ...g,
                  options: g.options.map((o) =>
                    o.value === value ? { ...o, is_active: !o.is_active } : o,
                  ),
                }
              : g,
          ),
        })),

      reorderOptions: (groupKey, optionValues) =>
        set((s) => ({
          groups: s.groups.map((g) =>
            g.key === groupKey
              ? {
                  ...g,
                  options: optionValues
                    .map((v, i) => {
                      const opt = g.options.find((o) => o.value === v);
                      return opt ? { ...opt, sort_order: i + 1 } : null;
                    })
                    .filter(Boolean) as InputOption[],
                }
              : g,
          ),
        })),
    }),
    {
      name: 'kinetic-input-config',
      version: 4,
      partialize: (state) => {
        const { loading, ...rest } = state as any;
        return rest;
      },
      migrate: (persisted: unknown, version: number) => {
        const current = (persisted || {}) as any;
        if (version < 4) return { groups: [] };
        return { groups: current.groups || [] };
      },
    },
  ),
);
