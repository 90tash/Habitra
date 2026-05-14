# Habitra Project Architecture

This document provides a comprehensive guide to Habitra's architecture, workflows, and development rules. It is designed to assist both human developers and AI assistants in understanding and modifying the codebase safely and effectively.

---

## 1. Project Overview
- **Purpose**: A mobile-first, gamified habit tracker focused on consistency, privacy, and delightful user experience.
- **Main Features**: Atomic habit tracking, daily review "Midnight" system, gamification (XP/Levels/Badges), smart insights, focus mode (ambient sounds), and native Android integration.
- **Target Platform**: Android (via Capacitor), Web.
- **Technology Stack**: React 18, TypeScript, Vite, Tailwind CSS, Shadcn UI, Zustand, TanStack Query, Capacitor, date-fns.

---

## 2. Project Architecture
- **High-Level Explanation**: Follows a layered architecture: **UI Layer** (React/Shadcn) -> **Store Layer** (Zustand/Query) -> **Repository Layer** (Abstraction) -> **Persistence Layer** (LocalStorage).
- **Design Principles**:
  - **Lean & Clear**: Minimal dependencies, focused components.
  - **Mobile-First**: Touch-optimized, high-contrast, responsive.
  - **Single Source of Truth**: State is managed via centralized stores or repositories.
- **State Management**:
  - **Global Reactive State**: Zustand (`useAppStore`) for settings, profile, and theme.
  - **Server/Data State**: TanStack Query for habits and logs.
  - **Local UI State**: React `useState` for transient component logic.
- **Data Persistence**: Atomic, synchronous `localStorage` operations wrapped in a Repository pattern to prevent data loss.

---

## 3. Folder Structure
```text
C:\USERS\ASHISH PATRA\DOCUMENTS\HABITRA
+---android\                # Capacitor Android project files
+---docs\                   # Documentation (Design System, Architecture)
+---entities\               # JSON schema definitions for core models
+---src\
|   +---components\         # Reusable UI components
|   |   +---focus\          # Focus mode specific (e.g., WhiteNoisePlayer)
|   |   +---gamification\   # XP bars, badges, and insight cards
|   |   +---habits\         # Habit cards, heatmaps, and progress rings
|   |   +---layout\         # App structure (BottomNav, Layout)
|   |   +---onboarding\     # Setup wizards and permission panels
|   |   \---ui\             # Shadcn base components
|   +---hooks\              # Custom React hooks (useGamification, useMobile)
|   +---lib\                # Core logic, types, and infrastructure
|   |   |   localDataStore.ts # Low-level storage logic
|   |   |   repository.ts    # Business logic abstraction
|   |   |   types.ts         # Global TS interfaces
|   +---pages\              # Main screen components
|   +---store\              # Zustand store definitions
|   \---utils\              # Pure utility functions
```

---

## 4. Feature Map

### Habit Tracking
- **Purpose**: Create, edit, reorder, and log daily habits.
- **Files**: `src/pages/Home.tsx`, `src/components/habits/`, `src/lib/repository.ts`.
- **Data Flow**: `HabitCard` trigger -> `HabitRepository.log` -> `LocalDataStore` -> `QueryClient` Invalidation -> UI Refresh.

### Midnight System (Daily Review)
- **Purpose**: A forced/guided review of habits at the end of the day.
- **Files**: `src/components/habits/MidnightPopup.tsx`, `src/lib/midnightPlugin.ts`.
- **Logic**: Triggered by Android Native Alarm or `useMidnightScheduler.ts`.

### Gamification
- **Purpose**: Motivate users through XP, Levels, and Badges.
- **Files**: `src/lib/gamification.ts`, `src/hooks/use-gamification.ts`.
- **Dependencies**: Calculated dynamically from `allLogs` and `habits`.

---

## 5. UI Navigation Flow
1. **SplashScreen**: Initial load and identity check.
2. **Onboarding/ProfileSetup**: Triggered if `onboardingCompleted` is false or `full_name` is missing.
3. **Home**: Primary dashboard for habit logging.
4. **Statistics**: Detailed analytics and badges.
5. **Focus**: Pomodoro-style timer with ambient sounds.
6. **Settings**: Configuration, profile editing, and habit management.

---

## 6. Data Flow Diagram
**Action** (Toggle Habit) -> **Component** (`HabitCard`) -> **Mutation** (`HabitRepository.updateStreak`) -> **Store** (`LocalDataStore`) -> **Sync** (`localStorage`) -> **Reactive Update** (TanStack Query invalidates 'habits' key) -> **UI Refresh**.

---

## 7. State Management
- **Zustand (`useAppStore`)**: Controls `identity` (user profile), `preferences` (theme, accent, reminder time), and `settings`.
- **TanStack Query**: Manages `habits` and `allLogs` lists.
- **Custom Hooks**:
  - `useGamification`: Derives XP, levels, and insights.
  - `useTheme`: Applies CSS variables based on Zustand state.
  - `useMidnightScheduler`: Watches clock for review triggers.

---

## 8. Database and Storage Schema
- **Habit**: `id`, `title`, `category`, `color`, `frequency`, `target_value`, `unit`, `current_streak`, `sort_order`.
- **DailyLog**: `id`, `habit_id`, `date` (YYYY-MM-DD), `current_value`, `is_completed`.
- **LocalStorage Keys**:
  - `habitra:habits`: Array of Habit objects.
  - `habitra:daily-logs`: Array of DailyLog objects.
  - `habitra-storage`: Serialized Zustand state (preferences/identity).

---

## 9. Business Logic
- **XP Algorithm**: Base 10 XP per completion + streak bonus (capped at 20).
- **Leveling**: 10 distinct ranks organized into tiers (Initiate -> Builder -> Legend) with increasing XP thresholds (Nomad -> Monarch).
- **Folklore**: Narrative-driven rank descriptions that replace simple icons.
- **Consistency**: Percentage of days with >=50% habit completion over the last 30 days.
- **Midnight Trigger**: Uses native Android alarms via `Midnight` plugin or local `setTimeout` fallback.

---

## 10. File Responsibility Matrix
| File | Responsibility |
| :--- | :--- |
| `src/lib/repository.ts` | High-level API for UI; handles XP logic and data orchestration. |
| `src/lib/localDataStore.ts` | Atomic read/write operations to localStorage. |
| `src/store/appStore.ts` | Reactive state for user settings and profile. |
| `src/lib/useTheme.ts` | DOM manipulation for CSS variables and theme classes. |
| `src/hooks/use-gamification.ts` | Centralized computation of analytics and achievements. |

---

## 11. Dependency Graph
- **UI Components** import from **Hooks** and **Shadcn UI**.
- **Hooks** import from **Repositories** and **Stores**.
- **Repositories** import from **LocalDataStore**.
- **All** import from `src/lib/types.ts`.

---

## 12. Modification Guide
- **Changing Colors/Themes**: Edit `src/lib/useTheme.ts` and `tailwind.config.js`.
- **Adding a New Habit Property**: Update `src/lib/types.ts`, `src/lib/localDataStore.ts` defaults, and `CreateHabitSheet.tsx`.
- **Adding an Achievement**: Edit `BADGES` array in `src/lib/gamification.ts`.
- **Changing Persistence Logic**: Edit `src/lib/localDataStore.ts` only.

---

## 13. Safe Editing Rules
- **Minimal Change**: Fix only what is requested.
- **Preserve APIs**: Do not change method signatures in `repository.ts` or `localDataStore.ts` without updating all consumers.
- **Styling**: Use Tailwind classes. Follow the spacing and radius conventions in `DESIGN_SYSTEM.md`.
- **Synchronicity**: Ensure storage updates remain synchronous/atomic to avoid race conditions.

---

## 14. Known Constraints
- **WebView Performance**: Android WebView can be slow; avoid heavy calculations in the main render loop (use `useMemo`).
- **Storage Limit**: `localStorage` is limited (~5MB). Avoid storing large binary data (convert images to small base64 or use external URIs).
- **Native Sync**: Midnight triggers require the Android app to be in the foreground or have background permissions.

---

## 15. Testing Checklist
- [ ] Run `npm run typecheck` - must have 0 errors.
- [ ] Run `npm run lint` - must have 0 errors.
- [ ] Verify habit completion persists after a page refresh.
- [ ] Verify accent color changes reflect instantly on the Home and Statistics pages.
- [ ] Verify XP updates immediately upon habit completion.

---

## 16. Troubleshooting Guide
- **Data not persisting?** Check `localStorage` for `habitra:habits`. Verify `writeCollection` in `localDataStore.ts` is firing.
- **Theme not applying?** Ensure `initializeTheme()` is called in `main.tsx`. Check `<html>` tag classes for `dark` or `amoled`.
- **XP not updating?** Invalidate TanStack Query keys `['habits']` and `['allLogs']` after mutations.

---

## 17. Development Workflow
- **Branching**: `feature/`, `fix/`, `refactor/`.
- **Build**: `npm run build` generates the `dist` folder.
- **Capacitor**: `npx cap sync android` after every build to update the native project.

---

## 18. Coding Standards
- **Naming**: PascalCase for components, camelCase for variables/functions, UPPER_CASE for constants.
- **Organization**: One component per file. Logic in `lib/` or `hooks/`, UI in `components/`.
- **Types**: Use explicit interfaces from `lib/types.ts`. Avoid `any`.

---

## 19. AI Instructions
- **Stay Context-Aware**: Read `AGENTS.md` and `docs/ARCHITECTURE.md` before making changes.
- **Surgical Edits**: Use `replace` for targeted changes. Avoid rewriting entire files.
- **Explain Intent**: For every change, provide a brief technical rationale.
- **Verification**: Always run diagnostic commands (`tsc`, `lint`) after significant edits.

---

## 20. Change Impact Matrix
| Feature | Primary Files | Potential Side Effects |
| :--- | :--- | :--- |
| **Habit Logic** | `repository.ts`, `types.ts` | Gamification values, Statistics charts. |
| **State/Settings** | `appStore.ts`, `useTheme.ts` | Global UI appearance, Onboarding flow. |
| **Persistence** | `localDataStore.ts` | App-wide data stability. |
| **Midnight/Review**| `MidnightPopup.tsx`, `midnightPlugin.ts` | Notification behavior, daily reset logic. |
