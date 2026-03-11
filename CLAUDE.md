# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Dev server with hot reload (http://localhost:3000)
npm run build    # Production build (required before npm start)
npm start        # Serve production build
```

There are no tests or linters configured.

## Architecture

Single-page Next.js 16 app using the App Router. All application code lives in `app/`.

- `app/layout.js` — Root layout, sets page metadata (`<title>`, description)
- `app/page.js` — Entire app in one file (`"use client"`): timer logic + all React components + inline styles
- `app/globals.css` — Minimal base reset (box-sizing, body background/font)
- `app/icon.svg` — Emoji favicon (🏋️‍♀️), picked up automatically by Next.js
- `next.config.mjs` — Sets `turbopack.root` to suppress a workspace-root warning
- `index.html` — Standalone HTML version of the app (no framework, not served by Next.js)

## page.js structure

The file is self-contained with three screens managed by a single `config` state in the root `Page` component:

- **`config === null`** → `SetupScreen` (work time, rest time, reps inputs)
- **`config !== null`** → `TimerScreen` (countdown ring, pause/reset)
- **`done === true`** (inside TimerScreen) → renders the done state inline

Key implementation details:
- Hover shadows on inputs use `onMouseEnter`/`onMouseLeave` + local `useState` (inline styles can't do `:hover`)
- Timer uses `setInterval` inside `useEffect`; a `stateRef` keeps a mutable snapshot of state to avoid stale closures in the `advance` callback
- Audio beeps use the Web Audio API (`AudioContext`), wrapped in try/catch for browsers that block it
- All styles are inline JS objects in the `styles` object at the bottom of the file — no CSS modules or Tailwind
