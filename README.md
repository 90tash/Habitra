# Habitra

A standalone Vite + React habit tracker.

## Local Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Data Storage

The app currently stores habits and daily logs in browser `localStorage`, so it runs without a hosted backend. The data layer is centralized in `src/lib/repository.js`, which can be swapped for an API later without changing page components.
