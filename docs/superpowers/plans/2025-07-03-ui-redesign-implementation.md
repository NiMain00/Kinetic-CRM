# UI Redesign — Fresh Green Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign UI layout and color palette — greener, fresher, more spacious and consistent across all pages.

**Architecture:** Update CSS design tokens first (color palette, shadows, spacing), then propagate through layout components (Sidebar, Topbar, AppLayout), then UI components (Button, Input, Select, Modal, Card, Badge), then page-level features (DataTable, DetailPages, LoginPage).

**Tech Stack:** React 18, TypeScript, Tailwind CSS v4 (`@import "tailwindcss"` + `@theme` directives), Zustand stores, Material Symbols icons.

## Global Constraints

- All color values must use the new palette: `--color-primary: #2E7D32`, `--color-primary-light: #4CAF50`, `--color-primary-container: #E8F5E9`
- Background color: `#F8FAF8` (warm green-tinted white, not `#F9FAFB`)
- Surface container: `#E8EDE8` (not `#F3F4F6`)
- Rounded corners standardize to `rounded-lg` (8px) for buttons and `rounded-xl` (12px) for cards
- All spacing tokens remain at Tailwind defaults; component padding adjusts individually
- Mobile: bottom sheet modals, auto-card tables, sidebar slide-in from left
- No changes to dark mode tokens except surface-container contrast tweaks

---

### Task 1: Update Design Tokens in index.css

**Files:**
- Modify: `frontend/src/index.css`

**Interfaces:**
- Consumes: existing CSS variables from `@theme` and `.dark`
- Produces: new color tokens consumed by all components

- [ ] **Step 1: Read the current file**

Read `frontend/src/index.css` to see current state.

- [ ] **Step 2: Update `@theme` — primary palette**

Replace the existing `--color-primary` block:

```css
--color-primary: #2E7D32;
--color-primary-light: #4CAF50;
--color-primary-lighter: #66BB6A;
--color-primary-dark: #1B5E20;
--color-primary-container: #E8F5E9;
--color-primary-fixed: #C8E6C9;
--color-primary-fixed-dim: #A5D6A7;
--color-on-primary: #ffffff;
--color-on-primary-container: #1B5E20;
```

- [ ] **Step 3: Update `@theme` — warm background and surface**

Replace `--color-background`, `--color-surface-dim`, `--color-surface-container`:

```css
--color-background: #F8FAF8;
--color-on-background: #111827;

--color-surface: #FFFFFF;
--color-surface-dim: #F1F5F1;
--color-surface-bright: #FFFFFF;
--color-surface-variant: #F8FAF8;
--color-surface-container: #E8EDE8;
--color-surface-container-low: #E0E8E0;
--color-surface-container-lowest: #FFFFFF;
--color-surface-container-high: #D5DFD5;
--color-surface-container-highest: #C5D0C5;
```

- [ ] **Step 4: Update `.dark` tokens — adjust surface containers**

In the `.dark` block, update these to be slightly more distinct:

```css
.dark {
  /* Keep primary as #81C784 — already good */
  --color-primary: #81C784;

  /* Adjust surface for better contrast */
  --color-surface-container: #2A3A2A;
  --color-surface-container-low: #243424;
  --color-surface-container-high: #2E3E2E;
  --color-surface-dim: #1A2A1A;
  --color-background: #0F1A0F;
  --color-border: #2A3A2A;
}
```

- [ ] **Step 5: Add/update utility shadows in `@layer utilities`**

Shadows are already defined — just verify they exist:

```css
.shadow-card {
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04);
}
.shadow-card-hover {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.06);
}
.shadow-modal {
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.2);
}
```

These stay as-is. No changes needed.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat(ui): update color tokens to fresh green palette with warm surfaces"
```

---

### Task 2: Sidebar — Width, Active State, Spacing

**Files:**
- Modify: `frontend/src/components/layout/Sidebar.tsx`

**Interfaces:**
- Consumes: same props interface `SidebarProps` (unchanged signature)
- Produces: sidebar with 256px default width, 72px collapsed, new active/hover styling

- [ ] **Step 1: Read current Sidebar.tsx**

Read `frontend/src/components/layout/Sidebar.tsx` to see full file.

- [ ] **Step 2: Update width classes**

Replace width classes in the `aside` element:

```tsx
// Sekarang:
className={`${mobile ? 'fixed inset-0 z-50 flex' : 'hidden md:flex'} h-screen flex-col bg-surface border-r border-border shrink-0 ${
  collapsed ? (mobile ? 'w-72' : 'w-20') : 'w-72'
} ...`}

// Nanti:
className={`${mobile ? 'fixed inset-0 z-50 flex' : 'hidden md:flex'} h-screen flex-col bg-surface border-r border-border/60 shrink-0 ${
  collapsed ? (mobile ? 'w-64' : 'w-18') : 'w-64'
} ...`}
```

- [ ] **Step 3: Update side panel width for mobile**

In the mobile overlay panel `<div>`, change:
```tsx
// Sekarang: w-72 shadow-2xl
// Nanti:
className={`relative z-10 flex flex-col h-full py-6 ${mobile ? 'w-64 shadow-2xl' : ''}`}
```

- [ ] **Step 4: Update brand logo size**

Reduce brand logo from `w-12 h-12` to `w-10 h-10` and adjust text:

```tsx
<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-sm">
  <span className="text-white font-bold text-xl">K</span>
</div>
{(!collapsed || mobile) && (
  <div>
    <h1 className="font-display-title text-on-surface text-base tracking-tight truncate">
      Kinetic CRM
    </h1>
    <p className="font-caption-xs text-outline uppercase tracking-widest text-[9px]">
      OPERASI PERUSAHAAN
    </p>
  </div>
)}
```

- [ ] **Step 5: Update sidebar padding**

Change nav area padding:
```tsx
// Sekarang: px-3 py-6
// Nanti:
className="relative z-10 flex flex-col h-full py-5"
```

Change brand header padding:
```tsx
// Sekarang: px-6 mb-8
// Nanti:
className={`px-5 mb-6 transition-opacity duration-200 ${collapsed && !mobile ? 'text-center' : ''}`}
```

- [ ] **Step 6: Update nav item active/hover styling**

Replace the `renderNavItem` className:

```tsx
// Sekarang:
className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left font-label-sm text-label-sm touch-min-h ${
  isActive
    ? 'bg-primary-container/20 text-primary font-semibold'
    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
}`}

// Nanti:
className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-left font-label-sm text-label-sm touch-min-h ${
  isActive
    ? 'bg-primary-container/40 text-primary font-semibold border-l-[3px] border-primary'
    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface border-l-[3px] border-transparent'
}`}
```

- [ ] **Step 7: Update active icon color**

The icon span uses `text-primary` when active — this will pick up `#2E7D32` automatically from the CSS variable. No code change needed here, just verify.

- [ ] **Step 8: Update collapse button**

Replace the collapse button:
```tsx
// Sekarang: w-12 h-12
// Sekarang: px-8 py-3 or full-width

// Nanti:
<button
  onClick={() => setCollapsed(!collapsed)}
  className="w-full flex items-center justify-center gap-2 py-2 text-outline font-label-sm text-label-sm rounded-lg hover:bg-surface-container hover:text-on-surface-variant transition-all touch-min-h"
  aria-label={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
>
  <span className="material-symbols-outlined text-lg transition-transform duration-300">
    {collapsed ? 'keyboard_double_arrow_right' : 'chevron_left'}
  </span>
</button>
```

- [ ] **Step 9: Commit**

```bash
git add frontend/src/components/layout/Sidebar.tsx
git commit -m "feat(ui): redesign sidebar — w-64 default, minimal active state, tighter padding"
```

---

### Task 3: Topbar — More Compact, Cleaner

**Files:**
- Modify: `frontend/src/components/layout/Topbar.tsx`

**Interfaces:**
- Consumes: same `TopbarProps` (unchanged)
- Produces: topbar at `h-12 sm:h-14` with cleaner icon layout

- [ ] **Step 1: Read current Topbar.tsx**

Read `frontend/src/components/layout/Topbar.tsx`.

- [ ] **Step 2: Reduce header height**

```tsx
// Sekarang:
<header className="w-full h-14 sm:h-16 bg-surface border-b border-border flex items-center ...">

// Nanti:
<header className="w-full h-12 sm:h-14 bg-surface border-b border-border/60 flex items-center ...">
```

- [ ] **Step 3: Reduce icon button wrapper size**

```tsx
// Sekarang:
className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl hover:bg-surface-container transition-all cursor-pointer touch-min"

// Nanti:
className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surface-container transition-all cursor-pointer touch-min"
```

Apply this to ALL icon buttons: hamburger menu, search, notifications, messages, settings, dark mode toggle.

- [ ] **Step 4: Simplify user avatar section**

Remove the name/role text next to avatar (show only on tooltip):

```tsx
// Sekarang: full name + role + avatar
// Nanti: avatar only with tooltip

<button
  type="button"
  onClick={onProfileClick}
  className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surface-container transition-all cursor-pointer touch-min"
  aria-label="Profil pengguna"
  title={userName}
>
  <img
    className="w-8 h-8 rounded-full ring-2 ring-primary/10 object-cover"
    alt="Foto profil"
    src={avatarUrl}
    referrerPolicy="no-referrer"
  />
</button>
```

- [ ] **Step 5: Reduce Topbar padding**

```tsx
// Sekarang:
<div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">

// Nanti:
<div className="flex items-center gap-2 flex-1 min-w-0">
```

And the right action group:
```tsx
// Sekarang:
<div className="flex items-center gap-0 sm:gap-1 lg:gap-3">

// Nanti:
<div className="flex items-center gap-1">
```

- [ ] **Step 6: Update divider**

```tsx
// Sekarang:
<div className="h-6 sm:h-8 w-[1px] bg-border mx-0 sm:mx-1 lg:mx-2"></div>

// Nanti:
<div className="h-5 w-[1px] bg-border/60 mx-1"></div>
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/layout/Topbar.tsx
git commit -m "feat(ui): compact topbar — h-12/h-14, smaller icon buttons, avatar-only user"
```

---

### Task 4: AppLayout — Content Spacing

**Files:**
- Modify: `frontend/src/components/layout/AppLayout.tsx`

**Interfaces:**
- Consumes: same layout structure
- Produces: more generous content padding

- [ ] **Step 1: Read current AppLayout.tsx**

Read `frontend/src/components/layout/AppLayout.tsx`.

- [ ] **Step 2: Update main content padding**

```tsx
// Sekarang:
<div className="flex-1 flex flex-col min-h-0 overflow-y-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">

// Nanti:
<div className="flex-1 flex flex-col min-h-0 overflow-y-auto px-4 sm:px-8 lg:px-10 py-5 sm:py-8">
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/layout/AppLayout.tsx
git commit -m "feat(ui): increase content padding — px-4/8/10 py-5/8"
```

---

### Task 5: Button Component — Radius, Colors, Padding

**Files:**
- Modify: `frontend/src/components/ui/Button.tsx`

**Interfaces:**
- Consumes: `ButtonProps` (unchanged interface)
- Produces: buttons with `rounded-lg`, new primary color, adjusted padding

- [ ] **Step 1: Read current Button.tsx**

Read `frontend/src/components/ui/Button.tsx`.

- [ ] **Step 2: Update border radius from rounded-xl to rounded-lg**

```tsx
// Sekarang:
className={`inline-flex items-center justify-center gap-2 font-label-sm font-semibold rounded-xl transition-all ...`}

// Nanti:
className={`inline-flex items-center justify-center gap-2 font-label-sm font-semibold rounded-lg transition-all ...`}
```

- [ ] **Step 3: Add hover shadow transition**

Add shadow to primary variant:
```tsx
const variants = {
  primary: 'bg-primary text-white hover:bg-primary-light shadow-sm hover:shadow-md active:shadow-sm',
  secondary: 'bg-surface text-on-surface border border-border hover:bg-surface-container',
  ghost: 'text-secondary hover:bg-surface-container hover:text-primary',
  danger: 'bg-danger text-white hover:opacity-90 shadow-sm',
  outline: 'bg-surface text-primary border border-primary/30 hover:bg-primary/5',
  success: 'bg-success text-white hover:opacity-90 shadow-sm',
  warning: 'bg-gold text-white hover:opacity-90 shadow-sm',
};
```

- [ ] **Step 4: Reduce padding for md size**

```tsx
// Sekarang:
const sizes = {
  sm: 'px-3.5 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

// Nanti:
const sizes = {
  xs: 'px-2.5 py-1 text-[11px]',    // baru: inline compact actions
  sm: 'px-3.5 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};
```

- [ ] **Step 5: Add size type**

Update the interface:
```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'success' | 'warning';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

Update the destructured default:
```tsx
const size = 'md' as 'xs' | 'sm' | 'md' | 'lg';
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/ui/Button.tsx
git commit -m "feat(ui): restyle Button — rounded-lg, adjusted padding, xs size variant"
```

---

### Task 6: Input & Select — Border, Label, Error State

**Files:**
- Modify: `frontend/src/components/ui/Input.tsx`
- Modify: `frontend/src/components/ui/Select.tsx`

**Interfaces:**
- Consumes: same `InputProps`/`SelectProps` (unchanged)
- Produces: inputs with lighter border, uppercase labels, error icons

- [ ] **Step 1: Read both files**

Read `frontend/src/components/ui/Input.tsx` and `frontend/src/components/ui/Select.tsx`.

- [ ] **Step 2: Update Input label style**

```tsx
// Sekarang:
<label htmlFor={inputId} className="font-label-sm text-sm text-on-surface font-semibold">

// Nanti:
<label htmlFor={inputId} className="text-[11px] font-semibold text-on-surface uppercase tracking-wider">
```

- [ ] **Step 3: Update Input border and padding**

```tsx
// Sekarang:
className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-all ...`}

// Nanti:
className={`w-full px-3.5 py-2 border rounded-lg text-sm outline-none transition-all ...`}
```

- [ ] **Step 4: Update Input error state with icon**

Add error icon span inside the wrapper div:
```tsx
<div className="relative">
  {leftIcon && (
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">
      {leftIcon}
    </span>
  )}
  <input
    id={inputId}
    aria-invalid={!!error}
    aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
    className={`w-full px-3.5 py-2 border rounded-lg text-sm outline-none transition-all bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary ${leftIcon ? 'pl-9' : ''} ${rightIcon || error ? 'pr-9' : ''} ${error ? 'border-danger focus:ring-danger/20 focus:border-danger' : 'border-outline-variant hover:border-outline'} ${className}`}
    {...props}
  />
  {rightIcon && (
    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-outline text-sm">
      {rightIcon}
    </span>
  )}
  {error && !rightIcon && (
    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-danger text-sm material-symbols-outlined" aria-hidden="true">
      warning
    </span>
  )}
</div>
```

- [ ] **Step 5: Update Input placeholder**

Note: placeholder opacity is controlled via Tailwind's `placeholder:` modifier. Add:
```css
/* Tidak perlu — Tailwind v4 default placeholder opacity sudah cukup */
```
Actually in Tailwind v4 the default placeholder color is controlled by the `placeholder` utility. Current code doesn't set a placeholder color, so it inherits the browser default. Let's add it inline:
```tsx
// Tambahkan di className setelah bg-surface
`...placeholder:text-on-surface-variant/50`
```

- [ ] **Step 6: Update Select label, border, padding**

Same changes as Input:
```tsx
// Label:
<label htmlFor={selectId} className="text-[11px] font-semibold text-on-surface uppercase tracking-wider">

// Select element:
className={`w-full px-3.5 py-2 border rounded-lg text-sm bg-surface outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary ${error ? 'border-danger focus:ring-danger/20' : 'border-outline-variant hover:border-outline'} ${className}`}
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/ui/Input.tsx frontend/src/components/ui/Select.tsx
git commit -m "feat(ui): restyle Input & Select — rounded-lg, uppercase label, error icon, tighter padding"
```

---

### Task 7: Modal — Animation, Sizes, Mobile Bottom Sheet

**Files:**
- Modify: `frontend/src/components/ui/Modal.tsx`

**Interfaces:**
- Consumes: `ModalProps` (add `size: 'xl'` option)
- Produces: modal with smoother animation, new size option, mobile behavior

- [ ] **Step 1: Read current Modal.tsx**

Read `frontend/src/components/ui/Modal.tsx`.

- [ ] **Step 2: Add xl size option**

```tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4',
};
```

- [ ] **Step 3: Add mobile bottom sheet behavior**

```tsx
// Sekarang:
className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"

// Nanti (tetap sama, sudah cukup baik untuk mobile bottom sheet):

// Tambah animasi zoom-in di container dialog:
// Sekarang:
className={`bg-surface sm:rounded-2xl shadow-modal w-full ${sizes[size]} max-h-[95vh] sm:max-h-[90vh] flex flex-col animate-in zoom-in-95 fade-in duration-200 rounded-t-2xl sm:rounded-2xl`}

// Nanti — tambah slide-up untuk mobile:
className={`bg-surface sm:rounded-2xl shadow-modal w-full ${sizes[size]} max-h-[95vh] sm:max-h-[90vh] flex flex-col animate-in zoom-in-95 fade-in duration-200 rounded-t-2xl sm:rounded-2xl sm:animate-in sm:zoom-in-95 sm:fade-in`}
```

Note: For mobile bottom sheet effect, the `items-end sm:items-center` already makes it snap to bottom on mobile. Keep this.

- [ ] **Step 4: Add slide-up animation for mobile**

Add to `index.css` later (or verify it's not needed with Tailwind v4 animate-in). Tailwind CSS v4 with `tailwindcss-animate` plugin already includes `animate-in`, `fade-in`, `zoom-in-95`, `slide-in-from-bottom`. If not installed, we need to note this.

Check package.json:
```bash
grep -i animate package.json
```

If `tailwindcss-animate` is not in package.json, the animate classes won't work. Modal already uses `animate-in zoom-in-95 fade-in` — likely already working. Keep as-is.

- [ ] **Step 5: Make header sticky**

Add sticky class to header:
```tsx
<div className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border/60 bg-surface">
```

- [ ] **Step 6: Make footer sticky**

```tsx
{footer && <div className="sticky bottom-0 px-4 sm:px-6 py-3 sm:py-4 border-t border-border/60 bg-surface-container-low flex justify-end gap-3 shrink-0">{footer}</div>}
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/ui/Modal.tsx
git commit -m "feat(ui): update Modal — xl size, sticky header/footer"
```

---

### Task 8: Card & Badge — Consistent Styling

**Files:**
- Modify: `frontend/src/components/ui/Card.tsx`
- Modify: `frontend/src/components/ui/Badge.tsx`

**Interfaces:**
- Consumes: same props (unchanged)
- Produces: cards with `rounded-xl`, badges with bold + letter-spacing

- [ ] **Step 1: Read both files**

Read `frontend/src/components/ui/Card.tsx` and `frontend/src/components/ui/Badge.tsx`.

- [ ] **Step 2: Update Card border radius**

```tsx
// Sekarang:
<div className={`${hasBg ? '' : 'bg-surface'} rounded-2xl border border-border/60 shadow-card ${hover ? ...}`}>

// Nanti:
<div className={`${hasBg ? '' : 'bg-surface'} rounded-xl border border-border/60 shadow-card ${hover ? ...}`}>
```

- [ ] **Step 3: Update Card hover effect**

```tsx
// Sekarang:
{hover ? 'hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5' : ''}

// Nanti:
{hover ? 'hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5' : ''}
```
This stays the same — the `-translate-y-0.5` is already subtle enough.

- [ ] **Step 4: Update Card header spacing**

```tsx
// Sekarang:
{header && <div className="border-b border-border/60 px-5 py-4">{header}</div>}

// Nanti — add icon+title+action structure:
{header && (
  <div className="border-b border-border/60 px-5 py-3.5">
    {typeof header === 'string' ? (
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-lg">info</span>
        <h4 className="font-heading-section text-sm">{header}</h4>
      </div>
    ) : header}
  </div>
)}
```

- [ ] **Step 5: Update Badge font**

```tsx
// Sekarang:
return (
  <span className={`inline-flex items-center font-semibold rounded-full ${variants[variant]} ${sizes[size]} ${className}`}>
    {children}
  </span>
);

// Nanti:
return (
  <span className={`inline-flex items-center font-bold tracking-wide rounded-full ${variants[variant]} ${sizes[size]} ${className}`}>
    {children}
  </span>
);
```

- [ ] **Step 6: Add new Badge variants**

```tsx
const variants = {
  default: 'bg-secondary-container text-secondary',
  success: 'bg-success-container text-success',
  warning: 'bg-warning-container text-warning',
  danger: 'bg-danger-container text-danger',
  info: 'bg-info-container text-info',
  primary: 'bg-primary-container text-primary',
  purple: 'bg-purple-100 text-status-purple',
  gold: 'bg-gold-container text-on-gold',
  neutral: 'bg-surface-container-high text-on-surface-variant',
};
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/ui/Card.tsx frontend/src/components/ui/Badge.tsx
git commit -m "feat(ui): restyle Card (rounded-xl) and Badge (bold, tracking, new variants)"
```

---

### Task 9: EmptyState — Icons and CTAs

**Files:**
- Modify: `frontend/src/components/shared/EmptyState.tsx`

**Interfaces:**
- Consumes: `EmptyState` component (check current interface)
- Produces: richer empty states with icon, title, description, CTA

- [ ] **Step 1: Read current EmptyState.tsx**

Read `frontend/src/components/shared/EmptyState.tsx`.

- [ ] **Step 2: Update component to support richer display**

If EmptyState is currently just text, enhance it:

```tsx
import React from 'react';
import Button from '@/components/ui/Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'empty' | 'search' | 'filter';
}

export default function EmptyState({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction,
  variant = 'empty',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-3xl text-outline">
          {variant === 'search' ? 'search_off' : variant === 'filter' ? 'filter_alt_off' : icon}
        </span>
      </div>
      <h3 className="font-heading-section text-base text-on-surface mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-secondary max-w-sm">{description}</p>
      )}
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="primary" size="md" onClick={onAction} leftIcon={<span className="material-symbols-outlined text-[16px]">add</span>}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/shared/EmptyState.tsx
git commit -m "feat(ui): enhance EmptyState with icons, descriptions, and CTA button"
```

---

### Task 10: DataTable — Filter as Popover, Pagination

**Files:**
- Modify: `frontend/src/components/shared/DataTable.tsx`
- Modify: `frontend/src/components/shared/FilterPanel.tsx`

**Interfaces:**
- Consumes: `DataTableProps` (add `filterAsDrawer?: boolean`)
- Produces: filter as popover/drawer instead of static block, better pagination info

- [ ] **Step 1: Read both files**

Read `frontend/src/components/shared/DataTable.tsx` and `frontend/src/components/shared/FilterPanel.tsx`.

- [ ] **Step 2: Update DataTable — add filter toggle**

Add filter drawer/popover state:

```tsx
const [showFilterDrawer, setShowFilterDrawer] = useState(false);

// Add filter button in the toolbar section:
<Button
  variant="secondary"
  size="sm"
  onClick={() => setShowFilterDrawer(!showFilterDrawer)}
  leftIcon={<span className="material-symbols-outlined text-[16px]">filter_alt</span>}
>
  Filter
  {activeFilterCount > 0 && (
    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
      {activeFilterCount}
    </span>
  )}
</Button>
```

Note: Need to compute `activeFilterCount` — add:
```tsx
// Hitung jumlah filter aktif
const activeFilterCount = useMemo(() => {
  if (!('filterValues' in this)) return 0;
  return Object.values(filterValues).filter(Boolean).length;
}, [filterValues]);
```

Wait, DataTable doesn't own filterValues. We need a different approach. Let me check how FilterPanel is used in ProjectListPage.

From what I read earlier, `ProjectListPage` uses `FilterPanel` as a standalone component. It's not part of `DataTable`. The FilterPanel renders as a static block.

So for DataTable itself, the filter toolbar change is:
- Add a "Filter" button in the toolbar area
- The parent page renders FilterPanel in a collapsible section controlled by `showFilters` state

- [ ] **Step 3: Update DataTable toolbar**

Update the toolbar section in DataTable:

```tsx
<div className="flex items-center gap-2">
  {/* Filter toggle */}
  <Button variant="secondary" size="sm" onClick={() => setShowColumnMenu(!showColumnMenu)} 
    leftIcon={<span className="material-symbols-outlined text-[16px]">filter_alt</span>}>
    Filter
  </Button>

  {exportable && data.length > 0 && (
    <Button variant="secondary" size="sm" onClick={exportCSV} leftIcon={<span className="material-symbols-outlined text-[16px]">file_download</span>}>
      Export
    </Button>
  )}
  {hideableColumns && (
    <div className="relative" ref={menuRef}>
      <Button variant="secondary" size="sm" onClick={() => setShowColumnMenu(!showColumnMenu)} leftIcon={<span className="material-symbols-outlined text-[16px]">view_column</span>}>
        Kolom
      </Button>
      ...
    </div>
  )}
  {onAdd && (
    <Button variant="primary" size="sm" onClick={onAdd} leftIcon={<span className="material-symbols-outlined text-sm">add</span>}>
      {addLabel}
    </Button>
  )}
</div>
```

Wait, DataTable doesn't own filter logic. Let me look at the actual usage again.

In `ProjectListPage.tsx`, it renders:
```tsx
<FilterPanel ... />
<DataTable ... />
```

So FilterPanel is rendered separately above DataTable. For the redesign, we should make FilterPanel collapsible — controlled by a "Filter" button that lives in the page or in DataTable's toolbar.

Better approach: Add an `onToggleFilter` callback to DataTable, and let the parent control FilterPanel visibility. But that couples them unnecessarily.

Simpler approach: Keep FilterPanel rendering in the parent page, but wrap it in a collapsible container with an `AnimatePresence` or simple `hidden` toggle.

Let me add `showFilters` state to the page and keep DataTable toolbar as-is — the parent passes a "Filter" button separately.

Actually, let's keep this simpler. The DataTable toolbar already has an "Export" button on the left side of the action buttons. We just need to ensure it looks clean. Let me focus on what DataTable directly controls:

- [ ] **Step 4: Update DataTable pagination display**

Update the pagination section in the Table component (since DataTable delegates to Table):

Read `frontend/src/components/ui/Table.tsx`:

```tsx
// If pagination shows Prev/Next only, enhance:
// Add info text: "Menampilkan 1-20 dari 156 data"
```

Let me read the Table component:

```bash
grep -n "pagination\|Pagination\|page" frontend/src/components/ui/Table.tsx
```

Based on the DataTable code, pagination props are forwarded to `<Table>`. We'll need to check Table.tsx for its pagination rendering.

Actually, for scope management: The pagination enhancement is a nice-to-have within the table component. Let me keep tasks focused. The main DataTable change is aesthetic (spacing) plus the filter-as-popover pattern.

- [ ] **Step 5: Commit DataTable changes**

```bash
git add frontend/src/components/shared/DataTable.tsx
git commit -m "feat(ui): enhance DataTable toolbar and spacing"
```

- [ ] **Step 6: Convert FilterPanel to collapsible (popover style)**

Update `FilterPanel.tsx` to support inline/slide-down mode:

Add a `collapsible` prop:

```tsx
interface FilterPanelProps {
  fields: FilterField[];
  values: FilterValues;
  onChange: (key: string, value: string) => void;
  onReset: () => void;
  onApply?: () => void;
  collapsible?: boolean;
  isOpen?: boolean;
}
```

When `collapsible` is true and `isOpen` is false, wrap content in collapsible:
```tsx
export default function FilterPanel({ fields, values, onChange, onReset, onApply, collapsible = false, isOpen = true }: FilterPanelProps) {
  if (collapsible && !isOpen) return null;
  
  return (
    <div className="bg-surface rounded-xl border border-border/60 p-4 space-y-4 shadow-card animate-in slide-in-from-top-2 fade-in duration-200">
      ...
    </div>
  );
}
```

- [ ] **Step 7: Commit FilterPanel changes**

```bash
git add frontend/src/components/shared/FilterPanel.tsx
git commit -m "feat(ui): add collapsible mode to FilterPanel"
```

---

### Task 11: Detail Pages — Pill Tabs, Consistent Spacing

**Files:**
- Modify: `frontend/src/features/procurement/ProcurementDetailPage.tsx`
- Modify: `frontend/src/features/projects/ProjectDetailPage.tsx`

**Interfaces:**
- Consumes: same page structure and props
- Produces: pill-style tab navigation, tighter sticky header, consistent content padding

- [ ] **Step 1: Read ProcurementDetailPage.tsx**

Read `frontend/src/features/procurement/ProcurementDetailPage.tsx`.

- [ ] **Step 2: Update Procurement sticky header height**

```tsx
// Sekarang:
<section className="bg-surface border-b border-border/60 px-4 sm:px-8 py-2.5 sm:py-3.5 shadow-card z-30">

// Nanti:
<section className="bg-surface border-b border-border/60 px-4 sm:px-8 py-2 sm:py-3 shadow-sm z-30">
```

- [ ] **Step 3: Update Procurement tab navigation to pills**

Replace the tab nav section:

```tsx
// Sekarang: underline tabs
<nav className="bg-surface border-b border-border/60 px-3 sm:px-8 overflow-x-auto select-none scrollbar-none">
  <div className="flex items-center gap-4 sm:gap-8 min-w-max">
    {tabs.map((tab, index) => {
      const locked = isTabLocked(index);
      return (
        <button key={tab.label}
          onClick={() => { if (!locked) handleTabChange(tab.path); }}
          className={`py-3 sm:py-4 font-label-sm text-xs sm:text-sm transition-all relative flex items-center gap-1 whitespace-nowrap ${
            activeTab === tab.label
              ? 'text-primary font-bold border-b-2 border-primary'
              : locked ? 'text-outline cursor-not-allowed opacity-50' : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          {locked && <span className="material-symbols-outlined text-[14px] sm:text-[16px]">lock</span>}
          {tab.label}
        </button>
      );
    })}
  </div>
</nav>

// Nanti: pills style
<nav className="bg-surface border-b border-border/60 px-3 sm:px-8 py-3 overflow-x-auto select-none scrollbar-none">
  <div className="flex items-center gap-2 min-w-max">
    {tabs.map((tab, index) => {
      const locked = isTabLocked(index);
      return (
        <button key={tab.label}
          onClick={() => { if (!locked) handleTabChange(tab.path); }}
          className={`px-4 py-2 font-label-sm text-xs sm:text-sm rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === tab.label
              ? 'bg-primary text-white shadow-sm font-bold'
              : locked
                ? 'text-outline cursor-not-allowed opacity-40'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
          }`}
        >
          {locked && <span className="material-symbols-outlined text-[14px]">lock</span>}
          {tab.label}
        </button>
      );
    })}
  </div>
</nav>
```

- [ ] **Step 3: Update Procurement content padding**

```tsx
// Sekarang:
<div className="p-3 sm:p-6 lg:p-8">
  <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">

// Nanti:
<div className="p-4 sm:p-6">
  <div className="max-w-6xl mx-auto space-y-5">
```

- [ ] **Step 4: Read ProjectDetailPage.tsx**

Read `frontend/src/features/projects/ProjectDetailPage.tsx` to find its tab navigation.

- [ ] **Step 5: Apply same pill tabs and spacing changes to ProjectDetailPage**

Same pattern as ProcurementDetailPage:
- Header: `py-2 sm:py-3 shadow-sm`
- Tab nav: pills style (same component pattern)
- Content: `p-4 sm:p-6` with `max-w-6xl mx-auto space-y-5`

- [ ] **Step 6: Commit**

```bash
git add frontend/src/features/procurement/ProcurementDetailPage.tsx frontend/src/features/projects/ProjectDetailPage.tsx
git commit -m "feat(ui): convert detail page tabs to pills style, tighten header"
```

---

### Task 12: Login Page — Dual-Panel Layout

**Files:**
- Modify: `frontend/src/features/auth/LoginPage.tsx`

**Interfaces:**
- Consumes: same auth stores and logic (unchanged)
- Produces: dual-panel layout with left brand panel and right form panel

- [ ] **Step 1: Read current LoginPage.tsx**

Read `frontend/src/features/auth/LoginPage.tsx`.

- [ ] **Step 2: Replace layout structure**

Replace the outer wrapper:

```tsx
// Sekarang:
<div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-green-800 to-green-950 p-4">
  <div className="w-full max-w-md">
    <div className="bg-surface rounded-2xl shadow-xl border border-border/60 p-8">
      ...
    </div>
  </div>
</div>

// Nanti:
<div className="min-h-screen w-full flex">
  {/* Left Panel — Branding (hidden on mobile) */}
  <div className="hidden lg:flex w-[40%] bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 flex-col items-center justify-center p-12 relative overflow-hidden">
    {/* Decorative pattern */}
    <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
      <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-primary blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-primary-lighter blur-3xl" />
    </div>
    
    <div className="relative z-10 text-center">
      <div className="w-20 h-20 rounded-2xl bg-primary shadow-lg flex items-center justify-center mx-auto mb-6">
        <span className="text-white font-bold text-4xl">K</span>
      </div>
      <h2 className="font-display-title text-2xl text-primary-dark dark:text-primary-light font-bold mb-2">
        Kinetic CRM
      </h2>
      <p className="text-primary-dark/70 dark:text-primary-light/70 text-sm max-w-xs">
        Kelola proyek dan pengadaan perusahaan lebih efektif dalam satu platform terintegrasi.
      </p>
    </div>
  </div>

  {/* Right Panel — Form */}
  <div className="w-full lg:w-[60%] flex items-center justify-center p-4 sm:p-8 bg-surface">
    <div className="w-full max-w-md">
      {/* Brand — visible on mobile only */}
      <div className="lg:hidden text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <span className="material-symbols-outlined text-primary text-3xl">corporate_fare</span>
        </div>
        <h1 className="font-display-title text-xl text-on-surface">KINETIC CRM</h1>
        <p className="text-caption-xs text-secondary mt-0.5">Enterprise Workspace Portal</p>
      </div>

      {/* Login Form — same as current, minus the outer card wrapper */}
      <div className="bg-surface rounded-xl p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          ...
        </form>
        
        {/* Demo accounts */}
        <div className="mt-6 pt-4 border-t border-border/60">
          ...
        </div>
      </div>

      <p className="text-caption-xs text-secondary text-center mt-4">
        &copy; {new Date().getFullYear()} Kinetic CRM. All rights reserved.
      </p>
    </div>
  </div>
</div>
```

- [ ] **Step 3: Keep all existing login logic unchanged**

The `handleSubmit`, `selectAccount`, `showDepartmentPicker` logic stays exactly the same. Only the layout wrapper and visual structure change.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/auth/LoginPage.tsx
git commit -m "feat(ui): redesign login page with dual-panel layout"
```

---

### Task 13: Polish — Breadcrumb, PhaseStepper, PageLoader

**Files:**
- Modify: `frontend/src/components/layout/Breadcrumb.tsx`
- Modify: `frontend/src/components/shared/PhaseStepper.tsx`
- Modify: `frontend/src/components/layout/PageLoader.tsx`
- Modify: `frontend/src/components/layout/PageSkeleton.tsx`

- [ ] **Step 1: Update Breadcrumb styling**

Read `frontend/src/components/layout/Breadcrumb.tsx`:

```tsx
// Sekarang: assume uses text-xs text-secondary
// Nanti: add home icon, reduce font size
// Current separator: '/' or '>'
// Add: icon home di awal
```

Update breadcrumb to be more compact:
```tsx
// Wrap in smaller container:
<nav className="px-4 sm:px-8 lg:px-10 py-2 bg-background border-b border-border/30">
  {/* breadcrumb items */}
</nav>
```

- [ ] **Step 2: Update PhaseStepper pills**

Read `frontend/src/components/shared/PhaseStepper.tsx` — align with pill tab style.

- [ ] **Step 3: Update PageLoader/PageSkeleton styling**

Update to use new surface-container colors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/layout/Breadcrumb.tsx frontend/src/components/shared/PhaseStepper.tsx frontend/src/components/layout/PageLoader.tsx frontend/src/components/layout/PageSkeleton.tsx
git commit -m "feat(ui): polish Breadcrumb, PhaseStepper, PageLoader styling"
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Color tokens | `index.css` |
| 2 | Sidebar | `Sidebar.tsx` |
| 3 | Topbar | `Topbar.tsx` |
| 4 | Content spacing | `AppLayout.tsx` |
| 5 | Button | `Button.tsx` |
| 6 | Input & Select | `Input.tsx`, `Select.tsx` |
| 7 | Modal | `Modal.tsx` |
| 8 | Card & Badge | `Card.tsx`, `Badge.tsx` |
| 9 | EmptyState | `EmptyState.tsx` |
| 10 | DataTable & FilterPanel | `DataTable.tsx`, `FilterPanel.tsx` |
| 11 | Detail pages | `ProcurementDetailPage.tsx`, `ProjectDetailPage.tsx` |
| 12 | Login page | `LoginPage.tsx` |
| 13 | Polish | Breadcrumb, PhaseStepper, PageLoader |
