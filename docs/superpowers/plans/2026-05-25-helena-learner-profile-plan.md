# Helena's Learner Profile — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a child-friendly web app that explores a 10-year-old's learning preferences, screens for common learning challenges, and offers a parent dashboard with saved runs — full system in one repo, deployed to Vercel.

**Architecture:** SvelteKit 2 (Svelte 5 runes) single-app on Vercel. UI + API routes + Drizzle ORM → Vercel Postgres (Neon). Client-side scoring; server only persists for signed-in parents. Custom bcrypt+JWT auth in httpOnly cookies. Client-side PDF export via pdf-lib.

**Tech Stack:** SvelteKit 2, Svelte 5, TypeScript strict, Tailwind v4, Drizzle ORM, Vercel Postgres, bcryptjs, jose (JWT), pdf-lib, canvas-confetti, zod, Vitest, @testing-library/svelte, Playwright, @axe-core/playwright.

**Repo:** `github.com/dhasakgbb/helena-learner-profile`
**Working directory:** `/Users/damian/GitHub/Helena/helena-learner-profile`

---

## Phase 0 — Scaffold (5 tasks)

### Task 0.1: Create SvelteKit project

**Files:**
- Create: `/Users/damian/GitHub/Helena/helena-learner-profile/` (whole repo)

- [ ] **Step 1:** `cd /Users/damian/GitHub/Helena && npx sv@latest create helena-learner-profile --template minimal --types ts --no-add-ons --install npm` (run non-interactively where possible; if interactive, choose minimal + TS strict + ESLint + Prettier + Vitest + Playwright).
- [ ] **Step 2:** Verify `cd helena-learner-profile && npm run check` exits clean.
- [ ] **Step 3:** Commit: `feat: scaffold SvelteKit project`.

### Task 0.2: Install runtime + dev deps

- [ ] **Step 1:** Install runtime deps:
```bash
npm i @sveltejs/adapter-vercel drizzle-orm @vercel/postgres bcryptjs jose zod pdf-lib canvas-confetti
```
- [ ] **Step 2:** Install dev deps:
```bash
npm i -D drizzle-kit @types/bcryptjs @types/canvas-confetti @axe-core/playwright @testing-library/svelte @testing-library/jest-dom @testing-library/user-event jsdom tailwindcss @tailwindcss/vite postgres
```
- [ ] **Step 3:** Commit: `chore: install dependencies`.

### Task 0.3: Configure adapter, Tailwind, paths

**Files:**
- Modify: `svelte.config.js`, `vite.config.ts`, `src/app.html`, `src/app.css`

- [ ] **Step 1:** Edit `svelte.config.js` — swap `adapter-auto` for `@sveltejs/adapter-vercel`.
- [ ] **Step 2:** Edit `vite.config.ts` — add `@tailwindcss/vite` plugin.
- [ ] **Step 3:** Create `src/app.css` with `@import "tailwindcss";` and theme tokens (purple primary, soft pastels, Inter font, AA-contrast).
- [ ] **Step 4:** Import `app.css` in `src/routes/+layout.svelte`.
- [ ] **Step 5:** Run `npm run dev` and confirm a styled blank page renders.
- [ ] **Step 6:** Commit: `chore: configure Vercel adapter + Tailwind`.

### Task 0.4: Configure Vitest + Playwright + tsconfig strict

**Files:**
- Modify: `vite.config.ts`, `tsconfig.json`, `playwright.config.ts`, `package.json`

- [ ] **Step 1:** Add `test` block to `vite.config.ts`: jsdom env, globals, setupFiles `./tests/setup.ts`.
- [ ] **Step 2:** Create `tests/setup.ts` with `@testing-library/jest-dom` import.
- [ ] **Step 3:** Set `tsconfig.json` `strict: true`, `noUncheckedIndexedAccess: true`.
- [ ] **Step 4:** Create `playwright.config.ts` (use baseURL from env, two projects: local + deployed).
- [ ] **Step 5:** Add npm scripts: `test`, `test:run`, `test:e2e`, `check`, `lint`, `format`.
- [ ] **Step 6:** Commit: `chore: wire up vitest, playwright, strict TS`.

### Task 0.5: Initial README + .env.example + .gitignore

**Files:**
- Create: `README.md`, `.env.example`

- [ ] **Step 1:** Write `README.md` covering: what this is, what it is not, run/build/test/deploy.
- [ ] **Step 2:** Write `.env.example` with `DATABASE_URL`, `JWT_SECRET`, `APP_VERSION`, `PUBLIC_APP_URL`.
- [ ] **Step 3:** Confirm `.gitignore` includes `.env`, `.svelte-kit/`, `node_modules/`, `dist/`.
- [ ] **Step 4:** Commit: `docs: README + env example`.

---

## Phase 1 — Domain model + scoring (TDD, no UI) (7 tasks)

### Task 1.1: Type definitions for question items

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Step 1:** Define:
```ts
export type PrefMode = "visual" | "auditory" | "read_write" | "kinesthetic";
export type Domain = "reading" | "writing" | "math" | "attention";
export type FrequencyAnswer = 0 | 1 | 2 | 3 | 4; // Never..Almost Always
export type LikertAnswer = 0 | 1 | 2; // Not really / Sometimes / Sounds like me
export type FlagLevel = "low" | "medium" | "high";

export type PreferencesItem = {
  id: string;
  prompt: string;
  options: { tag: PrefMode; text: string }[];
  multiSelect: boolean;
};

export type ScreeningItem = {
  id: string;
  domain: Domain;
  kidPrompt: string;
  parentPrompt: string;
};

export type StrengthsItem = { id: string; prompt: string };

export type PreferencesAnswer = { itemId: string; selectedTags: PrefMode[] };
export type ScreeningAnswer = { itemId: string; kid: FrequencyAnswer | null; parent: FrequencyAnswer | null };
export type StrengthsAnswer = { itemId: string; value: LikertAnswer };

export type RunPayload = {
  app_version: string;
  taken_at: string;
  preferences: PreferencesAnswer[];
  screening: ScreeningAnswer[];
  strengths: StrengthsAnswer[];
  scores: {
    preferences: Record<PrefMode, number>;
    screening: Record<Domain, { level: FlagLevel; needs_corroboration: boolean; raw: number }>;
    strengths_spotlight: string[];
    plan: "strengths" | "monitor" | "schedule";
  };
};
```
- [ ] **Step 2:** Commit: `feat(types): domain types for assessment`.

### Task 1.2: Preferences scoring (TDD)

**Files:**
- Create: `src/lib/scoring/preferences.ts`, `src/lib/scoring/preferences.test.ts`

- [ ] **Step 1:** Write failing test:
```ts
import { describe, it, expect } from "vitest";
import { scorePreferences } from "./preferences";

describe("scorePreferences", () => {
  it("returns 0s when no answers", () => {
    expect(scorePreferences([])).toEqual({ visual: 0, auditory: 0, read_write: 0, kinesthetic: 0 });
  });
  it("returns 100% for single-mode answers", () => {
    const result = scorePreferences([{ itemId: "p1", selectedTags: ["visual"] }]);
    expect(result.visual).toBe(100);
    expect(result.auditory).toBe(0);
  });
  it("splits percentages by tag-count across all answers", () => {
    const result = scorePreferences([
      { itemId: "p1", selectedTags: ["visual"] },
      { itemId: "p2", selectedTags: ["visual", "kinesthetic"] },
    ]);
    expect(result.visual).toBe(67); // 2 of 3 tags
    expect(result.kinesthetic).toBe(33);
  });
  it("rounds to integers and sums to 100 when any tags exist", () => {
    const result = scorePreferences([
      { itemId: "p1", selectedTags: ["visual"] },
      { itemId: "p2", selectedTags: ["auditory"] },
      { itemId: "p3", selectedTags: ["read_write"] },
    ]);
    const sum = result.visual + result.auditory + result.read_write + result.kinesthetic;
    expect(sum).toBeGreaterThanOrEqual(99);
    expect(sum).toBeLessThanOrEqual(100);
  });
});
```
- [ ] **Step 2:** Verify it fails: `npm run test:run -- preferences`.
- [ ] **Step 3:** Implement:
```ts
import type { PreferencesAnswer, PrefMode } from "$lib/types";

export function scorePreferences(answers: PreferencesAnswer[]): Record<PrefMode, number> {
  const counts: Record<PrefMode, number> = { visual: 0, auditory: 0, read_write: 0, kinesthetic: 0 };
  let total = 0;
  for (const a of answers) for (const t of a.selectedTags) { counts[t]++; total++; }
  if (total === 0) return counts;
  const result: Record<PrefMode, number> = { visual: 0, auditory: 0, read_write: 0, kinesthetic: 0 };
  for (const k of Object.keys(counts) as PrefMode[]) result[k] = Math.round((counts[k] / total) * 100);
  return result;
}
```
- [ ] **Step 4:** `npm run test:run -- preferences` → all pass.
- [ ] **Step 5:** Commit: `feat(scoring): preferences percentage with tests`.

### Task 1.3: Screening scoring (TDD)

**Files:**
- Create: `src/lib/scoring/screening.ts`, `src/lib/scoring/screening.test.ts`

- [ ] **Step 1:** Write failing tests covering: (a) all-zero kid + no parent → level low, no corroboration flag; (b) high kid + matching parent → keep high; (c) high kid + low parent → downgrade to medium; (d) medium kid + no parent → keep medium, set needs_corroboration true; (e) reverse: each domain isolated.
- [ ] **Step 2:** Implement `scoreScreening(items: ScreeningItem[], answers: ScreeningAnswer[]): Record<Domain, {...}>`:
  - Sum kid frequency per domain.
  - Raw level: 0–4 low, 5–8 medium, 9–12 high.
  - If any parent answer in domain present → set `parent_completed = true` for that domain.
  - If parent_completed and level ∈ {medium, high}: keep only if any parent ≥ 3 (Often); else downgrade one band.
  - If !parent_completed → set `needs_corroboration: true`.
- [ ] **Step 3:** Tests pass.
- [ ] **Step 4:** Commit: `feat(scoring): screening with parent-corroboration rule`.

### Task 1.4: Strengths scoring (TDD)

**Files:**
- Create: `src/lib/scoring/strengths.ts`, `src/lib/scoring/strengths.test.ts`

- [ ] **Step 1:** Failing test: returns list of item IDs whose value === 2 (Sounds like me).
- [ ] **Step 2:** Implement `scoreStrengths(answers: StrengthsAnswer[]): string[]`.
- [ ] **Step 3:** Tests pass.
- [ ] **Step 4:** Commit.

### Task 1.5: Decision tree (TDD)

**Files:**
- Create: `src/lib/scoring/decision-tree.ts`, `src/lib/scoring/decision-tree.test.ts`

- [ ] **Step 1:** Failing tests for all three branches plus mixed inputs.
- [ ] **Step 2:** Implement:
```ts
import type { Domain, FlagLevel } from "$lib/types";

export function pickPlan(
  flags: Record<Domain, FlagLevel>
): "strengths" | "monitor" | "schedule" {
  const high = Object.values(flags).filter(f => f === "high").length;
  const medium = Object.values(flags).filter(f => f === "medium").length;
  if (high >= 1) return "schedule";
  if (medium >= 2) return "schedule";
  if (medium === 1) return "monitor";
  return "strengths";
}
```
- [ ] **Step 3:** Commit: `feat(scoring): decision tree`.

### Task 1.6: Run aggregator (TDD)

**Files:**
- Create: `src/lib/scoring/build-run.ts`, `src/lib/scoring/build-run.test.ts`

- [ ] **Step 1:** Failing test producing a full `RunPayload` from raw answers.
- [ ] **Step 2:** Implement `buildRun(...)` calling each scorer and assembling the payload.
- [ ] **Step 3:** Commit.

### Task 1.7: Zod schemas

**Files:**
- Create: `src/lib/schemas/auth.ts`, `src/lib/schemas/children.ts`, `src/lib/schemas/runs.ts`

- [ ] **Step 1:** Define zod schemas matching the API contracts in spec §8.
- [ ] **Step 2:** Add a few quick unit tests confirming schemas reject obvious bad input.
- [ ] **Step 3:** Commit: `feat(schemas): zod request/response shapes`.

---

## Phase 2 — Question banks (3 tasks)

### Task 2.1: Preferences items (10 scenarios)

**Files:**
- Create: `src/lib/data/preferences-items.ts`

- [ ] **Step 1:** Write the 10 scenarios as `PreferencesItem[]`. 7 single-select, 3 multi-select. Each scenario maps to all four VARK tags. Kid-friendly language, 5th-grade reading level.
- [ ] **Step 2:** Add a smoke test asserting 10 items, each with 4 distinct tag options.
- [ ] **Step 3:** Commit.

### Task 2.2: Screening items (12 across 4 domains)

**Files:**
- Create: `src/lib/data/screening-items.ts`

- [ ] **Step 1:** Write 3 items per domain (Reading, Writing, Math, Attention). Each item has `kidPrompt` (first person, "I…") and `parentPrompt` (third person, "She…").
- [ ] **Step 2:** Smoke test: 12 items, 3 per domain.
- [ ] **Step 3:** Commit.

### Task 2.3: Strengths items + resource cards

**Files:**
- Create: `src/lib/data/strengths-items.ts`, `src/lib/data/resources.ts`

- [ ] **Step 1:** 6 strengths items (kid first-person positives).
- [ ] **Step 2:** Resource cards for UDL: per preference (4) + per domain (4) + general "when to seek help" links to IDA, Understood, CDC.
- [ ] **Step 3:** Commit.

---

## Phase 3 — DB + auth (server) (8 tasks)

### Task 3.1: Drizzle schema

**Files:**
- Create: `drizzle.config.ts`, `src/lib/db/schema.ts`, `src/lib/db/index.ts`

- [ ] **Step 1:** Define `parents`, `children`, `runs` tables per spec §7.
- [ ] **Step 2:** Set up Drizzle client connecting via `@vercel/postgres`.
- [ ] **Step 3:** Commit.

### Task 3.2: Password hashing utilities (TDD)

**Files:**
- Create: `src/lib/auth/password.ts`, `src/lib/auth/password.test.ts`

- [ ] **Step 1:** Failing test: hash then verify round-trip; wrong password rejected.
- [ ] **Step 2:** Implement `hashPassword` / `verifyPassword` with `bcryptjs` cost 12.
- [ ] **Step 3:** Commit.

### Task 3.3: JWT utilities (TDD)

**Files:**
- Create: `src/lib/auth/jwt.ts`, `src/lib/auth/jwt.test.ts`

- [ ] **Step 1:** Failing test: sign + verify round-trip; tampered token rejected; expired token rejected.
- [ ] **Step 2:** Implement using `jose` (HS256, 7d expiry, sub=parent_id).
- [ ] **Step 3:** Commit.

### Task 3.4: Session middleware

**Files:**
- Create: `src/hooks.server.ts`, `src/lib/auth/session.ts`, `src/app.d.ts`

- [ ] **Step 1:** Implement `handle` that reads `session` cookie, verifies JWT, attaches `event.locals.parent`.
- [ ] **Step 2:** Provide `requireParent(event)` helper that 401s if not signed in.
- [ ] **Step 3:** Declare `Locals` type in `app.d.ts`.
- [ ] **Step 4:** Commit.

### Task 3.5: Rate limiter

**Files:**
- Create: `src/lib/auth/rate-limit.ts`, `src/lib/auth/rate-limit.test.ts`

- [ ] **Step 1:** Failing test: 5 attempts allowed, 6th blocked, window expires after 15 min.
- [ ] **Step 2:** Implement in-memory token bucket keyed by IP.
- [ ] **Step 3:** Commit.

### Task 3.6: Signup endpoint

**Files:**
- Create: `src/routes/api/auth/signup/+server.ts`

- [ ] **Step 1:** POST handler — parse with zod, check uniqueness, hash password, insert parent, sign JWT, set cookie, return 201.
- [ ] **Step 2:** 409 on duplicate email.
- [ ] **Step 3:** Commit.

### Task 3.7: Login + logout + me endpoints

**Files:**
- Create: `src/routes/api/auth/login/+server.ts`, `src/routes/api/auth/logout/+server.ts`, `src/routes/api/auth/me/+server.ts`

- [ ] **Step 1:** Login: zod, rate-limit, lookup, verify, JWT, cookie, 401 on fail.
- [ ] **Step 2:** Logout: clear cookie, 204.
- [ ] **Step 3:** Me: read locals.parent, 200 or 401.
- [ ] **Step 4:** Commit.

### Task 3.8: Children + runs + delete-me endpoints

**Files:**
- Create: `src/routes/api/children/+server.ts`, `src/routes/api/runs/+server.ts`, `src/routes/api/runs/[id]/+server.ts`, `src/routes/api/parents/me/+server.ts`

- [ ] **Step 1:** Children GET/POST.
- [ ] **Step 2:** Runs GET (list summary), POST (save), [id] GET (full)/DELETE.
- [ ] **Step 3:** Parents me DELETE (cascade).
- [ ] **Step 4:** Commit.

---

## Phase 4 — UI primitives (6 tasks)

### Task 4.1: Disclaimer component

**Files:**
- Create: `src/lib/components/Disclaimer.svelte`

- [ ] **Step 1:** A clearly-styled banner with two variants: `compact` (single-line, every screen) and `full` (welcome + results). Reads disclaimer text; accepts a `variant` prop.
- [ ] **Step 2:** Commit.

### Task 4.2: ProgressBar component

**Files:**
- Create: `src/lib/components/ProgressBar.svelte`

- [ ] **Step 1:** 4-segment bar (Preferences / Screening / Strengths / Results). Accepts `current` prop 0–3 and `completed` set.
- [ ] **Step 2:** Commit.

### Task 4.3: AudioButton component (Web Speech API)

**Files:**
- Create: `src/lib/components/AudioButton.svelte`

- [ ] **Step 1:** Button that toggles `speechSynthesis.speak(new SpeechSynthesisUtterance(text))`. Pauses if active. Falls back gracefully when API unavailable (button hidden).
- [ ] **Step 2:** Add `data-testid` for testing.
- [ ] **Step 3:** Commit.

### Task 4.4: QuestionScenario component

**Files:**
- Create: `src/lib/components/QuestionScenario.svelte`

- [ ] **Step 1:** Renders a `PreferencesItem`, supports single + multi-select, emits `change` with array of `selectedTags`. Audio button on the prompt. Keyboard-accessible (radio for single, checkbox for multi).
- [ ] **Step 2:** Add basic component test (renders, click, emits).
- [ ] **Step 3:** Commit.

### Task 4.5: QuestionFrequency + QuestionLikert + ResultsChart

**Files:**
- Create: `src/lib/components/QuestionFrequency.svelte`, `src/lib/components/QuestionLikert.svelte`, `src/lib/components/ResultsChart.svelte`

- [ ] **Step 1:** QuestionFrequency: 5-radio + parent toggle, emits both kid+parent.
- [ ] **Step 2:** QuestionLikert: 3-radio.
- [ ] **Step 3:** ResultsChart: SVG bar chart accepting `Record<string, number>`; renders 4 bars with labels.
- [ ] **Step 4:** Component tests for each.
- [ ] **Step 5:** Commit.

### Task 4.6: BreakButton + DisclaimerAck

**Files:**
- Create: `src/lib/components/BreakButton.svelte`, `src/lib/components/DisclaimerAck.svelte`

- [ ] **Step 1:** BreakButton: opens a calm modal "Take your time" with a Resume button.
- [ ] **Step 2:** DisclaimerAck: required checkbox + label, emits `accepted`.
- [ ] **Step 3:** Commit.

---

## Phase 5 — Kid-facing routes (5 tasks)

### Task 5.1: Welcome page (`/`)

**Files:**
- Create: `src/routes/+page.svelte`

- [ ] **Step 1:** Welcome copy, disclaimer + ack checkbox, "Start exploring" button (disabled until ack), small "Parent? Sign in" link.
- [ ] **Step 2:** Commit.

### Task 5.2: Layout for `/explore` (shared progress bar, break button, session storage)

**Files:**
- Create: `src/routes/explore/+layout.svelte`, `src/lib/state/explore.svelte.ts`

- [ ] **Step 1:** `explore.svelte.ts` exposes a `$state` rune store holding answers; persists to `sessionStorage` on every change; restores on mount.
- [ ] **Step 2:** Layout renders ProgressBar + BreakButton + slot.
- [ ] **Step 3:** Commit.

### Task 5.3: Preferences page

**Files:**
- Create: `src/routes/explore/preferences/+page.svelte`

- [ ] **Step 1:** Iterate items, render QuestionScenario each, "Next" advances; final "Continue" → `/explore/screening`.
- [ ] **Step 2:** Commit.

### Task 5.4: Screening + Strengths pages

**Files:**
- Create: `src/routes/explore/screening/+page.svelte`, `src/routes/explore/strengths/+page.svelte`

- [ ] **Step 1:** Screening: kid/parent toggle, QuestionFrequency per item, advance to strengths.
- [ ] **Step 2:** Strengths: QuestionLikert × 6 → results.
- [ ] **Step 3:** Commit.

### Task 5.5: Results page + Resources page

**Files:**
- Create: `src/routes/explore/results/+page.svelte`, `src/routes/resources/+page.svelte`, `src/lib/pdf/export.ts`

- [ ] **Step 1:** Results: build run via `buildRun()`, render preferences chart, strengths spotlight, Learning Menu (next-step card based on plan), parent toggle (visible if signed-in or chosen on welcome) showing flagged areas, "Download PDF", "Save to dashboard" (if signed-in), confetti on mount.
- [ ] **Step 2:** `pdf/export.ts` uses pdf-lib to compose a 1-page summary; downloaded via blob URL.
- [ ] **Step 3:** Resources page: render resource cards grouped by preference and by domain.
- [ ] **Step 4:** Commit.

---

## Phase 6 — Parent routes (4 tasks)

### Task 6.1: Signup page

**Files:**
- Create: `src/routes/parent/signup/+page.svelte`

- [ ] **Step 1:** Email + password form, posts to `/api/auth/signup`, redirects to dashboard on 201.
- [ ] **Step 2:** Inline error rendering for 409 and validation.
- [ ] **Step 3:** Commit.

### Task 6.2: Login page

**Files:**
- Create: `src/routes/parent/login/+page.svelte`

- [ ] **Step 1:** Email + password form, posts to `/api/auth/login`, redirects on 200.
- [ ] **Step 2:** Commit.

### Task 6.3: Dashboard page

**Files:**
- Create: `src/routes/parent/dashboard/+page.svelte`, `src/routes/parent/dashboard/+page.server.ts`

- [ ] **Step 1:** Server load: list children + their runs (summary).
- [ ] **Step 2:** UI: child cards with run history (date + plan tier). Click a run → modal with full details.
- [ ] **Step 3:** "Add child" form.
- [ ] **Step 4:** Logout button.
- [ ] **Step 5:** Commit.

### Task 6.4: Privacy page (delete account)

**Files:**
- Create: `src/routes/parent/privacy/+page.svelte`

- [ ] **Step 1:** Plain-language explanation of what's stored.
- [ ] **Step 2:** "Delete my account" button requiring email re-entry → POST `/api/parents/me` DELETE.
- [ ] **Step 3:** Commit.

---

## Phase 7 — E2E tests + a11y (3 tasks)

### Task 7.1: Kid happy path e2e

**Files:**
- Create: `tests/e2e/kid-flow.spec.ts`

- [ ] **Step 1:** Playwright test: visit `/`, ack disclaimer, click Start, answer all preference items (click first option each), all screening items (Never each), all strengths items (Sounds like me each), arrive at results, assert chart visible + Learning Menu visible.
- [ ] **Step 2:** Click "Download PDF" — assert download event fires with non-empty file.
- [ ] **Step 3:** Commit.

### Task 7.2: Parent save + resume + delete e2e

**Files:**
- Create: `tests/e2e/parent-save.spec.ts`, `tests/e2e/resume-flow.spec.ts`

- [ ] **Step 1:** Parent save: sign up with random email, complete kid flow, save run, log out, log in, see run in dashboard, delete account, attempt login fails.
- [ ] **Step 2:** Resume: answer 3 preferences, reload, assert resume prompt, choose resume, finish without re-answering.
- [ ] **Step 3:** Commit.

### Task 7.3: A11y e2e (axe scan)

**Files:**
- Create: `tests/e2e/a11y.spec.ts`

- [ ] **Step 1:** For each of `/`, `/explore/preferences`, `/explore/results`, `/parent/dashboard`, `/parent/privacy`, run axe via `@axe-core/playwright`. Fail on any AA violation.
- [ ] **Step 2:** Where violations surface, fix at the component level rather than suppressing the test.
- [ ] **Step 3:** Commit.

---

## Phase 8 — Deploy (3 tasks)

### Task 8.1: Push to GitHub

- [ ] **Step 1:** `gh repo create dhasakgbb/helena-learner-profile --public --source=. --remote=origin --description "Helena's Learner Profile — informal learning exploration tool for a 10-year-old"`.
- [ ] **Step 2:** `git push -u origin main`.
- [ ] **Step 3:** Confirm repo visible at `https://github.com/dhasakgbb/helena-learner-profile`.

### Task 8.2: Provision Vercel project + Postgres

- [ ] **Step 1:** Use Vercel MCP to create a project linked to the GitHub repo.
- [ ] **Step 2:** Provision Vercel Postgres (Neon-backed), capture `DATABASE_URL`.
- [ ] **Step 3:** Set env vars in the project: `DATABASE_URL`, `JWT_SECRET` (generate 32-byte random), `APP_VERSION=0.1.0`, `PUBLIC_APP_URL=https://<vercel-url>`.
- [ ] **Step 4:** Run `npx drizzle-kit push` locally against the provisioned DB to apply schema.
- [ ] **Step 5:** Trigger production deploy.

### Task 8.3: Smoke-test live URL

- [ ] **Step 1:** Use Chrome MCP (or claude-in-chrome) to visit the live URL.
- [ ] **Step 2:** Drive the kid happy path manually. Capture a screenshot of results.
- [ ] **Step 3:** Sign up a parent test account, save a run, verify dashboard shows it.
- [ ] **Step 4:** Delete the test account.
- [ ] **Step 5:** Report URL + screenshot to user.

---

## Self-review checklist

After completing all phases, the assistant verifies:

- [ ] **Spec coverage:** every section in the spec maps to at least one task.
  - §1 Purpose → addressed via copy in 5.1, 5.5.
  - §2 Ethics → 4.1 Disclaimer, copy reviewed in 5.1/5.5/6.1.
  - §3 Architecture → 0.1–0.3 scaffold + 3.x server + 5.x/6.x UI.
  - §4 Tech stack → 0.2 install.
  - §5.1 Preferences → 1.2 + 2.1 + 5.3.
  - §5.2 Screening → 1.3 + 2.2 + 5.4.
  - §5.3 Strengths → 1.4 + 2.3 + 5.4.
  - §5.4 Interpretation → 1.5 + 5.5 + 2.3 (resources).
  - §6 Data flow → 5.2 + 5.5 (client-side scoring + save).
  - §7 Data model → 3.1.
  - §8 API → 3.6–3.8.
  - §9 UX → Phase 4 components + Tailwind in 0.3.
  - §10 Error handling → 5.5 (DB unavail), 3.4 (auth), 5.2 (resume).
  - §11 Security → 3.2, 3.3, 3.4, 3.5, 6.4.
  - §12 Testing → 1.x (unit), 4.4/4.5 (component), Phase 7 (e2e + a11y).
  - §13 YAGNI → no out-of-scope tasks present.
  - §14 File layout → matches Phase 3–7 paths.
  - §15 Env → 0.5 (example) + 8.2 (set in Vercel).
  - §16 Deploy → Phase 8.
  - §17 Acceptance → Phase 7 + 8.3 verifies live.
- [ ] **No placeholders.**
- [ ] **Type names consistent across tasks** (e.g. `PreferencesAnswer.selectedTags` used identically in 1.1, 1.2, 4.4, 5.3).

If gaps surface, add tasks inline before execution.
