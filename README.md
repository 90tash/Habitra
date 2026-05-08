# Habitra

Habitra is a modern habit tracking app built with React, TypeScript, Vite, Tailwind CSS, and Capacitor. It is designed for daily routines, streak tracking, focus tools, analytics, and future full-stack sync.

## How The Project Is Structured

The main app shell lives in `src/App.tsx`. User-facing screens live in `src/pages/`, reusable interface pieces live in `src/components/`, typed data access is centralized in `src/lib/repository.ts`, and lightweight client preferences/local identity live in `src/store/`.

Habitra currently runs backend-light: habits and daily logs are persisted locally through the repository layer, while the code is structured so that a real API can replace local persistence later without rewriting page components.

| Area | Responsibility |
| --- | --- |
| `src/App.tsx` | Application shell, onboarding/splash flow, routing, and layout mounting |
| `src/pages/` | Home, calendar, focus, statistics, settings, and onboarding screens |
| `src/components/` | Habit UI, gamification UI, layout, and shared interface primitives |
| `src/lib/` | Typed models, repository/data access, local storage persistence, auth shim, utilities, and app logic |
| `src/store/` | Lightweight persisted settings and local identity state |
| `capacitor.config.ts` | Android packaging configuration for Capacitor |
| `entities/` | Data-shape references for habits, daily logs, and achievements |

## Local Development

Install dependencies:

```bash
npm install
```

Start the web dev server:

```bash
npm run dev
```

Run checks:

```bash
npm run typecheck
npm run lint
npm run build
```

## Android Development

Android packaging uses Capacitor 7. For the first Android setup, run:

```bash
npm run android:add
```

After web changes, sync the Android project:

```bash
npm run android:sync
```

Open the native Android project:

```bash
npm run android:open
```

Then use Android Studio to run the app on a device or build an APK.

## What Is Intentionally Not Included Yet

Habitra does not need custom Android plugins, release workers, image relays, or automation workers right now. Those patterns make sense for app-store/catalog projects, but this app’s current needs are habit tracking, local persistence, Android packaging, and a clean path toward future cloud sync.
