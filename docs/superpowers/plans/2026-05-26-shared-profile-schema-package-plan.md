# Shared profile-schema Package — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the canonical Helena profile schema (currently duplicated across four repos) into one published npm package consumed by all four, eliminating drift permanently.

**Architecture:** New package at `/Users/damian/GitHub/Helena/profile-schema` (sibling to the four existing repos). Built with `tsup` to produce ESM + CJS + IIFE artifacts. TypeScript Svelte apps consume via `npm install`. Vanilla JS apps consume via `<script src=cdn.jsdelivr.net/...>` and read from `window.HelenaProfile`. Migration is sequenced (package → producer → spelling → states → math) and verified with a drift smoke test at the end.

**Tech Stack:** TypeScript 5+, zod 3+, tsup 8+, vitest 1+, Node 20+, npm. Distribution via npm + jsDelivr CDN. GitHub Actions for release-on-tag.

**Spec:** `/Users/damian/GitHub/Helena/helena-learner-profile/docs/superpowers/specs/2026-05-26-shared-profile-schema-package-design.md`

---

## Phase 1 — Scaffold the package

### Task 1: Initialize the package repo

**Files:**
- Create: `/Users/damian/GitHub/Helena/profile-schema/.gitignore`
- Create: `/Users/damian/GitHub/Helena/profile-schema/package.json`
- Create: `/Users/damian/GitHub/Helena/profile-schema/tsconfig.json`
- Create: `/Users/damian/GitHub/Helena/profile-schema/README.md`

- [ ] **Step 1: Create the directory and init git**

```bash
mkdir -p /Users/damian/GitHub/Helena/profile-schema
cd /Users/damian/GitHub/Helena/profile-schema
git init
```

Expected: `Initialized empty Git repository in /Users/damian/GitHub/Helena/profile-schema/.git/`

- [ ] **Step 2: Write `.gitignore`**

```
node_modules/
dist/
.DS_Store
*.log
coverage/
.npmrc
```

- [ ] **Step 3: Write `package.json`**

```json
{
  "name": "profile-schema",
  "version": "0.0.0",
  "description": "Canonical learner-profile schema for the Helena platform — zod schema, helpers, fragment codec, telemetry readers. Consumed by helena-learner-profile, helena-spelling, helena-states, helena-math.",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    },
    "./iife": "./dist/index.iife.js"
  },
  "files": [
    "dist/",
    "README.md"
  ],
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run build && npm test"
  },
  "engines": {
    "node": ">=20"
  },
  "license": "UNLICENSED",
  "dependencies": {
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.4.0",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 4: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": false,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 5: Write `README.md`**

```markdown
# profile-schema

Canonical learner-profile schema for the Helena platform.

One zod schema, one place. Consumed by:

- `helena-learner-profile` (SvelteKit producer)
- `helena-spelling` (Svelte 5 SPA)
- `helena-states` (vanilla JS, via `<script>`)
- `helena-math` (vanilla JS, via `<script>`)

## Install

\`\`\`bash
npm install profile-schema
\`\`\`

## Use (TypeScript / ESM)

\`\`\`ts
import { exportedProfileSchema, type ExportedProfile } from 'profile-schema';

const result = exportedProfileSchema.safeParse(json);
if (result.success) {
  const profile: ExportedProfile = result.data;
}
\`\`\`

## Use (Vanilla JS via CDN)

\`\`\`html
<script src="https://cdn.jsdelivr.net/npm/profile-schema@1/dist/index.iife.js"></script>
<script>
  const result = window.HelenaProfile.exportedProfileSchema.safeParse(json);
</script>
\`\`\`

Note: `window.HelenaProfile` (capital H). The lowercase `window.helenaProfile` is the per-app store in vanilla consumers and is distinct.

## Public API

See `src/index.ts` for the canonical export list. Headlines:

- `PROFILE_VERSION`, `exportedProfileSchema`, `ExportedProfile`
- `topPreference`, `secondPreference`, `isProfileStale`
- `MODE_AFFINITY`, `recommendedSpellingMode`, `recommendedStatesMode`, `recommendedMathMode`
- `encodeProfileFragment`, `decodeProfileFragment`
- `readTelemetry`, `totalLaunches`, `followRate`, `modesBy`, `prettyMode`

## Versioning

SemVer. Major bumps signal schema-breaking changes; consumers update at their own cadence. `PROFILE_VERSION` (the schema's internal version field) and the package's npm version are intentionally separate concerns.
```

- [ ] **Step 6: Install deps**

Run: `cd /Users/damian/GitHub/Helena/profile-schema && npm install`
Expected: `added N packages` with no errors.

- [ ] **Step 7: Commit scaffold**

```bash
cd /Users/damian/GitHub/Helena/profile-schema
git add .gitignore package.json package-lock.json tsconfig.json README.md
git commit -m "chore: scaffold profile-schema package"
```

---

### Task 2: tsup build config

**Files:**
- Create: `/Users/damian/GitHub/Helena/profile-schema/tsup.config.ts`

- [ ] **Step 1: Write `tsup.config.ts`**

```ts
import { defineConfig } from 'tsup';

export default defineConfig([
  // ESM + CJS for TypeScript consumers (helena-learner-profile, helena-spelling).
  // zod is bundled — these consumers will pin one version this way and avoid
  // duplicate zod copies in their own builds.
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    noExternal: ['zod'],
    target: 'es2022'
  },
  // IIFE for vanilla JS consumers (helena-states, helena-math). Exposes
  // `window.HelenaProfile`. zod is bundled because vanilla apps have no
  // module system.
  {
    entry: { 'index.iife': 'src/iife-entry.ts' },
    format: ['iife'],
    globalName: 'HelenaProfile',
    sourcemap: true,
    noExternal: ['zod'],
    target: 'es2020',
    footer: {
      // tsup writes `var HelenaProfile = (() => { ... })();`
      // We want it on window for vanilla pages.
      js: 'if (typeof window !== "undefined") { window.HelenaProfile = HelenaProfile; }'
    }
  }
]);
```

- [ ] **Step 2: Commit**

```bash
git add tsup.config.ts
git commit -m "chore: tsup config for ESM + CJS + IIFE builds"
```

---

### Task 3: vitest config

**Files:**
- Create: `/Users/damian/GitHub/Helena/profile-schema/vitest.config.ts`

- [ ] **Step 1: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    globals: false
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add vitest.config.ts
git commit -m "chore: vitest config"
```

---

## Phase 2 — Schema and helpers

### Task 4: Canonical zod schema

**Files:**
- Create: `/Users/damian/GitHub/Helena/profile-schema/src/schema.ts`
- Create: `/Users/damian/GitHub/Helena/profile-schema/tests/schema.test.ts`

- [ ] **Step 1: Write the failing test first**

`tests/schema.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { exportedProfileSchema, PROFILE_VERSION, PROFILE_TTL_DAYS } from '../src/schema';

const VALID = {
  version: 1,
  generated_at: '2026-05-26T00:00:00.000Z',
  expires_at: '2026-07-25T00:00:00.000Z',
  preferences: { visual: 60, auditory: 70, read_write: 40, kinesthetic: 30 },
  flags: { reading: 'low', writing: 'low', math: 'medium', attention: 'low' },
  needs_corroboration: { reading: false, writing: false, math: true, attention: false },
  strengths: ['solves puzzles', 'remembers stories'],
  plan: 'strengths',
  module_overrides: {},
  source: 'intake_quiz'
} as const;

describe('exportedProfileSchema', () => {
  it('exports PROFILE_VERSION = 1', () => {
    expect(PROFILE_VERSION).toBe(1);
  });

  it('exports PROFILE_TTL_DAYS = 60', () => {
    expect(PROFILE_TTL_DAYS).toBe(60);
  });

  it('accepts a fully valid profile', () => {
    const r = exportedProfileSchema.safeParse(VALID);
    expect(r.success).toBe(true);
  });

  it('rejects version != 1', () => {
    const r = exportedProfileSchema.safeParse({ ...VALID, version: 2 });
    expect(r.success).toBe(false);
  });

  it('rejects preference outside 0-100', () => {
    const r = exportedProfileSchema.safeParse({
      ...VALID,
      preferences: { ...VALID.preferences, visual: 101 }
    });
    expect(r.success).toBe(false);
  });

  it('rejects unknown flag level', () => {
    const r = exportedProfileSchema.safeParse({
      ...VALID,
      flags: { ...VALID.flags, reading: 'extreme' }
    });
    expect(r.success).toBe(false);
  });

  it('rejects unknown plan', () => {
    const r = exportedProfileSchema.safeParse({ ...VALID, plan: 'bogus' });
    expect(r.success).toBe(false);
  });

  it('rejects unknown source', () => {
    const r = exportedProfileSchema.safeParse({ ...VALID, source: 'magic' });
    expect(r.success).toBe(false);
  });

  it('accepts an optional child_label', () => {
    const r = exportedProfileSchema.safeParse({ ...VALID, child_label: 'Helena' });
    expect(r.success).toBe(true);
  });

  it('rejects a child_label over 40 chars', () => {
    const r = exportedProfileSchema.safeParse({
      ...VALID,
      child_label: 'x'.repeat(41)
    });
    expect(r.success).toBe(false);
  });

  it('defaults module_overrides to {} when omitted', () => {
    const { module_overrides, ...rest } = VALID;
    const r = exportedProfileSchema.safeParse(rest);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.module_overrides).toEqual({});
  });
});
```

- [ ] **Step 2: Run the test — expect it to fail**

```bash
cd /Users/damian/GitHub/Helena/profile-schema
npx vitest run tests/schema.test.ts
```

Expected: All tests fail with "Cannot find module '../src/schema'" or similar.

- [ ] **Step 3: Write `src/schema.ts`**

```ts
import { z } from 'zod';

/** Schema version, bumped only when the contract changes in a breaking way. */
export const PROFILE_VERSION = 1 as const;

/** Profile freshness window. After this many days, isProfileStale() returns true. */
export const PROFILE_TTL_DAYS = 60;

const flagLevel = z.enum(['low', 'medium', 'high']);
const planLevel = z.enum(['strengths', 'monitor', 'schedule']);
const sourceLevel = z.enum(['intake_quiz', 'parent_edit', 'behavioral_observation']);

const isoDate = z.string().refine((s) => !Number.isNaN(Date.parse(s)), {
  message: 'must be an ISO date string'
});

const pref = z.number().min(0).max(100);

export const exportedProfileSchema = z.object({
  version: z.literal(PROFILE_VERSION),
  generated_at: isoDate,
  expires_at: isoDate,
  preferences: z.object({
    visual: pref,
    auditory: pref,
    read_write: pref,
    kinesthetic: pref
  }),
  flags: z.object({
    reading: flagLevel,
    writing: flagLevel,
    math: flagLevel,
    attention: flagLevel
  }),
  needs_corroboration: z.object({
    reading: z.boolean(),
    writing: z.boolean(),
    math: z.boolean(),
    attention: z.boolean()
  }),
  strengths: z.array(z.string()),
  plan: planLevel,
  module_overrides: z.record(z.string(), z.record(z.string(), z.unknown())).default({}),
  source: sourceLevel,
  child_label: z.string().max(40).optional()
});

export type ExportedProfile = z.infer<typeof exportedProfileSchema>;
export type VarkChannel = keyof ExportedProfile['preferences'];
export type FlagLevel = z.infer<typeof flagLevel>;
export type PlanLevel = z.infer<typeof planLevel>;
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npx vitest run tests/schema.test.ts
```

Expected: all 11 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/schema.ts tests/schema.test.ts
git commit -m "feat(schema): canonical zod schema + PROFILE_VERSION + tests"
```

---

### Task 5: Pure helpers (topPreference / secondPreference / isProfileStale)

**Files:**
- Create: `/Users/damian/GitHub/Helena/profile-schema/src/helpers.ts`
- Create: `/Users/damian/GitHub/Helena/profile-schema/tests/helpers.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/helpers.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { ExportedProfile } from '../src/schema';
import { isProfileStale, secondPreference, topPreference } from '../src/helpers';

function mk(prefs: ExportedProfile['preferences'], expires = '2099-01-01T00:00:00.000Z'): ExportedProfile {
  return {
    version: 1,
    generated_at: '2026-01-01T00:00:00.000Z',
    expires_at: expires,
    preferences: prefs,
    flags: { reading: 'low', writing: 'low', math: 'low', attention: 'low' },
    needs_corroboration: { reading: false, writing: false, math: false, attention: false },
    strengths: [],
    plan: 'strengths',
    module_overrides: {},
    source: 'intake_quiz'
  };
}

describe('topPreference', () => {
  it('returns the highest-scoring channel', () => {
    const p = mk({ visual: 30, auditory: 80, read_write: 50, kinesthetic: 20 });
    expect(topPreference(p)).toBe('auditory');
  });
  it('returns null when all preferences are 0', () => {
    const p = mk({ visual: 0, auditory: 0, read_write: 0, kinesthetic: 0 });
    expect(topPreference(p)).toBeNull();
  });
});

describe('secondPreference', () => {
  it('returns the second-highest channel', () => {
    const p = mk({ visual: 30, auditory: 80, read_write: 50, kinesthetic: 20 });
    expect(secondPreference(p)).toBe('read_write');
  });
  it('returns null when only one non-zero preference exists', () => {
    const p = mk({ visual: 80, auditory: 0, read_write: 0, kinesthetic: 0 });
    expect(secondPreference(p)).toBeNull();
  });
});

describe('isProfileStale', () => {
  it('returns true when now >= expires_at', () => {
    const p = mk({ visual: 50, auditory: 50, read_write: 50, kinesthetic: 50 }, '2026-01-01T00:00:00.000Z');
    expect(isProfileStale(p, new Date('2026-06-01T00:00:00.000Z'))).toBe(true);
  });
  it('returns false when now < expires_at', () => {
    const p = mk({ visual: 50, auditory: 50, read_write: 50, kinesthetic: 50 }, '2099-01-01T00:00:00.000Z');
    expect(isProfileStale(p, new Date('2026-06-01T00:00:00.000Z'))).toBe(false);
  });
});
```

- [ ] **Step 2: Run — expect fail**

```bash
npx vitest run tests/helpers.test.ts
```

Expected: Cannot find module '../src/helpers'.

- [ ] **Step 3: Write `src/helpers.ts`**

```ts
import type { ExportedProfile, VarkChannel } from './schema';

/** Highest-scoring preference channel. Returns null if every channel is 0. */
export function topPreference(p: ExportedProfile): VarkChannel | null {
  const sorted = sortPrefs(p);
  return sorted[0] && sorted[0][1] > 0 ? sorted[0][0] : null;
}

/** Second-highest preference channel. Returns null if fewer than two non-zero. */
export function secondPreference(p: ExportedProfile): VarkChannel | null {
  const sorted = sortPrefs(p);
  return sorted[1] && sorted[1][1] > 0 ? sorted[1][0] : null;
}

/**
 * True when the profile's expires_at has passed. Caller supplies `now`
 * for testability; defaults to current wall clock.
 */
export function isProfileStale(p: ExportedProfile, now: Date = new Date()): boolean {
  return now.toISOString() >= p.expires_at;
}

function sortPrefs(p: ExportedProfile): [VarkChannel, number][] {
  const entries = Object.entries(p.preferences) as [VarkChannel, number][];
  return entries.sort((a, b) => b[1] - a[1]);
}
```

- [ ] **Step 4: Run — expect pass**

```bash
npx vitest run tests/helpers.test.ts
```

Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/helpers.ts tests/helpers.test.ts
git commit -m "feat(helpers): topPreference, secondPreference, isProfileStale"
```

---

### Task 6: Mode-affinity tables and recommendation functions

**Files:**
- Create: `/Users/damian/GitHub/Helena/profile-schema/src/recommend.ts`
- Create: `/Users/damian/GitHub/Helena/profile-schema/tests/recommend.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/recommend.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { ExportedProfile, VarkChannel } from '../src/schema';
import {
  MODE_AFFINITY,
  recommendedMathMode,
  recommendedSpellingMode,
  recommendedStatesMode
} from '../src/recommend';

function mkWithTop(top: VarkChannel, second?: VarkChannel): ExportedProfile {
  const prefs = { visual: 10, auditory: 10, read_write: 10, kinesthetic: 10 };
  prefs[top] = 80;
  if (second) prefs[second] = 60;
  return {
    version: 1,
    generated_at: '2026-01-01T00:00:00.000Z',
    expires_at: '2099-01-01T00:00:00.000Z',
    preferences: prefs,
    flags: { reading: 'low', writing: 'low', math: 'low', attention: 'low' },
    needs_corroboration: { reading: false, writing: false, math: false, attention: false },
    strengths: [],
    plan: 'strengths',
    module_overrides: {},
    source: 'intake_quiz'
  };
}

describe('MODE_AFFINITY', () => {
  it('exposes a table for every consumer module', () => {
    expect(MODE_AFFINITY.spelling).toBeDefined();
    expect(MODE_AFFINITY.states).toBeDefined();
    expect(MODE_AFFINITY.math).toBeDefined();
  });
});

describe('recommendedSpellingMode', () => {
  it('returns the auditory mode for an auditory-leaning learner', () => {
    expect(recommendedSpellingMode(mkWithTop('auditory'), 0)).toBe('speed-spell');
  });
  it('returns null when profile is null', () => {
    expect(recommendedSpellingMode(null, 0)).toBeNull();
  });
  it('rotates to second preference every 4th session', () => {
    const p = mkWithTop('auditory', 'visual');
    expect(recommendedSpellingMode(p, 0)).toBe('speed-spell');
    expect(recommendedSpellingMode(p, 1)).toBe('speed-spell');
    expect(recommendedSpellingMode(p, 4)).toBe('word-wheel'); // visual
  });
});

describe('recommendedMathMode', () => {
  it('returns times-tables for a read/write learner', () => {
    expect(recommendedMathMode(mkWithTop('read_write'), 0)).toBe('times-tables');
  });
  it('returns speed-add for auditory', () => {
    expect(recommendedMathMode(mkWithTop('auditory'), 0)).toBe('speed-add');
  });
  it('returns number-sort for visual or kinesthetic', () => {
    expect(recommendedMathMode(mkWithTop('visual'), 0)).toBe('number-sort');
    expect(recommendedMathMode(mkWithTop('kinesthetic'), 0)).toBe('number-sort');
  });
});

describe('recommendedStatesMode', () => {
  it('returns road-trip for visual/kinesthetic', () => {
    expect(recommendedStatesMode(mkWithTop('visual'), 0)).toBe('road-trip');
    expect(recommendedStatesMode(mkWithTop('kinesthetic'), 0)).toBe('road-trip');
  });
  it('returns quiz for read/write', () => {
    expect(recommendedStatesMode(mkWithTop('read_write'), 0)).toBe('quiz');
  });
  it('returns quest for auditory', () => {
    expect(recommendedStatesMode(mkWithTop('auditory'), 0)).toBe('quest');
  });
});
```

- [ ] **Step 2: Run — expect fail**

```bash
npx vitest run tests/recommend.test.ts
```

Expected: Cannot find module.

- [ ] **Step 3: Write `src/recommend.ts`**

```ts
import { topPreference, secondPreference } from './helpers';
import type { ExportedProfile, VarkChannel } from './schema';

export type SpellingMode =
  | 'missing-letters'
  | 'speed-spell'
  | 'word-wheel'
  | 'word-sort'
  | 'boss-round';

export type StatesMode = 'road-trip' | 'quest' | 'quiz';

export type MathMode = 'times-tables' | 'speed-add' | 'number-sort';

/**
 * Per-module mode-affinity tables. Each mode lists the VARK channels it
 * exercises. Order in the value array doesn't matter; order in the keys
 * array does — the first mode whose affinity matches the target channel
 * wins (gives a deterministic fallback when multiple modes share a tag).
 */
export const MODE_AFFINITY = {
  spelling: {
    'missing-letters': ['read_write'],
    'speed-spell': ['auditory'],
    'word-wheel': ['visual'],
    'word-sort': ['kinesthetic'],
    'boss-round': ['auditory', 'visual', 'read_write', 'kinesthetic']
  } as Record<SpellingMode, VarkChannel[]>,
  states: {
    'road-trip': ['visual', 'kinesthetic'],
    quest: ['auditory'],
    quiz: ['read_write']
  } as Record<StatesMode, VarkChannel[]>,
  math: {
    'times-tables': ['read_write'],
    'speed-add': ['auditory'],
    'number-sort': ['visual', 'kinesthetic']
  } as Record<MathMode, VarkChannel[]>
} as const;

const SPELLING_ORDER: SpellingMode[] = [
  'missing-letters',
  'speed-spell',
  'word-wheel',
  'word-sort',
  'boss-round'
];
const STATES_ORDER: StatesMode[] = ['road-trip', 'quest', 'quiz'];
const MATH_ORDER: MathMode[] = ['times-tables', 'speed-add', 'number-sort'];

/**
 * "Stretch turn" cadence: every 4th session, rotate to the learner's
 * SECOND-strongest channel so we don't lock them into a single modality
 * forever. Matches the existing consumer-side behavior.
 */
function targetChannel(p: ExportedProfile, sessionIndex: number): VarkChannel | null {
  const stretch = sessionIndex > 0 && sessionIndex % 4 === 0;
  return stretch ? secondPreference(p) : topPreference(p);
}

function pickMode<M extends string>(
  order: M[],
  table: Record<M, VarkChannel[]>,
  channel: VarkChannel
): M | null {
  for (const mode of order) {
    if (table[mode].includes(channel)) return mode;
  }
  return null;
}

export function recommendedSpellingMode(
  p: ExportedProfile | null,
  sessionIndex: number
): SpellingMode | null {
  if (!p) return null;
  const ch = targetChannel(p, sessionIndex);
  if (!ch) return null;
  return pickMode(SPELLING_ORDER, MODE_AFFINITY.spelling, ch);
}

export function recommendedStatesMode(
  p: ExportedProfile | null,
  sessionIndex: number
): StatesMode | null {
  if (!p) return null;
  const ch = targetChannel(p, sessionIndex);
  if (!ch) return null;
  return pickMode(STATES_ORDER, MODE_AFFINITY.states, ch);
}

export function recommendedMathMode(
  p: ExportedProfile | null,
  sessionIndex: number
): MathMode | null {
  if (!p) return null;
  const ch = targetChannel(p, sessionIndex);
  if (!ch) return null;
  return pickMode(MATH_ORDER, MODE_AFFINITY.math, ch);
}
```

- [ ] **Step 4: Run — expect pass**

```bash
npx vitest run tests/recommend.test.ts
```

Expected: 11 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/recommend.ts tests/recommend.test.ts
git commit -m "feat(recommend): MODE_AFFINITY + recommendedXxxMode with stretch cadence"
```

---

### Task 7: Fragment codec (encode + decode)

**Files:**
- Create: `/Users/damian/GitHub/Helena/profile-schema/src/fragment.ts`
- Create: `/Users/damian/GitHub/Helena/profile-schema/tests/fragment.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/fragment.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { decodeProfileFragment, encodeProfileFragment } from '../src/fragment';
import type { ExportedProfile } from '../src/schema';

const PROFILE: ExportedProfile = {
  version: 1,
  generated_at: '2026-05-26T00:00:00.000Z',
  expires_at: '2026-07-25T00:00:00.000Z',
  preferences: { visual: 60, auditory: 70, read_write: 40, kinesthetic: 30 },
  flags: { reading: 'low', writing: 'low', math: 'medium', attention: 'low' },
  needs_corroboration: { reading: false, writing: false, math: true, attention: false },
  strengths: ['solves puzzles'],
  plan: 'strengths',
  module_overrides: {},
  source: 'intake_quiz',
  child_label: 'Helena'
};

describe('encode/decodeProfileFragment', () => {
  it('round-trips a typical profile', () => {
    const token = encodeProfileFragment(PROFILE);
    const decoded = decodeProfileFragment(token);
    expect(decoded).not.toBeNull();
    expect(JSON.parse(decoded as string)).toEqual(PROFILE);
  });

  it('produces a URL-safe token with no +, /, or =', () => {
    const token = encodeProfileFragment(PROFILE);
    expect(token).not.toMatch(/[+/=]/);
  });

  it('handles non-ASCII child_label (round-trip)', () => {
    const p: ExportedProfile = { ...PROFILE, child_label: 'Élena' };
    const token = encodeProfileFragment(p);
    const decoded = decodeProfileFragment(token);
    expect(JSON.parse(decoded as string)).toEqual(p);
  });

  it('decodeProfileFragment returns null on garbage input', () => {
    expect(decodeProfileFragment('!!!not-base64@@@')).toBeNull();
  });

  it('decodeProfileFragment handles all three padding lengths (0/1/2 stripped)', () => {
    // The encoder strips '=' padding. Verify decode re-pads correctly for
    // all three input lengths mod 4.
    expect(decodeProfileFragment(encodeNaive('a'))).toBe('a');
    expect(decodeProfileFragment(encodeNaive('ab'))).toBe('ab');
    expect(decodeProfileFragment(encodeNaive('abc'))).toBe('abc');
  });
});

function encodeNaive(raw: string): string {
  // Mirror of encodeProfileFragment but accepts a raw string instead of a profile.
  const b64 = Buffer.from(encodeURIComponent(raw), 'binary').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
```

- [ ] **Step 2: Run — expect fail**

```bash
npx vitest run tests/fragment.test.ts
```

- [ ] **Step 3: Write `src/fragment.ts`**

```ts
import type { ExportedProfile } from './schema';

/**
 * Encode a profile into a URL-safe base64 token suitable for placing in a
 * fragment (`#profile=...`). Matches the contract used by every consumer.
 *
 * Encoding: `btoa(encodeURIComponent(JSON.stringify(profile)))`, then
 * `'+/' → '-_'` and `'='` stripped. Decode re-pads.
 */
export function encodeProfileFragment(profile: ExportedProfile): string {
  const json = JSON.stringify(profile);
  const b64 = base64Encode(encodeURIComponent(json));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decode a URL-safe base64 token back into the raw JSON text. Returns
 * `null` on any decoding failure — callers decide whether to surface a
 * paste fallback. Does NOT validate against the schema; pair with
 * `exportedProfileSchema.safeParse` to do that.
 */
export function decodeProfileFragment(token: string): string | null {
  try {
    const standard = token.replace(/-/g, '+').replace(/_/g, '/');
    const padded = standard + '==='.slice(0, (4 - (standard.length % 4)) % 4);
    return decodeURIComponent(base64Decode(padded));
  } catch {
    return null;
  }
}

function base64Encode(s: string): string {
  if (typeof btoa === 'function') return btoa(s);
  // Node fallback (used in tests and SSR contexts).
  return Buffer.from(s, 'binary').toString('base64');
}

function base64Decode(s: string): string {
  if (typeof atob === 'function') return atob(s);
  return Buffer.from(s, 'base64').toString('binary');
}
```

- [ ] **Step 4: Run — expect pass**

```bash
npx vitest run tests/fragment.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/fragment.ts tests/fragment.test.ts
git commit -m "feat(fragment): URL-safe base64 encode/decode with Node + browser fallbacks"
```

---

### Task 8: Telemetry readers

**Files:**
- Create: `/Users/damian/GitHub/Helena/profile-schema/src/telemetry.ts`
- Create: `/Users/damian/GitHub/Helena/profile-schema/tests/telemetry.test.ts`

- [ ] **Step 1: Copy the existing tests verbatim**

The telemetry behavior already exists at `helena-learner-profile/src/lib/profile/telemetry.test.ts` and we want to move it without changing behavior. Read the existing file and copy its test bodies to the new location, adjusting imports.

```bash
cat /Users/damian/GitHub/Helena/helena-learner-profile/src/lib/profile/telemetry.test.ts
```

Write `tests/telemetry.test.ts` with the same test bodies, but:
- Change `from './telemetry'` to `from '../src/telemetry'`
- Change `from './schema'` to `from '../src/schema'`
- Keep the same `makeProfile` helper, same test names, same assertions

(Code preserved verbatim from the existing tests; only import paths change.)

- [ ] **Step 2: Run — expect fail (no src/telemetry.ts yet)**

```bash
npx vitest run tests/telemetry.test.ts
```

- [ ] **Step 3: Write `src/telemetry.ts`**

```ts
import type { ExportedProfile } from './schema';

/**
 * Consumer apps write gameplay telemetry into
 * `module_overrides.<moduleKey>.{followed, overrode, last_launches, last_override_streak}`.
 * This module reads it defensively — consumer-side bugs cannot crash the
 * parent dashboard, every field falls back to a sensible default.
 */
export type ModuleTelemetry = {
  followed: Record<string, number>;
  overrode: Record<string, number>;
  last_launches: string[];
  last_override_streak: number;
};

export type ModuleRow = {
  mode: string;
  followed: number;
  overrode: number;
};

function isObj(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function coerceCountMap(v: unknown): Record<string, number> {
  if (!isObj(v)) return {};
  const out: Record<string, number> = {};
  for (const [k, val] of Object.entries(v)) {
    if (typeof val === 'number' && Number.isFinite(val) && val >= 0) {
      out[k] = Math.floor(val);
    }
  }
  return out;
}

/**
 * Read one module's telemetry. Returns null when the slot is missing OR
 * when every field is empty.
 */
export function readTelemetry(p: ExportedProfile, key: string): ModuleTelemetry | null {
  const raw = p.module_overrides?.[key];
  if (!isObj(raw)) return null;
  const followed = coerceCountMap(raw.followed);
  const overrode = coerceCountMap(raw.overrode);
  const last_launches = Array.isArray(raw.last_launches)
    ? raw.last_launches.filter((x): x is string => typeof x === 'string')
    : [];
  const last_override_streak =
    typeof raw.last_override_streak === 'number' &&
    Number.isFinite(raw.last_override_streak) &&
    raw.last_override_streak >= 0
      ? Math.floor(raw.last_override_streak)
      : 0;
  const hasAny =
    Object.keys(followed).length > 0 ||
    Object.keys(overrode).length > 0 ||
    last_launches.length > 0;
  if (!hasAny) return null;
  return { followed, overrode, last_launches, last_override_streak };
}

export function totalLaunches(t: ModuleTelemetry): number {
  const sum = (r: Record<string, number>) => Object.values(r).reduce((a, b) => a + b, 0);
  return sum(t.followed) + sum(t.overrode);
}

export function followRate(t: ModuleTelemetry): number {
  const followed = Object.values(t.followed).reduce((a, b) => a + b, 0);
  const total = totalLaunches(t);
  if (total === 0) return 0;
  return Math.round((followed / total) * 100);
}

export function modesBy(t: ModuleTelemetry): ModuleRow[] {
  const keys = new Set<string>([...Object.keys(t.followed), ...Object.keys(t.overrode)]);
  return [...keys]
    .map((mode) => ({
      mode,
      followed: t.followed[mode] ?? 0,
      overrode: t.overrode[mode] ?? 0
    }))
    .sort((a, b) => b.followed + b.overrode - (a.followed + a.overrode));
}

export function prettyMode(mode: string): string {
  return mode.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
```

- [ ] **Step 4: Run — expect pass**

```bash
npx vitest run tests/telemetry.test.ts
```

Expected: all existing telemetry tests pass (~16).

- [ ] **Step 5: Commit**

```bash
git add src/telemetry.ts tests/telemetry.test.ts
git commit -m "feat(telemetry): readTelemetry + helpers (ported from helena-learner-profile)"
```

---

### Task 9: Barrel exports + IIFE entry

**Files:**
- Create: `/Users/damian/GitHub/Helena/profile-schema/src/index.ts`
- Create: `/Users/damian/GitHub/Helena/profile-schema/src/iife-entry.ts`

- [ ] **Step 1: Write `src/index.ts`**

```ts
/**
 * Canonical export surface. Anything not listed here is private.
 * Keep the export list flat and explicit — IDE autocomplete is the
 * documentation.
 */
export {
  PROFILE_VERSION,
  PROFILE_TTL_DAYS,
  exportedProfileSchema,
  type ExportedProfile,
  type VarkChannel,
  type FlagLevel,
  type PlanLevel
} from './schema';

export { topPreference, secondPreference, isProfileStale } from './helpers';

export {
  MODE_AFFINITY,
  recommendedSpellingMode,
  recommendedStatesMode,
  recommendedMathMode,
  type SpellingMode,
  type StatesMode,
  type MathMode
} from './recommend';

export { encodeProfileFragment, decodeProfileFragment } from './fragment';

export {
  readTelemetry,
  totalLaunches,
  followRate,
  modesBy,
  prettyMode,
  type ModuleTelemetry,
  type ModuleRow
} from './telemetry';
```

- [ ] **Step 2: Write `src/iife-entry.ts`**

```ts
/**
 * IIFE bundle entry point. Re-exports everything from the main barrel so
 * tsup can build a single self-contained file for `<script>` consumers.
 *
 * Types disappear at compile time, so vanilla JS callers see only the
 * runtime values. The TypeScript types are still produced from `index.ts`.
 */
export * from './index';
```

- [ ] **Step 3: Verify the barrel exports compile**

```bash
npx tsc --noEmit
```

Expected: no output (success).

- [ ] **Step 4: Run the full test suite**

```bash
npx vitest run
```

Expected: all tests pass across schema, helpers, recommend, fragment, telemetry (~36 tests).

- [ ] **Step 5: Commit**

```bash
git add src/index.ts src/iife-entry.ts
git commit -m "feat: barrel exports + IIFE entry"
```

---

### Task 10: Round-trip integration test

**Files:**
- Create: `/Users/damian/GitHub/Helena/profile-schema/tests/round-trip.test.ts`

- [ ] **Step 1: Write the round-trip test**

`tests/round-trip.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  decodeProfileFragment,
  encodeProfileFragment,
  exportedProfileSchema,
  type ExportedProfile
} from '../src/index';

describe('encode → decode → schema.parse round trip', () => {
  const profile: ExportedProfile = {
    version: 1,
    generated_at: '2026-05-26T00:00:00.000Z',
    expires_at: '2026-07-25T00:00:00.000Z',
    preferences: { visual: 55, auditory: 80, read_write: 30, kinesthetic: 40 },
    flags: { reading: 'low', writing: 'low', math: 'medium', attention: 'high' },
    needs_corroboration: { reading: false, writing: false, math: true, attention: false },
    strengths: ['follows multi-step directions', 'recalls song lyrics'],
    plan: 'monitor',
    module_overrides: {
      spelling: {
        followed: { 'speed-spell': 5 },
        overrode: { 'word-sort': 1 },
        last_launches: ['word-sort', 'speed-spell'],
        last_override_streak: 1
      }
    },
    source: 'behavioral_observation',
    child_label: 'Helena'
  };

  it('preserves every field through encode → decode → safeParse', () => {
    const token = encodeProfileFragment(profile);
    const json = decodeProfileFragment(token);
    expect(json).not.toBeNull();
    const parsed = exportedProfileSchema.safeParse(JSON.parse(json as string));
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual(profile);
    }
  });
});
```

- [ ] **Step 2: Run — expect pass**

```bash
npx vitest run tests/round-trip.test.ts
```

Expected: 1 test passes.

- [ ] **Step 3: Commit**

```bash
git add tests/round-trip.test.ts
git commit -m "test: end-to-end encode → decode → parse round trip"
```

---

## Phase 3 — Build, publish prep, link to first consumer

### Task 11: Run the production build

- [ ] **Step 1: Build**

```bash
cd /Users/damian/GitHub/Helena/profile-schema
npm run build
```

Expected: `dist/` populated with:
- `index.mjs` (ESM)
- `index.cjs` (CommonJS)
- `index.d.ts` (types)
- `index.iife.js` (IIFE — exposes `HelenaProfile` to window)

- [ ] **Step 2: Inspect IIFE output for the window assignment**

```bash
tail -5 dist/index.iife.js
```

Expected: contains `window.HelenaProfile = HelenaProfile`.

- [ ] **Step 3: String-level smoke check of the IIFE artifact**

We deliberately do NOT execute the downloaded JS to verify it. Instead, run string checks against the build output — the actual runtime verification happens in a real browser later (Task 19 Step 4).

```bash
grep -c "exportedProfileSchema" dist/index.iife.js
grep -c "recommendedSpellingMode" dist/index.iife.js
grep -c "window.HelenaProfile" dist/index.iife.js
```

Expected: each command prints a positive integer (each symbol appears at least once in the bundle).

- [ ] **Step 4: Commit any tsup-config tweaks if the build failed or strings are missing**

If the `window.HelenaProfile = HelenaProfile` line isn't in `dist/index.iife.js`, the `footer.js` injection in `tsup.config.ts` isn't firing. Fix the config and re-commit. If the build is clean, no commit needed here.

---

### Task 12: Link the package into helena-learner-profile

This is the spec's "pre-publish via npm link first" gate. We prove the package works against a real consumer before pushing to npm.

- [ ] **Step 1: Register the global link from the package side**

```bash
cd /Users/damian/GitHub/Helena/profile-schema
npm link
```

Expected: creates a global symlink at `~/.npm-global/lib/node_modules/profile-schema` (path varies).

- [ ] **Step 2: Link from the consumer side**

```bash
cd /Users/damian/GitHub/Helena/helena-learner-profile
npm link profile-schema
```

- [ ] **Step 3: Verify the link resolves**

```bash
node -e "console.log(require.resolve('profile-schema'))"
```

Expected: prints a path under the package directory, NOT under helena-learner-profile's own node_modules.

---

## Phase 4 — Migrate helena-learner-profile (the producer)

### Task 13: Re-export from the package in the producer's schema barrel

**Files:**
- Modify: `/Users/damian/GitHub/Helena/helena-learner-profile/src/lib/profile/schema.ts`

The producer's schema.ts has BOTH the schema (which moves to the package) AND `buildExportedProfile` (which depends on `STRENGTHS_ITEMS` and stays in the producer). We keep `buildExportedProfile` and replace the rest with a re-export.

- [ ] **Step 1: Read the current file to confirm shape**

```bash
cat /Users/damian/GitHub/Helena/helena-learner-profile/src/lib/profile/schema.ts | head -100
```

Confirm: imports zod, exports `PROFILE_VERSION`, `PROFILE_TTL_DAYS`, schema, type, `buildExportedProfile`, `formatProfile`.

- [ ] **Step 2: Rewrite the file**

```ts
/**
 * Re-export the canonical schema from the shared package, plus producer-
 * specific helpers (buildExportedProfile, formatProfile) that depend on
 * RunPayload and the STRENGTHS_ITEMS item bank.
 *
 * Canonical schema lives in the `profile-schema` package. Do not redefine
 * it here.
 */
import type { RunPayload } from '$lib/types';
import { STRENGTHS_ITEMS } from '$lib/items/strengths';

export {
  PROFILE_VERSION,
  PROFILE_TTL_DAYS,
  exportedProfileSchema,
  type ExportedProfile,
  type VarkChannel,
  type FlagLevel,
  type PlanLevel
} from 'profile-schema';

import { PROFILE_TTL_DAYS } from 'profile-schema';
import type { ExportedProfile } from 'profile-schema';

/**
 * Convert a RunPayload + optional child label into the exportable shape.
 * Producer-specific — depends on the item bank to translate strength IDs
 * into human-readable prompts. Stays in the producer for that reason.
 */
export function buildExportedProfile(
  run: RunPayload,
  opts: { childLabel?: string; now?: Date } = {}
): ExportedProfile {
  const now = opts.now ?? new Date();
  const expires = new Date(now.getTime() + PROFILE_TTL_DAYS * 24 * 60 * 60 * 1000);

  const strengthPrompts = run.scores.strengths_spotlight
    .map((id) => STRENGTHS_ITEMS.find((s) => s.id === id)?.prompt)
    .filter((p): p is string => Boolean(p));

  return {
    version: 1,
    generated_at: now.toISOString(),
    expires_at: expires.toISOString(),
    preferences: { ...run.scores.preferences },
    flags: {
      reading: run.scores.screening.reading.level,
      writing: run.scores.screening.writing.level,
      math: run.scores.screening.math.level,
      attention: run.scores.screening.attention.level
    },
    needs_corroboration: {
      reading: run.scores.screening.reading.needs_corroboration,
      writing: run.scores.screening.writing.needs_corroboration,
      math: run.scores.screening.math.needs_corroboration,
      attention: run.scores.screening.attention.needs_corroboration
    },
    strengths: strengthPrompts,
    plan: run.scores.plan,
    module_overrides: {},
    source: 'intake_quiz',
    ...(opts.childLabel ? { child_label: opts.childLabel } : {})
  };
}

/** Pretty-print the profile JSON for the preview card on results page. */
export function formatProfile(profile: ExportedProfile): string {
  return JSON.stringify(profile, null, 2);
}
```

- [ ] **Step 3: Replace `telemetry.ts` with a re-export**

```bash
cat > /Users/damian/GitHub/Helena/helena-learner-profile/src/lib/profile/telemetry.ts <<'EOF'
// Re-export the telemetry helpers from the shared package. The original
// implementation now lives in `profile-schema`. This shim exists so
// existing imports (`from '$lib/profile/telemetry'`) keep working without
// touching every callsite.
export {
  readTelemetry,
  totalLaunches,
  followRate,
  modesBy,
  prettyMode,
  decodeProfileFragment,
  type ModuleTelemetry,
  type ModuleRow
} from 'profile-schema';
EOF
```

- [ ] **Step 4: Delete the obsolete schema-internal tests**

The schema and telemetry tests now live in the package. Keep the producer's tests focused on producer behavior (RunPayload → ExportedProfile, etc.).

```bash
cd /Users/damian/GitHub/Helena/helena-learner-profile
git rm src/lib/profile/schema.test.ts || rm -f src/lib/profile/schema.test.ts
git rm src/lib/profile/telemetry.test.ts || rm -f src/lib/profile/telemetry.test.ts
```

(If schema.test.ts has buildExportedProfile-specific tests, KEEP THOSE — extract them to a new file like `buildExportedProfile.test.ts` before deleting.)

- [ ] **Step 5: Run the producer test suite**

```bash
cd /Users/damian/GitHub/Helena/helena-learner-profile
npx vitest run
```

Expected: tests pass. Some test count drop is expected because schema/telemetry tests now live in the package.

- [ ] **Step 6: Typecheck**

```bash
npx svelte-check --threshold error --output human
```

Expected: 0 errors.

- [ ] **Step 7: Build**

```bash
npm run build
```

Expected: build green.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor(profile): import schema + telemetry from profile-schema package

Re-export from the canonical shared package; keep buildExportedProfile
local because it depends on the item bank. Drops the duplicate schema
test file (lives in the package now).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

Do NOT push yet — leave this commit local until Phase 5 confirms the package itself is good.

---

## Phase 5 — Publish the package

### Task 14: Bump version, publish

- [ ] **Step 1: Verify there are no uncommitted changes in the package**

```bash
cd /Users/damian/GitHub/Helena/profile-schema
git status
```

Expected: clean working tree.

- [ ] **Step 2: Bump to 1.0.0**

```bash
npm version 1.0.0 --no-git-tag-version
```

Expected: `package.json` now says `"version": "1.0.0"`.

- [ ] **Step 3: Build + test once more**

```bash
npm run build
npm test
```

Expected: build clean, all tests pass.

- [ ] **Step 4: Create GitHub repo**

```bash
gh repo create dhasakgbb/profile-schema --private --source=. --remote=origin --push
```

(If you want a public repo, drop `--private`.)

- [ ] **Step 5: Commit version bump and tag**

```bash
git add package.json
git commit -m "chore: release 1.0.0"
git tag v1.0.0
git push origin main --tags
```

- [ ] **Step 6: Publish to npm**

```bash
npm publish --access public
```

Expected: `+ profile-schema@1.0.0`.

If you don't have npm auth: `npm login` first.

- [ ] **Step 7: Verify on npm**

```bash
npm view profile-schema
```

Expected: shows v1.0.0.

- [ ] **Step 8: Switch helena-learner-profile from `npm link` to the real package**

```bash
cd /Users/damian/GitHub/Helena/helena-learner-profile
npm unlink profile-schema
npm install profile-schema@1.0.0
```

- [ ] **Step 9: Re-run tests against the published version**

```bash
npx vitest run && npx svelte-check --threshold error --output human && npm run build
```

Expected: all green.

- [ ] **Step 10: Push helena-learner-profile**

```bash
git add package.json package-lock.json
git commit -m "chore: install profile-schema@1.0.0 from npm

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
git push
```

---

## Phase 6 — Migrate helena-spelling

### Task 15: Swap helena-spelling's local schema for the package

**Files:**
- Modify: `/Users/damian/GitHub/Helena/Spelling/src/profile/schema.ts`
- Modify: `/Users/damian/GitHub/Helena/Spelling/package.json` (via npm install)

- [ ] **Step 1: Install the package**

```bash
cd /Users/damian/GitHub/Helena/Spelling
npm install profile-schema@1.0.0
```

- [ ] **Step 2: Read the existing schema to understand its shape**

```bash
cat /Users/damian/GitHub/Helena/Spelling/src/profile/schema.ts
```

Note any Spelling-specific helpers (e.g., `recommendedSpellingMode` was originally here) — these MUST be replaced with the package's versions, not kept.

- [ ] **Step 3: Rewrite as a re-export shim**

```ts
/**
 * Cross-module contract — see profile-schema package for the canonical
 * definitions. This file is a thin re-export shim so existing imports
 * keep working without churn.
 */
export {
  PROFILE_VERSION,
  PROFILE_TTL_DAYS,
  exportedProfileSchema,
  type ExportedProfile,
  type VarkChannel,
  topPreference,
  secondPreference,
  isProfileStale,
  MODE_AFFINITY,
  recommendedSpellingMode,
  type SpellingMode,
  encodeProfileFragment,
  decodeProfileFragment
} from 'profile-schema';
```

- [ ] **Step 4: Sweep callsites for any remaining direct imports of removed symbols**

```bash
cd /Users/damian/GitHub/Helena/Spelling
grep -rn "from '../profile/schema'" src/ | head -20
grep -rn "from '../../profile/schema'" src/ | head -20
```

Verify everything imported still exists in the re-export shim. If something is missing (e.g., a Spelling-specific type), add it to the shim or update the callsite to import from elsewhere.

- [ ] **Step 5: Run the Spelling test suite**

```bash
npx vitest run --exclude '**/definitions.test.ts' --exclude '**/masking-issues.test.ts'
```

(Those two test files were broken before this work; the exclude flags match the existing pattern.)

Expected: all tests pass.

- [ ] **Step 6: Build**

```bash
npm run build
```

Expected: build clean.

- [ ] **Step 7: Commit + push**

```bash
git add package.json package-lock.json src/profile/schema.ts
git commit -m "refactor(profile): import schema + helpers from profile-schema package

Replaces the hand-mirrored zod schema and recommendedSpellingMode
with re-exports from the canonical shared package. No behavior change
expected; tests still pass.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
git push
```

---

## Phase 7 — Migrate helena-states (vanilla, via CDN)

### Task 16: Load the IIFE in helena-states

**Files:**
- Modify: `/Users/damian/GitHub/Helena/helena-states/index.html`
- Modify: `/Users/damian/GitHub/Helena/helena-states/profile.js`

- [ ] **Step 1: Add the CDN script to index.html BEFORE profile.js**

Find the existing script tags in `index.html`:

```bash
cd /Users/damian/GitHub/Helena/helena-states
grep -n "<script" index.html
```

In the `<head>` (or before any tag that loads `profile.js`), insert:

```html
<!-- Canonical Helena profile schema, exposes window.HelenaProfile (capital H).
     The lowercase window.helenaProfile is this app's own store, set by profile.js. -->
<script src="https://cdn.jsdelivr.net/npm/profile-schema@1/dist/index.iife.js" crossorigin="anonymous"></script>
```

- [ ] **Step 2: Replace the local validators in profile.js**

Read `profile.js`:

```bash
cat /Users/damian/GitHub/Helena/helena-states/profile.js
```

Identify these blocks and replace each with delegations to `window.HelenaProfile`:

1. `function validate(raw) { ... }` (hand-rolled, ~50 lines) — replace with:
   ```js
   function validate(raw) {
     if (!window.HelenaProfile) return { ok: false, error: 'profile-schema package failed to load' };
     const r = window.HelenaProfile.exportedProfileSchema.safeParse(raw);
     return r.success
       ? { ok: true, profile: r.data }
       : { ok: false, error: r.error.issues[0]?.message ?? 'invalid' };
   }
   ```

2. `function topPreference(profile) { ... }` — DELETE; replace callsites with `window.HelenaProfile.topPreference(profile)`.

3. `function secondPreference(profile) { ... }` — DELETE; same pattern.

4. `function recommendedStatesMode(profile, sessionIndex) { ... }` — DELETE; replace callsite (likely one in the exposed `window.helenaProfile` object) with `window.HelenaProfile.recommendedStatesMode(profile, sessionIndex)`.

5. `function isProfileStale(profile, now) { ... }` — DELETE; replace callsites with `window.HelenaProfile.isProfileStale(profile, now)`.

6. The `MODE_AFFINITY` const — DELETE; expose via `window.HelenaProfile.MODE_AFFINITY.states` if any callsite reads it.

7. The `tryImportProfileFromHash` function uses an inline base64 decode — replace its body's URL-safe decode block with:
   ```js
   const decoded = window.HelenaProfile.decodeProfileFragment(raw);
   if (decoded === null) return 'invalid';
   ```

8. The `buildActivityUrl` function uses an inline base64 encode — replace its body with:
   ```js
   function buildActivityUrl() {
     if (!window.helenaProfile || !window.HelenaProfile) return '#';
     const updated = window.helenaProfile.profileStore.exportWithTelemetry();
     if (!updated) return '#';
     try {
       const token = window.HelenaProfile.encodeProfileFragment(updated);
       return 'https://helena-learner-profile.vercel.app/activity#profile=' + token;
     } catch (_) {
       return '#';
     }
   }
   ```

Keep the app-level `window.helenaProfile` (lowercase) object that wraps localStorage, cross-tab sync, and subscribers — that's the per-app store, distinct from the package's namespace.

- [ ] **Step 3: Syntax-check**

```bash
node -c /Users/damian/GitHub/Helena/helena-states/profile.js
```

Expected: no output (success).

- [ ] **Step 4: Manual deploy check**

```bash
cd /Users/damian/GitHub/Helena/helena-states
python3 -m http.server 8080 &
SERVER_PID=$!
sleep 1
echo "Open http://localhost:8080 in a browser. Verify the mode-selection view renders without console errors. Open DevTools console and run: typeof window.HelenaProfile (should print 'object'). Hit Ctrl-C in the terminal when done."
wait
```

Manually verify in the browser:
- Mode selection renders.
- Console shows no errors.
- `window.HelenaProfile.PROFILE_VERSION` returns 1 in DevTools console.
- `window.HelenaProfile.recommendedStatesMode(null, 0)` returns null without throwing.

Then kill the server with Ctrl-C.

- [ ] **Step 5: Commit + push**

```bash
cd /Users/damian/GitHub/Helena/helena-states
git add index.html profile.js
git commit -m "refactor(profile): load schema + helpers from profile-schema via CDN

The hand-rolled validate(), topPreference, secondPreference,
recommendedStatesMode, isProfileStale, MODE_AFFINITY, and inline
base64 codec are gone. window.HelenaProfile (capital H) carries
them now; the per-app window.helenaProfile store is unchanged.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
git push
```

---

## Phase 8 — Migrate helena-math (vanilla, via CDN)

### Task 17: Same pattern as helena-states

**Files:**
- Modify: `/Users/damian/GitHub/Helena/helena-math/index.html`
- Modify: `/Users/damian/GitHub/Helena/helena-math/profile.js`

- [ ] **Step 1: Add the CDN script to index.html**

```html
<script src="https://cdn.jsdelivr.net/npm/profile-schema@1/dist/index.iife.js" crossorigin="anonymous"></script>
```

Place it before `profile.js` is loaded.

- [ ] **Step 2: Replace local validators in profile.js**

Same edits as Task 16 Step 2, but the recommended-mode function is `recommendedMathMode` instead of `recommendedStatesMode`.

Specifically:

1. `validate(raw)` → delegates to `window.HelenaProfile.exportedProfileSchema.safeParse`.
2. `topPreference`, `secondPreference`, `isProfileStale` → DELETE, replace callsites.
3. `recommendedMathMode` → DELETE, replace callsites with `window.HelenaProfile.recommendedMathMode(profile, sessionIndex)`.
4. `MODE_AFFINITY` → DELETE; replace any callsite reads with `window.HelenaProfile.MODE_AFFINITY.math`.
5. `tryImportProfileFromHash`'s inline decode → `window.HelenaProfile.decodeProfileFragment(raw)`.
6. `buildActivityUrl`'s inline encode → `window.HelenaProfile.encodeProfileFragment(updated)`.

- [ ] **Step 3: Syntax-check**

```bash
node -c /Users/damian/GitHub/Helena/helena-math/profile.js
```

- [ ] **Step 4: Manual deploy check**

```bash
cd /Users/damian/GitHub/Helena/helena-math
python3 -m http.server 8081 &
SERVER_PID=$!
sleep 1
echo "Open http://localhost:8081, verify mode picker renders + no console errors + window.HelenaProfile is defined. Ctrl-C when done."
wait
```

- [ ] **Step 5: Commit + push**

```bash
git add index.html profile.js
git commit -m "refactor(profile): load schema + helpers from profile-schema via CDN

Same migration as helena-states. recommendedMathMode + all hand-rolled
validators are gone; window.HelenaProfile carries them now.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
git push
```

---

## Phase 9 — Acceptance verification

### Task 18: Drift smoke test (acceptance criterion #3)

- [ ] **Step 1: Confirm no duplicate PROFILE_VERSION declarations**

```bash
cd /Users/damian/GitHub/Helena
git grep -l "PROFILE_VERSION = " helena-learner-profile helena-spelling helena-states helena-math
```

Expected output: empty, OR shows only re-export shims (`export { PROFILE_VERSION } from 'profile-schema'`). No second const declaration.

- [ ] **Step 2: Confirm no duplicate schema definitions**

```bash
git grep -l "exportedProfileSchema = z.object" helena-learner-profile helena-spelling helena-states helena-math
```

Expected: empty. The schema lives only in the package.

- [ ] **Step 3: Confirm no duplicate MODE_AFFINITY tables**

```bash
git grep -l "MODE_AFFINITY = {" helena-learner-profile helena-spelling helena-states helena-math
```

Expected: empty.

If any of the above grep'd hits exist, go back to the relevant Task and clean up.

---

### Task 19: CDN smoke test (acceptance criterion #6)

We avoid downloading-and-executing the JS in Node (that's the canonical XSS shape — `eval()` against arbitrary fetched content). Instead, we verify the CDN serves the expected bundle by string-checking the response, and we verify runtime behavior in a real browser against the live deploys.

- [ ] **Step 1: Wait ~5 minutes after npm publish for jsDelivr to fetch**

jsDelivr caches by tag. New publishes propagate in seconds-to-minutes.

- [ ] **Step 2: Hit the CDN URL and string-check the bundle**

```bash
curl -fsS -o /tmp/iife-cdn.js https://cdn.jsdelivr.net/npm/profile-schema@1/dist/index.iife.js
wc -c /tmp/iife-cdn.js
grep -c "exportedProfileSchema" /tmp/iife-cdn.js
grep -c "recommendedSpellingMode" /tmp/iife-cdn.js
grep -c "window.HelenaProfile" /tmp/iife-cdn.js
```

Expected: file is non-empty (~15–50 KB), each grep returns a positive integer.

This is a content check, not an execution check. We do not run the downloaded JS.

- [ ] **Step 3: Browser-level smoke (the real runtime check)**

Open https://helena-states.vercel.app/ in a real browser AFTER the helena-states deploy has propagated (Task 16). In DevTools console:

```js
typeof window.HelenaProfile           // 'object'
window.HelenaProfile.PROFILE_VERSION  // 1
window.HelenaProfile.recommendedStatesMode(null, 0)  // null (no throw)
window.HelenaProfile.exportedProfileSchema.safeParse({}).success  // false (no throw)
```

If all four expressions succeed, the end-to-end pipeline (npm → CDN → live site → live IIFE) is verified. Repeat the spot-check at https://helena-math.vercel.app/ for symmetry.

---

### Task 20: Drift simulation (acceptance criterion #5)

- [ ] **Step 1: In the package, add an optional field**

```bash
cd /Users/damian/GitHub/Helena/profile-schema
git checkout -b drift-test
```

Edit `src/schema.ts`. Inside the `exportedProfileSchema` object, add:

```ts
notes: z.string().max(500).optional(),
```

- [ ] **Step 2: Bump to 1.1.0 + build + test + tag + publish**

```bash
npm version 1.1.0 --no-git-tag-version
npm run build
npm test
git add -A
git commit -m "feat(schema): optional notes field (drift-test)"
git tag v1.1.0
git push --tags
npm publish --access public
```

- [ ] **Step 3: Verify helena-states still passes WITHOUT upgrading**

The CDN script still points at `profile-schema@1` (major version), which means jsDelivr will eventually serve 1.1.0 BUT existing pages cached with the older bundle will keep working until the cache expires. Either way, the contract holds: schema parses old AND new profiles, because `notes` is optional.

Verify in a browser at https://helena-states.vercel.app/ that the app still loads without errors after waiting for CDN propagation (a few minutes). Console should be clean.

- [ ] **Step 4: Roll back the drift test**

This was a proof, not a real feature. Revert.

```bash
cd /Users/damian/GitHub/Helena/profile-schema
git checkout main
git branch -D drift-test
npm deprecate profile-schema@1.1.0 "test publish for drift simulation — use 1.0.0"
```

(Deprecate rather than unpublish — npm makes unpublish hard after 24h and even within 24h is frowned on.)

If the test PROVED that the schema is brittle (older consumers failed against new data), bail and rethink before iterating. The whole point is to know.

---

### Task 21: Final cross-repo verification

- [ ] **Step 1: Run all four repos' test suites one more time**

```bash
cd /Users/damian/GitHub/Helena/helena-learner-profile && npx vitest run && npx svelte-check --threshold error --output human
cd /Users/damian/GitHub/Helena/Spelling && npx vitest run --exclude '**/definitions.test.ts' --exclude '**/masking-issues.test.ts'
node -c /Users/damian/GitHub/Helena/helena-states/profile.js
node -c /Users/damian/GitHub/Helena/helena-math/profile.js
```

Expected: all clean.

- [ ] **Step 2: Verify live deploys**

Open each in a browser:
- https://helena-learner-profile.vercel.app/ — homepage renders, /activity loads
- https://helena-spelling.vercel.app/ — Hub renders, profile banner works
- https://helena-states.vercel.app/ — mode picker renders
- https://helena-math.vercel.app/ — mode picker renders

In each, open DevTools and confirm zero schema-related errors in the console.

- [ ] **Step 3: Update PLATFORM.md to mention the package**

**Files:**
- Modify: `/Users/damian/GitHub/Helena/helena-learner-profile/docs/PLATFORM.md`

Add a section near the top:

```markdown
## Shared schema package

The canonical `ExportedProfile` schema and all cross-module helpers
(VARK preference rankings, mode recommendation, fragment codec,
telemetry readers) live in the `profile-schema` npm package. All
four apps depend on it:

- `helena-learner-profile` and `helena-spelling` via `npm install profile-schema`
- `helena-states` and `helena-math` via `<script src="https://cdn.jsdelivr.net/npm/profile-schema@1/dist/index.iife.js">`

The IIFE exposes `window.HelenaProfile` (capital H). The lowercase
`window.helenaProfile` is the per-app localStorage store and is
distinct.

Changing the schema is a coordinated publish: bump the package, then
update each consumer at its own cadence. Drift is no longer possible
by construction.

Spec: `docs/superpowers/specs/2026-05-26-shared-profile-schema-package-design.md`
Plan: `docs/superpowers/plans/2026-05-26-shared-profile-schema-package-plan.md`
```

- [ ] **Step 4: Commit + push the docs update**

```bash
cd /Users/damian/GitHub/Helena/helena-learner-profile
git add docs/PLATFORM.md
git commit -m "docs(platform): document the shared profile-schema package

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
git push
```

---

## Done

Acceptance criteria from the spec are now mechanically verifiable:

1. ✅ Package published at 1.0.0 (Task 14)
2. ✅ All four consumers import the package; local schema definitions removed (Tasks 13, 15, 16, 17)
3. ✅ `git grep "PROFILE_VERSION"` returns no duplicate const declarations (Task 18)
4. ✅ All existing tests pass post-migration (Task 21 step 1)
5. ✅ Drift simulation proves version contract holds (Task 20)
6. ✅ CDN smoke test confirms the bundle is served with the expected exports + browser runtime check passes (Task 19)

Next sub-project: **A — Rebrand from "Helena's"**. The package name and IIFE global name (`HelenaProfile`) will need updating as part of that work; that's now a single npm rename + deprecate flow, not four uncoordinated renames.
