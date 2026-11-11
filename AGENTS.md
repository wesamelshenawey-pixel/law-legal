# Base44 dev environment notes

Single service, no separate API process: `server.ts` is an Express server that mounts Vite in
middleware mode and also defines every `/api/*` route (Gemini, OCR, scraping, PDF parsing).
`npm run dev` = `tsx server.ts`, listening on `0.0.0.0:3000`. `docker-compose.base44.yml`
bind-mounts the repo, installs dependencies into a named `node_modules` volume, then runs it.

## Non-obvious things

- **Dependencies must be declared in `package.json`.** Commit `599e8ea` imported
  `react-qr-code` in 6 components (`App.tsx`, `DocumentManagerModal`,
  `ConsultationPaymentGatewayModal`, `ClientFeeDetailsModal`, `LegalPaymentGatewayModal`,
  `UrfiMarriageContractStudio`) but never added it to `package.json`/`package-lock.json`,
  so `npm ci` installed nothing and both `vite build` and the dev server failed to
  resolve the import. `bun.lock` has it — do not trust `bun.lock` as the source of truth
  for what is installed; CI runs `npm ci || npm install` against `package-lock.json`.
- **Automated tests:** `npm test` runs Vitest (`vitest.config.ts`, jsdom). Suites cover
  `src/utils/authValidation.ts` and the phone-only `LoginView` form. New devDependencies
  (`vitest`, `jsdom`, `@testing-library/*`) are installed by the compose startup `npm install`.
- **`npm run lint` (`tsc --noEmit`) already fails** with pre-existing type errors in
  `DashboardView`, `SettingsView`, `SessionsView`, `rbacAndSecurity`. It is not part of
  `npm run build`, so it does not block the app or CI. Do not gate a change on it.
- **Vite host allowlist:** the preview proxy forwards `Host: <port>-<sandbox id>.$BASE44_SANDBOX_HOST_DOMAIN`.
  `vite.config.ts` adds `.${BASE44_SANDBOX_HOST_DOMAIN}` to `server.allowedHosts` only when
  `BASE44_PREVIEW_MODE === "1"` (unset → Vite's default allowlist, original behaviour).
  `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` does **not** help here: it is only read by the
  `vite` CLI, and this app starts the dev server through `tsx server.ts` → `createServer()`.
  A blocked host shows up as HTTP 403 "Blocked request. This host ... is not allowed."
- `GEMINI_API_KEY` is optional at boot (`server.ts` falls back to `"dummy_key"`); AI routes
  fail at request time without a real key. Delivered through `/run/base44/app.env`.
- Root-level `patch*.cjs`, `patch*.py`, `fix_*.cjs`, `update_*.cjs`, `clean_buttons.cjs` are
  one-off AI Studio edit scripts from previous sessions. They are not imported or run by the
  build; leave them alone.

## Verify

```bash
docker compose -f docker-compose.base44.yml up -d
docker compose -f docker-compose.base44.yml ps          # web must be (healthy)
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000  # 200, Arabic login screen
# production build (what .github/workflows/deploy.yml runs):
docker compose -f docker-compose.base44.yml exec -T web npx vite build --outDir /tmp/dist-check --emptyOutDir
```

The app boots to a Firebase-auth login screen (signed-out state needs no session). Use a
throwaway `--outDir` when checking the build so `dist/` (no longer gitignored) is not left
in the working tree.
