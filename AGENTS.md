# Habitra Agent Guide

This file is the shared operating guide for LLM contributors working in this repo. Follow it before making code changes.

## Product And Stack

Habitra is a mobile-first habit tracking app built with React, TypeScript, Vite, Tailwind CSS, Radix/shadcn-style UI primitives, TanStack Query, and Capacitor for Android packaging. The app currently uses local persistence through repository abstractions in `src/lib/`.

## Design Principles

Use these principles for every UI decision:

- Lean: keep screens focused, remove unnecessary decoration, and avoid adding controls that do not support the current workflow.
- Clear: use obvious labels, predictable hierarchy, and readable spacing.
- User-focused: optimize for daily habit tracking, quick completion, progress review, and low-friction settings.
- Intuitive: prefer familiar mobile patterns, icons from Lucide where appropriate, and controls users can understand without explanation.

## Coding Standards

- Use TypeScript types from `src/lib/types.ts` and avoid `any` unless a boundary is genuinely unknown.
- Prefer existing repository APIs in `src/lib/repository.ts` over direct persistence access from pages.
- Keep feature logic close to the feature, but extract reusable UI patterns when duplication is real.
- Keep page files focused on orchestration; move complex interaction or presentation blocks into components.
- Do not introduce unrelated rewrites, broad formatting churn, or behavior changes while doing focused fixes.
- Run `npm run typecheck`, `npm run lint`, and `npm run build` for foundation-level changes.

## UI And Design System Rules

- Treat `docs/DESIGN_SYSTEM.md` as mandatory. If a UI decision conflicts with that document, follow the design system strictly like a devotee. If a change is superly needed in design system else you can't proceed, which must be very rare, then inform the user that you are deviating from design system and update the design system accordingly.
- Reuse primitives from `src/components/ui` before creating new base controls.
- Use Tailwind semantic tokens from `src/index.css` and `tailwind.config.js`: `background`, `foreground`, `card`, `primary`, `accent`, `muted`, `border`, `destructive`, and chart tokens.
- Use `lucide-react` icons for standard actions and states.
- Prefer compact, scan-friendly layouts over large decorative sections.
- Keep cards purposeful: use them for grouped information or repeated items, not as generic page wrappers.
- Preserve mobile-first ergonomics, safe-area spacing, and touch targets.
- Respect light, dark, and AMOLED themes.

## Documentation

The design system reference lives in `docs/DESIGN_SYSTEM.md`. Update it when adding new tokens, shared UI conventions, or reusable component patterns.
