# Phase 5 — Polish Implementation Plan

## Context
Phase 5 adds polish features: bulk operations, keyboard shortcuts, user preferences, activity feed, and calendar view. Existing infrastructure (DataTable selection, Topbar layout, notification store, router patterns) already supports most of these — we add the missing layers.

---

## 1. Bulk Operations (#16)

**What exists:** DataTable/Table already have `selectedRows`/`onSelectionChange` props for multi-select. CSV export works. But no bulk action toolbar appears when items are selected.

**What to build:**
- Add a `BulkActionBar` component that slides in when items are selected
- A new shared `BulkActions` component with `onBatchDelete`, `onBatchUpdate` callbacks
- Plug it into DataTable (and update DataTable.tsx)

### Files:
| File | Action |
|------|--------|
| `frontend/src/components/shared/BulkActions.tsx` | **NEW** — Bulk action toolbar with batch delete, batch status update, batch export |
| `frontend/src/components/shared/DataTable.tsx` | **MODIFY** — Render BulkActions when `selectedRows.size > 0` |

### BulkActions props interface:
```tsx
interface BulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBatchDelete?: () => void;
  onBatchUpdate?: () => void;
  onBatchExport?: () => void;
}
```

---

## 2. Keyboard Shortcuts (#17)

**What exists:** Topbar handles Escape for mobile search. No global shortcut system.

**What to build:**
- A `useKeyboardShortcuts` hook that registers global keydown listeners
- A `ShortcutHelpModal` showing available shortcuts
- Wire it to Topbar via a help button or Shift+? trigger

### Files:
| File | Action |
|------|--------|
| `frontend/src/hooks/useKeyboardShortcuts.ts` | **NEW** — Hook registering global shortcuts |
| `frontend/src/components/shared/ShortcutHelpModal.tsx` | **NEW** — Modal listing all shortcuts |
| `frontend/src/components/layout/Topbar.tsx` | **MODIFY** — Add keyboard shortcut help button, integrate hook |

### Shortcuts:
| Shortcut | Action |
|----------|--------|
| `G + D` | Go to Dashboard |
| `G + P` | Go to Projects |
| `G + S` | Go to Prospects |
| `G + M` | Go to Master Data |
| `G + A` | Go to Approvals |
| `C` (on list pages) | Create new item |
| `/` | Focus search |
| `Shift + ?` | Show shortcut help |
| `Escape` | Close modal/drawer |

---

## 3. User Preferences (#18)

**What exists:** ProfilePage has language/timezone in local state. ThemeStore persists dark mode. No preferences store.

**What to build:**
- A `usePreferencesStore` (Zustand + persist) for language, timezone, notification prefs
- Update ProfilePage to use the store instead of local state
- Add a `/preferences` route (or integrate into ProfilePage)

### Files:
| File | Action |
|------|--------|
| `frontend/src/stores/preferencesStore.ts` | **NEW** — Preferences store (language, timezone, notifications enabled, theme) |
| `frontend/src/features/profile/ProfilePage.tsx` | **MODIFY** — Use preferencesStore instead of local state |

### Preferences store interface:
```tsx
interface PreferencesState {
  language: 'id' | 'en';
  timezone: string;
  notificationsEnabled: boolean;
  setLanguage: (lang: 'id' | 'en') => void;
  setTimezone: (tz: string) => void;
  setNotificationsEnabled: (v: boolean) => void;
}
```

Leverage existing `useThemeStore` for dark mode — preferencesStore uses theme store values.

---

## 4. Activity Feed (#19)

**What exists:** notificationStore has typed notifications. masterDataStore has auditLogs. Audit page exists for Super Admin only.

**What to build:**
- An `ActivityFeed` component that merges notifications + audit logs into a unified feed
- Add to an existing page (NotificationsPage) as a tab, or as standalone

### Files:
| File | Action |
|------|--------|
| `frontend/src/components/shared/ActivityFeed.tsx` | **NEW** — Unified feed component with entity type filter |
| `frontend/src/features/notifications/NotificationsPage.tsx` | **MODIFY** — Add activity feed tab or section |

### ActivityFeed props:
```tsx
interface ActivityFeedProps {
  maxItems?: number;
  showFilter?: boolean;
}
```

---

## 5. Calendar View (#20)

**What exists:** DeliveryTab has milestone display. MasterHolidayPage lists holidays. Project data has deadlines.

**What to build:**
- A simple monthly calendar component showing project deadlines + holidays
- A `CalendarPage` route accessible from reports or dashboard

### Files:
| File | Action |
|------|--------|
| `frontend/src/components/shared/CalendarView.tsx` | **NEW** — Monthly calendar grid with event dots |
| `frontend/src/features/reports/CalendarPage.tsx` | **NEW** — Calendar page loading data from stores |
| `frontend/src/routes/router.tsx` | **MODIFY** — Add `/reports/calendar` route |
| `frontend/src/routes/nav-items.ts` | **MODIFY** — Add calendar nav item |

### Data sources:
- Project deadlines → `projectStore`
- Holidays → `masterDataStore.holidays`
- Milestones → embedded in project data

---

## Implementation Order

1. **Bulk Operations** — reuses existing DataTable selection, quickest win
2. **Keyboard Shortcuts** — self-contained hook + modal, high visibility
3. **User Preferences** — new store + profile integration
4. **Activity Feed** — reusable component using existing stores
5. **Calendar View** — new component + route, most visual impact

## Verification
- Build: `npx tsc --noEmit` and `npx vite build` both pass
- Bulk: select rows in DataTable → action bar appears → batch delete/export works
- Shortcuts: press Shift+? → modal opens → G+D navigates to Dashboard
- Preferences: change language/timezone → refresh → settings persist
- Feed: ActivityFeed shows merged audit logs + notifications
- Calendar: shows project deadlines and holidays on correct dates
