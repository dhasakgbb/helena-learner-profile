# Astrid rebrand — design

**Status:** approved 2026-05-26
**Sub-project ID:** A (second of six commercial-rollout sub-projects)
**Sub-project size estimate:** ~7.5 engineering days, three phases
**Depends on:** D (shared profile-schema package — done)
**Blocks:** all customer-facing work below (B compliance, C billing, F marketing site)

## Context

The platform currently uses "Helena" / "Helena's …" everywhere — repos, copy,
package names, code comments, vercel project names, GitHub URLs. Going
commercial requires lifting that placeholder and giving the platform a real
brand that can hold a marketing site, a billing flow, and a parent's trust.

Sub-project D shipped the technical foundation (one shared schema package,
no drift). Sub-project A now rebrands the surface so everything below
(B, C, F) can ship under a real name.

## Brand decisions

| Slot | Value |
|------|-------|
| Brand name | **Astrid** |
| Mascot | existing cyan-glow robot (`Spelling/src/components/MascotSVG.svelte`), used identically across all 4 apps |
| Domain | **deferred** (intent: `astrid.kids` — verified available — but not registered in this sub-project) |
| GitHub org | `astrid-learn` |
| Distribution | git tag + jsDelivr-from-gh (mirrors sub-project D pattern; no npm publish) |
| Cross-app metaphor | "Astrid takes you to different places — Spell Lab, Map Room, Number Garden, the Assessment. She doesn't change; the rooms around her do." |

### Why "Astrid"

- Already present in the codebase (`SPELL_MASTER_ASTRID` in `Hub.svelte`).
- Strong children's-literature tailwind (Astrid Lindgren / Pippi Longstocking).
- Mascot-first branding outperforms abstract coined words for kids-edu
  (Duolingo > Duo, ClassDojo > monsters, Mailchimp > Freddie).
- The robot mascot tells the VARK-adaptation story visually without
  explanation: "Astrid figures out how your kid learns."

### Why mascot identical (no costume variants)

The user explicitly chose: each app keeps its own visual personality, Astrid
travels between them with the same look. The tension between Astrid's
cyan-glow appearance and each app's distinct theme is the design *signal*
— it marks her as the constant across worlds. Costume variants would
multiply assets 4× (8 poses × 4 themes = 32) and dilute brand consistency
for no gain.

### Why domain deferred

User-directed. Domain registration is one DNS form away and can land any
time. Decoupling it from this sub-project's code/asset work avoids
blocking on payment / WHOIS / TLD-registry timing.

## Architecture: three sequenced phases

Each phase is independently shippable, but they're sequential — A1
unblocks A2, A2 unblocks A3.

| Phase | Scope | Estimate |
|-------|-------|----------|
| **A1** | Infra rename across all 5 repos and Vercel projects | ~1.5 days |
| **A2** | New `astrid-mascot` distribution package (sibling to `profile-schema`) | ~3 days |
| **A3** | Integrate Astrid into all 4 apps + "Helena" → "Astrid" copy sweep | ~3 days |

Total: ~7.5 days.

---

## A1 — Infra rename

### Goals

1. Move all 5 repos to a clean `astrid-learn` GitHub org.
2. Update every cross-repo reference (package.json git URLs, jsDelivr CDN
   URLs, Vercel project links, README badges) to the new paths.
3. Sweep "Helena" out of code-level identifiers (variables, comments,
   filenames). Historic-context references in docs/PLATFORM.md are
   acceptable to keep.

### Repos and their new names

| Today | New |
|-------|-----|
| `dhasakgbb/profile-schema` | `astrid-learn/profile-schema` (no rename, just transfer) |
| `dhasakgbb/helena-learner-profile` | `astrid-learn/learner-profile` |
| `dhasakgbb/helena-spelling` (working tree `Spelling/`) | `astrid-learn/spelling` |
| `dhasakgbb/helena-states` | `astrid-learn/states` |
| `dhasakgbb/helena-math` | `astrid-learn/math` |

### Order of operations

1. Create `github.com/astrid-learn` organization.
2. Transfer each repo in sequence: `gh repo transfer`. GitHub auto-installs
   permanent redirects from the old URL to the new one (covers git
   remotes, clone URLs, raw URLs, jsDelivr-from-gh URLs).
3. For each repo, update its local `git remote set-url origin` to the new path.
4. Update all `package.json` `dependencies` entries that reference git URLs
   (profile-schema in 2 TS consumers).
5. Update jsDelivr `<script src>` tags in 2 vanilla apps to the new path.
6. Update Vercel project names (rename via dashboard or `vercel link`).
   Accept that `<old>.vercel.app` URLs will change.
7. Update cross-app links in code: any hard-coded `helena-*.vercel.app`
   URLs (the "View activity" buttons, "Back to Hub" links, etc.) get
   updated to the new Vercel URLs.
8. Sweep `git grep -i "helena"` across all 5 repos and update or remove
   each hit. Allowed remaining: historic-context paragraphs in PLATFORM.md
   that explain the project's origin.

### Acceptance criteria

- `gh repo list astrid-learn` shows all 5 repos.
- `git -C <repo> remote -v` for each working tree points at the new origin.
- Old GitHub URLs redirect (HTTP 301) to the new ones (auto by GitHub).
- jsDelivr serves `https://cdn.jsdelivr.net/gh/astrid-learn/profile-schema@v1.0.0/dist/index.iife.js` with HTTP 200.
- All 4 consumer test suites pass after the rename (no broken imports).
- All 4 live deploys return HTTP 200 on their new Vercel URLs.
- `git grep -in "helena" -- ':!docs/' ':!*.md'` across all 5 repos returns zero hits.

### Risks

- **Vercel URL change breaks external bookmarks.** Acceptable pre-revenue.
- **GitHub transfer is reversible.** Low risk if name turns out wrong; just transfer back.
- **Trademark on "Astrid" not cleared in this sub-project.** Acceptable for MVP / paid pilots with friendly families; required before any paid marketing spend. Tracked as a follow-up.

---

## A2 — Astrid mascot package

### Goals

1. Move `MascotSVG.svelte` out of the Spelling repo and into a shared,
   versioned package that any of the four apps can consume.
2. Add four new poses bringing the set from 4 to 8.
3. Distribute via the same git-tag + jsDelivr pattern as `profile-schema`,
   so vanilla and TS apps consume from one source of truth.

### Package shape

```
astrid-mascot/                            (new repo: astrid-learn/astrid-mascot)
├── src/
│   ├── poses/
│   │   ├── idle.ts              ← existing (ported from MascotSVG.svelte 'idle' mood)
│   │   ├── happy.ts             ← existing (ported from 'happy' mood)
│   │   ├── sad.ts               ← existing (ported from 'sad' mood)
│   │   ├── wow.ts               ← existing (ported from 'wow' mood)
│   │   ├── waving.ts            ← NEW
│   │   ├── thinking.ts          ← NEW
│   │   ├── sleeping.ts          ← NEW
│   │   └── cheering.ts          ← NEW
│   ├── tokens.ts                ← exported color tokens (cyan body, glow colors, screen gradients)
│   ├── component.svelte         ← Svelte 5 component wrapper: <AstridMascot pose="idle" />
│   ├── index.ts                 ← ESM barrel
│   └── iife-entry.ts            ← IIFE bundle entry
├── dist/                         (committed; mirrors profile-schema git-tag distribution)
│   ├── index.mjs
│   ├── index.cjs
│   ├── index.d.ts
│   └── index.iife.js
├── tests/
└── package.json
```

### Pose character notes (drives the SVG variations)

| Pose | Use case |
|------|----------|
| **idle** | default/Hub home, neutral expression |
| **happy** | correct-answer feedback |
| **sad** | wrong-answer / encouragement state |
| **wow** | achievement / milestone moment |
| **waving** | first-paint greeting on landing |
| **thinking** | assessment / quiz / question-presented state |
| **sleeping** | no-activity / inactivity nudge |
| **cheering** | end-of-session celebration |

The 4 new poses reuse the existing SVG body geometry from `MascotSVG.svelte`
— only the eye expression, mouth/screen content, and small accessory
elements change per pose. No new illustrator commission required.

### Public API

```ts
// ESM (TS apps consume via `github:astrid-learn/astrid-mascot#v1.0.0` in package.json)
import { AstridMascot } from 'astrid-mascot';   // Svelte component
import { svgFor, POSES, tokens } from 'astrid-mascot'; // raw helpers

// IIFE (vanilla apps via window.AstridMascot)
window.AstridMascot = {
  POSES,                 // ['idle', 'happy', ..., 'cheering']
  svgFor(pose: string),  // returns SVG string
  renderInto(node, opts) // appends SVG to a DOM node
};
```

Distribution and naming mirror sub-project D exactly: package.json
`"name": "astrid-mascot"` (no npm scope), consumer dep specs as
`"astrid-mascot": "github:astrid-learn/astrid-mascot#v1.0.0"`, IIFE
served from `cdn.jsdelivr.net/gh/astrid-learn/astrid-mascot@v1.0.0/...`.
No npm publish; the package is provisional under this name and will
be re-evaluated alongside `profile-schema` if/when we move to a
registered scope.

### Distribution

- Build with `tsup` (same config shape as profile-schema)
- Publish via git tag `v1.0.0` on `github.com/astrid-learn/astrid-mascot`
- TS consumers depend via `package.json`: `"astrid-mascot": "github:astrid-learn/astrid-mascot#v1.0.0"`
- Vanilla consumers load via `<script src="https://cdn.jsdelivr.net/gh/astrid-learn/astrid-mascot@v1.0.0/dist/index.iife.js">`

### Acceptance criteria

- `astrid-mascot` (in `github.com/astrid-learn/astrid-mascot`) published as git tag `v1.0.0` with `dist/` populated
- All 8 poses available; each produces parseable, well-formed SVG
- Three consumption paths verified (Svelte import / ESM import / IIFE script)
- jsDelivr serves the IIFE at the documented URL
- At least one unit test per pose (snapshot or DOM-shape assertion)
- Color tokens exported and importable (used by app code that wants to match Astrid's cyan elsewhere)

---

## A3 — Place Astrid in each app

### Goals

1. Every app shows Astrid in its home/hub view.
2. Every app shows Astrid in its end-of-session view (where one exists).
3. Spelling deletes its local mascot files; uses the shared package.
4. "Helena" / "Helena's" copy is replaced platform-wide.

### Per-app integration

#### `astrid-learn/spelling` (was Spelling/)

- Delete `src/components/Mascot.svelte` and `src/components/MascotSVG.svelte`
- Replace with `import { AstridMascot } from 'astrid-mascot'` after adding the dep `"astrid-mascot": "github:astrid-learn/astrid-mascot#v1.0.0"`
- The `SPELL_MASTER_ASTRID` placeholder in `Hub.svelte` becomes the proper
  "Astrid" label — possibly with a friendlier display name like "Astrid"
  alone or "Hi, I'm Astrid"
- Welcome flow copy: "Helena's Spelling Game" → "Astrid's Spell Lab" (or
  similar, finalized in the implementation plan)

#### `astrid-learn/learner-profile` (was helena-learner-profile/)

- Add `AstridMascot` to:
  - the welcome page hero (`src/routes/+page.svelte`)
  - the explore-quiz screen (Astrid asks the questions)
  - the results page
  - the parent dashboard header
  - the hub page (`src/routes/hub/+page.svelte`) — Astrid as the launcher
- Copy sweep: "Helena's Learner Profile" → "Astrid's Quiz" (or similar)

#### `astrid-learn/states` (was helena-states/)

- Add `<script src="cdn.jsdelivr.net/.../astrid-mascot@v1.0.0/dist/index.iife.js">`
- Astrid appears on the home / mode-selection view (alongside or replacing the compass logo)
- Astrid appears on the end-of-session screen
- Copy sweep: "Capitals Quest" → "Astrid's Map Room"

#### `astrid-learn/math` (was helena-math/)

- Same IIFE pattern as states
- Astrid on mode-selection view + end-of-round summary
- Copy sweep: "Helena's Math Practice" → "Astrid's Number Garden"

### App-by-app naming (working draft; finalize in plan)

| App | Display name |
|-----|--------------|
| learner-profile | Astrid's Quiz |
| spelling | Astrid's Spell Lab |
| states | Astrid's Map Room |
| math | Astrid's Number Garden |

### Acceptance criteria

- Each of the 4 apps imports the mascot from the shared package — no local mascot files anywhere
- Astrid is visible in the home view of each app
- Astrid is visible in the end-of-session view where one exists
- Copy sweep complete: no user-facing "Helena" strings remain in any of the 4 apps
- Each app's existing visual theme is preserved (no palette unification, per design call)
- All test suites still green; all live deploys still 200 OK
- The 4 cross-app links (back-to-hub, take-the-quiz, view-activity) point at the new Vercel URLs

---

## Cross-cutting acceptance criteria

1. `gh repo list astrid-learn` returns the 5 repos.
2. `git grep -in "helena" -- ':!docs/' ':!*.md'` across all 5 repos returns zero hits.
3. `astrid-mascot` v1.0.0 (from `github.com/astrid-learn/astrid-mascot`) consumed by all 4 apps via the established git+https/jsDelivr distribution pattern.
4. All 4 live deploys return HTTP 200 on their (possibly new) Vercel URLs.
5. PLATFORM.md updated to describe the Astrid platform — mention the brand, the mascot, the four apps and their per-room names.

## Out of scope (explicit YAGNI)

- Domain registration (deferred; intent is `astrid.kids` later)
- Trademark search and clearance (required before paid marketing; not blocking MVP)
- Mascot costume variants per app (explicitly rejected)
- Palette unification across apps (explicitly rejected)
- Marketing-site landing page (sub-project F)
- Astrid voice/personality content guidelines (separate workstream)
- Logo lockup or wordmark beyond what the SVG mascot provides
- Animated mascot transitions between poses (future work)
- Multi-tenant accounts, billing, COPPA (sub-projects B, C)

## Open questions intentionally left for writing-plans

- Exact SVG diffs between idle and the 4 new poses (eye shape, mouth content). The implementation plan will spec each pose's SVG markup precisely.
- Vercel rename procedure: rename in-place vs. create new + redirect. Plan will pick based on what the dashboard supports.
- Whether to keep the old `dhasakgbb/profile-schema` git tag working or fully migrate (consumers' lockfiles still reference the old path; we can leave them until the next package version bump, or update at this rename).
- Per-app naming finalization (the "Spell Lab / Map Room / Number Garden" draft might evolve).

## Handoff

After user approval of this design, invoke `writing-plans` to produce a
single implementation plan with three phased sections (A1, A2, A3), one
sub-section per task, following the same shape as the sub-project D plan.
