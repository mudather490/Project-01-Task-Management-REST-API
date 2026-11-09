# Deployment Guide — One Vercel Project (Services) + Turso

This app deploys as **one Vercel project** using [Vercel Services](https://vercel.com/docs/services): the Next.js frontend and the FastAPI backend build together and share one domain.

```
https://your-app.vercel.app
├── /        → Next.js (frontend/)
└── /api/*   → FastAPI (backend/)
```

Only the database lives outside Vercel: **Turso** (serverless SQL — SQLite at heart, durable and free for small apps). Authentication stays the existing custom JWT flow.

## 1. Turso (serverless SQL)
- Go to https://turso.tech → sign up → create a database (dashboard or `turso db create taskflow`).
- Copy its **URL + auth token** (dashboard → database → Connection info). The URL looks like:
  ```env
  DATABASE_URL=libsql://<your-database>.<your-account>.turso.io?authToken=<token>
  ```
- The backend converts `libsql://` to `sqlite+libsql://&secure=true` internally (SQLAlchemy-libsql dialect).
- Keep the token private; paste the URL only into Vercel env vars.
- (Postgres via Neon/Supabase is still accepted — `postgresql://` is converted to the installed psycopg 3 driver.)

## 2. One Vercel Project (Services)
- Push the repo to GitHub.
- Vercel → New Project → Import repo.
  - **Root Directory:** repository root (`./`), not `frontend/` or `backend/`.
  - **Framework Preset:** **Vercel Services** (fall back to CLI below if missing).

- The root [`vercel.json`](../vercel.json) declares both services and the routing:

  ```json
  {
    "services": {
      "api": { "root": "backend/", "framework": "fastapi", "entrypoint": "app.main:app" },
      "web": { "root": "frontend/", "framework": "nextjs" }
    },
    "rewrites": [
      { "source": "/api/(.*)", "destination": { "service": "api" } },
      { "source": "/(.*)", "destination": { "service": "web" } }
    ]
  }
  ```

- If the Services preset is not visible in the dashboard, link once with the CLI:

  ```bash
  vercel link
  vercel project update --framework services
  vercel deploy
  ```

- Env Vars (set once on the single project):
  - `DATABASE_URL` = Turso `libsql://…?authToken=…` URL above
  - `SECRET_KEY` = `openssl rand -hex 32`
  - `DEBUG` = `false`
- Do **not** set `NEXT_PUBLIC_API_URL` — the browser calls `/api` same-origin.

- Deploy → verify:
  - `/` loads the Next.js UI
  - `/api/health` returns `{"status":"ok", ...}`
  - `/api/docs` shows FastAPI docs
  - register → login → create/update/delete tasks, and data persists after refresh

- If you have old split projects (`api.vercel.app` + `web.vercel.app`), delete or disconnect them after the unified app works.

## 3. Local development
Two terminals:

```bash
# Backend
cd backend
pip install -r requirements-dev.txt
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload   # http://127.0.0.1:8001/api/docs

# Frontend (separate terminal)
cd frontend
npm install --legacy-peer-deps
npm run dev -- --webpack             # http://localhost:3000
```

`frontend/next.config.ts` rewrites `/api/*` to `http://127.0.0.1:8001/api/*` locally, so the frontend code is identical locally and in production. (Port 8001 is used in this dev environment because port 8000 is occupied by another listener.)

## 4. Smoke Tests
```bash
curl https://your-app.vercel.app/api/health
curl -X POST https://your-app.vercel.app/api/auth/register -H "Content-Type: application/json" -d '{"email":"t@t.com","password":"secret123","language":"ar"}'
curl -X POST https://your-app.vercel.app/api/auth/login -H "Content-Type: application/json" -d '{"email":"t@t.com","password":"secret123"}'
```

## 5. Troubleshooting
- `ERR_CONNECTION_REFUSED` on localhost: start uvicorn and keep it running; the Next.js proxy then forwards `/api`.
- `Task not found` in Arabic: send `Accept-Language: ar` header.
- CORS: same-origin calls need no CORS. Direct calls to the API from another origin must be listed in `backend/.env` → `CORS_ORIGINS`.
- Token expired: frontend redirects to `/login?reason=expired` — login again.
- `terms like framework: other` in Vercel settings: the project must use the **Services** preset with root at the repo root; otherwise Vercel builds only one side.
- `Error 500` on **Create account** (register) in production: check in this order —
  1. `curl https://<domain>/api/health` → must be `200`. If `404`/`NOT_FOUND` from Vercel, `/api/*` is not reaching the FastAPI service: confirm the deployment is a **Services** deployment (both `services/api/fastapi` and `services/web/index` in the build output) and that `vercel.json` still has the top-level rewrites (`/api/(.*)` → service `api`).
  2. `curl https://<domain>/api/ready` → must be `200 {"status":"ready","database":"ok"}`. If `503`, the database is unreachable — check `DATABASE_URL` in Vercel Dashboard → project → **Settings → Environment Variables** → must be set for **Production** (Turso `libsql://…?authToken=…`), then redeploy (`vercel --prod`).
  3. `DEBUG=false` with a missing/empty `DATABASE_URL` now fails fast at boot (previously this surfaced as an opaque 500 on register).
- `429` after too many sign-in attempts: auth endpoints are rate-limited in production (register 10/min, login 20/min per IP) — wait a minute and retry.

## 6. Cost & Limits
- Vercel Hobby: 100 GB bandwidth, serverless function limits.
- Turso Free: 500 MB database, 9 GB bandwidth/month (data persists; no timeout pauses).
