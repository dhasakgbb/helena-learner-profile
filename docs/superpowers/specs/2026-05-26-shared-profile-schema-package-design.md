# Shared profile-schema package — design

**Status:** approved 2026-05-26
**Sub-project ID:** D (first of six commercial-rollout sub-projects)
**Sub-project size estimate:** ~2 engineering days
**Depends on:** nothing
**Blocks:** nothing critical — clears tech debt and reduces drift risk for every sub-project below

## Context

The Helena learning platform is four separate repositories that all consume
the same canonical `ExportedProfile` JSON contract:

| Repo | Today's validator |
|------|-------------------|
| `helena-learner-profile` | `src/lib/profile/schema.ts` (zod, canonical) |
| `helena-spelling` | `src/profile/schema.ts` (zod, hand-mirrored from canonical) |
| `helena-states` | `profile.js` — hand-rolled `validate()` in vanilla JS |
| `helena-math` | `profile.js` — hand-rolled `validate()` in vanilla JS |

This is four sources of truth. The drift has already caused real bugs twice:

1. Ralph Loop 1 in past sessions specifically existed to chase "schema drift
   across 3 validators."
2. The stale base64 encoding-contract comment (`'+/=' → '-_~'`) in the hub
   misled what every consumer must implement on decode.

As we move toward a commercial product (sub-projects A–F), every future
schema change has to land in four places without drift. That's a tax we
should pay down before scaling content, billing, or compliance work.

## Goal

One canonical schema package — published — that all four repos import.
The four local validators are deleted.

## Non-goals

- Renaming the package away from a "Helena" working title. That's
  sub-project A.
- Migrating to a monorepo. Possible later; out of scope now.
- DB / server-side profile persistence. Sub-project C.
- Removing zod from the Svelte apps that already use it.
- Adding new schema fields. The contract stays at `PROFILE_VERSION = 1`.

## Audience and timing

Audience for the platform (locked in Section 1 of this brainstorm):
**B2C parents, homeschool-tilted**. This sub-project does not gate any
audience choice — the schema is the same regardless — but the priority
ordering is: D → A → B → C → E → F.

## Package contents

```
profile-schema/                  (working name; final name set in A)
├── src/
│   ├── schema.ts        zod schema, ExportedProfile type, PROFILE_VERSION
│   ├── helpers.ts       topPreference, secondPreference, isProfileStale
│   ├── recommend.ts     recommendedSpellingMode, recommendedStatesMode,
│   │                    recommendedMathMode + MODE_AFFINITY tables
│   ├── fragment.ts      encodeProfileFragment, decodeProfileFragment
│   │                    (URL-safe base64; matches existing contract)
│   └── telemetry.ts     readTelemetry, totalLaunches, followRate,
│                        modesBy, prettyMode
├── dist/                (generated)
│   ├── index.mjs        ESM build
│   ├── index.cjs        CommonJS build (for Node test runners)
│   ├── index.iife.js    IIFE bundle exposing `window.HelenaProfile`
│   └── index.d.ts       TypeScript declarations
├── tests/
│   ├── schema.test.ts
│   ├── telemetry.test.ts
│   ├── fragment.test.ts
│   └── round-trip.test.ts
└── package.json
```

### Public API

```ts
// schema.ts
export const PROFILE_VERSION = 1;
export const exportedProfileSchema: z.ZodType<ExportedProfile>;
export type ExportedProfile = { /* … */ };

// helpers.ts
export function topPreference(p: ExportedProfile): VarkChannel | null;
export function secondPreference(p: ExportedProfile): VarkChannel | null;
export function isProfileStale(p: ExportedProfile, now?: Date): boolean;

// recommend.ts
export const MODE_AFFINITY: {
  spelling: Record<SpellingMode, VarkChannel[]>;
  states:   Record<StatesMode,   VarkChannel[]>;
  math:     Record<MathMode,     VarkChannel[]>;
};
export function recommendedSpellingMode(p: ExportedProfile, sessionIndex: number): SpellingMode | null;
export function recommendedStatesMode(p: ExportedProfile, sessionIndex: number): StatesMode | null;
export function recommendedMathMode(p: ExportedProfile, sessionIndex: number): MathMode | null;

// fragment.ts
export function encodeProfileFragment(p: ExportedProfile): string;
export function decodeProfileFragment(token: string): string | null;

// telemetry.ts
export function readTelemetry(p: ExportedProfile, moduleKey: string): ModuleTelemetry | null;
export function totalLaunches(t: ModuleTelemetry): number;
export function followRate(t: ModuleTelemetry): number;
export function modesBy(t: ModuleTelemetry): ModuleRow[];
export function prettyMode(mode: string): string;
```

### IIFE namespace

Vanilla apps load via `<script>` and consume from `window.HelenaProfile`:

```js
window.HelenaProfile = {
  PROFILE_VERSION,
  exportedProfileSchema,
  topPreference, secondPreference, isProfileStale,
  MODE_AFFINITY,
  recommendedSpellingMode, recommendedStatesMode, recommendedMathMode,
  encodeProfileFragment, decodeProfileFragment,
  readTelemetry, totalLaunches, followRate, modesBy, prettyMode
};
```

Naming note: vanilla apps today already use `window.helenaProfile`
(lowercase `h`) for their own per-app store. The package deliberately uses
`HelenaProfile` (capital `H`) to avoid collision. App-level code keeps
its lowercase namespace.

## Distribution

- Publish to public npm. The schema isn't secret IP, and private packages
  add credential management to four separate repos with no benefit.
- Build with `tsup` — dual ESM + CJS + IIFE + types, ~30-line config.
- CDN consumption for vanilla apps: pin major version via jsDelivr:
  `<script src="https://cdn.jsdelivr.net/npm/profile-schema@1/dist/index.iife.js"></script>`
- GitHub Actions workflow publishes on git tag (`v1.0.0` etc).

## Migration plan, per consumer

Order matters: ship the package first, then update consumers one at a
time. Don't touch all four in a single landing.

### Step 1 — Create the package

Pre-publish via `npm link` or `file:../profile-schema` first; only publish
`1.0.0` to npm AFTER `helena-learner-profile` (Step 2) successfully runs
its full test suite against the locally-linked package. This avoids
bumping to `1.0.1` immediately when the first real consumer surfaces a
tweak.

1. New repo (or directory within a planned monorepo — out of scope; new
   repo for now).
2. Copy `helena-learner-profile/src/lib/profile/schema.ts` → `src/schema.ts`,
   minus the `STRENGTHS_ITEMS` import (that's specific to the producer and
   does not belong in the contract package).
3. Copy `helena-learner-profile/src/lib/profile/telemetry.ts` → `src/telemetry.ts`.
4. Lift `topPreference`, `secondPreference`, `isProfileStale`,
   `recommendedSpellingMode`, `MODE_AFFINITY` from the existing producer
   files into `src/helpers.ts` and `src/recommend.ts`. Cross-reference the
   matching code in `helena-spelling/src/profile/schema.ts` and the two
   vanilla `profile.js` files to ensure no behavioural drift in the
   consolidated version.
5. Lift the `recommendedStatesMode` and `recommendedMathMode` definitions
   from `helena-states/profile.js` and `helena-math/profile.js`
   respectively into `src/recommend.ts`.
6. Lift `decodeProfileFragment` (already in `helena-learner-profile`) and
   add the mirror `encodeProfileFragment` (currently inlined in
   `helena-learner-profile/src/routes/hub/+page.svelte` and each consumer's
   "View activity" button).
7. Wire `tsup.config.ts`, `package.json`, `vitest.config.ts`. Move existing
   tests from `helena-learner-profile/src/lib/profile/*.test.ts`. Add a
   round-trip test (`encode → decode → parse` deep-equals input).
8. Publish v1.0.0 to npm.

### Step 2 — Migrate `helena-learner-profile`

1. `npm install profile-schema@1`.
2. Re-export from `src/lib/profile/schema.ts`:
   ```ts
   export * from 'profile-schema';
   ```
   (Keeps existing imports working without touching every callsite.)
3. Delete `src/lib/profile/telemetry.ts`; replace with re-export.
4. Run full test suite, fix any divergences.
5. After tests pass, optionally delete the re-export shims and update
   callsites directly.
6. Commit, deploy.

### Step 3 — Migrate `helena-spelling`

1. `npm install profile-schema@1`.
2. Replace `src/profile/schema.ts` (delete the local zod schema, keep the
   Svelte-runes store wrapper, point types at the package).
3. The store (`store.svelte.ts`) keeps its Svelte-runes shape since runes
   are framework-specific; only the validation/types get swapped.
4. Run full test suite, fix divergences.
5. Commit, deploy.

### Step 4 — Migrate `helena-states`

1. Add `<script src="https://cdn.jsdelivr.net/npm/profile-schema@1/dist/index.iife.js"></script>`
   to `index.html` BEFORE `profile.js`.
2. Update `profile.js` to call `window.HelenaProfile.exportedProfileSchema.safeParse(raw)`
   instead of the local hand-rolled `validate()`.
3. Replace local copies of `recommendedStatesMode`, `topPreference`,
   `secondPreference`, `isProfileStale` with calls into `window.HelenaProfile`.
4. Keep the existing per-app store (`window.helenaProfile`, lowercase) — it
   wraps localStorage + cross-tab sync + the package's pure helpers.
5. Manually verify deployment.

### Step 5 — Migrate `helena-math`

Same pattern as Step 4. The two vanilla apps share the same shape;
expect the diff to be nearly identical.

### Step 6 — Verify no schema definitions remain outside the package

```bash
git grep -l "PROFILE_VERSION" helena-learner-profile helena-spelling helena-states helena-math
```

Should return only the re-export shims. The constant lives in the package.

## Error handling

| Concern | Behavior |
|---------|----------|
| Invalid profile JSON | `schema.safeParse()` returns `{ success: false, error }` — never throws. Callers branch on `success`. |
| Decode failure (bad base64, bad URI, truncated) | `decodeProfileFragment()` returns `null`. Already the contract. |
| Missing module_overrides slot | `readTelemetry()` returns `null`. Already the contract. |
| Network failure loading IIFE on vanilla apps | `window.HelenaProfile === undefined` → vanilla `profile.js` falls back to a no-op renderer (no profile banner, no recommendations). The game still runs. |

## Testing

| Suite | Lives in | Covers |
|-------|----------|--------|
| Schema tests | `tests/schema.test.ts` | All required fields, all enums, all bounds (preferences 0–100, dates ISO, etc.) |
| Telemetry tests | `tests/telemetry.test.ts` | Defensive coercion (negative, NaN, non-string, missing) |
| Fragment tests | `tests/fragment.test.ts` | Encode/decode round-trip, URL-safe character handling, all three padding lengths, bogus input |
| Round-trip test | `tests/round-trip.test.ts` | `valid profile → encode → decode → parse → deep-equal input` |
| Each consumer | (untouched) | Integration tests stay where they are; schema unit tests get deleted from consumers |

Existing test counts (helena-learner-profile = 98) should stay at or above
their current level after migration. New round-trip test adds at least one.

## Acceptance criteria

1. Package published to npm at `1.0.0`.
2. All four consumers import (or `<script src>`) the package; their local
   schema definitions are gone (re-export shims are allowed in TS apps).
3. `git grep -l "PROFILE_VERSION" helena-*` returns only the package
   itself or re-export shims, never duplicate const declarations.
4. All existing tests pass in all four repos after migration.
5. Drift smoke test: bump a field in the package and re-publish — verify
   one un-bumped consumer keeps passing its tests until it pulls the new
   version. This proves the version contract holds.
6. CDN smoke test: load the IIFE from jsDelivr in a hand-crafted HTML
   file and verify `window.HelenaProfile.exportedProfileSchema.safeParse({})`
   returns a failure (not a thrown error).

## Risks and mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| jsDelivr outage breaks vanilla apps' boot | low | Vanilla `profile.js` already handles `window.HelenaProfile === undefined` gracefully (no profile, default mode picker still works). |
| IIFE bundle size grows once zod is bundled | medium | Verified ~10 KB gzipped. Acceptable for the simplification it buys. Re-evaluate if it crosses 30 KB. |
| Schema bump cascades into four PRs | high | This is the *intended* trade-off — drift is now impossible by construction. Use SemVer carefully; major bumps are rare. |
| Naming collision with `window.helenaProfile` (lowercase, in-app store) | resolved | Package uses capital `H` (`HelenaProfile`). App-level lowercase namespace untouched. |
| The package name itself is temporary (sub-project A will rename) | high | Use a working name now (`profile-schema` or similar); the npm rename later is one PR + deprecate-the-old-name flow. |

## Open questions (intentionally left for writing-plans)

- Which exact tsup config? (Bundled vs. external zod, sourcemap on/off.)
- Which test runner — vitest (matches existing repo) or node:test? Probably vitest for consistency.
- CI: GitHub Actions yaml shape, secrets management for npm token, release tag conventions.
- Should the package include a `BREAKING_CHANGES.md` log up front, or wait until first breaking bump?

These are tactical and belong in the implementation plan, not the design.

## Done = ready to hand to sub-project A (rebrand)

Once acceptance criteria are met, the rebrand work can rename the npm
package as part of its scope without re-touching the four consumers'
schema logic. That's the actual proof this design works.
