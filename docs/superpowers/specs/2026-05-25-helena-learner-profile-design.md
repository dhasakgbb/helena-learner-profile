# Helena's Learner Profile — Design Spec

**Date:** 2026-05-25
**Author:** Damian (with Claude)
**Status:** Approved for implementation
**Repo:** `github.com/dhasakgbb/helena-learner-profile`
**Hosting:** Vercel
**Audience:** Damian (parent), Helena (10), and any caregiver/teacher she shares the result with

---

## 1. Purpose

Build a child-friendly web app that helps a 10-year-old (and her parent) explore:

1. **Her current learning preferences** — what feels easiest/most fun.
2. **Areas that might be tricky** — informal screening for reading, writing, math, attention.
3. **What to do with the result** — a Learning Menu of concrete strategies + clear guidance on when to seek professional help.

**Explicit non-goal:** This app does **not** diagnose learning disabilities. Every results screen states this. It is a starting point for conversations with teachers and pediatricians.

## 2. Ethical & framing principles

The app's tone and language are part of the spec, not decoration.

| Principle | Implementation |
| --- | --- |
| Strength-first | Module order is preferences → screening → strengths spotlight → results. Confidence-building before any flagging. |
| Plain kid language | "Tricky" not "deficit." "Still learning this" not "low score." 5th-grade reading level max. |
| Repeated disclaimers | Welcome screen, before each module, and on every results screen. |
| No labeling | Results are framed as "current preferences" and "areas worth watching" — never "you are a visual learner" or "you have signs of dyslexia." |
| Parent gates sensitive content | Detailed interpretation language is shown to the parent view only; kid view stays encouraging. |
| Triangulation reminder | Results page always recommends combining with teacher input, work samples, and re-testing in 6 months. |

## 3. Architecture

```
┌─────────────────────────────────────────────────────┐
│  Browser (Svelte 5 components, Tailwind, runes)     │
│  Kid-facing                                         │
│  ├── /                  Welcome + disclaimer        │
│  ├── /explore           4-step assessment flow      │
│  │    ├── /explore/preferences                      │
│  │    ├── /explore/screening                        │
│  │    ├── /explore/strengths                        │
│  │    └── /explore/results                          │
│  ├── /resources         UDL strategies + pro-help   │
│  Parent-facing                                      │
│  ├── /parent/login      Sign-in                     │
│  ├── /parent/signup     Sign-up                     │
│  ├── /parent/dashboard  Run history + comparison    │
│  └── /parent/privacy    Privacy notice + delete-me  │
└─────────────────────────┬───────────────────────────┘
                          │ JSON over fetch
┌─────────────────────────▼───────────────────────────┐
│  SvelteKit server routes (+server.ts)               │
│  ├── /api/auth/{signup,login,logout,me}             │
│  ├── /api/runs (POST save, GET list, DELETE)        │
│  └── /api/children (CRUD)                           │
└─────────────────────────┬───────────────────────────┘
                          │ Drizzle ORM
┌─────────────────────────▼───────────────────────────┐
│  Vercel Postgres (Neon)                             │
│  ├── parents (id, email, password_hash, created_at) │
│  ├── children (id, parent_id, name, birth_year)     │
│  └── runs (id, child_id, taken_at, payload jsonb)   │
└─────────────────────────────────────────────────────┘
```

**Single deploy target:** SvelteKit app on Vercel. UI + API + DB connection all in one repo.

## 4. Tech stack

| Layer | Choice | Rationale |
| --- | --- | --- |
| Framework | SvelteKit 2.x with Svelte 5 (runes) | Matches Spelling project ergonomics, adds server routes + adapter-vercel. |
| Language | TypeScript strict | Catches misalignment between scoring fixtures and runtime. |
| Styling | Tailwind CSS v4 + custom CSS variables for theme | Fast iteration, kid-friendly utilities. |
| State | Svelte 5 runes (`$state`, `$derived`) + a small `sessionStorage` persistence layer | No external store library needed. |
| API validation | `zod` | Same schemas usable on client + server. |
| ORM | Drizzle ORM | Type-safe, lightweight, plays well with Vercel Postgres. |
| Auth | `bcryptjs` (passwords) + `jose` (JWT signing) | Pure-JS, edge-compatible, no native compile. |
| PDF export | `pdf-lib` | Client-side, no server cost. |
| Charts | Hand-rolled SVG bar charts (no library) | Avoids 100KB chart libs for 2 simple bars. |
| Confetti | `canvas-confetti` | Reuse pattern from helena-learning. |
| Tests | Vitest + `@testing-library/svelte` + Playwright + `@axe-core/playwright` | Matches Spelling toolchain, adds a11y enforcement. |
| Linting | ESLint + Prettier + `svelte-check` | Standard SvelteKit defaults. |

## 5. Modules

### 5.1 Preferences Exploration

**Goal:** Surface current learning-mode preferences (Visual / Auditory / Read-Write / Kinesthetic) without locking the child into a label.

**Items:** 10 scenario-based questions. Each scenario presents 4 responses tagged V/A/R/K. Some items are single-select; 3 items allow multi-select to capture blended preferences. Items are written at a 5th-grade reading level and reviewed for cultural neutrality.

**Example item:**

> You want to learn how to build a LEGO set. You would rather…
> - (V) Look at the pictures and diagrams.
> - (A) Have someone explain it step-by-step.
> - (R) Read the instruction booklet.
> - (K) Just start building and figure it out by doing.

**Scoring:** Per-mode percentage of total selected tags. Output: bar chart + a "Your top preferences right now" sentence. Always closes with: "Your brain can use all of these. Mixing them often works best."

**Edge cases:**
- All multi-select chosen → preferences considered balanced; output framed as "you like to mix it up."
- All same letter chosen → flagged as a possible "answered without reading" pattern; gentle prompt to retake if desired.

### 5.2 Challenge Screening

**Goal:** Light parent-and-child observation of four domains where 10-year-olds commonly show learning friction.

**Items:** 12 items total — 3 per domain (Reading, Writing, Math, Attention). Each uses a 5-point frequency scale: **Never / Rarely / Sometimes / Often / Almost Always**. All 12 are negatively-framed (e.g. "I lose my place when I'm reading") — affect balance is handled by the separate Strengths Spotlight module, which lets us keep screening math consistent across domains without per-item reverse-scoring.

**Example items:**
- *Reading:* "I have to read a sentence more than once to understand it."
- *Writing:* "When I write, my ideas come out faster than I can put them on the page."
- *Math:* "I mix up the steps in word problems."
- *Attention:* "I lose my place when I'm working on something for a long time."

**View toggling:** Each item is shown twice — once phrased to the kid, once to the parent (toggle at the top). Both responses persist; the child's response shows on the results screen, the parent's view is included in the parent-only "Areas worth watching" section.

**Scoring (per domain):**
- Sum the kid's frequency answers (Never=0 … Almost Always=4). Max per domain = 12.
- **Raw flag levels:** `low` (sum 0–4), `medium` (5–8), `high` (9–12).
- **Parent corroboration rule:**
  - If the parent view was completed *and* the raw level is `medium` or `high`: keep the level only if at least one parent answer in that domain ≥ "Often"; otherwise downgrade by one band.
  - If the parent view was *not* completed: keep the raw level but tag the badge as "needs parent corroboration" so the parent knows the result is single-source.
- This guards against pure self-report bias without losing data when only one view is filled in.

**Output (parent view):** Per-domain badge. `high` includes a "schedule a conversation" prompt.

### 5.3 Strengths Spotlight

**Goal:** Counterweight to screening. 6 positive items with a 3-point scale (Sounds like me / Sometimes / Not really).

**Example items:**
- "I notice patterns other people miss."
- "I can stick with a problem until I solve it."
- "I'm good at coming up with new ideas."

**Output:** A list of "Things I'm great at" (any item answered "Sounds like me") with one-line affirmations.

### 5.4 Interpretation & Resources

The Learning Menu page is the **only output the kid sees**. The parent dashboard shows the full detail.

**Decision tree** (deterministic, runs in browser):

```
flags = count of medium/high domain flags
top_pref = mode with highest preference percentage
strengths = list of strengths spotlighted

if flags == 0:
    plan = "Strength-based experimentation plan"
    next_step = "Try one new strategy this week."
elif flags == 1 and that domain is `medium`:
    plan = "Monitor + multisensory boost"
    next_step = "Track this area for 3–4 weeks. Re-do the explore."
elif flags >= 2 or any domain is `high`:
    plan = "Schedule a conversation"
    next_step = "Teacher first → pediatrician → formal evaluation."
```

**Resource hub** (`/resources`): UDL strategy cards organized by preference and by flagged domain. External links go to authoritative sources only (IDA, Understood.org, Lexercise, CDC Learn the Signs).

**PDF export:** Single-page PDF summary with top preferences, flagged areas (parent view), recommended next step, and the disclaimer.

## 6. Data flow (single run)

1. User lands on `/`. Reads short welcome. Checks the "I understand this is an exploration, not a diagnosis" box (required). Optionally clicks "Sign in to save runs" — opens `/parent/login`.
2. User starts at `/explore/preferences`. Each question writes to `$state` and to `sessionStorage` (resume-on-refresh).
3. Same for `/explore/screening` (with parent/kid toggle) and `/explore/strengths`.
4. At `/explore/results`:
   - Client-side scoring functions compute preferences %, screening flags, strengths list, and run the decision tree.
   - Kid view renders: preferences chart, strengths spotlight, the Learning Menu, big "next step" card.
   - Parent view (toggle visible only if signed in *or* if "show parent view" checkbox was ticked in welcome): adds flagged-areas section + when-to-seek-help checklist.
5. CTA buttons: "Download PDF summary," "Save to dashboard" (visible if signed in), "Restart explore."
6. On Save: POST to `/api/runs` with the full payload (raw answers + computed scores + decision-tree output).

## 7. Data model

```sql
CREATE TABLE parents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         CITEXT UNIQUE NOT NULL,
  password_hash TEXT   NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE children (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id   UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  birth_year  INT  NOT NULL CHECK (birth_year BETWEEN 2005 AND 2025),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE runs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id   UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  taken_at   TIMESTAMPTZ DEFAULT now(),
  payload    JSONB NOT NULL,
  app_version TEXT NOT NULL
);

CREATE INDEX runs_child_taken ON runs(child_id, taken_at DESC);
```

- Email stored as CITEXT (case-insensitive).
- Only `display_name` and `birth_year` for the child — no full DOB, no school name, no last name.
- `payload` is the raw run JSON (preferences answers, screening answers, computed scores, decision tree). Stored as JSONB for forward-compatible schema evolution.
- `app_version` makes future replay / migration tractable. On read, the loader checks `app_version`; runs from older versions are loaded best-effort and rendered with a "from an older version" notice rather than crashing.

## 8. API contracts

All endpoints validate with shared zod schemas (single source of truth: `src/lib/schemas/*.ts`).

### `POST /api/auth/signup`
- Body: `{ email: string, password: string (≥10 chars) }`
- Response 201: `{ parent: { id, email } }` + Set-Cookie with JWT
- Response 409: `{ error: "email_in_use" }`

### `POST /api/auth/login`
- Body: `{ email, password }`
- Response 200: same as signup
- Response 401: `{ error: "invalid_credentials" }` (constant-time bcrypt compare, same error for unknown email vs wrong password)

### `POST /api/auth/logout`
- Clears session cookie. Always 204.

### `GET /api/auth/me`
- Response 200 if signed in: `{ parent: { id, email } }`
- Response 401 if not.

### `GET /api/children`
- Response 200: `{ children: [{ id, display_name, birth_year }] }`

### `POST /api/children`
- Body: `{ display_name, birth_year }`
- Response 201: `{ child: {...} }`

### `POST /api/runs`
- Body: `{ child_id, payload }`
- Response 201: `{ run: { id, taken_at } }`

### `GET /api/runs?child_id=…`
- Response 200: `{ runs: [{ id, taken_at, summary }] }` where summary is a derived high-level summary, full payload fetched on demand.

### `GET /api/runs/:id`
- Response 200: full run.

### `DELETE /api/runs/:id`
- Response 204.

### `DELETE /api/parents/me`
- Cascade-deletes children + runs. Confirms with `{ confirm_email: string }` matching the signed-in email.

## 9. UX shape

- **Layout:** single-column, max-width 640px on mobile, 720px on desktop. Center-justified. Big touch targets (44px minimum).
- **Typography:** Inter via system-ui fallback. Body 18px, headings up to 32px. Generous line-height (1.6).
- **Color:** soft pastel palette with strong contrast for AA compliance. Primary accent purple `#7c3aed`, success `#16a34a`, gentle warning `#f59e0b` (never red for results).
- **Audio narration:** every question and every result paragraph has a "Read aloud" button (Web Speech API). Mirrors the Spelling project's affordance.
- **Microcopy:** encouraging only. "Nice work!" between modules. No grading language.
- **Progress bar:** persistent at top, 4 segments (Preferences / Screening / Strengths / Results).
- **Break button:** "I need a break" pauses the session, saves state, shows a calm screen with a "Pick up where I left off" button.
- **Confetti:** triggered at results page reveal.

## 10. Error handling

| Failure mode | UX response |
| --- | --- |
| Network error mid-quiz | Local state preserved in `sessionStorage`. User sees inline "Your answers are safe — they live on this device." |
| DB unavailable | Results still render locally. "Save to dashboard" button disabled with tooltip. |
| Auth failure on save | Toast: "Your session expired. Sign in again to save." Results still downloadable as PDF. |
| Mid-quiz refresh | On `/explore/*` load, check `sessionStorage` and offer "Resume / Start over." |
| Invalid payload at API | 400 with `{ error: "validation_failed", details: [...] }`. UI shows a generic friendly message; details go to console only. |
| Catastrophic JS error | Top-level error boundary catches, shows "Something went wrong. Your answers are safe on this device — you can download what you have so far." |

## 11. Security / privacy

| Concern | Mitigation |
| --- | --- |
| Password storage | `bcryptjs` cost 12. |
| Session | JWT signed with `JWT_SECRET` (≥32 chars), httpOnly + Secure + SameSite=Strict cookie, 7-day expiry, refreshed on every authenticated request. |
| SQL injection | Drizzle parameterized queries throughout. |
| XSS | Svelte's default escaping; no `{@html}` anywhere except a single sanitized resource-blurb component. |
| CSRF | SameSite=Strict cookie + same-origin fetch. (No third-party form posts.) |
| Brute force | Rate-limit `/api/auth/login` to 5 attempts per IP per 15 minutes via in-memory token bucket per lambda instance. Acknowledged limitation: a serverless cold start resets the bucket; for a family-scale app this is acceptable in v1, with an upgrade path to Vercel KV documented in the README. |
| PII surface | Only email + child first-name + birth-year. No DOB, last name, school, address. |
| Encryption at rest | Vercel Postgres provides TDE. No app-layer crypto in v1. |
| Account deletion | `/parent/privacy` exposes a delete-account button that cascades children + runs. |
| Disclaimers | On every screen showing interpretation language. |
| Logging | No PII in logs. Errors logged with parent_id hashed. |

## 12. Testing strategy

### Unit tests (Vitest)
- `lib/scoring/preferences.test.ts` — preferences percentage math, edge cases (zero answers, all multi-select, single mode dominance).
- `lib/scoring/screening.test.ts` — flag-level boundaries, reverse-scoring, parent-bias guard.
- `lib/scoring/decision-tree.test.ts` — every branch covered with JSON fixture inputs.
- `lib/auth/password.test.ts` — bcrypt round-trip.
- `lib/auth/jwt.test.ts` — sign/verify round-trip, tampered token rejected, expired token rejected.
- `lib/schemas/*.test.ts` — happy path + each validation failure per schema.

### Component tests (Vitest + @testing-library/svelte)
- `QuestionScenario.svelte` — renders options, advances on selection, multi-select where applicable.
- `QuestionFrequency.svelte` — 5-point scale, keyboard navigation.
- `ResultsChart.svelte` — renders SVG bars matching score input.
- `AudioButton.svelte` — speech API call mocked, button state changes.

### E2E tests (Playwright)
1. **Kid happy path:** welcome → all 3 modules → results → PDF download. Asserts the PDF file is created and non-empty.
2. **Resume flow:** answer 5 questions, reload, see "resume" prompt, continue and finish.
3. **Parent sign-up + save run:** sign up → complete a run → save → log out → log in → run appears in dashboard.
4. **Delete account:** sign up → delete account → confirm tables show 0 rows (asserted via API check).
5. **Accessibility:** `@axe-core/playwright` on `/`, `/explore/preferences`, `/explore/results`, `/parent/dashboard`. Zero AA violations allowed.

### Deployed smoke test
After Vercel deploy: a Playwright smoke against the live URL covering the kid happy path and the auth save flow.

## 13. Out of scope (YAGNI for v1)

- Email verification / password reset email
- Multi-tenant family sharing or co-parent access
- Comparison charts across multiple children
- I18n / multi-language
- Analytics / telemetry
- Mobile native app
- "Share with teacher" feature
- Adaptive question logic (questions don't branch based on prior answers in v1)

## 14. File layout

```
helena-learner-profile/
├── docs/superpowers/specs/2026-05-25-helena-learner-profile-design.md
├── docs/superpowers/plans/2026-05-25-helena-learner-profile-plan.md
├── package.json
├── svelte.config.js
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── drizzle.config.ts
├── .env.example
├── .gitignore
├── README.md
├── src/
│   ├── app.css
│   ├── app.html
│   ├── hooks.server.ts            # auth middleware
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── password.ts
│   │   │   ├── jwt.ts
│   │   │   └── session.ts
│   │   ├── db/
│   │   │   ├── index.ts
│   │   │   └── schema.ts
│   │   ├── schemas/
│   │   │   ├── auth.ts
│   │   │   ├── runs.ts
│   │   │   └── children.ts
│   │   ├── scoring/
│   │   │   ├── preferences.ts
│   │   │   ├── screening.ts
│   │   │   ├── strengths.ts
│   │   │   └── decision-tree.ts
│   │   ├── data/
│   │   │   ├── preferences-items.ts
│   │   │   ├── screening-items.ts
│   │   │   ├── strengths-items.ts
│   │   │   └── resources.ts
│   │   ├── components/
│   │   │   ├── QuestionScenario.svelte
│   │   │   ├── QuestionFrequency.svelte
│   │   │   ├── QuestionLikert.svelte
│   │   │   ├── ResultsChart.svelte
│   │   │   ├── AudioButton.svelte
│   │   │   ├── Disclaimer.svelte
│   │   │   ├── ProgressBar.svelte
│   │   │   └── BreakButton.svelte
│   │   └── pdf/export.ts
│   └── routes/
│       ├── +layout.svelte
│       ├── +page.svelte                 # /  Welcome
│       ├── explore/
│       │   ├── +layout.svelte
│       │   ├── preferences/+page.svelte
│       │   ├── screening/+page.svelte
│       │   ├── strengths/+page.svelte
│       │   └── results/+page.svelte
│       ├── resources/+page.svelte
│       ├── parent/
│       │   ├── login/+page.svelte
│       │   ├── signup/+page.svelte
│       │   ├── dashboard/+page.svelte
│       │   └── privacy/+page.svelte
│       └── api/
│           ├── auth/
│           │   ├── signup/+server.ts
│           │   ├── login/+server.ts
│           │   ├── logout/+server.ts
│           │   └── me/+server.ts
│           ├── children/+server.ts
│           ├── runs/+server.ts
│           ├── runs/[id]/+server.ts
│           └── parents/me/+server.ts
└── tests/
    ├── e2e/
    │   ├── kid-flow.spec.ts
    │   ├── resume-flow.spec.ts
    │   ├── parent-save.spec.ts
    │   └── a11y.spec.ts
    └── fixtures/
        └── runs.json
```

## 15. Environment variables

```
DATABASE_URL=postgres://...           # Vercel Postgres
JWT_SECRET=<32+ random chars>         # generated at deploy time
APP_VERSION=0.1.0                      # echoed into runs.app_version
PUBLIC_APP_URL=https://...            # for PDF link backs
```

## 16. Deployment

1. Push to `github.com/dhasakgbb/helena-learner-profile` (main branch).
2. Vercel project linked via Vercel MCP.
3. Provision Vercel Postgres via MCP.
4. Set `JWT_SECRET`, `APP_VERSION`, `PUBLIC_APP_URL` env vars.
5. Run `drizzle-kit push` against the prod DB (one-time, manual).
6. First deploy. Smoke test via Chrome MCP.

## 17. Acceptance criteria

This spec is met when:

- All unit tests pass (`pnpm test:run`).
- All e2e tests pass against local preview (`pnpm test:e2e`).
- Zero AA accessibility violations on the four key routes.
- Live URL on Vercel reachable and completing the kid happy path end-to-end.
- Live URL completing the parent sign-up → save → dashboard flow.
- A parent can delete their account and all dependent data is removed.
- The disclaimer appears on the welcome screen and every results screen.
- The repo is public on GitHub with a complete README explaining usage and limitations.
