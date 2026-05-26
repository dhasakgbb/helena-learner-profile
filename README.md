# Helena's Learner Profile

A child-friendly web app that helps a 10-year-old (and her parent) explore:

1. **Current learning preferences** — what feels easiest and most fun right now.
2. **Areas that might be tricky** — informal screening across reading, writing, math, and attention.
3. **What to do next** — a personalized Learning Menu plus a clear decision tree about when to seek professional input.

## Platform role

This is the **intake + hub** for a four-app platform. The intake produces a small JSON profile that downstream apps (spelling, states, math) read to set sensible defaults. See [`docs/PLATFORM.md`](docs/PLATFORM.md) for the full cross-module architecture.

Live consumers:
- 📝 **helena-spelling** — https://helena-spelling.vercel.app
- 🗺️ **helena-states** — https://helena-states.vercel.app
- ➕ **helena-math** — https://helena-math.vercel.app

The hub at `/hub` (parent-only) is the canonical launcher — each game tile carries the profile to the destination via URL fragment.

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

### Configured infrastructure
- **Hosting**: Vercel (project `helena-learner-profile` under `dhasakgbbs-projects`)
- **Database**: Neon Postgres (free tier, IAD1 region, provisioned via `vercel install neon`)
- **Env vars** (Production + Preview + Development): `DATABASE_URL`, `JWT_SECRET`, `APP_VERSION`, `PUBLIC_APP_URL`, plus the auto-injected `POSTGRES_*` aliases
- **Security headers**: CSP locked to self + Google Fonts, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy disabling sensitive APIs, COOP same-origin

### Re-applying schema (if you ever change Drizzle models)

```bash
vercel env pull .env --environment=production
echo y | npm run db:push -- --force
```

The first command writes a gitignored `.env` with the production DATABASE_URL. The second pushes any schema diff to the live Neon DB.

## Known v1 limitations

- No email verification or password reset flow — manual recovery only.
- Rate limiting is in-memory per lambda instance (resets on cold start). Upgrade path: Vercel KV.
- Single-child accounts are supported; multi-child is in the data model but not wired into the dashboard yet.

## Disclaimer

Reproduced in-app on every results screen:

> This is an informal exploration tool, not a diagnosis. It cannot identify learning disabilities. If results suggest a closer look, talk with her teacher and pediatrician.
