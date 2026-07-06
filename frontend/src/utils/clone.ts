/**
 * Deep clone a value using the native structuredClone API.
 * Falls back to JSON round-trip for environments without structuredClone.
 */
export function deepClone<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  // Legacy fallback — loses Date, Map, Set, RegExp, undefined, circular refs
  return JSON.parse(JSON.stringify(value));
}

/**
 * Create a snapshot of selected fields from a source object.
 * Uses deepClone internally so the snapshot is independent of the source.
 *
 * @example
 * ```ts
 * const snap = createSnapshot(prospect, ['client', 'estimatedValue', 'branch']);
 * addProject({ ...snap, sourceProspectId: prospect.id });
 * ```
 */
export function createSnapshot<T extends Record<string, unknown>>(
  source: T,
  fields: (keyof T)[],
): Partial<T> {
  const snapshot: Partial<T> = {} as Partial<T>;
  for (const field of fields) {
    if (field in source) {
      snapshot[field] = deepClone(source[field]);
    }
  }
  return snapshot;
}
