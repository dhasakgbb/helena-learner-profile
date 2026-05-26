# Helena Platform — Architecture

Four-app ecosystem connected by a small versioned JSON contract.
Single intake. Three learning modules. No shared backend between modules.

---

## The shape

```
                ┌──────────────────────────────┐
                │  helena-learner-profile      │   SvelteKit + Vercel Postgres + zod
                │  ─ 28-question intake quiz   │
                │  ─ Parent dashboard          │
                │  ─ Item bank editor          │
                │  ─ /hub launcher             │   profile attached via URL fragment
                └──────────────┬───────────────┘
                               │
              ┌────────────────┼────────────────┬─────────────────┐
              ▼                ▼                ▼                 ▼
   ┌───────────────────┐ ┌───────────────────┐ ┌────────────────┐
   │  helena-spelling  │ │  helena-states    │ │  helena-math   │
   │  Svelte 5 + Vite  │ │  vanilla HTML/JS  │ │  vanilla HTML  │
   │  6 game modes     │ │  3 game modes     │ │  3 game modes  │
   │  Leitner          │ │  US map           │ │  arithmetic    │
   └───────────────────┘ └───────────────────┘ └────────────────┘
```

All three consumers read the **same** `ExportedProfile` JSON. All three write telemetry into `module_overrides.<module>.*` inside that same profile object.

---

## The contract — `ExportedProfile`

```json
{
  "version": 1,
  "generated_at": "2026-05-26T22:00:00.000Z",
  "expires_at":   "2026-07-25T22:00:00.000Z",
  "preferences": {
    "visual":      70,
    "auditory":    15,
    "read_write":  10,
    "kinesthetic":  5
  },
  "flags": {
    "reading":   "low",
    "writing":   "low",
    "math":      "medium",
    "attention": "low"
  },
  "needs_corroboration": {
    "reading":   false,
    "writing":   false,
    "math":      false,
    "attention": false
  },
  "strengths": ["I notice patterns that other people miss."],
  "plan":      "monitor",
  "module_overrides": {
    "spelling": { "followed": { "speed-spell": 3 }, "overrode": {}, "last_launches": [], "last_override_streak": 0 },
    "states":   { ... },
    "math":     { ... }
  },
  "source":      "intake_quiz",
  "child_label": "Helena"
}
```

### Field contract

| Field | Shape | Notes |
| --- | --- | --- |
| `version` | literal `1` | Bump for any breaking change; consumers can branch |
| `generated_at` / `expires_at` | ISO datetime | TTL is 60 days; `expires_at = generated_at + 60d` |
| `preferences.<mode>` | number `[0, 100]` | VARK percentages; need not sum to 100 |
| `flags.<domain>` | `'low' \| 'medium' \| 'high'` | Per-domain screening levels |
| `needs_corroboration.<domain>` | boolean | True when only kid-view was filled |
| `strengths` | `string[]` | Human-readable prompts, not item IDs |
| `plan` | `'strengths' \| 'monitor' \| 'schedule'` | Decision-tree output from intake |
| `module_overrides.<module>` | per-module namespace | Consumers write back here |
| `source` | enum | `intake_quiz` / `parent_edit` / `behavioral_observation` |
| `child_label` | string (≤40 chars) | Optional |

### Validation surfaces

| App | Validator | LOC |
| --- | --- | --- |
| helena-learner-profile | `exportedProfileSchema` (zod) | 1 schema definition |
| helena-spelling | `exportedProfileSchema` (zod, copied verbatim) | 1 schema definition |
| helena-states | hand-rolled `validate()` in `profile.js` | ~50 |
| helena-math | hand-rolled `validate()` in `profile.js` | ~50 |

When the contract evolves, update all four. Drift is the most likely failure mode going forward (see Ralph Loop 1 audit in this commit cycle).

---

## How the profile travels

### 1. Generated
Parent + child complete the 28-question intake at `helena-learner-profile.vercel.app`. The saved run lives in Vercel Postgres.

### 2. Distributed via URL fragment
Parent visits `/hub`. Each game tile is a link to the consuming app with the profile attached as a base64 URL **fragment** (not query parameter):

```
https://helena-spelling.vercel.app/#profile=<base64-encoded-profile>
```

Fragments are kept entirely client-side — never sent to a server, never logged in HTTP access logs, never in `Referer` headers. The kid's screening data stays private as it travels.

### 3. Imported + scrubbed
Each consumer's `profile.js` decodes the fragment on first paint, validates against the schema, persists to `localStorage`, and **immediately scrubs the fragment** from the URL via `history.replaceState`. A toast confirms the import.

### 4. Used as defaults
On the consumer's Hub, the matching mode tile gets a `RECOMMENDED` pip. Every 4th launch the pip rotates to the **secondary** preference (the comfort+stretch cadence). Other modes remain clickable — never locked.

### 5. Telemetry written back
Each launch records `followed[mode]++` or `overrode[mode]++` into `module_overrides.<module>.*`. The profile carries its own behavioral signal forward.

### 6. Re-exported
After play, the parent can download a fresh profile JSON with `source: 'behavioral_observation'`, refreshed timestamps, and telemetry baked in. Drop it back into another module — or eventually back into the learner-profile system — to keep the platform converging on what the kid actually engages with.

---

## Per-module mode → preference affinity

### Spelling (`helena-spelling/src/profile/schema.ts`)
```
speed-spell      → auditory
missing-letters  → read_write + visual
word-sort        → kinesthetic + visual
word-wheel       → kinesthetic + visual
boss-round       → agnostic (never recommended specifically)
```

### States (`helena-states/profile.js`)
```
roadtrip   → visual + kinesthetic
locate     → visual + kinesthetic
quiz       → read_write
spell      → read_write + auditory
adaptive   → agnostic
```

### Math (`helena-math/profile.js`)
```
times-tables → read_write
speed-add    → auditory
number-sort  → visual + kinesthetic
```

When you add a new module: pick a `MODE_AFFINITY` map first. Then the rest is mechanical.

---

## Discipline encoded in the architecture

| Rule | Where it's enforced |
| --- | --- |
| Profile sets defaults, never locks | All four apps keep every mode clickable; pip is decoration |
| Comfort + stretch cadence | `sessionIndex % 4 === 0` rotates the pip to secondary mode |
| Never adapt high-stakes content | Boss Round / Adaptive Quest have empty affinity — never recommended |
| 60-day TTL | `isProfileStale()` surfaces a yellow chip + nudge to re-take |
| Reactive correction | After 3 consecutive overrides, a banner suggests re-taking the intake |
| Source provenance | The `source` field travels through; downstream can weight `intake_quiz` differently from `behavioral_observation` |
| Versioned for evolvability | `version: 1` literal; v2 schemas branch on read |
| Private extension space | `module_overrides.<name>.*` lets modules add fields without polluting shared schema |
| URL fragments, not query params | Privacy by transport; client-only data flow |

---

## Adding a new consumer (the mechanical recipe)

```bash
mkdir helena-<subject>
cd helena-<subject>
cp ../helena-math/profile.js .                # ← byte-for-byte copy is fine
cp ../helena-math/styles.css .                # ← optional starting point
```

Edit `profile.js`:
1. Rename `helena-math:profile:v1` → `helena-<subject>:profile:v1`
2. Replace `MATH_MODES` with the modes you have
3. Replace `MODE_AFFINITY` map with your affinity choices
4. Rename `recommendedMathMode` → `recommended<Subject>Mode`
5. Rename `module_overrides.math` → `module_overrides.<subject>`

Build the actual gameplay. Add three lines per mode button:
```js
btn.addEventListener('click', () => {
  const recommended = hp.recommended<Subject>Mode(hp.profileStore.profile, hp.profileStore.sessionIndex);
  hp.profileStore.recordLaunch(mode, recommended);
  hp.profileStore.advanceSession();
  // ... your actual game-start code
});
```

Add the banner DOM + a `RECOMMENDED` pip CSS rule. Ship it. ~20 minutes.

---

## Privacy posture

- The producer app stores `parent.email`, `child.display_name`, `child.birth_year`, and run payloads in Vercel Postgres. Auth is bcrypt + JWT in `httpOnly` cookies.
- All four apps serve over HTTPS with strict transport security.
- The producer sends 6 security headers on every response (CSP, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy, COOP).
- Profile travels between apps via URL fragment — **not** sent to servers, **not** in HTTP logs, **not** in `Referer`.
- Each consumer scrubs the fragment from its URL immediately on import.
- No analytics, no third-party scripts beyond Google Fonts (producer + spelling only).
- localStorage is the only at-rest store on consumers — opt-out via the "Forget" button in each banner.

---

## Out of scope (deliberately)

- Server-side telemetry aggregation across modules
- Multi-child accounts per parent (data model supports it; UI doesn't surface yet)
- Email magic-link / password reset (manual recovery only in v1)
- Mobile app wrapper (PWA-installable instead)
- A/B testing or randomized assignment to modes
- Any clinical-screening claim

The platform exists for **one family**. It's intentionally over-engineered just enough to be portable to a second family if anyone wants to fork it.
