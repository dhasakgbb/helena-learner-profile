# Helena's Learner Profile

A child-friendly web app that helps a 10-year-old (and her parent) explore:

1. **Current learning preferences** — what feels easiest and most fun right now.
2. **Areas that might be tricky** — informal screening across reading, writing, math, and attention.
3. **What to do next** — a personalized Learning Menu plus a clear decision tree about when to seek professional input.

## What this app is not

It is **not** a diagnostic tool. It cannot identify learning disabilities. Every results screen repeats this — results are a conversation starter, not a label. If a domain flags `medium` or `high`, talk to her teacher and pediatrician.

## Stack

- SvelteKit 2 (Svelte 5 runes) + TypeScript strict
- Tailwind CSS v4
- Drizzle ORM → Vercel Postgres (Neon)
- bcryptjs + jose (JWT) for auth (httpOnly cookies)
- pdf-lib for client-side PDF export
- Vitest + Playwright + @axe-core/playwright for tests

## Local development

```bash
npm install
cp .env.example .env       # fill in DATABASE_URL + JWT_SECRET
npm run db:push            # apply Drizzle schema to your DB
npm run dev                # http://localhost:5173
```

## Tests

```bash
npm run test:run           # unit + component tests
npm run test:e2e:install   # one-time Playwright browser install
npm run test:e2e           # end-to-end + accessibility (axe)
npm run check              # svelte-check
```

## Deploy

Live at **https://helena-learner-profile.vercel.app**.

`main` auto-deploys to production via the Vercel ↔ GitHub integration.

### Already configured
- `JWT_SECRET` — generated, set in Vercel env (Production + Development)
- `APP_VERSION = 0.1.0`
- `PUBLIC_APP_URL = https://helena-learner-profile.vercel.app`

### Manual step needed for parent dashboard (~60 seconds)

The kid-facing flow works fully without a database. The parent dashboard (sign-up, save run, history) needs a Postgres database — Vercel's CLI no longer provisions storage, so the one-time step is in the Vercel dashboard:

1. Visit **https://vercel.com/dhasakgbbs-projects/helena-learner-profile/stores**
2. Click **Create Database → Postgres** (Neon-backed, free tier is fine).
3. Vercel automatically injects `DATABASE_URL` (plus `POSTGRES_*` aliases) into the project's env vars and triggers a redeploy.
4. After the redeploy completes, apply the Drizzle schema once:
   ```bash
   vercel env pull .env                      # pulls DATABASE_URL to local .env
   npm run db:push                            # creates parents/children/runs tables
   ```
5. Sign up at `/parent/signup` to verify.

Until step 1 is done, the auth endpoints return `{"error":"server_not_configured"}` with status 500 — the rest of the app still works.

## Known v1 limitations

- No email verification or password reset flow — manual recovery only.
- Rate limiting is in-memory per lambda instance (resets on cold start). Upgrade path: Vercel KV.
- Single-child accounts are supported; multi-child is in the data model but not wired into the dashboard yet.

## Disclaimer

Reproduced in-app on every results screen:

> This is an informal exploration tool, not a diagnosis. It cannot identify learning disabilities. If results suggest a closer look, talk with her teacher and pediatrician.
