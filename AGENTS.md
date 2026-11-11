# AGENTS.md — Base44 dev environment notes

## Stack
- Single Node/Express process (`server.ts`) that runs **Vite in middleware mode** in development and serves `dist/` in production. It also defines every `/api/*` route (Gemini, OCR, scraping, PDF parsing). One entry point on port 3000 — no separate client/API servers.
- Vite root is the repository root (`@` alias → repo root), so components live in `src/`.
- Local dev command: `npm run dev` (`tsx server.ts`), listening on `0.0.0.0:3000`. Production build: `npm run build` (`vite build` + esbuild-bundled `server.ts` → `dist/server.cjs`).
- `docker-compose.base44.yml` bind-mounts the repo, installs dependencies into a named `node_modules` volume, then runs the dev server.

## Run it in the sandbox
```bash
docker compose -f docker-compose.base44.yml up -d --build
docker compose -f docker-compose.base44.yml logs -f web
```
- `node:22-bookworm-slim` + source bind-mounted; `node_modules` lives in a named volume and is installed from `package-lock.json` (`npm ci`) at container start.
- The container runs the dev server, not the production build, so edits hot-reload through Vite HMR. Changes to `server.ts` require `docker compose restart web` (`tsx` is not started in watch mode).

## Environment check
- `docker/startup.sh` is the container entrypoint (Compose runs it as root via `user: root`). It runs before `npm ci` and `npm run dev`.
- Missing `REQUIRED_VARS` print a "STARTUP ABORTED" block and exit 1. `REQUIRED_VARS` is empty today because `server.ts` falls back to defaults for every variable it reads.
- Missing `RECOMMENDED_VARS` (currently `GEMINI_API_KEY`) print a warning only: the app starts, but AI chat/OCR/drafting stay disabled.
- Override the lists for one-off checks: `docker compose -f docker-compose.base44.yml exec -T -e REQUIRED_VARS=GEMINI_API_KEY web /app/docker/startup.sh true`.
- `tests/startup-env-check.sh` verifies the abort/pass/warning paths, the executable bit and that Compose runs the container as root.

## Non-obvious things
- **Dependencies must be declared in `package.json`.** Commit `599e8ea` imported
  `react-qr-code` in 6 components (`App.tsx`, `DocumentManagerModal`,
  `ConsultationPaymentGatewayModal`, `ClientFeeDetailsModal`, `LegalPaymentGatewayModal`,
  `UrfiMarriageContractStudio`) but never added it to `package.json`/`package-lock.json`,
  so `npm ci` installed nothing and both `vite build` and the dev server failed to
  resolve the import. `bun.lock` has it — do not trust `bun.lock` as the source of truth
  for what is installed; CI runs `npm ci || npm install` against `package-lock.json`.
- **`package-lock.json` and `package.json` must stay in sync.** If `npm ci` aborts with
  `Missing: <pkg> from lock file`, regenerate with `npm install --package-lock-only` and
  commit the result.
- **Automated tests:** `npm test` runs Vitest (`vitest.config.ts`, jsdom). Suites cover
  `src/utils/authValidation.ts` and the phone-only `LoginView` form. DevDependencies
  (`vitest`, `jsdom`, `@testing-library/*`) are installed by the compose startup `npm ci`.
- **`npm run lint` (`tsc --noEmit`) already fails** with pre-existing type errors in
  `DashboardView`, `SettingsView`, `SessionsView`, `rbacAndSecurity`. It is not part of
  `npm run build`, so it does not block the app or CI. Do not gate a change on it.
- **Vite host allowlist:** the preview proxy forwards `Host: <port>-<sandbox id>.$BASE44_SANDBOX_HOST_DOMAIN`.
  `vite.config.ts` adds `.${BASE44_SANDBOX_HOST_DOMAIN}` to `server.allowedHosts` only when
  `BASE44_PREVIEW_MODE === "1"` (unset → Vite's default allowlist, original behaviour).
  `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` is also passed bare through Compose; note it is
  only read by the `vite` CLI, and this app starts the dev server through `tsx server.ts`
  → `createServer()`, so the `allowedHosts` entry is what actually matters here.
  A blocked host shows up as HTTP 403 "Blocked request. This host ... is not allowed."
- `GEMINI_API_KEY` is optional at boot (`server.ts` falls back to `"dummy_key"`); AI routes
  fail at request time without a real key. Delivered through `/run/base44/app.env`.
- `.env.base44-defaults` holds boot-only placeholders; `/run/base44/app.env` (platform
  secrets) is listed after it so real values win. Never put real credentials in the
  defaults file.
- Root-level `patch*.cjs`, `patch*.py`, `fix_*.cjs`, `update_*.cjs`, `clean_buttons.cjs` are
  one-off AI Studio edit scripts from previous sessions. They are not imported or run by the
  build; leave them alone.
- `dist/` and `build/` are **not** gitignored in this repo. Running `npm run build` creates `dist/`; delete it afterwards so build output is not committed.

## Verify
```bash
docker compose -f docker-compose.base44.yml up -d
docker compose -f docker-compose.base44.yml ps          # web must be (healthy)
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000  # 200, Arabic login screen
# production build (what .github/workflows/deploy.yml runs):
docker compose -f docker-compose.base44.yml exec -T web npx vite build --outDir /tmp/dist-check --emptyOutDir
# unit tests (vitest + jsdom):
docker compose -f docker-compose.base44.yml exec -T web npm test
# startup env-check script:
bash tests/startup-env-check.sh
```

The app boots to a Firebase-auth login screen (signed-out state needs no session). Use a
throwaway `--outDir` when checking the build so `dist/` (no longer gitignored) is not left
in the working tree.
