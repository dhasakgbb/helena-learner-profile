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

Connected to Vercel via the GitHub repo. `main` deploys to production. Postgres is provisioned through Vercel Storage; required env vars:

- `DATABASE_URL` — Vercel Postgres (Neon) connection string
- `JWT_SECRET` — 32+ random bytes
- `APP_VERSION` — semver string stamped into saved runs
- `PUBLIC_APP_URL` — public URL for PDF link-backs

## Known v1 limitations

- No email verification or password reset flow — manual recovery only.
- Rate limiting is in-memory per lambda instance (resets on cold start). Upgrade path: Vercel KV.
- Single-child accounts are supported; multi-child is in the data model but not wired into the dashboard yet.

## Disclaimer

Reproduced in-app on every results screen:

> This is an informal exploration tool, not a diagnosis. It cannot identify learning disabilities. If results suggest a closer look, talk with her teacher and pediatrician.
