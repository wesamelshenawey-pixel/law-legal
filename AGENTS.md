# AGENTS.md — sandbox / Base44 notes

## Stack
- Single Node/Express process (`server.ts`) that runs **Vite in middleware mode** in development and serves `dist/` in production. One entry point on port 3000 — no separate client/API servers.
- Vite root is the repository root (`@` alias → repo root), so components live in `src/`.
- Local dev command: `npm run dev` (`tsx server.ts`). Production build: `npm run build` (`vite build` + esbuild-bundled `server.ts` → `dist/server.cjs`).

## Run it in the sandbox
```bash
docker compose -f docker-compose.base44.yml up -d --build
docker compose -f docker-compose.base44.yml logs -f web
```
- `node:22-bookworm-slim` + source bind-mounted; `node_modules` lives in a named volume and is installed from `package-lock.json` (`npm ci`) at container start.
- The container runs the dev server, not the production build, so edits hot-reload through Vite HMR. Changes to `server.ts` require `docker compose restart web` (`tsx` is not started in watch mode).

## Gotchas learned the hard way
- **`package-lock.json` and `package.json` must stay in sync.** A commit once trimmed the lockfile and dropped `react-qr-code` from `package.json` while the source imported it — `npm ci` aborted with `Missing: <pkg> from lock file`, then the dev server failed on `Failed to resolve import`. If `npm ci` reports missing packages, regenerate with `npm install --package-lock-only` and commit the result.
- `bun.lock` is present but stale/not used by Compose or CI; never treat it as the source of truth for dependencies.
- `.env.base44-defaults` holds boot-only placeholders; `/run/base44/app.env` (platform secrets) is listed after it so real values win. Never put real credentials in the defaults file.
- Preview proxy hosts are passed bare through Compose (`__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS`) so Vite accepts them; no host is hardcoded.
- `dist/` and `build/` are **not** gitignored in this repo. Running `npm run build` creates `dist/`; delete it afterwards so build output is not committed.

## Verify
```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/     # expect 200
docker compose -f docker-compose.base44.yml exec -T web npm run build # production build must pass
```
The app opens on a login screen (Firebase/Firestore auth). Without a signed-in session only the login screen can be verified.
