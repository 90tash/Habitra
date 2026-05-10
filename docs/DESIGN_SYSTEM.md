# Habitra Design System

Habitra's design system is a practical layer over Tailwind CSS variables, shadcn/Radix primitives, and feature-specific React components. It exists to keep the app lean, clear, user-focused, and intuitive.

## Foundations

- Platform: mobile-first React app packaged with Capacitor.
- Base primitives: `src/components/ui`, generated in the shadcn/Radix style.
- Styling: Tailwind utility classes backed by CSS variables in `src/index.css`.
- Icons: `lucide-react`.
- Themes: light, dark, and AMOLED classes.

## Tokens

Use semantic tokens instead of hard-coded colors where possible:

- Surfaces: `background`, `card`, `popover`, `muted`, `secondary`.
- Text: `foreground`, `card-foreground`, `muted-foreground`.
- Actions: `primary`, `accent`, `destructive`.
- Structure: `border`, `input`, `ring`.
- Data visualization: `chart-1` through `chart-5`.

Use the configured font families:

- `font-inter` for most interface text.
- `font-space` for app identity, high-emphasis headings, and compact numeric emphasis.

Use the configured radius scale from `--radius`; avoid one-off radius values unless a component has an established visual reason.

## Layout Principles

- Start from the primary user task, then add supporting information.
- Keep mobile screens scan-friendly: clear headings, compact sections, and predictable vertical rhythm.
- Use bottom navigation and safe-area spacing consistently.
- Avoid decorative complexity that competes with habit completion, progress review, or settings workflows.
- Use cards for grouped content or repeated items; avoid nesting cards inside cards.

## Component Rules

- Use `src/components/ui` primitives for buttons, dialogs, sheets, inputs, tabs, alerts, progress, and similar base controls.
- Put domain-specific components under feature folders such as `src/components/habits`, `src/components/gamification`, and `src/components/focus`.
- Extract a component when it improves readability, centralizes repeated behavior, or clarifies ownership.
- Keep page components responsible for data loading, route-level state, and composition.

## Interaction And Motion

- Motion should clarify state changes, not decorate them.
- Prefer short, responsive transitions for route entrances, sheets, dialogs, completion feedback, and drag interactions.
- Avoid scroll locks or body-level style changes unless there is no lighter alternative.
- Touch targets should be comfortable on mobile and should not shift layout during hover, drag, or loading states.

## Content And Accessibility

- Use direct labels and concise helper text.
- Preserve visible focus states and semantic controls.
- Use icons with accessible labels when the icon is the only visible affordance.
- Loading, empty, and error states should explain what happened and offer the next useful action when one exists.

## Refactor Guidance

- Prefer incremental cleanup over broad rewrites.
- Keep behavior stable unless the task is explicitly a behavior change.
- Replace repeated inline style patterns with shared components or tokenized utilities when repetition is clear.
- Validate changes with `npm run typecheck`, `npm run lint`, and `npm run build`.
