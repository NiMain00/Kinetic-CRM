import { useMemo } from 'react';
import { useInputConfigStore } from '@/stores/inputConfigStore';
import type { InputConfigGroupKey, InputOption, InputConfigGroup } from '@/types/input-config';

/**
 * Returns active (is_active=true) options for a given input config group,
 * sorted by sort_order. Used by form dropdowns, filter selects, and radio groups.
 */
export function useActiveOptions(key: InputConfigGroupKey): InputOption[] {
  const getActiveOptions = useInputConfigStore((s) => s.getActiveOptions);
  return useMemo(() => getActiveOptions(key), [getActiveOptions, key]);
}

/**
 * Returns the full group (including inactive options) for admin editing purposes.
 */
export function useInputGroup(key: InputConfigGroupKey): InputConfigGroup | undefined {
  const getGroup = useInputConfigStore((s) => s.getGroup);
  return useMemo(() => getGroup(key), [getGroup, key]);
}

/**
 * Returns the label for a given option value within a config group.
 * Falls back to the value itself if not found (graceful degradation).
 */
export function useOptionLabel(key: InputConfigGroupKey, value: string): string {
  const getGroup = useInputConfigStore((s) => s.getGroup);
  return useMemo(() => {
    const group = getGroup(key);
    if (!group) return value;
    const option = group.options.find((o) => o.value === value);
    return option?.label ?? value;
  }, [getGroup, key, value]);
}

/**
 * Mutation hooks for admin CRUD operations on input config options.
 */
export function useInputConfigMutations() {
  const addOption = useInputConfigStore((s) => s.addOption);
  const updateOption = useInputConfigStore((s) => s.updateOption);
  const deleteOption = useInputConfigStore((s) => s.deleteOption);
  const toggleOption = useInputConfigStore((s) => s.toggleOption);
  const reorderOptions = useInputConfigStore((s) => s.reorderOptions);

  return { addOption, updateOption, deleteOption, toggleOption, reorderOptions };
}
