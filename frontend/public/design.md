---
name: CodeForge
version: 2.0
inspiration: Notion — calm, content-first, warm neutrals, block-based, hover-revealed controls
themes: [light, dark]
default-theme: system

colors:
  light:
    bg-canvas: '#FFFFFF'
    bg-sidebar: '#F7F7F5'
    bg-panel: '#FFFFFF'
    bg-raised: '#FFFFFF'
    bg-hover: 'rgba(55, 53, 47, 0.06)'
    bg-active: 'rgba(55, 53, 47, 0.10)'
    bg-code: '#F7F6F3'
    bg-inline-code: 'rgba(135, 131, 120, 0.15)'
    border: 'rgba(55, 53, 47, 0.09)'
    border-strong: 'rgba(55, 53, 47, 0.16)'
    text-primary: '#37352F'
    text-secondary: 'rgba(55, 53, 47, 0.65)'
    text-muted: 'rgba(55, 53, 47, 0.46)'
    text-placeholder: 'rgba(55, 53, 47, 0.30)'
    accent: '#2383E2'
    accent-hover: '#0B6BCB'
    accent-soft: 'rgba(35, 131, 226, 0.10)'
    on-accent: '#FFFFFF'
    success: '#0F7B6C'
    success-soft: '#DBEDDB'
    error: '#E03E3E'
    error-soft: '#FFE2DD'
    warning: '#D9730D'
    warning-soft: '#FAEBDD'
    selection: 'rgba(35, 131, 226, 0.28)'
  dark:
    bg-canvas: '#191919'
    bg-sidebar: '#202020'
    bg-panel: '#252525'
    bg-raised: '#2B2B2B'
    bg-hover: 'rgba(255, 255, 255, 0.055)'
    bg-active: 'rgba(255, 255, 255, 0.10)'
    bg-code: '#202020'
    bg-inline-code: 'rgba(255, 255, 255, 0.10)'
    border: 'rgba(255, 255, 255, 0.09)'
    border-strong: 'rgba(255, 255, 255, 0.16)'
    text-primary: 'rgba(255, 255, 255, 0.90)'
    text-secondary: 'rgba(255, 255, 255, 0.64)'
    text-muted: 'rgba(255, 255, 255, 0.44)'
    text-placeholder: 'rgba(255, 255, 255, 0.28)'
    accent: '#529CCA'
    accent-hover: '#6BAEDB'
    accent-soft: 'rgba(82, 156, 202, 0.16)'
    on-accent: '#0F1A22'
    success: '#4DAB9A'
    success-soft: 'rgba(77, 171, 154, 0.18)'
    error: '#FF7369'
    error-soft: 'rgba(255, 115, 105, 0.16)'
    warning: '#FFA344'
    warning-soft: 'rgba(255, 163, 68, 0.16)'
    selection: 'rgba(82, 156, 202, 0.35)'

  # Notion-style soft tag / callout palette (use for difficulty, topics, status)
  tags:
    light:
      gray:   { bg: '#E3E2E0', fg: '#32302C' }
      brown:  { bg: '#EEE0DA', fg: '#603B2C' }
      orange: { bg: '#FADEC9', fg: '#854C1D' }
      yellow: { bg: '#FDECC8', fg: '#89632A' }
      green:  { bg: '#DBEDDB', fg: '#1C3829' }
      blue:   { bg: '#D3E5EF', fg: '#183347' }
      purple: { bg: '#E8DEEE', fg: '#412454' }
      pink:   { bg: '#F5E0E9', fg: '#6C1E3C' }
      red:    { bg: '#FFE2DD', fg: '#5D1715' }
    dark:
      gray:   { bg: '#454B4E', fg: '#E6E6E5' }
      brown:  { bg: '#434040', fg: '#E9D5CC' }
      orange: { bg: '#594A3A', fg: '#F4CDA5' }
      yellow: { bg: '#59563B', fg: '#F2E3A1' }
      green:  { bg: '#354C4B', fg: '#B5DDD3' }
      blue:   { bg: '#364954', fg: '#B7D7EA' }
      purple: { bg: '#443F57', fg: '#D5CBEB' }
      pink:   { bg: '#533B4C', fg: '#EBC5DA' }
      red:    { bg: '#594141', fg: '#F5C0BB' }

  # Code syntax (editor) — muted, readable, Notion-like
  syntax:
    light: { keyword: '#9A6700', string: '#0F7B6C', number: '#2383E2', comment: '#9B9A97', function: '#6940A5', type: '#C14F8B', operator: '#37352F' }
    dark:  { keyword: '#FFA344', string: '#4DAB9A', number: '#529CCA', comment: '#6F6E69', function: '#9A6DD7', type: '#E255A1', operator: '#E6E6E5' }

typography:
  font-families:
    sans: 'Inter'
    sans-stack: 'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"'
    serif: 'Newsreader'
    serif-stack: 'Newsreader, Lyon-Text, Georgia, YuMincho, "Noto Serif", serif'
    mono: 'JetBrains Mono'
    mono-stack: '"JetBrains Mono", "SFMono-Regular", Menlo, Consolas, "PT Mono", "Liberation Mono", Courier, monospace'
  font-features:
    sans: '"tnum" 1, "cv11" 1, "ss03" 1, "calt" 1'
    mono: '"tnum" 1, "calt" 1'
  scale:
    page-title:
      fontFamily: Inter
      fontSize: 40px
      fontWeight: '700'
      lineHeight: 48px
      letterSpacing: -0.03em
    page-title-mobile:
      fontFamily: Inter
      fontSize: 30px
      fontWeight: '700'
      lineHeight: 38px
      letterSpacing: -0.025em
    heading-1:
      fontFamily: Inter
      fontSize: 30px
      fontWeight: '600'
      lineHeight: 38px
      letterSpacing: -0.02em
    heading-2:
      fontFamily: Inter
      fontSize: 24px
      fontWeight: '600'
      lineHeight: 32px
      letterSpacing: -0.015em
    heading-3:
      fontFamily: Inter
      fontSize: 20px
      fontWeight: '600'
      lineHeight: 28px
      letterSpacing: -0.01em
    body-reading:
      fontFamily: Inter
      fontSize: 16px
      fontWeight: '400'
      lineHeight: 26px
      letterSpacing: -0.003em
    body-ui:
      fontFamily: Inter
      fontSize: 14px
      fontWeight: '400'
      lineHeight: 20px
      letterSpacing: 0em
    body-ui-medium:
      fontFamily: Inter
      fontSize: 14px
      fontWeight: '500'
      lineHeight: 20px
      letterSpacing: 0em
    caption:
      fontFamily: Inter
      fontSize: 12px
      fontWeight: '400'
      lineHeight: 16px
      letterSpacing: 0.005em
    overline:
      fontFamily: Inter
      fontSize: 11px
      fontWeight: '600'
      lineHeight: 16px
      letterSpacing: 0.04em
      textTransform: uppercase
    code-editor:
      fontFamily: JetBrains Mono
      fontSize: 14px
      fontWeight: '400'
      lineHeight: 22px
      letterSpacing: 0em
    code-inline:
      fontFamily: JetBrains Mono
      fontSize: 0.85em
      fontWeight: '400'
      lineHeight: inherit
    code-tag:
      fontFamily: JetBrains Mono
      fontSize: 11px
      fontWeight: '500'
      lineHeight: 16px
      letterSpacing: 0.02em

rounded:
  xs: 3px
  sm: 4px
  DEFAULT: 6px
  md: 8px
  lg: 10px
  xl: 14px
  full: 9999px

spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
  3xl: 48px
  page-gutter: 16px
  page-gutter-desktop: 96px
  content-max-width: 720px
  content-max-width-wide: 1080px
  sidebar-width: 240px
  sidebar-width-collapsed: 0px
  topbar-height: 44px
  row-height: 28px
  row-height-comfortable: 32px

elevation:
  light:
    e0: 'none'
    e1: '0 1px 2px rgba(15, 15, 15, 0.06)'
    e2: '0 0 0 1px rgba(15, 15, 15, 0.05), 0 3px 6px rgba(15, 15, 15, 0.10), 0 9px 24px rgba(15, 15, 15, 0.12)'
    e3: '0 0 0 1px rgba(15, 15, 15, 0.05), 0 8px 16px rgba(15, 15, 15, 0.12), 0 24px 48px rgba(15, 15, 15, 0.16)'
  dark:
    e0: 'none'
    e1: '0 1px 2px rgba(0, 0, 0, 0.30)'
    e2: '0 0 0 1px rgba(255, 255, 255, 0.06), 0 3px 6px rgba(0, 0, 0, 0.30), 0 9px 24px rgba(0, 0, 0, 0.40)'
    e3: '0 0 0 1px rgba(255, 255, 255, 0.07), 0 8px 16px rgba(0, 0, 0, 0.40), 0 24px 48px rgba(0, 0, 0, 0.50)'

motion:
  duration-fast: 80ms
  duration-base: 140ms
  duration-slow: 220ms
  easing-standard: 'cubic-bezier(0.2, 0, 0, 1)'
  easing-enter: 'cubic-bezier(0, 0, 0.2, 1)'
  easing-exit: 'cubic-bezier(0.4, 0, 1, 1)'
---

## Brand & Style

CodeForge feels like a quiet, well-organized notebook for engineers — not a dashboard. The visual language follows Notion's philosophy: **the content is the interface**. Chrome recedes, text is king, and controls appear when you need them.

Four principles guide every decision:

- **Content first.** Problem statements, code, and results get the space. Toolbars, icons, and borders stay faint until hovered or focused.
- **Warm neutrals, not cold grays.** Light mode uses a warm near-black (`#37352F`) on white; dark mode uses soft charcoal (`#191919`) with off-white text. No pure black, no pure white text on dark.
- **Soft structure.** Hairline borders at low opacity, gentle hover fills, and layered (not heavy) shadows. No neon, no glassmorphism, no gradients.
- **Progressive disclosure.** Row actions, drag handles, and "+" affordances fade in on hover. The default state is calm; the active state is obvious.

The tone is friendly and confident. Microcopy is plain and short ("Run", "Submit", "Add a test case"), never shouty.

## Colors

Colors are defined as **semantic tokens** with separate light and dark values. Components must reference tokens (`--bg-canvas`, `--text-primary`), never raw hex.

### Surfaces (layering, back to front)

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg-sidebar` | `#F7F7F5` | `#202020` | Left navigation, secondary rails |
| `bg-canvas` | `#FFFFFF` | `#191919` | Main page, editor background |
| `bg-panel` | `#FFFFFF` | `#252525` | Cards, test runner, console |
| `bg-raised` | `#FFFFFF` | `#2B2B2B` | Menus, popovers, modals |
| `bg-code` | `#F7F6F3` | `#202020` | Code blocks, diff viewer |

### Text

Use opacity-based text colors so text harmonizes with any surface or tint behind it.

- **Primary** — headings, body, code.
- **Secondary** (~65%) — descriptions, sidebar items at rest.
- **Muted** (~45%) — timestamps, line numbers, hints, shortcut glyphs.
- **Placeholder** (~30%) — empty inputs and empty blocks ("Type '/' for commands…").

Minimum contrast: primary text ≥ 7:1, secondary ≥ 4.5:1, muted used only for non-essential info.

### Interaction fills

- **Hover:** a translucent wash (`bg-hover`) — never a solid color swap.
- **Active / pressed / selected row:** `bg-active`.
- **Selected item with meaning** (current tab, current problem): `accent-soft` fill + `accent` text or indicator.

### Accent

A single calm blue carries all primary actions and focus.

- **Light:** `#2383E2` (hover `#0B6BCB`)
- **Dark:** `#529CCA` (hover `#6BAEDB`) — desaturated for comfort on charcoal.
- Use for: primary buttons, links, focus rings, active tab underline, selected text highlight (`selection`).
- Never use accent for decoration or large background areas.

### Semantic

- **Success** (`#0F7B6C` / `#4DAB9A`): passing tests, "Accepted".
- **Error** (`#E03E3E` / `#FF7369`): failing tests, runtime exceptions, destructive confirmations only.
- **Warning** (`#D9730D` / `#FFA344`): time-limit nearing, partial pass.
- Each has a `-soft` tint for pill and callout backgrounds.

### Tag palette (Notion-style)

Nine soft color pairs (background + foreground) for difficulty, topics, company tags, and status. Suggested mapping:

- Easy → **green**, Medium → **yellow/orange**, Hard → **red**
- Topic tags (Arrays, DP, Graphs…) → rotate **blue, purple, pink, brown, gray**
- Always pair tag text with its matching `fg` value — never reuse `text-primary` on tag fills.

## Typography

Type is the core of the Notion feel. Use a disciplined, comfortable scale with generous line height.

### Families

- **Inter** — all UI and reading text. Enable `tnum`, `cv11` (single-story *a*), `ss03` (rounded quote marks/details) and `calt`. Falls back to the native system stack (`ui-sans-serif`, SF Pro, Segoe UI) so the app never flashes unstyled text.
- **Newsreader (optional serif)** — a user-selectable "Serif" page style for long problem write-ups and editorials, mirroring Notion's Default / Serif / Mono page fonts. Not used for UI controls.
- **JetBrains Mono** — the code editor, terminal output, complexity readouts (`O(n log n)`), inline code, keyboard shortcuts, and tags. Ligatures on in the editor (user-toggleable).

### Scale & usage

- **Page title (40/48, 700):** problem title, dashboard page title. Tight `-0.03em` tracking.
- **Heading 1–3 (30 / 24 / 20, 600):** section headers inside problem statements and docs. Heading 1 gets `2em` top margin, 1 gets `4px` bottom margin, mirroring Notion's block rhythm.
- **Body reading (16/26):** problem descriptions, editorial text. Line height is deliberately generous (1.6).
- **Body UI (14/20):** all controls, sidebar, tables, menus. The workhorse size.
- **Caption (12/16):** metadata, helper text, timestamps.
- **Overline (11, uppercase, +0.04em):** sidebar section labels such as "Workspace", "Favorites".
- **Code editor (14/22):** default; user can scale 12–18.

### Rules

- Left-align everything; no justified text.
- Line length: **60–75 characters** in reading mode (`content-max-width: 720px`).
- Use **weight, not color**, for emphasis: 400 → 500 → 600 → 700. Reserve bold for headings and key terms.
- Numeric data (timers, runtimes, memory, scores) always uses tabular figures to prevent jitter.
- Inline code: monospace at `0.85em`, `bg-inline-code` fill, 3px radius, `2px 5px` padding, `text-primary` color tinted toward `error` in light mode (`#EB5757`) to echo Notion's inline code — optional per theme.

## Layout & Spacing

Base unit is **4px**; most gaps are multiples of 4 (Notion uses a fine-grained rhythm rather than a coarse 8px grid).

### App shell

- **Sidebar (240px, resizable 200–360px):** `bg-sidebar`, no right border on desktop (the tonal shift is enough); 1px border when overlaying on mobile. Collapsible with `⌘\`. Items are 28px tall, 6px radius, 8px horizontal padding, icon 18px + 8px gap.
- **Topbar (44px):** breadcrumb on the left ("Workspace / Arrays / Two Sum"), actions on the right (Share, Timer, Theme, Avatar). Transparent on canvas; gains a 1px bottom border only after the page scrolls.
- **Main canvas:** centered content column at 720px for reading pages; wide mode (1080px) for dashboards and tables.

### Problem workspace (desktop ≥ 1024px)

Fluid, resizable tri-pane: **Problem | Editor | Console**, filling `100vh` with no window scroll; each pane scrolls independently. Splitters are a 1px line with an 8px invisible hit area that thickens to a 3px `accent` line on hover/drag. Panes have 16px inner padding (editor 0).

### Tablet & mobile (< 1024px)

Single column with a segmented control (`Problem · Code · Console`) pinned below the topbar. Sidebar becomes a slide-over drawer. Touch targets ≥ 44px. Page gutter 16px.

### Vertical rhythm

- Between blocks in a problem statement: 4px (tight, like Notion blocks) with 24–32px above headings.
- Between cards: 16px. Between major sections: 32–48px.
- Table and list rows: 28px (compact) or 32px (comfortable).

## Elevation & Depth

Depth comes mostly from **tonal layering** and **hairline borders**. Shadows are soft, layered, and reserved for things that float.

- **E0 — Canvas & inline content:** no shadow.
- **E1 — Cards on hover, sticky headers:** `1px` subtle shadow + hairline border.
- **E2 — Menus, popovers, dropdowns, tooltips:** a 1px ring plus two soft shadows (see tokens). Radius 8px.
- **E3 — Modals, command palette:** larger soft spread; backdrop is a flat scrim (`rgba(15,15,15,0.6)` light / `rgba(0,0,0,0.6)` dark), **no blur**.
- **Focus ring:** `0 0 0 2px accent` with a `2px` offset of canvas color; visible on keyboard focus only (`:focus-visible`). Text inputs show a 1px accent border plus a 3px `accent-soft` halo.

## Shapes

Notion uses small, friendly radii — never pills for controls.

- **Controls (buttons, inputs, menu items, sidebar rows):** `6px` (`DEFAULT`).
- **Cards, callouts, code blocks, popovers:** `8px`.
- **Modals, command palette:** `10–14px`.
- **Tags & badges:** `4px` (rectangular-soft) — matching Notion's database tags.
- **Status dots, avatars, toggles:** `full`.
- **Checkboxes:** 16px, `3px` radius.

## Components

### Buttons

- **Primary:** `accent` fill, `on-accent` text, 500 weight, 32px height (28px compact), 6px radius, `0 12px` padding. Hover → `accent-hover`. Pressed → darken 4%. No shadow.
- **Secondary:** transparent with `1px border-strong`, `text-primary`. Hover → `bg-hover`.
- **Ghost / Icon:** no border; `text-secondary`. Hover → `bg-hover` + `text-primary`. Icon buttons are 28×28.
- **Destructive:** ghost by default; turns `error` text on hover, `error` fill only inside confirmation dialogs.
- **Run / Submit:** `Run ⌘↵` (secondary) and `Submit` (primary). Shortcut glyphs in JetBrains Mono at `text-muted`, inside the label.
- Disabled: 40% opacity, no pointer events.

### Sidebar

- Section overlines (`Workspace`, `Favorites`, `Recent`) in 11px uppercase `text-muted`.
- Rows show icon + label; **hover reveals** a "⋯" and "+" on the right. Active row: `bg-active` with `text-primary` weight 500.
- Nested pages indent 16px with a chevron that rotates 90° over 140ms.
- Footer: "New page" row pinned to bottom with a `+` icon.

### Top tabs & segmented controls

- **Tab bar:** 36px tall, no full-width border on the active state; active tab has a 2px `accent` underline and `text-primary`; inactive `text-secondary`; hover `bg-hover` (6px radius, inset 4px).
- **Segmented control (mobile panels):** `bg-hover` track, 6px radius, active segment lifts to `bg-canvas` with `E1`.

### Blocks & Callouts

- **Callout:** 8px radius, 16px padding, `bg-hover` or a tinted tag background, leading 20px emoji/icon. Used for hints, constraints, and "Follow-up" notes.
- **Quote:** 3px left border in `text-primary`, 14px left padding, 16px text.
- **Toggle ("Hint", "Solution"):** chevron + label; content indents 24px.
- **Divider:** 1px `border`, 12px vertical margin.

### Code editor

- Background `bg-code`, **no inner border** on the canvas side; 1px `border` separates panes.
- Line numbers: `text-muted`, right-aligned, tabular. Active line: `bg-hover` flat fill. Matching brackets: `accent-soft` with 1px `accent` outline.
- Selection: `selection` token. Cursor: 2px `accent`, blinks at 1s.
- Editor header (36px): language selector on the left, settings / reset / fullscreen icon buttons on the right.
- Copyable code blocks (in problem text) show a "Copy" ghost button top-right on hover, with a 2s checkmark confirmation.

### Test runner & console

- Case tabs (`Case 1`, `Case 2`, `+`) as small rounded chips: 28px tall, 6px radius. Active chip uses `bg-active`; failing case shows a 6px `error` dot, passing shows `success`.
- Result banner: large status text ("Accepted" in `success`, "Wrong Answer" in `error`, 20px/600) with runtime and memory in `code-tag` beside it.
- Input / Expected / Output displayed as labelled mono blocks on `bg-code`, 8px radius, 12px padding, 1px `border`. A mismatched diff line is highlighted with `error-soft`.
- Console logs: mono 13px, stdout in `text-primary`, stderr in `error`.

### Inputs & selectors

- Height 32px, 6px radius, `bg-canvas` (light) / `bg-hover` tint (dark), `1px border-strong`. Focus: accent border + 3px `accent-soft` halo. Placeholder `text-placeholder`.
- Dropdown menus are E2 popovers with 4px inner padding; items 28px tall, 4px radius, hover `bg-hover`; selected item gets a trailing `✓`.
- Language selector: icon + name (Inter) + compiler target (JetBrains Mono, `text-muted`).
- Search / command palette (`⌘K`): E3 modal, 600px wide, 14px radius, autofocus input with no border, results grouped with overline headings.

### Tags & badges

- 4px radius, `0 6px` padding, 20px height, 12px Inter or `code-tag` for technical values. Colors from the tag palette (light and dark variants swap automatically).
- Difficulty badges always use green / yellow / red.

### Tables & databases

- Notion-style: no outer border, 1px bottom borders at `border`, sticky header with overline-style labels, 32px rows, cell padding `0 8px`, hover row `bg-hover`. Columns resizable with a 3px handle that shows on hover.

### Checkboxes, radios & toggles

- **Checkbox:** 16px, 3px radius, unchecked = 1px `border-strong`; checked = `accent` fill with a white check that draws in over 100ms.
- **Radio:** 16px circle, inner 8px dot in `accent`.
- **Toggle:** 28×16 track, `full` radius; off = `bg-active`, on = `accent`; 12px knob with 140ms ease.

### Toasts & tooltips

- **Tooltip:** 12px Inter, inverted surface (dark tooltip on light theme, light tooltip on dark), 4px radius, 6px 8px padding, 400ms show delay. Shortcut hints in mono at 70% opacity.
- **Toast:** bottom-center, E2, 8px radius, optional "Undo" ghost button, auto-dismiss 4s.

### Empty states

- Centered 48px outline icon in `text-muted`, a 16px/600 headline, one line of `text-secondary` helper text, and a single secondary button. Placeholder text in empty blocks reads "Press '/' for commands…".

## Motion

Motion is fast and functional — never decorative.

- Hover fills, color changes: **80–140ms**, `easing-standard`.
- Menus and popovers: fade + 4px translate-up, **140ms**, `easing-enter`; exit 100ms.
- Modals: fade + scale from 0.98, **220ms**.
- Sidebar collapse: width animation **220ms**.
- Respect `prefers-reduced-motion`: disable transforms, keep opacity fades only.

## Theming Rules

1. **Follow the system** by default (`prefers-color-scheme`), with a manual Light / Dark / System toggle in settings and on the topbar (⌘⇧L).
2. Switch themes by swapping CSS custom properties on `:root[data-theme]`; transition `background-color` and `color` over 140ms only when the user toggles (not on first paint).
3. Never use absolute black or absolute white for large surfaces in dark mode; never use pure-gray shadows in light mode (shadows are tinted `rgba(15,15,15,…)`).
4. Images, diagrams, and embedded illustrations should ship with a dark variant or use `currentColor`.
5. Syntax colors are muted in both themes and must achieve ≥ 4.5:1 against `bg-code`.

## Accessibility

- WCAG 2.2 AA minimum for all text and controls; focus is always visible and never removed.
- All hover-revealed controls must also appear on keyboard focus and remain visible on touch devices.
- Status is never communicated by color alone: pair with icon or label (✓ / ✕ / text).
- Every interactive control has an accessible name; icon buttons carry `aria-label` and a tooltip.
- Support 200% text zoom without loss of function; content reflows to a single column at narrow widths.
- Full keyboard model: `⌘K` palette, `⌘↵` run, `⌘⇧↵` submit, `⌘\` toggle sidebar, `/` slash menu in note blocks, `Esc` closes overlays.

## Do / Don't

**Do**
- Let whitespace and typography create hierarchy.
- Use translucent hover fills and hairline borders.
- Keep one accent color and let the tag palette supply variety.
- Reveal secondary actions on hover/focus.

**Don't**
- Add gradients, glows, or blurred glass effects.
- Use heavy drop shadows on cards that sit on the canvas.
- Use red for anything other than errors and destructive actions.
- Mix more than two weights within a single block of text.
