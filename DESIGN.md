---
name: Kinetic CRM
description: Approval governance platform for Indonesian enterprise sales and operations
colors:
  official-green: "#2E7D32"
  approval-stamp: "#4CAF50"
  approved-tint: "#66BB6A"
  registry-ink: "#1B5E20"
  filed-paper: "#E8F5E9"
  seal-white: "#ffffff"
  cancelled-ink: "#374151"
  muted-edge: "#6B7280"
  muted-tint: "#F3F4F6"
  audit-sheet: "#F8FAF8"
  dossier: "#FFFFFF"
  dossier-dim: "#F1F5F1"
  dossier-container: "#E8EDE8"
  document-ink: "#111827"
  rule-line: "#E5E7EB"
  faded-line: "#9CA3AF"
  verified: "#16A34A"
  verified-bg: "#DCFCE7"
  flagged: "#0284C7"
  flagged-bg: "#E0F2FE"
  caution: "#D97706"
  caution-bg: "#FEF3C7"
  rejected: "#DC2626"
  rejected-bg: "#FEE2E2"
  in-review: "#EA580C"
  reviewed: "#7C3AED"
  gold-seal: "#D4A843"
  gold-seal-bg: "#FEF3C7"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: "2rem"
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: "1.75rem"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: "1.625rem"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: "1.5rem"
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: "1.25rem"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: "1.125rem"
rounded:
  sm: "0.25rem"
  md: "0.375rem"
  lg: "0.5rem"
  xl: "0.75rem"
  full: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
---

# Design System: Kinetic CRM

## 1. Overview

**Creative North Star: "The Governed Archive"**

Kinetic CRM's visual identity is rooted in the confidence of a filing system where every decision is recorded, every approval is stamped, and every document is in its place. The interface communicates authority through precision, not decoration — clean structure, deliberate spacing, and a restrained green accent that signals completion and approval without dominating the surface.

This system explicitly rejects two extremes: the visual heaviness of legacy enterprise CRMs (crowded toolbars, dense data tables, inconsistent form controls) and the casual playfulness of consumer apps (rounded everything, illustrations, decorative motion). Kinetic occupies the middle: professional, purposeful, and unadorned. The tool should disappear into the task.

**Key Characteristics:**
- Tonal depth via surface containers, not shadows
- Single sans-serif family (Inter) at all levels
- Green as an accent for primary actions and state indicators, never decoration
- Consistent 2px focus rings and 200ms transitions throughout
- Responsive by structure (sidebar collapse, mobile card stacks, breakpoint-driven grids), not by fluid typography

## 2. Colors

The palette is restrained by design: a green primary carries authority and approval signals, while a green-tinted neutral scale provides structure through tonal layering. Color is never applied decoratively; every instance serves a state, a role, or a piece of information.

### Primary
- **Official Green** (#2E7D32): Primary actions, active navigation, selected states, sort indicators, and the topbar accent line. Use as a button background, link color, or focus ring tint. Do not use for body text or passive backgrounds.
- **Approval Stamp** (#4CAF50): Primary hover state, success confirmation, interactive hover feedback on primary elements.
- **Registry Ink** (#1B5E20): Deep press state, dark variant for high-contrast needs, dark mode primary text.
- **Filed Paper** (#E8F5E9): Primary container backgrounds — highlighted table rows, selected cards, info callouts in approval contexts.
- **Seal White** (#ffffff): Text and icons on primary backgrounds.

### Neutral
- **Audit Sheet** (#F8FAF8): Page background. A near-white with the faintest green cast — not cream, not gray.
- **Dossier** (#FFFFFF): Card and surface background. Pure white with container variants for depth.
- **Dossier Dim** (#F1F5F1): Low-level surface differentiation — secondary panels, hover states.
- **Dossier Container** (#E8EDE8): Container surfaces — table headers, input borders at rest, tertiary backgrounds.
- **Document Ink** (#111827): Primary body text and high-emphasis labels.
- **Cancelled Ink** (#374151): Secondary text, muted labels, inactive states.
- **Rule Line** (#E5E7EB): Borders and dividers between sections and table rows.
- **Faded Line** (#9CA3AF): Low-emphasis outlines, placeholder text, disabled indicators.

### Semantic
- **Verified** (#16A34A) / **Verified BG** (#DCFCE7): Success states — completed approvals, won prospects, fulfilled SLAs.
- **Flagged** (#0284C7) / **Flagged BG** (#E0F2FE): Informational states — new items, submitted documents, system notifications.
- **Caution** (#D97706) / **Caution BG** (#FEF3C7): Warning states — near-deadline SLAs, pending requirements, revision requests.
- **Rejected** (#DC2626) / **Rejected BG** (#FEE2E2): Error and rejection states — denied approvals, failed validations, critical SLA breaches.
- **In Review** (#EA580C): Active review or intermediate processing states.
- **Reviewed** (#7C3AED): Special status indicator for items under legal or supervisory review.
- **Gold Seal** (#D4A843) / **Gold Seal BG** (#FEF3C7): Premium or high-priority indicators — negotiation status, escalated items.

### Named Rules

**The One Voice Rule.** The official-green accent is used on no more than ~10% of any given surface. Its rarity is what makes it meaningful — primary buttons, active nav items, selected rows. Applying green to passive elements dilutes its authority signal.

**The Tonal Depth Rule.** Surface hierarchy is expressed through lightness, not shadow. The surface container scale (dossier → dossier-dim → dossier-container → container-high → container-highest) steps from lightest to darkest within the green-tinted neutral family. Deeper = closer to the user.

## 3. Typography

**Font:** Inter (with ui-sans-serif, system-ui, sans-serif fallback)
**Mono Font:** JetBrains Mono (with ui-monospace, SFMono-Regular, monospace fallback)

**Character:** Inter at 14px base provides a compact, highly legible reading experience for dense data surfaces. The type feels precise and workmanlike — neither fashionable nor utilitarian. At display and headline sizes, tight letter-spacing and bold weight give headings authority without display-font flourish.

The base font size is 14px (87.5% of the browser default). This intentionally compresses the entire Tailwind design system — fonts, spacing, grids — by ~12.5%, fitting more information on screen without sacrificing readability. The 14px base also powers the full rem scale: 1rem = 14px.

### Hierarchy

- **Display** (700, 1.5rem/21px, 2rem/28px line height, -0.02em letter-spacing): Page titles and primary headings. Use `text-wrap: balance`. One per surface.
- **Headline** (600, 1.25rem/17.5px, 1.75rem/24.5px line height): Section headings — "Daftar Prospek," "Riwayat Persetujuan."
- **Title** (700, 1.125rem/15.75px, 1.625rem/22.75px line height): Entity names — prospect names, project titles, card headings.
- **Body** (400, 1rem/14px, 1.5rem/21px line height): Default reading text, table cell content, descriptions. Cap line length at 65–75ch for continuous prose.
- **Label** (600, 0.875rem/12.25px, 1.25rem/17.5px line height): Button text, form labels, tab labels, navigation items. Often paired with uppercase tracking.
- **Caption** (400, 0.75rem/10.5px, 1rem/14px line height): Helper text, timestamps, metadata, status badges.
- **Mono** (400, 0.8125rem/11.375px, 1.125rem/15.75px line height): Code snippets, structured IDs, reference numbers, data values where character alignment matters.

### Named Rules

**The Single Family Rule.** Kinetic CRM uses one type family (Inter) for everything — display, headings, body, labels. There is no display/body pairing. Hierarchy comes from weight, size, and spacing, not a font change.

**The 14px Rule.** 1rem = 14px, not 16px. This is not negotiable per-screen; it is the system constant. The 14px base was chosen to compress the Tailwind design system by exactly 12.5%, fitting enterprise data-density comfortably without resorting to `text-xs` on everything.

## 4. Elevation

Kinetic CRM uses **tonal layering** as its primary depth mechanism. Surfaces sit at different lightness levels of the green-tinted neutral family — lighter surfaces feel closer, darker ones recede. This avoids the visual noise of shadows across large data surfaces while still providing clear hierarchy.

No component has a shadow by default. Shadows appear only as interaction feedback: a card hover, a focused input, an elevated dropdown or modal.

### Shadow Vocabulary

- **Card Rest** (`0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)`): Default card state — barely perceptible, just enough to separate from the surface.
- **Card Hover** (`0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.06)`): Interactive card hover state.
- **Elevated** (`0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08)`): Dropdowns, popovers, drawers.
- **Modal** (`0 25px 50px -12px rgb(0 0 0 / 0.2)`): Modals, full-screen overlays, dialogs.

### Named Rules

**The Flat-by-Default Rule.** Surfaces are flat at rest. Shadows appear only as a response to interaction — hover, focus, elevation state. A table with 50 rows should not cast 50 shadows.

## 5. Components

### Buttons
- **Shape:** Gently curved edges (rounded-lg, 0.5rem / 7px at 14px base).
- **Primary:** Official Green background, Seal White text. 14px font, 600 weight. Padding: 1rem horizontal, 0.5rem vertical (14px / 7px).
- **Secondary:** Transparent or Dossier background, Document Ink text, Rule Line border.
- **Ghost:** No background or border. Muted Edge text, Dossier Dim hover background.
- **Danger:** Rejected background, white text. Same shape and sizing as Primary.
- **Success / Warning:** Verified / Gold Seal backgrounds respectively, white text. Same shape and sizing.
- **Hover:** Background shifts one step (primary → Approval Stamp, secondary → Dossier Dim). 200ms ease transition. Subtle shadow increase for Primary (Card Hover).
- **Focus:** 2px ring using primary at 20% opacity, matching border-radius.
- **Active:** Scale transform to 0.98, shadow returns to rest level.
- **Disabled:** 50% opacity, no pointer events. No hover effect.
- **Loading:** CSS spin animation replaces icon slot, using a 2px border spinner with transparent outer quarter.
- **Sizes:** xs (22px padding, 11px font) → sm (14px padding, 12px font) → md (1rem padding, 14px font) → lg (1.5rem padding, 16px font). Full-width variant available.
- **Mobile:** `btn-full-mobile` utility stretches buttons to full width below 768px viewport.

### Inputs / Fields
- **Shape:** Gently curved edges (rounded-lg, 0.5rem), consistent with buttons.
- **Default:** Dossier background, Faded Line border (1px). 14px body text, Document Ink. Placeholder: Document Ink at 50% opacity.
- **Hover:** Border shifts to Faded Line (from border-outline-variant to border-outline in the token system).
- **Focus:** Border shifts to Official Green. 2px ring using Official Green at 20% opacity. No shadow.
- **Error:** Border shifts to Rejected. Ring uses Rejected at 20% opacity. Warning icon appears on the right (material-symbols-outlined).
- **Disabled:** 50% opacity, muted background.
- **Label:** 11px uppercase, 600 weight, tracking-wider. Always above the field, never placeholder-as-label.
- **Helper Text:** 12px below the field. Faded Line for neutral, Rejected for error.
- **Icons:** Optional left/right icon slots. Left icon shifts text padding. Right icon reserved for action or error indicator.
- **Spacing:** 0.375rem gap between label and field. 1.5rem gap between stacked fields.

### Selects
- Same sizing, border, focus, and error treatment as text inputs.
- Uses the native `<select>` element for reliability. Placeholder option with empty value.
- Consistent label pattern: 11px uppercase above, not inside.

### Badges / Status Indicators
- **Shape:** Fully rounded (rounded-full, 9999px).
- **Sizes:** sm (8px horizontal, 2px vertical, 10px font) → md (12px horizontal, 4px vertical, 12px font) → lg (1rem horizontal, 6px vertical, 12px font).
- **Colors:** One background/tint pair per semantic role (success, warning, danger, info, primary, purple, gold, default).
- **Dot:** Optional leading dot (4px circle in the badge's semantic color) for quick scanning in lists.
- **Text:** 700 weight, uppercase by convention. `tracking-wide`.

### Tables
- **Style:** Clean rows with bottom borders (Rule Line at 60% opacity). No vertical cell borders. No card-like row styling on desktop.
- **Header:** Dossier Container background (the lowest surface container). 12px uppercase, 600 weight, Muted Edge text. Sticky header option available.
- **Rows:** Dossier background. Hover shifts to Dossier Dim background. Clickable rows show pointer cursor.
- **Sorting:** Clickable header columns. Unfold icon at rest, arrow up/down when active. Header text shifts to Official Green on active sort.
- **Selection:** Checkbox column on the left. Indeterminate state for partial selection.
- **Mobile:** Card-stack mode replaces the table below 768px. Each row becomes a Dossier card with border, rounded corners, and Card Rest shadow. Custom `mobileCardRenderer` per table. Column hiding via `hideOnMobile`.
- **Loading:** Skeleton placeholders matching row structure — animated shimmer (1.5s infinite sweep) using Dossier Container and Dossier Container High as the base colors.
- **Empty:** Centered EmptyState component with icon, title, and description.
- **Pagination:** Compact bar below the table. "X–Y of Z" label. Numbered page buttons with Official Green highlight on active. Chevron navigation. Disabled state at boundaries.

### Cards / Containers
- **Shape:** Gently curved (rounded-lg, 0.5rem).
- **Rest:** Dossier background, optional Rule Line border at 60% opacity. No shadow at rest.
- **Hover (interactive):** Card Hover shadow, cursor pointer. Optional active scale transform (0.99).
- **Padding:** 1rem internal, scaling to 1.5rem on larger screens.
- **Usage:** Cards are reserved for data-grouping on dashboards and mobile list views. They are not the default container for every element. Cards within cards are prohibited.

### Navigation
- **Sidebar:** Permission-filtered tree with expandable parents. Active item highlighted with Official Green text and Filed Paper background. Icons use material-symbols-outlined.
- **Breadcrumb:** Compact bar below the topbar. Home icon, chevron separators, current page in Document Ink at 600 weight. Truncated at 120–200px per segment depending on viewport.
- **Topbar:** Full-width bar, 14px height at desktop (3.5rem / 49px). Bottom accent: a 3px gradient from transparent through Official Green to transparent. Notification badge: Gold Seal pill with white text, 9px font, ring in Dossier color. Mobile: hamburger menu, search overlay (full-screen with back arrow).

### Drawer (Panel)
- **Shape:** Full-height panel from right (or left). Dossier background.
- **Width:** `max-w-lg` (32rem / 448px at 14px base) by default, expandable via `width` prop.
- **Overlay:** 40% black backdrop with blur-sm backdrop-filter.
- **Animation:** 300ms slide from edge, ease-out. Overlay fades at 300ms.
- **Header:** Border-bottom divider. Title in Headline typography. Close button: 2rem circle, hover shifts to Dossier Container.
- **Footer:** Dossier Dim background, border-top divider. Right-aligned action buttons.
- **Focus trap:** Active when open. Escape key closes.
- **Body scroll lock:** Applied on open, removed on close.

### Empty State
- **Layout:** Centered vertically and horizontally within the container. Generous padding (2rem).
- **Icon:** Large material symbol (roughly 48px) in Faded Line.
- **Title:** Document Ink, 600 weight.
- **Description:** Muted Edge, regular weight, 14px.
- **Usage:** Default empty state says "Tidak ada data" / "Belum ada data untuk ditampilkan." Custom content per surface is preferred.

## 6. Do's and Don'ts

### Do:
- **Do** use Official Green for primary actions, active nav items, selected rows, and focus indicators — and nothing else. Its power comes from scarcity.
- **Do** express surface hierarchy through the tonal container scale (dossier → dossier-dim → dossier-container), not through shadows or background colors outside the palette.
- **Do** keep buttons, inputs, selects, and badges on the same corner radius vocabulary (rounded-lg at 0.5rem). Consistency is a feature.
- **Do** use the 11px uppercase label pattern for all form fields — above the field, never as placeholder text inside it.
- **Do** use skeleton loading for tables and card grids. Never show a spinner in the middle of content that has structure.
- **Do** provide empty states that teach the interface: what belongs here, how to add it.
- **Do** design for both light and dark mode. Every surface token has a dark counterpart; test both.
- **Do** use reduced-motion alternatives (instant transitions, no animation) via `@media (prefers-reduced-motion: reduce)`.

### Don't:
- **Don't** apply the Official Green accent decoratively — not as card borders, not as background tints on passive elements, not as gradient text.
- **Don't** use shadows as the primary depth mechanism. Tonal layering carries structure; shadows are only for interaction feedback.
- **Don't** use side-stripe borders (border-left or border-right greater than 1px as a colored accent on cards, list items, callouts, or alerts).
- **Don't** use gradient text (`background-clip: text` with a gradient). One solid color, always.
- **Don't** create glassmorphism effects (blurred backgrounds on cards or panels) as a default pattern.
- **Don't** use different button shapes or form control styles across different screens. If the save button is rounded-lg on one page, it's rounded-lg everywhere.
- **Don't** nest cards. A card inside a card is always wrong.
- **Don't** use display fonts or serif typefaces for UI labels, buttons, or data. Inter covers everything; there is no display pairing.
- **Don't** invent new color roles outside the defined palette. If a new semantic state is needed, extend the semantic set, not the primary set.
- **Don't** ship a modal when an inline panel, expandable section, or progressive disclosure would work. Modals are the last resort, not the first thought.
- **Don't** add decorative motion or orchestrated page-load sequences. Motion conveys state (feedback, loading, reveal) only.
