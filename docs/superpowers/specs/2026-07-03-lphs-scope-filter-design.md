# LPHS/SIOS — Scope-Based Department Reviewer Filter

**Date:** 2026-07-03
**Project:** Kinetic CRM
**Status:** Approved

## Problem

In the LPHS/SIOS tab (`LphsSiosTab.tsx`), the "Departemen Reviewer" section displays **all active departments** from `masterDataStore.departments`, regardless of which departments are actually involved in the project. This makes the selection unfocused and allows reviewers from departments that have no relation to the project.

## Current Behavior

```tsx
// LphsSiosTab.tsx line 77
const activeDepartments = useMemo(() => departments.filter(d => d.status), [departments]);
```

All departments with `status: true` are shown in the department selection list and the approval matrix.

## Target Behavior

For **Tender-type projects**, the department reviewer list should be filtered to only show departments listed in `project.scopeDepartments`. For **Prospecting-type projects** or projects without `scopeDepartments`, fall back to showing all active departments (backward compatible).

## Source of Truth

Use `project.scopeDepartments: string[]` — an array of department IDs set at project creation time (ProjectFormPage) and manageable via the Scope Tim tab. This field already exists on the `Project` type and is persisted.

## Changes

### 1. `LphsSiosTab.tsx` — Filter logic

Change the `activeDepartments` memo to conditionally filter by `scopeDepartments`:

```tsx
const activeDepartments = useMemo(() => {
  if (project?.type === 'Tender' && project?.scopeDepartments && project.scopeDepartments.length > 0) {
    return departments.filter(d => d.status && project.scopeDepartments!.includes(d.id));
  }
  return departments.filter(d => d.status);
}, [departments, project?.scopeDepartments, project?.type]);
```

### Fallback Behavior

| Scenario | Behavior |
|---|---|
| Tender + has scopeDepartments | Filtered to those departments only |
| Tender + empty scopeDepartments | All active departments (fallback) |
| Prospecting project | All active departments (fallback) |
| Legacy project without scopeDepartments | All active departments (fallback) |

## Files Affected

| File | Change |
|---|---|
| `frontend/src/features/projects/tabs/LphsSiosTab.tsx` | Modify `activeDepartments` memo (line 77) |

No other files need changes. No new types, stores, or APIs required.

## Testing

- Create a Tender project with specific scope departments → LPHS tab should only show those departments
- Create a project without scopeDepartments → LPHS tab should show all active departments (fallback)
- Prospecting project → LPHS tab should show all active departments (fallback)
