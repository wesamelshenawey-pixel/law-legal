# Base44 Dev Environment

## Stack
- Vite + React 19 + TypeScript SPA with an Express backend (`server.ts`) served on port 3000.
- Express runs Vite in middleware mode (dev) — single origin, no separate API port.
- Tailwind v4 via `@tailwindcss/vite`.

## Running
- `docker compose -f docker-compose.base44.yml up -d` — builds and starts the app.
- Healthcheck: `curl -sf http://localhost:3000/`.
- Dependencies installed via `npm ci` on container startup (node_modules in a named volume).

## Secrets
- `GEMINI_API_KEY` (optional): Google Gemini API key for AI features (OCR, legal assistant). The app boots without it (falls back to `dummy_key`); AI endpoints will fail until a real key is provided. Get one at https://aistudio.google.com/apikey.

## Notes
- Firebase config is committed in `firebase-applet-config.json` and used client-side for auth/firestore.
- The app is an Arabic legal practice management system (مكتب الأستاذ وسام الشناوي المحامى).
- Many `.cjs` patch scripts at repo root are legacy; not part of the build.
