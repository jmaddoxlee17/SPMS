# SPMS Backend (Express + Supabase)

## Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` using the Supabase project URL and **publishable/anon key** (NOT a service-role or secret key). Set `CORS_ORIGIN` to your frontend URL(s).

In Supabase **SQL Editor**, run `../supabase/migrations/001_initial_schema.sql` **only after checking whether you already created any of these tables**. The migration is intended for a new/empty application schema; do not overwrite an existing populated schema without reconciling differences.

```bash
npm run dev
```

Open http://localhost:3001/api/health and http://localhost:3001/api/health/config.

Protected endpoints require an access token from Supabase Auth: `Authorization: Bearer <access_token>`. The server verifies that token and passes it to Supabase so Row Level Security applies to each request. Do not send the user's password to Express.

## Routes

- `GET /api/health`, `GET /api/health/config` (no login)
- `GET /api/me`, `GET /api/users`
- `GET, POST /api/projects`
- `GET, PATCH, DELETE /api/projects/:projectId`
- `GET, POST /api/projects/:projectId/members`; `PATCH, DELETE /api/projects/:projectId/members/:memberId`
- `GET, POST /api/projects/:projectId/requirements`; `PATCH, DELETE /api/projects/:projectId/requirements/:itemId`
- `GET, POST /api/projects/:projectId/risks`; `PATCH, DELETE /api/projects/:projectId/risks/:itemId`
- `GET, POST /api/projects/:projectId/effort`; `PATCH, DELETE /api/projects/:projectId/effort/:itemId`
- `GET /api/projects/:projectId/effort/summary`

## Curl smoke test

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/projects  # Expect HTTP 401 without bearer token
# Once you sign in via Supabase Auth in the frontend:
curl -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' http://localhost:3001/api/me
curl -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' http://localhost:3001/api/projects
```

## Vercel deployment

In the same GitHub repository, create **two Vercel projects**: one with root directory `frontend`, and one with root directory `backend`. Vercel recognizes `backend/src/index.ts` as the Express entrypoint. Backend environment variables: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `CORS_ORIGIN=https://your-frontend.vercel.app`. Frontend should have `VITE_API_URL=https://your-backend.vercel.app/api`. Do not expose secret/service-role keys via `VITE_` variables.

## Notes

- User accounts must be created via Supabase Auth. A database trigger creates each user's public profile.
- Project creation automatically adds the project manager as a member.
- Effort entries can optionally reference a requirement, enabling hours-by-requirement totals.
- These API routes are implemented but not yet wired into the existing React pages.
