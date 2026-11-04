# Development notes

## Running the app

```bash
docker compose -f docker-compose.base44.yml up -d --build
```

- Single Node service (`node:22`) runs `tsx server.ts` in dev mode; Express serves the API routes and mounts Vite in middleware mode for the React SPA on port 3000.
- `node_modules` lives in a named Docker volume, populated by `npm install` at container start. Do not delete the volume to refresh deps; use `docker compose ... exec app npm install <pkg>`.
- Vite's dev-server host allowlist receives `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` from the platform environment (passed through as a bare env entry) — required for the sandbox preview host.
- `docker/startup.sh` is the container entrypoint (runs as root). It validates env vars before the app starts: missing `REQUIRED_VARS` abort with exit 1; missing `RECOMMENDED_VARS` (currently `GEMINI_API_KEY`) print a warning and the app still starts.

## Secrets

- `GEMINI_API_KEY` is optional at boot: `server.ts` falls back to a dummy key, so the UI and non-AI features load. AI chat, document OCR and AI drafting calls fail without a real key.
- Secrets arrive via `/run/base44/app.env` (outside the repo) and are wired through `env_file:` in compose.

## Verification

- `docker compose -f docker-compose.base44.yml ps` should show `app` as `healthy`; `curl -s localhost:3000` returns 200 with the login page.
- `npm run lint` (tsc) inside the container checks types.
