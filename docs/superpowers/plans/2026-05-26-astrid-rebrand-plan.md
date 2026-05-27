# Astrid Rebrand — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand the platform from "Helena's …" everywhere to **Astrid** — a mascot-first brand built around the existing cyan-glow robot in `Spelling/src/components/MascotSVG.svelte`. Transfer all 5 repos to a new `astrid-learn` GitHub org, publish a shared `astrid-mascot` distribution package (mirroring `profile-schema`), integrate the mascot into all 4 apps, and sweep "Helena" code-level references.

**Architecture:** Three sequenced phases. **A1** transfers GitHub repos + updates cross-repo dep URLs + Vercel projects + code-level "Helena" → "Astrid" sweep. **A2** ships a new `astrid-mascot` git-tagged package (8 poses, ESM + CJS + IIFE builds, jsDelivr-from-gh distribution, same pattern as `profile-schema`). **A3** removes local mascot files from Spelling and integrates Astrid into the other three apps via the package. Each app keeps its own visual theme — the mascot is the only thing unified.

**Tech Stack:** TypeScript 5+, Svelte 5, tsup 8+, vitest 1+, Node 20+. Distribution via git tag + jsDelivr CDN. GitHub `gh` CLI for org/repo operations. Vercel CLI for project renames.

**Spec:** `/Users/damian/GitHub/Helena/learner-profile/docs/superpowers/specs/2026-05-26-astrid-rebrand-design.md`

---

## Phase A1 — Infra rename

### Task 1: Rename the four `helena-*` repos in place under `dhasakgbb`

**Decision:** Skip the GitHub org. Keep everything under `dhasakgbb` (the existing personal account). The rebrand goal — "Helena" out of public URLs — is satisfied by in-place repo renames; an org adds friction (web-UI creation gate) for no concrete benefit pre-revenue.

**Files (mechanical infra ops, no local files):**
- 4 GitHub repos renamed in place
- `profile-schema` stays at `dhasakgbb/profile-schema` (no change)

- [ ] **Step 1: Rename the four `helena-*` repos in place**

```bash
gh api -X PATCH /repos/dhasakgbb/helena-learner-profile -f name=learner-profile
gh api -X PATCH /repos/dhasakgbb/helena-spelling -f name=spelling
gh api -X PATCH /repos/dhasakgbb/helena-states -f name=states
gh api -X PATCH /repos/dhasakgbb/helena-math -f name=math
```

GitHub auto-installs 301 redirects from each old URL. Existing clones, jsDelivr URLs that referenced the old name (none did — only `profile-schema` is on jsDelivr, and it didn't change), and Vercel webhooks continue working via the redirect during the transition.

- [ ] **Step 2: Verify each rename succeeded**

```bash
for new in learner-profile spelling states math; do
  echo -n "$new: "
  gh api repos/dhasakgbb/$new --jq '.name' 2>&1 | head -1
done
```

Expected: each line prints the new name back. If any rename failed (e.g., name taken under your account), surface BLOCKED with the offending name.

- [ ] **Step 3: Verify the old URLs redirect**

```bash
for old in helena-learner-profile helena-spelling helena-states helena-math; do
  code=$(curl -sI -o /dev/null -w "%{http_code}" -m 5 "https://github.com/dhasakgbb/$old")
  echo "$old: HTTP $code"
done
```

Expected: each prints `HTTP 301` (redirect to new location).

- [ ] **Step 4: Commit nothing — this task is GitHub-side only.**

No local commits. Move to Task 2.

---

### Task 2: Update local git remotes for all 5 repos

**Files:**
- Modify: 5 working trees' `.git/config` remotes

- [ ] **Step 1: For each repo, set the new origin URL**

```bash
git -C /Users/damian/GitHub/Helena/profile-schema remote set-url origin https://github.com/dhasakgbb/profile-schema.git
git -C /Users/damian/GitHub/Helena/learner-profile remote set-url origin https://github.com/dhasakgbb/learner-profile.git
git -C /Users/damian/GitHub/Helena/spelling remote set-url origin https://github.com/dhasakgbb/spelling.git
git -C /Users/damian/GitHub/Helena/states remote set-url origin https://github.com/dhasakgbb/states.git
git -C /Users/damian/GitHub/Helena/math remote set-url origin https://github.com/dhasakgbb/math.git
```

Note: working-tree directory names (`helena-learner-profile/`, `Spelling/`, etc.) are NOT renamed in this task. Renaming local directories breaks editor projects and shell history; the implementer can rename later if desired. The git remote is what consumers (CI, Vercel) read.

- [ ] **Step 2: Verify each remote**

```bash
for d in profile-schema helena-learner-profile Spelling helena-states helena-math; do
  echo "=== $d ==="
  git -C /Users/damian/GitHub/Helena/$d remote -v
done
```

Each entry's URL should start with `https://github.com/dhasakgbb/`.

- [ ] **Step 3: Smoke-test a fetch from each new remote**

```bash
for d in profile-schema helena-learner-profile Spelling helena-states helena-math; do
  echo "=== $d ==="
  git -C /Users/damian/GitHub/Helena/$d fetch origin --dry-run 2>&1 | head -3
done
```

Expected: no errors. Each prints "From https://github.com/dhasakgbb/..." or silent success.

- [ ] **Step 4: No commit — this is local-config only.**

---

### Task 3: Update package.json git deps + jsDelivr URLs across the 4 consumers

**Files:**
- Modify: `/Users/damian/GitHub/Helena/learner-profile/package.json`
- Modify: `/Users/damian/GitHub/Helena/spelling/package.json`
- Modify: `/Users/damian/GitHub/Helena/states/index.html`
- Modify: `/Users/damian/GitHub/Helena/math/index.html`

- [ ] **Step 1: Update helena-learner-profile dep**

Open `/Users/damian/GitHub/Helena/learner-profile/package.json`. Find the `profile-schema` dep entry (look for `dhasakgbb/profile-schema` or `github:dhasakgbb`) and change it to:

```json
"profile-schema": "github:dhasakgbb/profile-schema#v1.0.0"
```

Then:

```bash
cd /Users/damian/GitHub/Helena/learner-profile
npm install
```

This refetches the dep from the new URL into node_modules.

- [ ] **Step 2: Update Spelling dep**

Same change in `/Users/damian/GitHub/Helena/spelling/package.json`:

```json
"profile-schema": "github:dhasakgbb/profile-schema#v1.0.0"
```

Then:

```bash
cd /Users/damian/GitHub/Helena/spelling
npm install
```

- [ ] **Step 3: Update states CDN URL**

Open `/Users/damian/GitHub/Helena/states/index.html`. Find the line:

```html
<script src="https://cdn.jsdelivr.net/gh/dhasakgbb/profile-schema@v1.0.0/dist/index.iife.js" crossorigin="anonymous"></script>
```

Replace `dhasakgbb` with `astrid-learn`:

```html
<script src="https://cdn.jsdelivr.net/gh/dhasakgbb/profile-schema@v1.0.0/dist/index.iife.js" crossorigin="anonymous"></script>
```

- [ ] **Step 4: Update math CDN URL**

Same change in `/Users/damian/GitHub/Helena/math/index.html`.

- [ ] **Step 5: Verify each consumer still resolves the package**

```bash
cd /Users/damian/GitHub/Helena/learner-profile && node -e "console.log(require.resolve('profile-schema'))"
cd /Users/damian/GitHub/Helena/spelling && node -e "console.log(require.resolve('profile-schema'))"
```

Both should print a path under their own `node_modules/profile-schema/`.

For the vanilla apps, smoke-test the CDN:

```bash
curl -sI https://cdn.jsdelivr.net/gh/dhasakgbb/profile-schema@v1.0.0/dist/index.iife.js | head -1
```

Expected: `HTTP/2 200`.

- [ ] **Step 6: Commit the 4 changes**

```bash
cd /Users/damian/GitHub/Helena/learner-profile
git add package.json package-lock.json
git commit -m "chore(deps): repoint profile-schema dep at astrid-learn org

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"

cd /Users/damian/GitHub/Helena/spelling
git add package.json package-lock.json
git commit -m "chore(deps): repoint profile-schema dep at astrid-learn org

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"

cd /Users/damian/GitHub/Helena/states
git add index.html
git commit -m "chore: repoint profile-schema CDN at astrid-learn org

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"

cd /Users/damian/GitHub/Helena/math
git add index.html
git commit -m "chore: repoint profile-schema CDN at astrid-learn org

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

Don't push yet — Task 8 batch-pushes everything after the full sweep.

---

### Task 4: Inventory cross-app hard-coded URLs in source

The four apps link to each other via hard-coded `helena-*.vercel.app` URLs. Vercel project renames in Task 5 will change those URLs. This task only *inventories* them; the rewrites happen in Task 5 once new URLs are known.

- [ ] **Step 1: Inventory every helena-*.vercel.app URL in source**

```bash
cd /Users/damian/GitHub/Helena
for d in profile-schema helena-learner-profile Spelling helena-states helena-math; do
  echo "=== $d ==="
  git -C $d grep -n "helena.*\.vercel\.app" -- ':!*.md' ':!docs/' 2>/dev/null || true
done > /tmp/astrid-url-inventory.txt
cat /tmp/astrid-url-inventory.txt
```

This produces the full list of URLs to update. Save the output for Task 5.

- [ ] **Step 2: No edits yet — proceed to Task 5.**

---

### Task 5: Rename Vercel projects + finalize cross-app URLs

Vercel project renames change the `<project>.vercel.app` deploy URL. After renaming, each consumer's hard-coded "go to other consumer" URLs need an update to point at the new locations.

- [ ] **Step 1: Login to Vercel CLI**

```bash
vercel whoami 2>&1
```

If "Not authenticated", STOP and surface BLOCKED with: "Vercel CLI needs login. Run `vercel login` in a terminal, then re-dispatch." (Vercel login is interactive; subagent can't do it.)

- [ ] **Step 2: List current Vercel projects**

```bash
vercel projects ls 2>&1 | head -20
```

Find the 4 helena-* projects.

- [ ] **Step 3: Rename each Vercel project**

```bash
for pair in \
  "helena-learner-profile:learner-profile" \
  "helena-spelling:spelling" \
  "helena-states:states" \
  "helena-math:math"; do
  old="${pair%%:*}"
  new="${pair##*:}"
  echo "Renaming $old -> $new"
  vercel project rename "$old" "$new" 2>&1 | head -3
done
```

If `vercel project rename` is not supported by the installed CLI version, fall back to the dashboard: https://vercel.com/<team>/<project>/settings → edit Project Name. Report BLOCKED if neither path works.

- [ ] **Step 4: Capture the new deploy URLs**

```bash
for new in learner-profile spelling states math; do
  for candidate in "${new}.vercel.app" "${new}-dhasakgbb.vercel.app"; do
    status=$(curl -sI -o /dev/null -w "%{http_code}" -m 6 "https://${candidate}")
    if [ "$status" = "200" ] || [ "$status" = "301" ] || [ "$status" = "302" ]; then
      echo "$new: https://${candidate}"
      break
    fi
  done
done
```

Record the resolved URLs — these are the targets for Step 5.

- [ ] **Step 5: Update every cross-app URL in source**

Using `/tmp/astrid-url-inventory.txt` from Task 4 Step 1 as the checklist, replace each `helena-<X>.vercel.app` with the matching URL captured in Step 4.

Files typically affected (verify against the inventory):

- `/Users/damian/GitHub/Helena/spelling/src/screens/Hub.svelte` — Hub back-link
- `/Users/damian/GitHub/Helena/spelling/src/components/ProfileBanner.svelte` — "Take the quiz" + activity URL
- `/Users/damian/GitHub/Helena/states/index.html` — Hub back-link
- `/Users/damian/GitHub/Helena/states/app.js` — `buildActivityUrl`
- `/Users/damian/GitHub/Helena/states/profile.js` — onboarding "Take the quiz" anchor
- `/Users/damian/GitHub/Helena/math/index.html` — Hub back-link
- `/Users/damian/GitHub/Helena/math/app.js` — `buildActivityUrl`
- `/Users/damian/GitHub/Helena/math/profile.js` — onboarding "Take the quiz" anchor

- [ ] **Step 6: Commit per-repo**

```bash
cd /Users/damian/GitHub/Helena/spelling
git add src/
git commit -m "chore: repoint cross-app URLs at new Vercel project names

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"

cd /Users/damian/GitHub/Helena/states
git add index.html app.js profile.js
git commit -m "chore: repoint cross-app URLs at new Vercel project names

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"

cd /Users/damian/GitHub/Helena/math
git add index.html app.js profile.js
git commit -m "chore: repoint cross-app URLs at new Vercel project names

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

(helena-learner-profile typically doesn't self-link; verify against the inventory and commit if any hits.)

---

### Task 6: Sweep "Helena" code-level identifiers + display copy

This task replaces every code-level reference to "Helena" with "Astrid" — variable names, comments, copy strings, CSS class names that include "helena".

**LocalStorage key handling:** existing keys like `helena-math:onboarding:no-profile-dismissed:v1` are user-facing state. Renaming them silently breaks returning users' state. Strategy for this sub-project: **keep existing localStorage keys**. The `helena-` prefix becomes a historic implementation detail; future writes use `astrid-`. Document in code.

**`window.helenaProfile` (lowercase) namespace in vanilla apps:** the per-app store. Renaming it requires updates across multiple files per app and risks breakage. **Keep `window.helenaProfile` as the per-app namespace** for now; rename freely in code-internal identifiers. Add comments noting the historic name.

- [ ] **Step 1: Inventory the "Helena" hits**

```bash
cd /Users/damian/GitHub/Helena
for d in profile-schema helena-learner-profile Spelling helena-states helena-math; do
  echo "=== $d ==="
  git -C $d grep -nl -i "helena" -- ':!*.md' ':!docs/' ':!CLAUDE.md' 2>/dev/null || true
done > /tmp/astrid-helena-files.txt
wc -l /tmp/astrid-helena-files.txt
```

- [ ] **Step 2: For each file in the inventory, categorize and edit**

| Category | Action |
|----------|--------|
| User-visible copy ("Helena's Spelling Game") | Replace with Astrid display name per spec |
| Variable / function / type name (`helenaProfile` — lowercase) | LEAVE in `window.helenaProfile` namespace; rename freely in code-internal closures |
| Comment (`// Helena's intake module`) | Replace "Helena" with "Astrid" |
| localStorage key (`helena-math:...`) | LEAVE AS-IS (historic prefix; future writes use astrid-) |
| URL (`helena-*.vercel.app`) | Already handled in Task 5 |

- [ ] **Step 3: Per-app sweep + commit**

For each app, a single editor pass updates display copy + code-internal identifiers + comments. localStorage keys and `window.helenaProfile` namespace stay.

Per-repo commit:

```bash
cd /Users/damian/GitHub/Helena/<repo>
git add -A
git commit -m "refactor: rename Helena → Astrid in code and copy

Display strings, comments, internal variable names. LocalStorage keys
and the window.helenaProfile per-app namespace are kept as historic
identifiers — renaming them would break returning users' state and
require multi-file refactors disproportionate to this rename's intent.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

- [ ] **Step 4: Verify the sweep**

```bash
cd /Users/damian/GitHub/Helena
for d in profile-schema helena-learner-profile Spelling helena-states helena-math; do
  echo "=== $d (allowed: window.helenaProfile + localStorage keys + docs) ==="
  git -C $d grep -in "helena" -- ':!*.md' ':!docs/' ':!CLAUDE.md' 2>/dev/null \
    | grep -v "window.helenaProfile\|helena-math:onboarding\|helena-states:onboarding\|helena-spelling:" \
    | head -20 || true
done
```

Expected: minimal hits (only the explicitly-allowed patterns).

---

### Task 7: Update READMEs and PLATFORM.md

**Files:**
- Modify: `/Users/damian/GitHub/Helena/profile-schema/README.md`
- Modify: `/Users/damian/GitHub/Helena/learner-profile/README.md`
- Modify: `/Users/damian/GitHub/Helena/spelling/README.md`
- Modify: `/Users/damian/GitHub/Helena/states/README.md`
- Modify: `/Users/damian/GitHub/Helena/math/README.md`
- Modify: `/Users/damian/GitHub/Helena/learner-profile/docs/PLATFORM.md`

- [ ] **Step 1: Edit each README title and first paragraph**

| File | Title change |
|------|--------------|
| `profile-schema/README.md` | "Helena platform" → "Astrid platform" in top paragraph |
| `helena-learner-profile/README.md` | Title → "Astrid's Quiz — Learner Profile" |
| `Spelling/README.md` | Title → "Astrid's Spell Lab" |
| `helena-states/README.md` | Title → "Astrid's Map Room (was Capitals Quest)" |
| `helena-math/README.md` | Title → "Astrid's Number Garden" |

Each README also adds a one-line top-of-file note:
> Part of the **Astrid** platform — see [PLATFORM.md](https://github.com/dhasakgbb/learner-profile/blob/main/docs/PLATFORM.md).

- [ ] **Step 2: Update PLATFORM.md introduction**

Open `/Users/damian/GitHub/Helena/learner-profile/docs/PLATFORM.md`. Add a new section right after the introduction:

```markdown
## Brand

The platform is **Astrid** — a friendly cyan-glow robot mascot who hosts
four learning environments. Each environment is a "place" Astrid takes
the kid to:

- **Astrid's Quiz** — the 28-question learning-profile assessment
- **Astrid's Spell Lab** — arcade spelling practice with five modes
- **Astrid's Map Room** — US capitals via Road Trip / Quest / Quiz
- **Astrid's Number Garden** — math practice in three modes

Astrid herself doesn't change. Each app keeps its own visual world (we
deliberately did NOT unify palettes) — the constant is the mascot, the
variable is the room. See
`docs/superpowers/specs/2026-05-26-astrid-rebrand-design.md` for the
design rationale.
```

Also update any other PLATFORM.md mentions of "Helena's …" or platform name to "Astrid".

- [ ] **Step 3: Commit per repo**

```bash
for repo_dir in profile-schema helena-learner-profile Spelling helena-states helena-math; do
  cd /Users/damian/GitHub/Helena/$repo_dir
  if [ -n "$(git status --porcelain README.md 2>/dev/null)" ] || [ -n "$(git status --porcelain docs/PLATFORM.md 2>/dev/null)" ]; then
    [ -f README.md ] && git add README.md
    [ -f docs/PLATFORM.md ] && git add docs/PLATFORM.md
    git commit -m "docs: rebrand as Astrid

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
  fi
done
```

---

### Task 8: Push everything + verify deploys

- [ ] **Step 1: Push all 5 repos**

```bash
for d in profile-schema helena-learner-profile Spelling helena-states helena-math; do
  echo "=== $d ==="
  git -C /Users/damian/GitHub/Helena/$d push origin HEAD
done
```

Each push goes to the new `github.com/dhasakgbb/<name>.git` remote (set in Task 2).

- [ ] **Step 2: Watch Vercel redeploy**

```bash
sleep 60
for url_var in learner-profile spelling states math; do
  # Use whatever new URL was captured in Task 5 Step 4
  echo "Checking ${url_var}..."
done
```

- [ ] **Step 3: HTTP 200 check on each new deploy URL**

```bash
for url in \
  "https://learner-profile.vercel.app/" \
  "https://spelling.vercel.app/" \
  "https://states.vercel.app/" \
  "https://math.vercel.app/"; do
  echo "$url -> $(curl -sI -o /dev/null -w '%{http_code}' -m 6 "$url")"
done
```

(Substitute actual URLs if the project rename produced different ones.)

Each: 200 (or 301/302 followed by 200).

- [ ] **Step 4: Cross-app link spot check**

Open `https://learner-profile.vercel.app/hub` in a browser. Click each "Open Spelling" / "Open States" / "Open Math" tile — destination loads. Then open one consumer and click "Helena Hub" / "Back to Hub" — lands at learner-profile.

- [ ] **Step 5: Run all test suites once more**

```bash
cd /Users/damian/GitHub/Helena/learner-profile && npx vitest run 2>&1 | tail -5
cd /Users/damian/GitHub/Helena/spelling && npx vitest run --exclude '**/definitions.test.ts' --exclude '**/masking-issues.test.ts' 2>&1 | tail -5
node -c /Users/damian/GitHub/Helena/states/profile.js && node -c /Users/damian/GitHub/Helena/states/app.js
node -c /Users/damian/GitHub/Helena/math/profile.js && node -c /Users/damian/GitHub/Helena/math/app.js
```

All clean. A1 is complete.

---

## Phase A2 — Astrid mascot package

### Task 9: Scaffold astrid-mascot package

**Files:**
- Create: `/Users/damian/GitHub/Helena/astrid-mascot/.gitignore`
- Create: `/Users/damian/GitHub/Helena/astrid-mascot/package.json`
- Create: `/Users/damian/GitHub/Helena/astrid-mascot/tsconfig.json`
- Create: `/Users/damian/GitHub/Helena/astrid-mascot/README.md`
- Create: `/Users/damian/GitHub/Helena/astrid-mascot/tsup.config.ts`
- Create: `/Users/damian/GitHub/Helena/astrid-mascot/vitest.config.ts`

- [ ] **Step 1: Create directory and init git**

```bash
mkdir -p /Users/damian/GitHub/Helena/astrid-mascot
cd /Users/damian/GitHub/Helena/astrid-mascot
git init
git branch -m main   # if it landed on master
```

- [ ] **Step 2: Write `.gitignore`**

```
node_modules/
.DS_Store
*.log
coverage/
.npmrc
```

Note: `dist/` is intentionally NOT in `.gitignore` — like profile-schema, the package distributes built artifacts via git tags so jsDelivr can serve them.

- [ ] **Step 3: Write `package.json`**

```json
{
  "name": "astrid-mascot",
  "version": "0.0.0",
  "description": "Astrid the cyan-glow robot mascot — SVG poses + Svelte component + framework-agnostic IIFE. Consumed by all four Astrid platform apps.",
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
  "files": ["dist/", "README.md"],
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run build && npm test"
  },
  "engines": { "node": ">=20" },
  "license": "UNLICENSED",
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.4.0",
    "vitest": "^1.6.0",
    "jsdom": "^24.0.0"
  }
}
```

No runtime deps; jsdom is dev-only for tests that exercise `renderInto` against a real DOM.

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
  "include": ["src/**/*", "tests/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 5: Write `tsup.config.ts`**

```ts
import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    target: 'es2022',
    outExtension: ({ format }) => ({ js: format === 'esm' ? '.mjs' : '.cjs' })
  },
  {
    entry: { 'index.iife': 'src/iife-entry.ts' },
    format: ['iife'],
    globalName: 'AstridMascot',
    sourcemap: true,
    target: 'es2020',
    outExtension: () => ({ js: '.js' }),
    footer: {
      js: 'if (typeof window !== "undefined") { window.AstridMascot = AstridMascot; }'
    }
  }
]);
```

- [ ] **Step 6: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'jsdom',
    globals: false
  }
});
```

`jsdom` is the test environment so `renderInto` can be exercised against a real DOM in tests.

- [ ] **Step 7: Write a brief `README.md`**

```markdown
# astrid-mascot

Astrid the cyan-glow robot mascot for the Astrid learning platform.

8 poses available: `idle`, `happy`, `sad`, `wow`, `waving`, `thinking`,
`sleeping`, `cheering`.

## Install (TypeScript / ESM)

\`\`\`bash
npm install "astrid-mascot@github:dhasakgbb/astrid-mascot#v1.0.0"
\`\`\`

\`\`\`ts
import { AstridMascot, svgFor, POSES, tokens } from 'astrid-mascot';
\`\`\`

## Install (Vanilla JS via CDN)

\`\`\`html
<script src="https://cdn.jsdelivr.net/gh/dhasakgbb/astrid-mascot@v1.0.0/dist/index.iife.js"></script>
<script>
  const node = document.getElementById('hero');
  window.AstridMascot.renderInto(node, { pose: 'waving', size: 140 });
</script>
\`\`\`

## API

- `POSES: string[]` — the 8 pose names
- `svgFor(pose: string): string` — returns SVG markup as a string
- `renderInto(node: Element, { pose, size? }): void` — parses the SVG via DOMParser and appends to a DOM node (no innerHTML write)
- `tokens: { cyan, glow, body, screen, ... }` — color tokens used in the SVG
- `AstridMascot` (ESM only) — Svelte 5 component: `<AstridMascot pose="idle" size={140} />`

## Versioning

SemVer. The 8-pose set is the v1 contract. Adding poses is a minor bump; removing or renaming poses is a major.
```

- [ ] **Step 8: Install deps**

```bash
cd /Users/damian/GitHub/Helena/astrid-mascot
npm install
```

- [ ] **Step 9: Commit scaffold**

```bash
git add .gitignore package.json package-lock.json tsconfig.json README.md tsup.config.ts vitest.config.ts
git commit -m "chore: scaffold astrid-mascot package"
```

---

### Task 10: Port the 4 existing poses from MascotSVG.svelte

The 4 existing poses (idle, happy, sad, wow) live in `/Users/damian/GitHub/Helena/spelling/src/components/MascotSVG.svelte` as conditional SVG blocks inside one component. We extract them into 4 separate TypeScript files, each exporting a `string` containing standalone SVG markup.

**Files:**
- Create: `/Users/damian/GitHub/Helena/astrid-mascot/src/poses/idle.ts`
- Create: `/Users/damian/GitHub/Helena/astrid-mascot/src/poses/happy.ts`
- Create: `/Users/damian/GitHub/Helena/astrid-mascot/src/poses/sad.ts`
- Create: `/Users/damian/GitHub/Helena/astrid-mascot/src/poses/wow.ts`
- Create: `/Users/damian/GitHub/Helena/astrid-mascot/src/tokens.ts`
- Create: `/Users/damian/GitHub/Helena/astrid-mascot/tests/poses-existing.test.ts`

- [ ] **Step 1: Read the source mascot**

```bash
cat /Users/damian/GitHub/Helena/spelling/src/components/MascotSVG.svelte
```

Note the four `mood-` CSS classes and how the conditional SVG content varies per mood. Identify the shared body (gradient defs, robot face frame) and the per-mood deltas (eye shape, mouth/screen content).

- [ ] **Step 2: Write `src/tokens.ts` with the color constants**

```ts
/**
 * Color tokens used inside Astrid's SVG. Exported so consumer code can
 * theme accents to match the mascot (e.g., glow buttons in the same cyan).
 */
export const tokens = {
  bodyGradient: { from: '#1f2347', mid: '#141733', to: '#0a0c1b' },
  screenGradient: { from: '#04060f', to: '#0f142c' },
  cyan: '#08d9d6',
  cyanGlow: 'rgba(8, 217, 214, 0.7)',
  pink: '#ff5f9e',
  pinkGlow: 'rgba(255, 95, 158, 0.7)',
  yellow: '#ffd966',
  yellowGlow: 'rgba(255, 217, 102, 0.7)',
  ink: '#0a0a14'
} as const;

export type MascotColorTokens = typeof tokens;
```

- [ ] **Step 3: Write the failing test first**

`tests/poses-existing.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { idle } from '../src/poses/idle';
import { happy } from '../src/poses/happy';
import { sad } from '../src/poses/sad';
import { wow } from '../src/poses/wow';

describe.each([
  ['idle', idle],
  ['happy', happy],
  ['sad', sad],
  ['wow', wow]
])('pose: %s', (_name, svg) => {
  it('is a non-empty string', () => {
    expect(typeof svg).toBe('string');
    expect(svg.length).toBeGreaterThan(200);
  });

  it('opens with an <svg root', () => {
    expect(svg.trimStart().startsWith('<svg')).toBe(true);
  });

  it('declares the xmlns', () => {
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('uses the standard 140x140 viewBox', () => {
    expect(svg).toContain('viewBox="0 0 140 140"');
  });

  it('contains the canonical cyan brand color', () => {
    expect(svg).toContain('#08d9d6');
  });

  it('closes the <svg root', () => {
    expect(svg.trimEnd().endsWith('</svg>')).toBe(true);
  });

  it('parses as well-formed XML via DOMParser', () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    const errors = doc.getElementsByTagName('parsererror');
    expect(errors.length).toBe(0);
  });
});
```

- [ ] **Step 4: Run — expect fail**

```bash
cd /Users/damian/GitHub/Helena/astrid-mascot
npx vitest run tests/poses-existing.test.ts
```

Expected: "Cannot find module '../src/poses/idle'" etc.

- [ ] **Step 5: Write `src/poses/idle.ts`**

Approach: lift the SVG markup for the `mood === 'idle'` branch from `MascotSVG.svelte` along with the shared `<defs>` block. Export as a TS template-literal string.

```ts
/**
 * Astrid — idle pose. Neutral expression, default Hub state.
 *
 * Ported from helena-spelling/src/components/MascotSVG.svelte (the
 * `mood === 'idle'` conditional branch + shared <defs>).
 */
export const idle: string = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140" aria-label="Astrid">
  <defs>
    <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1f2347" />
      <stop offset="60%" stop-color="#141733" />
      <stop offset="100%" stop-color="#0a0c1b" />
    </linearGradient>
    <linearGradient id="screenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#04060f" />
      <stop offset="100%" stop-color="#0f142c" />
    </linearGradient>
    <filter id="neonCyanGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
  </defs>

  <rect x="20" y="34" width="100" height="80" rx="14" fill="url(#bodyGradient)" stroke="#08d9d6" stroke-width="2" />
  <rect x="34" y="46" width="72" height="56" rx="6" fill="url(#screenGradient)" stroke="#08d9d6" stroke-width="1.5" />
  <ellipse cx="54" cy="74" rx="6" ry="9" fill="#08d9d6" filter="url(#neonCyanGlow)" />
  <ellipse cx="86" cy="74" rx="6" ry="9" fill="#08d9d6" filter="url(#neonCyanGlow)" />
  <rect x="62" y="92" width="16" height="2.5" rx="1.25" fill="#08d9d6" filter="url(#neonCyanGlow)" />
  <circle cx="70" cy="28" r="4" fill="#ff5f9e" filter="url(#neonCyanGlow)" />
  <line x1="70" y1="32" x2="70" y2="38" stroke="#08d9d6" stroke-width="2" />
  <circle cx="14" cy="74" r="6" fill="#1f2347" stroke="#08d9d6" stroke-width="1.5" />
  <circle cx="126" cy="74" r="6" fill="#1f2347" stroke="#08d9d6" stroke-width="1.5" />
  <circle cx="44" cy="86" r="2" fill="#ff5f9e" opacity="0.5" />
  <circle cx="96" cy="86" r="2" fill="#ff5f9e" opacity="0.5" />
</svg>`;
```

The implementer should cross-reference `MascotSVG.svelte` and tighten the markup to match the canonical visual exactly. The above is a faithful port; minor coordinate tweaks may be needed to match the source pixel-for-pixel.

- [ ] **Step 6: Write `src/poses/happy.ts`**

Same skeleton as idle. Differences:
- Eyes: replace ellipses with crescent-curve `<path>` elements (closed/smiling eyes):
  ```
  <path d="M48 74 q6 6 12 0" stroke="#08d9d6" stroke-width="2.5" fill="none" filter="url(#neonCyanGlow)" />
  ```
  for each eye.
- Mouth: replace horizontal line with smile arc:
  ```
  <path d="M58 92 q12 8 24 0" stroke="#08d9d6" stroke-width="2.5" fill="none" filter="url(#neonCyanGlow)" />
  ```

Lift the exact happy-mood markup from `MascotSVG.svelte`.

- [ ] **Step 7: Write `src/poses/sad.ts`**

Differences:
- Eyes: downturned curves (or lowered ellipses).
- Mouth: downturned arc (curve flipped vs. happy):
  ```
  <path d="M58 96 q12 -8 24 0" stroke="#08d9d6" stroke-width="2.5" fill="none" filter="url(#neonCyanGlow)" />
  ```

Lift from source.

- [ ] **Step 8: Write `src/poses/wow.ts`**

Differences:
- Eyes: wide-open circles, larger radius (`r="9"`).
- Mouth: small "O" shape:
  ```
  <ellipse cx="70" cy="94" rx="4" ry="5" fill="#08d9d6" filter="url(#neonCyanGlow)" />
  ```

Lift from source.

- [ ] **Step 9: Run tests — expect pass**

```bash
npx vitest run tests/poses-existing.test.ts
```

Expected: 28 tests pass (4 poses × 7 assertions).

- [ ] **Step 10: Commit**

```bash
git add src/tokens.ts src/poses/idle.ts src/poses/happy.ts src/poses/sad.ts src/poses/wow.ts tests/poses-existing.test.ts
git commit -m "feat(poses): port idle/happy/sad/wow + color tokens from MascotSVG.svelte"
```

---

### Task 11: Author the 4 new poses (waving, thinking, sleeping, cheering)

**Files:**
- Create: `/Users/damian/GitHub/Helena/astrid-mascot/src/poses/waving.ts`
- Create: `/Users/damian/GitHub/Helena/astrid-mascot/src/poses/thinking.ts`
- Create: `/Users/damian/GitHub/Helena/astrid-mascot/src/poses/sleeping.ts`
- Create: `/Users/damian/GitHub/Helena/astrid-mascot/src/poses/cheering.ts`
- Create: `/Users/damian/GitHub/Helena/astrid-mascot/tests/poses-new.test.ts`

Each new pose reuses the same body chassis as `idle`. The deltas are eye expression + accessory elements (wave hand, thought dots, Z indicator, celebration arms/sparks).

- [ ] **Step 1: Write the failing test**

`tests/poses-new.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { waving } from '../src/poses/waving';
import { thinking } from '../src/poses/thinking';
import { sleeping } from '../src/poses/sleeping';
import { cheering } from '../src/poses/cheering';

describe.each([
  ['waving', waving],
  ['thinking', thinking],
  ['sleeping', sleeping],
  ['cheering', cheering]
])('pose: %s', (_name, svg) => {
  it('is a non-empty string', () => expect(svg.length).toBeGreaterThan(200));
  it('opens with <svg', () => expect(svg.trimStart().startsWith('<svg')).toBe(true));
  it('uses the standard 140x140 viewBox', () => {
    expect(svg).toContain('viewBox="0 0 140 140"');
  });
  it('declares xmlns', () => {
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });
  it('uses the cyan brand color', () => expect(svg).toContain('#08d9d6'));
  it('closes <svg>', () => expect(svg.trimEnd().endsWith('</svg>')).toBe(true));
  it('parses as well-formed XML', () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    expect(doc.getElementsByTagName('parsererror').length).toBe(0);
  });
});

describe('waving', () => {
  it('contains a hand/wave element', () => {
    expect(waving).toMatch(/class="wave"/);
  });
});

describe('thinking', () => {
  it('contains thinking-dots element', () => {
    expect(thinking).toMatch(/class="thinking-dots"/);
  });
});

describe('sleeping', () => {
  it('contains a Z indicator', () => {
    expect(sleeping).toMatch(/class="z-sleep"/);
  });
});

describe('cheering', () => {
  it('contains celebration arms', () => {
    expect(cheering).toMatch(/class="celebrate-arms"/);
  });
});
```

- [ ] **Step 2: Run — expect fail**

```bash
npx vitest run tests/poses-new.test.ts
```

Expected: "Cannot find module '../src/poses/waving'" etc.

- [ ] **Step 3: Write `src/poses/waving.ts`**

```ts
/**
 * Astrid — waving pose. Used as the greeting on first paint / landing
 * screens of each app. Idle face + a waving hand on Astrid's right side.
 */
export const waving: string = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140" aria-label="Astrid waving">
  <defs>
    <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1f2347" />
      <stop offset="60%" stop-color="#141733" />
      <stop offset="100%" stop-color="#0a0c1b" />
    </linearGradient>
    <linearGradient id="screenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#04060f" />
      <stop offset="100%" stop-color="#0f142c" />
    </linearGradient>
    <filter id="neonCyanGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
  </defs>

  <rect x="20" y="34" width="100" height="80" rx="14" fill="url(#bodyGradient)" stroke="#08d9d6" stroke-width="2" />
  <rect x="34" y="46" width="72" height="56" rx="6" fill="url(#screenGradient)" stroke="#08d9d6" stroke-width="1.5" />

  <path d="M48 74 q6 6 12 0" stroke="#08d9d6" stroke-width="2.5" fill="none" filter="url(#neonCyanGlow)" />
  <path d="M80 74 q6 6 12 0" stroke="#08d9d6" stroke-width="2.5" fill="none" filter="url(#neonCyanGlow)" />
  <path d="M58 92 q12 6 24 0" stroke="#08d9d6" stroke-width="2.5" fill="none" filter="url(#neonCyanGlow)" />

  <circle cx="70" cy="28" r="4" fill="#ff5f9e" filter="url(#neonCyanGlow)" />
  <line x1="70" y1="32" x2="70" y2="38" stroke="#08d9d6" stroke-width="2" />

  <g class="wave" filter="url(#neonCyanGlow)">
    <circle cx="128" cy="50" r="7" fill="#08d9d6" />
    <line x1="120" y1="54" x2="126" y2="48" stroke="#08d9d6" stroke-width="2.5" />
  </g>

  <circle cx="14" cy="74" r="6" fill="#1f2347" stroke="#08d9d6" stroke-width="1.5" />
</svg>`;
```

- [ ] **Step 4: Write `src/poses/thinking.ts`**

```ts
/**
 * Astrid — thinking pose. Used during assessment / quiz / question-presented
 * states. One eye slightly closed; three rising dots above the antenna.
 */
export const thinking: string = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140" aria-label="Astrid thinking">
  <defs>
    <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1f2347" />
      <stop offset="60%" stop-color="#141733" />
      <stop offset="100%" stop-color="#0a0c1b" />
    </linearGradient>
    <linearGradient id="screenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#04060f" />
      <stop offset="100%" stop-color="#0f142c" />
    </linearGradient>
    <filter id="neonCyanGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
  </defs>

  <rect x="20" y="34" width="100" height="80" rx="14" fill="url(#bodyGradient)" stroke="#08d9d6" stroke-width="2" />
  <rect x="34" y="46" width="72" height="56" rx="6" fill="url(#screenGradient)" stroke="#08d9d6" stroke-width="1.5" />

  <ellipse cx="54" cy="74" rx="6" ry="9" fill="#08d9d6" filter="url(#neonCyanGlow)" />
  <ellipse cx="86" cy="70" rx="5" ry="7" fill="#08d9d6" filter="url(#neonCyanGlow)" />
  <ellipse cx="70" cy="94" rx="3" ry="2" fill="#08d9d6" filter="url(#neonCyanGlow)" />

  <circle cx="70" cy="28" r="4" fill="#ff5f9e" filter="url(#neonCyanGlow)" />
  <line x1="70" y1="32" x2="70" y2="38" stroke="#08d9d6" stroke-width="2" />

  <g class="thinking-dots" filter="url(#neonCyanGlow)">
    <circle cx="86" cy="22" r="1.8" fill="#08d9d6" opacity="0.5" />
    <circle cx="94" cy="16" r="2.4" fill="#08d9d6" opacity="0.7" />
    <circle cx="104" cy="9" r="3" fill="#08d9d6" opacity="0.9" />
  </g>

  <circle cx="14" cy="74" r="6" fill="#1f2347" stroke="#08d9d6" stroke-width="1.5" />
  <circle cx="126" cy="74" r="6" fill="#1f2347" stroke="#08d9d6" stroke-width="1.5" />
</svg>`;
```

- [ ] **Step 5: Write `src/poses/sleeping.ts`**

```ts
/**
 * Astrid — sleeping pose. Used as the inactivity nudge. Closed eyes
 * (dash lines), a small "Z" floats above the antenna.
 */
export const sleeping: string = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140" aria-label="Astrid sleeping">
  <defs>
    <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1f2347" />
      <stop offset="60%" stop-color="#141733" />
      <stop offset="100%" stop-color="#0a0c1b" />
    </linearGradient>
    <linearGradient id="screenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#04060f" />
      <stop offset="100%" stop-color="#0f142c" />
    </linearGradient>
    <filter id="neonCyanGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
  </defs>

  <rect x="20" y="34" width="100" height="80" rx="14" fill="url(#bodyGradient)" stroke="#08d9d6" stroke-width="2" />
  <rect x="34" y="46" width="72" height="56" rx="6" fill="url(#screenGradient)" stroke="#08d9d6" stroke-width="1.5" />

  <g class="sleep-eyes" stroke="#08d9d6" stroke-width="3" stroke-linecap="round" opacity="0.7">
    <line x1="48" y1="74" x2="60" y2="74" />
    <line x1="80" y1="74" x2="92" y2="74" />
  </g>
  <ellipse cx="70" cy="94" rx="5" ry="1.5" fill="#08d9d6" opacity="0.6" />

  <circle cx="70" cy="28" r="4" fill="#ff5f9e" opacity="0.4" />
  <line x1="70" y1="32" x2="70" y2="38" stroke="#08d9d6" stroke-width="2" opacity="0.4" />

  <text class="z-sleep" x="100" y="22" font-family="sans-serif" font-size="16" font-weight="bold" fill="#08d9d6" filter="url(#neonCyanGlow)">Z</text>
  <text x="112" y="14" font-family="sans-serif" font-size="11" font-weight="bold" fill="#08d9d6" opacity="0.7">z</text>

  <circle cx="14" cy="74" r="6" fill="#1f2347" stroke="#08d9d6" stroke-width="1" opacity="0.5" />
</svg>`;
```

- [ ] **Step 6: Write `src/poses/cheering.ts`**

```ts
/**
 * Astrid — cheering pose. Used on end-of-session celebration. Happy
 * crescent eyes, big open smile, two arms raised in celebration.
 */
export const cheering: string = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140" aria-label="Astrid cheering">
  <defs>
    <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1f2347" />
      <stop offset="60%" stop-color="#141733" />
      <stop offset="100%" stop-color="#0a0c1b" />
    </linearGradient>
    <linearGradient id="screenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#04060f" />
      <stop offset="100%" stop-color="#0f142c" />
    </linearGradient>
    <filter id="neonCyanGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
  </defs>

  <rect x="20" y="34" width="100" height="80" rx="14" fill="url(#bodyGradient)" stroke="#08d9d6" stroke-width="2" />
  <rect x="34" y="46" width="72" height="56" rx="6" fill="url(#screenGradient)" stroke="#08d9d6" stroke-width="1.5" />

  <path d="M48 76 q6 -6 12 0" stroke="#08d9d6" stroke-width="2.5" fill="none" filter="url(#neonCyanGlow)" />
  <path d="M80 76 q6 -6 12 0" stroke="#08d9d6" stroke-width="2.5" fill="none" filter="url(#neonCyanGlow)" />
  <path d="M55 90 q15 12 30 0" stroke="#08d9d6" stroke-width="3" fill="none" filter="url(#neonCyanGlow)" />

  <circle cx="70" cy="28" r="5" fill="#ff5f9e" filter="url(#neonCyanGlow)" />
  <line x1="70" y1="32" x2="70" y2="38" stroke="#08d9d6" stroke-width="2" />

  <g class="celebrate-arms" filter="url(#neonCyanGlow)" stroke="#08d9d6" stroke-width="3" stroke-linecap="round" fill="none">
    <path d="M22 56 q-8 -12 -12 -24" />
    <path d="M118 56 q8 -12 12 -24" />
  </g>
  <g class="celebrate-sparks" fill="#ffd966" filter="url(#neonCyanGlow)" opacity="0.85">
    <circle cx="8" cy="30" r="2.5" />
    <circle cx="132" cy="30" r="2.5" />
  </g>
</svg>`;
```

- [ ] **Step 7: Run tests — expect pass**

```bash
npx vitest run tests/poses-new.test.ts
```

Expected: 32 tests pass (4 poses × 7 generic + 4 pose-specific = 28 + 4 = 32).

- [ ] **Step 8: Commit**

```bash
git add src/poses/waving.ts src/poses/thinking.ts src/poses/sleeping.ts src/poses/cheering.ts tests/poses-new.test.ts
git commit -m "feat(poses): add waving, thinking, sleeping, cheering"
```

---

### Task 12: Public API — svgFor, POSES, renderInto (DOMParser-based), Svelte component, barrel + IIFE entry

**Files:**
- Create: `/Users/damian/GitHub/Helena/astrid-mascot/src/component.svelte`
- Create: `/Users/damian/GitHub/Helena/astrid-mascot/src/index.ts`
- Create: `/Users/damian/GitHub/Helena/astrid-mascot/src/iife-entry.ts`
- Create: `/Users/damian/GitHub/Helena/astrid-mascot/tests/api.test.ts`

`renderInto` uses `DOMParser` + `appendChild` rather than `innerHTML`. This is both better practice (cleaner anti-XSS posture even though SVG content is trusted-by-construction) and more correct for SVG content (proper namespace handling).

- [ ] **Step 1: Write the test for the public API**

`tests/api.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { POSES, svgFor, tokens, renderInto } from '../src/index';

describe('public API', () => {
  it('POSES has the 8 expected names', () => {
    expect(POSES).toEqual([
      'idle', 'happy', 'sad', 'wow',
      'waving', 'thinking', 'sleeping', 'cheering'
    ]);
  });

  it('svgFor returns SVG markup for each pose', () => {
    for (const p of POSES) {
      const svg = svgFor(p);
      expect(typeof svg).toBe('string');
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
    }
  });

  it('svgFor falls back to idle for unknown input', () => {
    const svg = svgFor('not-a-real-pose' as never);
    expect(svg).toContain('<svg');
    // Defaults to idle is documented behavior.
  });

  it('tokens.cyan is the canonical brand color', () => {
    expect(tokens.cyan).toBe('#08d9d6');
  });

  it('tokens has the expected fields', () => {
    expect(tokens.bodyGradient).toBeDefined();
    expect(tokens.screenGradient).toBeDefined();
    expect(tokens.cyan).toBeDefined();
  });
});

describe('renderInto', () => {
  it('appends a parsed SVG to the target node', () => {
    const host = document.createElement('div');
    renderInto(host, { pose: 'idle', size: 100 });
    const svg = host.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('width')).toBe('100');
    expect(svg?.getAttribute('height')).toBe('100');
  });

  it('clears existing children before appending', () => {
    const host = document.createElement('div');
    host.appendChild(document.createTextNode('old content'));
    renderInto(host, { pose: 'happy' });
    expect(host.childNodes.length).toBe(1);
    expect((host.firstChild as Element).tagName.toLowerCase()).toBe('svg');
  });

  it('omits width/height when size is not given', () => {
    const host = document.createElement('div');
    renderInto(host, { pose: 'wow' });
    const svg = host.querySelector('svg');
    // The original SVG markup has no width/height attrs (only viewBox),
    // and renderInto only adds them when size is provided.
    expect(svg?.hasAttribute('width')).toBe(false);
  });
});
```

- [ ] **Step 2: Run — expect fail**

```bash
npx vitest run tests/api.test.ts
```

Expected: Cannot find module '../src/index'.

- [ ] **Step 3: Write `src/index.ts`**

```ts
import { idle } from './poses/idle';
import { happy } from './poses/happy';
import { sad } from './poses/sad';
import { wow } from './poses/wow';
import { waving } from './poses/waving';
import { thinking } from './poses/thinking';
import { sleeping } from './poses/sleeping';
import { cheering } from './poses/cheering';

export { tokens, type MascotColorTokens } from './tokens';

/** Canonical pose name list — the v1 contract. */
export const POSES = [
  'idle',
  'happy',
  'sad',
  'wow',
  'waving',
  'thinking',
  'sleeping',
  'cheering'
] as const;

export type Pose = typeof POSES[number];

const POSE_MAP: Record<Pose, string> = {
  idle, happy, sad, wow,
  waving, thinking, sleeping, cheering
};

/**
 * Return Astrid's SVG markup for the given pose. Unknown pose names
 * fall back to the `idle` pose (defensive — consumer code may pass
 * runtime strings, especially from URL fragments).
 */
export function svgFor(pose: Pose | string): string {
  return POSE_MAP[pose as Pose] ?? POSE_MAP.idle;
}

/**
 * Append Astrid's SVG to a DOM node, replacing any existing children.
 *
 * Implementation note: we use DOMParser + appendChild rather than
 * setting node.innerHTML. The SVG content is package-controlled and
 * trusted by construction (no consumer input flows into it), but
 * avoiding innerHTML keeps the published library's anti-XSS posture
 * clean and gives proper SVG namespace handling for free.
 */
export function renderInto(
  node: Element,
  opts: { pose?: Pose | string; size?: number } = {}
): void {
  const { pose = 'idle', size } = opts;
  const svgString = svgFor(pose);

  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgEl = doc.documentElement;

  // Clear any existing children of the target node.
  while (node.firstChild) node.removeChild(node.firstChild);

  if (size !== undefined) {
    svgEl.setAttribute('width', String(size));
    svgEl.setAttribute('height', String(size));
  }

  // importNode handles cross-document boundaries that DOMParser produces.
  const imported = node.ownerDocument
    ? node.ownerDocument.importNode(svgEl, true)
    : svgEl;
  node.appendChild(imported);
}

// Re-export the raw pose strings for consumers that want them as
// individual imports.
export { idle, happy, sad, wow, waving, thinking, sleeping, cheering };
```

- [ ] **Step 4: Write the Svelte component**

`src/component.svelte`:

```svelte
<script lang="ts">
  import { svgFor, type Pose } from './index';

  let { pose = 'idle', size = 140 }: { pose?: Pose | string; size?: number } = $props();
</script>

<!--
  Mascot SVG is shipped by this package — no consumer input flows
  into the rendered HTML. {@html} is safe by construction here.
  Eslint hint added for any linter that bans @html broadly.
-->
<div class="astrid-mascot" style:--size="{size}px" aria-hidden="true">
  <!-- svelte-ignore a11y_misuse -->
  {@html svgFor(pose)}
</div>

<style>
  .astrid-mascot {
    display: inline-block;
    width: var(--size, 140px);
    height: var(--size, 140px);
  }
  .astrid-mascot :global(svg) {
    width: 100%;
    height: 100%;
  }
</style>
```

- [ ] **Step 5: Write `src/iife-entry.ts`**

```ts
/**
 * IIFE bundle entry. Re-exports runtime-only values so vanilla JS
 * pages can read `window.AstridMascot.{POSES, svgFor, renderInto, tokens}`.
 *
 * The Svelte component is NOT exported via IIFE — consumers that want
 * the component must use the ESM build.
 */
export { POSES, svgFor, renderInto, tokens } from './index';
```

- [ ] **Step 6: Run tests — expect pass**

```bash
npx vitest run
```

Expected: all tests pass in poses-existing.test.ts, poses-new.test.ts, and api.test.ts.

- [ ] **Step 7: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no output (success).

- [ ] **Step 8: Commit**

```bash
git add src/component.svelte src/index.ts src/iife-entry.ts tests/api.test.ts
git commit -m "feat(api): svgFor + renderInto (DOMParser-based) + POSES + component + IIFE"
```

---

### Task 13: Build + IIFE string check

- [ ] **Step 1: Build**

```bash
cd /Users/damian/GitHub/Helena/astrid-mascot
npm run build
```

Expected: `dist/` contains:
- `index.mjs` (ESM)
- `index.cjs` (CommonJS)
- `index.d.ts` (types)
- `index.iife.js` (IIFE with window.AstridMascot)
- sourcemaps

- [ ] **Step 2: Verify dist/ contents**

```bash
ls -la dist/
```

- [ ] **Step 3: String-check the IIFE bundle**

```bash
grep -c "POSES" dist/index.iife.js
grep -c "svgFor" dist/index.iife.js
grep -c "renderInto" dist/index.iife.js
grep -c "window.AstridMascot" dist/index.iife.js
grep -c "#08d9d6" dist/index.iife.js
grep -c "DOMParser" dist/index.iife.js
```

Each must print a positive integer. Verifies tsup bundled the renderInto function (which references DOMParser).

- [ ] **Step 4: No commit — dist/ lands with the release commit in Task 14.**

---

### Task 14: Create GitHub repo, tag v1.0.0, push

- [ ] **Step 1: Bump to 1.0.0**

```bash
cd /Users/damian/GitHub/Helena/astrid-mascot
npm version 1.0.0 --no-git-tag-version
```

- [ ] **Step 2: Rebuild against the bumped version**

```bash
npm run build
```

- [ ] **Step 3: Run tests + typecheck**

```bash
npm test
npx tsc --noEmit
```

- [ ] **Step 4: Stage and commit the release**

```bash
git add package.json package-lock.json dist/
git commit -m "chore: release 1.0.0

Track dist/ on main so git+https consumers and the jsDelivr-from-gh
CDN serve the built artifacts directly from the v1.0.0 tag.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

- [ ] **Step 5: Tag**

```bash
git tag -a v1.0.0 -m "Release 1.0.0 — Astrid mascot for the Astrid platform"
```

- [ ] **Step 6: Create the GitHub repo and push**

```bash
gh repo create dhasakgbb/astrid-mascot --public --source=. --remote=origin --push --description "Astrid the cyan-glow robot mascot — SVG poses, Svelte component, IIFE bundle for the Astrid learning platform"
git push origin v1.0.0
```

If `astrid-learn` org doesn't exist yet, this will fail — go back to Task 1.

- [ ] **Step 7: Verify on GitHub**

```bash
gh api repos/dhasakgbb/astrid-mascot/tags --jq '.[].name' | head -3
```

Expected: `v1.0.0` in output.

- [ ] **Step 8: Wait for jsDelivr to fetch + smoke-test**

```bash
until curl -fsSI -m 5 "https://cdn.jsdelivr.net/gh/dhasakgbb/astrid-mascot@v1.0.0/dist/index.iife.js" >/dev/null 2>&1; do
  echo "waiting for jsDelivr to fetch the tag..."
  sleep 5
done
echo "jsDelivr is serving."
```

- [ ] **Step 9: String-check the jsDelivr-served bundle**

```bash
curl -fsS "https://cdn.jsdelivr.net/gh/dhasakgbb/astrid-mascot@v1.0.0/dist/index.iife.js" -o /tmp/astrid-iife.js
wc -c /tmp/astrid-iife.js
grep -c "window.AstridMascot" /tmp/astrid-iife.js
grep -c "POSES" /tmp/astrid-iife.js
```

All positive. A2 complete.

---

## Phase A3 — Place Astrid in each app

### Task 15: Migrate Spelling — replace local mascot with package

**Files:**
- Modify: `/Users/damian/GitHub/Helena/spelling/package.json`
- Delete: `/Users/damian/GitHub/Helena/spelling/src/components/Mascot.svelte`
- Delete: `/Users/damian/GitHub/Helena/spelling/src/components/MascotSVG.svelte`
- Modify: `/Users/damian/GitHub/Helena/spelling/src/screens/Hub.svelte`
- Modify: any other Spelling file that imported Mascot/MascotSVG

- [ ] **Step 1: Install astrid-mascot**

```bash
cd /Users/damian/GitHub/Helena/spelling
npm install "astrid-mascot@github:dhasakgbb/astrid-mascot#v1.0.0"
```

Verify:
```bash
node -e "console.log(require.resolve('astrid-mascot'))"
```
Expected: a path under `Spelling/node_modules/astrid-mascot/`.

- [ ] **Step 2: Inventory callsites**

```bash
cd /Users/damian/GitHub/Helena/spelling
grep -rn "from.*Mascot\(SVG\)\?'" src/ 2>/dev/null
```

- [ ] **Step 3: Update each callsite**

For each file in Step 2's output, change:
```ts
import Mascot from '../components/Mascot.svelte';
// or
import MascotSVG from '../components/MascotSVG.svelte';
```

to:
```ts
import { AstridMascot } from 'astrid-mascot';
```

Map the existing `mood` prop to the package's `pose` prop. Mood names map directly: `idle`, `happy`, `sad`, `wow`.

```svelte
<!-- Before -->
<Mascot mood="idle" />
<!-- After -->
<AstridMascot pose="idle" size={140} />
```

- [ ] **Step 4: Delete the local mascot files**

```bash
cd /Users/damian/GitHub/Helena/spelling
git rm src/components/Mascot.svelte src/components/MascotSVG.svelte
```

- [ ] **Step 5: Update display copy in Hub.svelte**

Find:
```svelte
<span class="user-role-title">SPELL_MASTER_ASTRID</span>
```

Replace with:
```svelte
<span class="user-role-title">Astrid</span>
```

Sweep similar copy in `App.svelte`, `Settings.svelte`, and any landing-page strings — "Helena's Spelling Game" → "Astrid's Spell Lab".

- [ ] **Step 6: Run tests + build**

```bash
npx vitest run --exclude '**/definitions.test.ts' --exclude '**/masking-issues.test.ts' 2>&1 | tail -10
npm run build 2>&1 | tail -10
```

- [ ] **Step 7: Commit + push**

```bash
git add -A
git commit -m "refactor(mascot): consume astrid-mascot package; delete local Mascot files

Spell Master Astrid was already the mascot here — formalize via
astrid-mascot@v1.0.0 from the shared package. Hub copy updated to
'Astrid' and 'Spell Lab'.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
git push origin HEAD
```

---

### Task 16: Integrate Astrid into helena-learner-profile

**Files:**
- Modify: `/Users/damian/GitHub/Helena/learner-profile/package.json`
- Modify: `/Users/damian/GitHub/Helena/learner-profile/src/routes/+page.svelte` (welcome hero)
- Modify: `/Users/damian/GitHub/Helena/learner-profile/src/routes/hub/+page.svelte` (hub launcher)
- Modify: `/Users/damian/GitHub/Helena/learner-profile/src/routes/explore/results/+page.svelte` (results)
- Modify: `/Users/damian/GitHub/Helena/learner-profile/src/routes/parent/dashboard/+page.svelte` (header)
- Modify: the explore-quiz page (thinking pose during quiz)
- Modify: display copy throughout

- [ ] **Step 1: Install astrid-mascot**

```bash
cd /Users/damian/GitHub/Helena/learner-profile
npm install "astrid-mascot@github:dhasakgbb/astrid-mascot#v1.0.0"
```

- [ ] **Step 2: Add Astrid to the welcome page hero (waving pose)**

Open `src/routes/+page.svelte`. Add the mascot near the hero text:

```svelte
<script lang="ts">
  import { AstridMascot } from 'astrid-mascot';
  // ...existing imports
</script>

<section class="hero">
  <AstridMascot pose="waving" size={160} />
  <h1 class="font-display">Hi, I'm Astrid.</h1>
  <p>Take a 5-minute quiz so I can recommend the modes that fit how you learn best.</p>
  <!-- ...existing CTAs... -->
</section>
```

- [ ] **Step 3: Add Astrid to the hub (idle pose)**

Open `src/routes/hub/+page.svelte`:

```svelte
<header class="hub-header flex flex-col items-center gap-3">
  <AstridMascot pose="idle" size={140} />
  <h1>Astrid's Hub</h1>
  <p class="text-[var(--color-ink-soft)]">Pick a place to visit.</p>
</header>
```

- [ ] **Step 4: Add Astrid to results (cheering pose)**

Open `src/routes/explore/results/+page.svelte`:

```svelte
<header class="results-header flex flex-col items-center gap-2">
  <AstridMascot pose="cheering" size={140} />
  <h1>Nice work!</h1>
</header>
```

- [ ] **Step 5: Add Astrid to parent dashboard header (idle pose, smaller)**

Open `src/routes/parent/dashboard/+page.svelte`:

```svelte
<header class="flex items-end justify-between gap-3 flex-wrap">
  <div class="flex items-center gap-3">
    <AstridMascot pose="idle" size={80} />
    <div>
      <span class="eyebrow">Signed in as {data.parent?.email}</span>
      <h1 class="m-0 font-display">Parent dashboard</h1>
    </div>
  </div>
  <!-- ...existing right-side controls... -->
</header>
```

- [ ] **Step 6: Add Astrid to the quiz (thinking pose)**

Open the explore-quiz page (likely `src/routes/explore/+page.svelte` or a child route). Place near the question prompt:

```svelte
<header class="quiz-header flex items-center gap-3">
  <AstridMascot pose="thinking" size={100} />
  <h2>{currentItem.prompt}</h2>
</header>
```

- [ ] **Step 7: Copy sweep**

```bash
git grep -in "helena" -- ':!docs/' ':!*.md' ':!CLAUDE.md'
```

Update each user-facing hit. Aim for "Astrid's Quiz" as the product name in titles, "Astrid" alone in personal greetings.

- [ ] **Step 8: Run tests + svelte-check + build**

```bash
npx vitest run 2>&1 | tail -5
npx svelte-check --threshold error --output human 2>&1 | tail -5
npm run build 2>&1 | tail -5
```

- [ ] **Step 9: Commit + push**

```bash
git add -A
git commit -m "feat(astrid): integrate mascot across welcome, hub, results, dashboard, quiz

Astrid (pose: waving) on welcome; idle on hub; cheering on results;
idle (small) on parent dashboard header; thinking during quiz prompts.
Copy swept: 'Helena's Learner Profile' → 'Astrid's Quiz'.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
git push origin HEAD
```

---

### Task 17: Integrate Astrid into helena-states (CDN-based)

**Files:**
- Modify: `/Users/damian/GitHub/Helena/states/index.html`
- Modify: `/Users/damian/GitHub/Helena/states/index.css` (mount-point CSS)
- Modify: `/Users/damian/GitHub/Helena/states/app.js`

- [ ] **Step 1: Add the CDN script to index.html**

Find the existing profile-schema CDN line. Add a sibling line for astrid-mascot BEFORE `app.js`:

```html
<!-- Astrid mascot — exposes window.AstridMascot. Load before app.js so
     app.js can call window.AstridMascot.renderInto(...) during init. -->
<script src="https://cdn.jsdelivr.net/gh/dhasakgbb/astrid-mascot@v1.0.0/dist/index.iife.js" crossorigin="anonymous"></script>
```

- [ ] **Step 2: Add a mascot mount point in the home view**

In `index.html`, find `<section id="modeSelectionView" ...>`. Add at the top:

```html
<div class="astrid-mascot-mount" aria-hidden="true">
  <div id="astridHomeMount" style="width: 120px; height: 120px;"></div>
</div>
```

In `index.css`, add:

```css
.astrid-mascot-mount {
  display: flex;
  justify-content: center;
  margin-bottom: 0.5rem;
}
```

Also add an end-view mount point if an end-of-session screen exists:

```html
<div id="astridEndMount" style="width: 140px; height: 140px;"></div>
```

- [ ] **Step 3: Mount Astrid in app.js**

```js
function mountAstridHome() {
  if (!window.AstridMascot) return;
  const node = document.getElementById('astridHomeMount');
  if (node) window.AstridMascot.renderInto(node, { pose: 'waving', size: 120 });
}

function mountAstridEnd() {
  if (!window.AstridMascot) return;
  const node = document.getElementById('astridEndMount');
  if (node) window.AstridMascot.renderInto(node, { pose: 'cheering', size: 140 });
}

document.addEventListener('DOMContentLoaded', () => {
  mountAstridHome();
  // ...existing init...
});
```

Find the function that transitions to the end view (search for `endView.style.display` or `endView.hidden`) and call `mountAstridEnd()` there.

- [ ] **Step 4: Copy sweep**

```bash
cd /Users/damian/GitHub/Helena/states
git grep -in "helena\|capitals quest" -- ':!*.md'
```

Update display copy: "Capitals Quest" → "Astrid's Map Room" in titles, meta description, `<title>`, og: tags.

- [ ] **Step 5: Bump cache-bust version on script tags**

`<script src="app.js?v=21">` → `?v=22` (or whatever next-integer). Same for `profile.js`.

- [ ] **Step 6: Verify CDN tag is in the served HTML**

```bash
cd /Users/damian/GitHub/Helena/states
python3 -m http.server 8080 &
SERVER_PID=$!
sleep 2
curl -sf http://localhost:8080/ -o /tmp/states-index.html
grep -c "astrid-mascot\|profile-schema" /tmp/states-index.html
kill $SERVER_PID 2>/dev/null || true
```

Expected: 2 (both CDN scripts present).

- [ ] **Step 7: Syntax-check**

```bash
node -c /Users/damian/GitHub/Helena/states/app.js
node -c /Users/damian/GitHub/Helena/states/profile.js
```

- [ ] **Step 8: Commit + push**

```bash
git add index.html index.css app.js profile.js
git commit -m "feat(astrid): mount mascot on home + end view; rename to Astrid's Map Room

Loads window.AstridMascot via jsDelivr from astrid-mascot@v1.0.0.
Astrid waves on home, cheers at end-of-session. Capitals Quest →
Astrid's Map Room across titles and meta.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
git push origin HEAD
```

---

### Task 18: Integrate Astrid into helena-math (CDN-based)

Same pattern as helena-states.

**Files:**
- Modify: `/Users/damian/GitHub/Helena/math/index.html`
- Modify: `/Users/damian/GitHub/Helena/math/styles.css` (mount-point CSS)
- Modify: `/Users/damian/GitHub/Helena/math/app.js`

- [ ] **Step 1: Add the CDN script to index.html**

```html
<script src="https://cdn.jsdelivr.net/gh/dhasakgbb/astrid-mascot@v1.0.0/dist/index.iife.js" crossorigin="anonymous"></script>
```

Place before `app.js`.

- [ ] **Step 2: Add mount points**

In the mode-selection view:

```html
<div class="astrid-mascot-mount" aria-hidden="true">
  <div id="astridHomeMount" style="width: 120px; height: 120px;"></div>
</div>
```

In the end-of-round summary:

```html
<div id="astridEndMount" style="width: 140px; height: 140px;"></div>
```

In `styles.css`:

```css
.astrid-mascot-mount {
  display: flex;
  justify-content: center;
  margin-bottom: 0.5rem;
}
```

- [ ] **Step 3: Mount in app.js**

```js
function mountAstridHome() {
  if (!window.AstridMascot) return;
  const node = document.getElementById('astridHomeMount');
  if (node) window.AstridMascot.renderInto(node, { pose: 'waving', size: 120 });
}

function mountAstridEnd() {
  if (!window.AstridMascot) return;
  const node = document.getElementById('astridEndMount');
  if (node) window.AstridMascot.renderInto(node, { pose: 'cheering', size: 140 });
}

document.addEventListener('DOMContentLoaded', () => {
  mountAstridHome();
  // ...existing init...
});
```

Wire `mountAstridEnd()` into whatever function transitions to the end view.

- [ ] **Step 4: Copy sweep**

```bash
cd /Users/damian/GitHub/Helena/math
git grep -in "helena" -- ':!*.md'
```

Update: "Helena's Math Practice" → "Astrid's Number Garden" in titles, `<title>`, meta description.

- [ ] **Step 5: Bump cache-bust version**

Same pattern as states.

- [ ] **Step 6: Static check + syntax check**

```bash
cd /Users/damian/GitHub/Helena/math
python3 -m http.server 8081 &
SERVER_PID=$!
sleep 2
curl -sf http://localhost:8081/ -o /tmp/math-index.html
grep -c "astrid-mascot\|profile-schema" /tmp/math-index.html
kill $SERVER_PID 2>/dev/null || true

node -c /Users/damian/GitHub/Helena/math/app.js
node -c /Users/damian/GitHub/Helena/math/profile.js
```

- [ ] **Step 7: Commit + push**

```bash
git add index.html styles.css app.js
[ -n "$(git status --porcelain profile.js)" ] && git add profile.js
git commit -m "feat(astrid): mount mascot on home + end view; rename to Astrid's Number Garden

Same pattern as helena-states. Math Practice → Astrid's Number Garden.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
git push origin HEAD
```

---

### Task 19: Final cross-cutting acceptance

- [ ] **Step 1: Drift smoke test — "Helena" gone from source**

```bash
cd /Users/damian/GitHub/Helena
for d in profile-schema helena-learner-profile Spelling helena-states helena-math; do
  echo "=== $d ==="
  git -C $d grep -in "helena" -- ':!*.md' ':!docs/' ':!CLAUDE.md' 2>/dev/null \
    | grep -v "window.helenaProfile\|helena-spelling:\|helena-states:\|helena-math:" \
    | head -20 || true
done
```

Expected: empty output (only allowed historic patterns remain).

- [ ] **Step 2: All 6 repos under astrid-learn**

```bash
gh repo list astrid-learn --json name --jq '.[].name' | sort
```

Expected: `astrid-mascot`, `learner-profile`, `math`, `profile-schema`, `spelling`, `states`.

- [ ] **Step 3: All 4 live deploys return 200**

Use the URLs captured in Task 5 Step 4.

```bash
for url in \
  "https://learner-profile.vercel.app/" \
  "https://spelling.vercel.app/" \
  "https://states.vercel.app/" \
  "https://math.vercel.app/"; do
  echo "$url -> $(curl -sI -o /dev/null -w '%{http_code}' -m 6 "$url")"
done
```

Each: 200.

- [ ] **Step 4: jsDelivr serves both packages**

```bash
for url in \
  "https://cdn.jsdelivr.net/gh/dhasakgbb/profile-schema@v1.0.0/dist/index.iife.js" \
  "https://cdn.jsdelivr.net/gh/dhasakgbb/astrid-mascot@v1.0.0/dist/index.iife.js"; do
  echo "$url -> $(curl -sI -o /dev/null -w '%{http_code}' -m 8 "$url")"
done
```

Each: 200.

- [ ] **Step 5: All test suites green**

```bash
cd /Users/damian/GitHub/Helena/learner-profile && npx vitest run 2>&1 | tail -5
cd /Users/damian/GitHub/Helena/spelling && npx vitest run --exclude '**/definitions.test.ts' --exclude '**/masking-issues.test.ts' 2>&1 | tail -5
cd /Users/damian/GitHub/Helena/astrid-mascot && npx vitest run 2>&1 | tail -5
node -c /Users/damian/GitHub/Helena/states/profile.js && node -c /Users/damian/GitHub/Helena/states/app.js
node -c /Users/damian/GitHub/Helena/math/profile.js && node -c /Users/damian/GitHub/Helena/math/app.js
```

- [ ] **Step 6: Browser spot check**

For each app, open in a browser and verify Astrid is visible in the home view. For the two vanilla apps, in DevTools console:

```js
typeof window.AstridMascot      // 'object'
window.AstridMascot.POSES.length // 8
```

- [ ] **Step 7: PLATFORM.md sub-project A completion note**

Add at the end of `/Users/damian/GitHub/Helena/learner-profile/docs/PLATFORM.md`:

```markdown
---

**Sub-project A status:** complete, 2026-05-26.

The platform now ships under the Astrid brand. The mascot lives in
`astrid-mascot` (git tag v1.0.0 at https://github.com/dhasakgbb/astrid-mascot).
All 5 repos are at `github.com/dhasakgbb/*`. Domain registration is
deferred — the rebrand stands on the GitHub org and Vercel project
names alone until commercial-readiness sub-projects (B, C, F) decide
on a hosting domain.
```

- [ ] **Step 8: Commit + push**

```bash
cd /Users/damian/GitHub/Helena/learner-profile
git add docs/PLATFORM.md
git commit -m "docs(platform): mark sub-project A complete

Astrid rebrand shipped: github.com/astrid-learn org, mascot package
published, 4 apps consume from it.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
git push origin HEAD
```

---

## Done

Acceptance criteria from the spec are now mechanically verifiable:

1. ✅ `gh repo list astrid-learn` returns 6 repos (5 platform + new astrid-mascot) — Tasks 1, 14
2. ✅ `git grep -in "helena"` returns no code-level hits across the 5 repos (only allowed historic patterns) — Tasks 6, 19
3. ✅ `astrid-mascot` v1.0.0 published, 8 poses, served via jsDelivr, consumed by all 4 apps — Tasks 9–18
4. ✅ All 4 live deploys return HTTP 200 with Astrid visible in the home views — Task 19
5. ✅ PLATFORM.md updated — Tasks 7, 19

**Deferred / out of scope (per spec):**
- Domain registration
- Trademark search
- Per-app mascot costume variants
- Palette unification

**Next sub-project:** B — COPPA compliance foundation.
