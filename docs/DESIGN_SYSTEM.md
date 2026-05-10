# Habitra Design System

Habitra's design system is the source of truth for visual, interaction, and implementation decisions. It is built on Tailwind CSS variables, shadcn/Radix primitives, Lucide icons, and feature-level React components.

The product standard is enterprise-grade: lean, clear, user-focused, intuitive, consistent, accessible, and maintainable.

## 1. Design Principles

- Lean: every visible element must support a user task, user state, or navigation decision.
- Clear: hierarchy, labels, contrast, and spacing must make screens understandable at a glance.
- User-focused: optimize for habit completion, progress review, focus sessions, and settings changes with minimal friction.
- Intuitive: use familiar mobile patterns, recognizable icons, stable controls, and predictable feedback.
- Consistent: reuse tokens, primitives, naming, spacing, and interaction patterns before inventing new ones.
- Accessible: preserve semantic controls, focus states, contrast, touch targets, and screen-reader labels.

## 2. Technology Contract

- Styling system: Tailwind CSS with CSS variables in `src/index.css`.
- UI primitives: shadcn/Radix-style components in `src/components/ui`.
- Icons: `lucide-react`.
- Theme implementation: class-based themes in `src/index.css` plus runtime accent application in `src/lib/useTheme.ts`.
- Theme modes: `light`, `dark`, `amoled`.
- Default app theme from `useTheme`: `dark`.
- Default accent index from `useTheme`: `0`, Cyan.

Do not introduce a second styling system, CSS-in-JS framework, icon library, or unrelated component framework.

## 3. Typography

### Font Families

Habitra uses two Google fonts imported in `src/index.css`:

| Token | Font | Weights Imported | Primary Use |
| --- | --- | --- | --- |
| `font-inter` | Inter | 300, 400, 500, 600, 700, 800, 900 | Default interface text, body copy, controls, labels |
| `font-space` | Space Grotesk | 400, 500, 600, 700, 800 | Brand moments, high-emphasis headings, compact numbers |

Rules:

- Use `font-inter` for most UI text.
- Use `font-space` only for app identity, page titles, key metrics, XP/level emphasis, and short display headings.
- Do not add more typefaces.
- Do not use negative letter spacing.
- Avoid viewport-based font sizing.

### Type Scale

Use Tailwind's default type scale unless a component already has an established size.

| Role | Preferred Classes | Weight | Notes |
| --- | --- | --- | --- |
| App/page title | `text-3xl` to `text-4xl` + `font-space` | `font-bold` | One primary page title per screen |
| Section heading | `text-sm` or `text-base` | `font-semibold` or `font-bold` | Often uppercase only for compact operational labels |
| Card title | `text-sm` to `text-base` | `font-semibold` or `font-bold` | Must fit one line or intentionally wrap |
| Body text | `text-sm` | `font-normal` or `font-medium` | Default readable UI copy |
| Metadata/helper | `text-xs` | `font-medium` | Secondary details, captions, descriptions |
| Micro label | `text-[10px]` | `font-semibold` or `font-bold` | Badges, section labels, compact stat labels |

### Letter Spacing

Use letter spacing sparingly:

- Normal copy: no tracking class.
- Compact section labels: `uppercase tracking-widest`.
- Badges and metadata: `uppercase tracking-wider` or `tracking-widest`.
- Do not apply wide tracking to paragraphs, long labels, or buttons with multi-word actions.

### Line Height

- Headings: use Tailwind defaults or `leading-tight`.
- Body/helper copy: use `leading-relaxed` only when text is more than one short line.
- Buttons, badges, nav labels: keep default line-height unless visual alignment requires a tighter setting.

## 4. Color System

All colors are semantic CSS variables. Use Tailwind classes such as `bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`, `bg-primary`, and `text-primary-foreground`.

Do not hard-code arbitrary colors in feature UI unless representing user-selected habit colors, data visualization, or a documented accent swatch.

### Light Theme Tokens

| Token | HSL | Purpose |
| --- | --- | --- |
| `--background` | `218 28% 96%` | App canvas |
| `--foreground` | `222 25% 8%` | Primary text |
| `--card` | `0 0% 100%` | Card surfaces |
| `--card-foreground` | `222 25% 8%` | Text on cards |
| `--popover` | `0 0% 100%` | Floating surfaces |
| `--popover-foreground` | `222 25% 8%` | Text on popovers |
| `--primary` | `252 87% 62%` | Primary action and brand color before user accent override |
| `--primary-foreground` | `0 0% 100%` | Text/icons on primary |
| `--secondary` | `218 20% 92%` | Secondary surface |
| `--secondary-foreground` | `222 25% 20%` | Text on secondary |
| `--muted` | `218 20% 92%` | Subtle surface |
| `--muted-foreground` | `222 12% 48%` | Secondary text |
| `--accent` | `168 78% 46%` | Complementary accent |
| `--accent-foreground` | `0 0% 100%` | Text/icons on accent |
| `--destructive` | `0 82% 60%` | Delete/error/destructive action |
| `--destructive-foreground` | `0 0% 100%` | Text/icons on destructive |
| `--border` | `218 18% 88%` | Borders and dividers |
| `--input` | `218 18% 88%` | Input border/background support |
| `--ring` | `252 87% 62%` | Focus ring before user accent override |

### Dark Theme Tokens

| Token | HSL | Purpose |
| --- | --- | --- |
| `--background` | `232 28% 6%` | App canvas |
| `--foreground` | `218 18% 94%` | Primary text |
| `--card` | `232 24% 10%` | Card surfaces |
| `--card-foreground` | `218 18% 94%` | Text on cards |
| `--popover` | `232 24% 10%` | Floating surfaces |
| `--popover-foreground` | `218 18% 94%` | Text on popovers |
| `--primary` | `252 87% 67%` | Primary before user accent override |
| `--primary-foreground` | `0 0% 100%` | Text/icons on primary |
| `--secondary` | `232 22% 15%` | Secondary surface |
| `--secondary-foreground` | `218 18% 88%` | Text on secondary |
| `--muted` | `232 22% 15%` | Subtle surface |
| `--muted-foreground` | `218 12% 52%` | Secondary text |
| `--accent` | `168 78% 52%` | Complementary accent |
| `--accent-foreground` | `0 0% 100%` | Text/icons on accent |
| `--destructive` | `0 72% 52%` | Delete/error/destructive action |
| `--destructive-foreground` | `0 0% 100%` | Text/icons on destructive |
| `--border` | `232 22% 16%` | Borders and dividers |
| `--input` | `232 22% 16%` | Input border/background support |
| `--ring` | `252 87% 67%` | Focus ring before user accent override |

### AMOLED Theme Tokens

AMOLED inherits the dark class and overrides core surfaces to true black.

| Token | HSL | Purpose |
| --- | --- | --- |
| `--background` | `0 0% 0%` | True black app canvas |
| `--card` | `0 0% 4%` | Near-black card surface |
| `--popover` | `0 0% 4%` | Near-black floating surface |
| `--secondary` | `0 0% 8%` | Secondary surface |
| `--muted` | `0 0% 8%` | Subtle surface |
| `--border` | `0 0% 10%` | Borders and dividers |
| `--input` | `0 0% 10%` | Input border/background support |

Use AMOLED for battery-conscious dark UI. Do not add colored or tinted full-screen backgrounds in AMOLED unless the feature explicitly needs status emphasis.

### Chart Tokens

Use these for analytics and progress visualizations:

| Token | Light HSL | Dark/AMOLED HSL |
| --- | --- | --- |
| `--chart-1` | `252 87% 62%` | `252 87% 67%` |
| `--chart-2` | `168 78% 46%` | `168 78% 52%` |
| `--chart-3` | `32 92% 56%` | `32 92% 60%` |
| `--chart-4` | `340 78% 56%` | `340 78% 60%` |
| `--chart-5` | `200 82% 52%` | `200 82% 56%` |

Rules:

- Use chart tokens before custom data colors.
- Do not use destructive red for non-error data unless the metric is explicitly negative.
- Pair charts with labels, values, or legends when color alone would carry meaning.

## 5. Accent Palette

Habitra has 8 selectable accent colors from `ACCENT_COLORS` in `src/lib/useTheme.ts`. Accents override `--primary` and `--ring`.

| Index | Name | Light HSL | Dark HSL | Hex |
| --- | --- | --- | --- | --- |
| 0 | Cyan | `188 90% 40%` | `188 90% 48%` | `#00E5FF` |
| 1 | Emerald | `155 75% 40%` | `155 75% 46%` | `#10B981` |
| 2 | Purple | `262 83% 58%` | `262 83% 64%` | `#7C3AED` |
| 3 | Pink | `322 81% 55%` | `322 81% 61%` | `#EC4899` |
| 4 | Blue | `213 90% 54%` | `213 90% 60%` | `#3B82F6` |
| 5 | Orange | `24 90% 50%` | `24 90% 56%` | `#F59E0B` |
| 6 | Red | `0 84% 60%` | `0 84% 66%` | `#EF4444` |
| 7 | Yellow | `45 93% 47%` | `45 93% 53%` | `#EAB308` |

Rules:

- Accent controls may use raw `hex` values only for swatches, rings, previews, and user-selected color feedback.
- Product actions should use `primary`, not a fixed accent hex.
- Focus rings must follow `ring`, which tracks the selected accent.
- Do not introduce additional global accents without updating `ACCENT_COLORS`, this document, and any settings UI.

## 6. Semantic Color Usage

| Need | Preferred Token/Class |
| --- | --- |
| App background | `bg-background text-foreground` |
| Default surface | `bg-card text-card-foreground` |
| Subtle grouped surface | `bg-muted/20`, `bg-muted/30`, or `bg-secondary` |
| Primary action | `bg-primary text-primary-foreground` |
| Secondary action | `bg-secondary text-secondary-foreground` or button `variant="outline"` |
| Link/action text | `text-primary` |
| Helper text | `text-muted-foreground` |
| Border | `border-border` or `border-border/40` |
| Error/delete | `text-destructive`, `bg-destructive`, `border-destructive` |
| Focus ring | `focus-visible:ring-ring` or primitive defaults |

Avoid using opacity stacks so subtle that contrast becomes unclear.

## 7. Spacing System

Use Tailwind spacing as the canonical scale. Prefer these values:

| Token | Size | Preferred Use |
| --- | --- | --- |
| `1` | 4px | Tight icon/text nudge |
| `1.5` | 6px | Compact inline gaps |
| `2` | 8px | Default compact gap |
| `2.5` | 10px | Dense card internals |
| `3` | 12px | Standard element gap |
| `4` | 16px | Default page/card padding and section gap |
| `5` | 20px | Larger card padding |
| `6` | 24px | Page padding, major vertical spacing |
| `8` | 32px | Major screen sections |
| `10` | 40px | Empty states, hero-like spacing |
| `12` | 48px | Top/bottom breathing room |

Rules:

- Mobile page horizontal padding: `px-4` by default.
- Mobile page top padding: `pt-6` unless a full-screen flow owns the viewport.
- Bottom space above mobile nav: `pb-24` to `pb-28`.
- Card padding: `p-4` default, `p-5` for information-rich cards, `p-6` for profile/summary cards.
- Internal gaps: `gap-2` for dense rows, `gap-3` for standard rows, `gap-4` for grouped card content.
- Avoid one-off arbitrary spacing unless aligning with safe areas or fixed interaction geometry.

## 8. Radius System

Global radius token:

- `--radius: 1rem`.

Tailwind mapping:

| Class | Value |
| --- | --- |
| `rounded-lg` | `var(--radius)` |
| `rounded-md` | `calc(var(--radius) - 2px)` |
| `rounded-sm` | `calc(var(--radius) - 4px)` |

Habitra also uses larger mobile-card radii where already established:

| Radius | Use |
| --- | --- |
| `rounded-lg` / `rounded-xl` | Buttons, controls, compact cards |
| `rounded-2xl` | Default mobile cards, sheets, grouped panels |
| `rounded-3xl` | Hero/profile cards or immersive mobile modules |
| `rounded-full` | Pills, progress bars, circular swatches |

Rules:

- Default to `rounded-xl` or `rounded-2xl`.
- Use `rounded-[32px]` only for established profile or high-emphasis surfaces.
- Avoid mixing many radius sizes inside one component.

## 9. Elevation And Surface Effects

Existing utility classes:

| Class | Definition | Use |
| --- | --- | --- |
| `.glass` | `card / 0.72` with `blur(24px)` | Standard translucent cards |
| `.glass-strong` | `card / 0.88` with `blur(40px)` | Overlays, stronger floating surfaces |
| `.card-shadow` | Small layered shadow and border ring | Default elevated card |
| `.card-shadow-lg` | Larger layered shadow and border ring | Hero/profile/summary card |
| `.neu-inset` | Inset highlight/shadow | Selected controls or pressed wells |
| `.glow-primary` | Primary glow | Rare celebratory or active state |
| `.glow-accent` | Accent glow | Rare complementary emphasis |

Rules:

- Use elevation to communicate grouping or active state, not decoration.
- Do not stack `.glass`, heavy gradients, glow, and large shadows on the same small control.
- Keep heavy blur effects away from scroll-heavy lists if performance is affected on Android WebView.
- Prefer borders plus subtle background over large shadows for dense operational screens.

## 10. Layout Patterns

### Page Shell

Default app page:

- `px-4 pt-6 pb-28 space-y-5`.
- Top title: `text-3xl font-bold font-space`.
- Use `motion.div` page entrance only when it does not harm performance.
- Keep primary content visible without requiring unnecessary introductory sections.

### Cards And Panels

Default card:

- `glass rounded-2xl p-4 card-shadow border border-border/40`.

Dense row card:

- `flex items-center gap-3 px-4 py-3 border-t border-border/30`.

Summary/profile card:

- Larger padding, `rounded-[32px]` only when the design benefits from a hero summary surface.

Rules:

- Do not put a card inside another card unless the nested item is a repeated record or a clearly separated stat.
- Keep card titles concise.
- Keep actionable controls aligned to the right or bottom depending on density.

### Navigation

- Bottom navigation is the primary mobile app navigation.
- Use icons plus short labels for main destinations.
- Avoid adding top nav controls that duplicate bottom nav destinations.

## 11. Components

### Primitive Components

Use `src/components/ui` for:

- Buttons
- Inputs and textareas
- Dialogs, sheets, drawers, alerts
- Tabs, select, dropdowns, popovers
- Progress, badges, cards, skeletons
- Tooltips, scroll areas, charts

Do not create new primitives unless:

- the primitive does not exist,
- the existing primitive cannot support the interaction,
- or the new primitive is a deliberate system-level addition.

### Feature Components

Use feature folders for domain-specific UI:

- `src/components/habits`
- `src/components/gamification`
- `src/components/focus`
- `src/components/layout`
- `src/components/onboarding`

Rules:

- Pages compose data and feature components.
- Feature components own domain presentation and interaction details.
- Shared stateful UI should be extracted only after at least two real use cases exist.

## 12. Buttons And Controls

Rules:

- Primary action: one per view or focused section when possible.
- Destructive actions must use destructive color and confirmation when data is lost.
- Icon-only buttons need accessible labels or visible context.
- Touch target minimum: 40px, preferred 44px or larger.
- Use Lucide icons for common actions: edit, delete, close, settings, navigation, progress, time, play/pause.

Preferred patterns:

- Primary CTA: filled `primary`, strong contrast.
- Secondary CTA: outline/ghost with clear hover/active state.
- Tool action: icon button with `size="icon"` and rounded shape.
- Toggle/segmented choice: use tabs, toggle-group, or explicit button group.

## 13. Forms

Rules:

- Labels should be visible for editable inputs.
- Helper text should be short and specific.
- Errors should be near the input and use destructive semantics.
- Inputs should use semantic tokens and preserve focus rings.
- Avoid long forms on one mobile screen; group by task.

Preferred field styling:

- Height: `h-10` to `h-12`.
- Radius: `rounded-xl` or `rounded-2xl`.
- Background: `bg-muted/20` or primitive default.
- Border: `border-border/50`.

## 14. Motion

Existing animations:

| Token/Class | Duration | Use |
| --- | --- | --- |
| `accordion-down` | 0.2s | Radix accordion open |
| `accordion-up` | 0.2s | Radix accordion close |
| `pulse-ring` | 1.5s infinite | Active pulse indicator |
| `float` | 3s infinite | Rare ambient floating motion |
| `.flame` | 1.8s infinite | Streak flame |
| `.shimmer` | 2.5s infinite | Loading/sheen effect |

Rules:

- Motion should communicate change, progress, completion, or selection.
- Keep transitions short: 150ms to 300ms for UI feedback.
- Use spring motion only for major view transitions or delightful completion moments.
- Avoid body-level layout changes during drag or scroll interactions.
- Respect performance on Android WebView.

## 15. States

Every async or data-driven surface should define:

- Loading state: skeleton or clear spinner.
- Empty state: concise message and next action when relevant.
- Error state: what failed and how the user can recover.
- Disabled state: visible, non-interactive, and explained when ambiguity is likely.
- Success state: brief confirmation when the result is not visually obvious.

Use existing `LoadingState`, `EmptyState`, and `ErrorState` before creating new state components.

## 16. Accessibility

Minimum requirements:

- Interactive elements must be semantic buttons, links, inputs, or Radix primitives.
- Icon-only controls must have an accessible label.
- Focus rings must remain visible.
- Do not remove outlines without replacing them with tokenized focus-visible styling.
- Do not rely on color alone for important status.
- Text must not overlap, clip, or become unreadable on mobile.
- Preserve sufficient contrast in light, dark, and AMOLED themes.

## 17. Content Style

Voice:

- Direct
- Calm
- Useful
- Concise

Rules:

- Prefer verbs for actions: Save, Delete, Start, Pause, Resume, Edit.
- Avoid explaining the interface in visible UI unless the user needs recovery guidance.
- Keep labels short enough for mobile.
- Use title case for page titles and sentence case for helper text.

## 18. Enterprise Quality Bar

Before merging UI changes, verify:

- The screen follows this design system.
- No new hard-coded color duplicates an existing token.
- No new font family is introduced.
- Spacing follows the documented scale.
- Controls are accessible and touch-friendly.
- Light, dark, and AMOLED themes remain coherent.
- `npm run typecheck` passes.
- `npm run lint` passes.
- `npm run build` passes.

When a design exception is necessary, document the reason in code only if it prevents future confusion. Otherwise, prefer updating this design system if the exception should become a reusable rule.
