---
name: user-guide
description: Use when the user asks to build, rebuild, regenerate, update, or extend a multi-format product handbook (markdown source → HTML pages, single PDF, instructional MP4 videos). Covers the full pipeline including Playwright screenshot capture, ElevenLabs TTS narration, and ffmpeg muxing. Invoke whenever a request mentions "user guide", "handbook", "help docs", "training video", "screenshot the UI", "record a help video", or asks about regenerating product documentation after a UI change.
---

# User-guide pipeline skill

A multi-format documentation builder. One markdown source produces:

- A set of self-contained HTML pages (sticky topnav, prev/next, base64-inlined images)
- A single PDF with anchored TOC and clickable internal links
- Instructional MP4 videos (Playwright recording + ElevenLabs TTS + ffmpeg mux)

This skill is installed at user scope. All scripts are invoked via absolute paths:

```
node ~/.claude/skills/user-guide/scripts/<script>.js [args]
```

## First-run setup in a new project

Run the scaffold script from inside the consumer project. It drops starter
markdown + Playwright spec templates into your project tree:

```bash
node ~/.claude/skills/user-guide/scripts/scaffold.js
# defaults: target = cwd, handbook-dir = docs/handbook, specs-dir = e2e/tests
```

That creates `docs/handbook/{README,01-introduction,02-getting-started}.md` and
`e2e/tests/{helpers,capture-screenshots,video-01-example}.spec.js`. The specs
have prominent `TODO` markers — Claude must wire up `loginViaUi` and swap the
example selectors for ones that exist in the consumer app.

## When to use this skill

Invoke any time the user says one of:

- "update the user guide" / "regenerate the docs"
- "rebuild the handbook"
- "add a page to the handbook"
- "rebuild the HTML / PDF"
- "record a new help video" / "make a training video"
- "the UI changed — refresh the screenshots"
- "change the voice" / "swap narrator"

## Markdown is the source of truth

Edit only the `.md` files. HTML and PDF outputs are generated and should never be
hand-edited. The build scripts auto-discover `NN-*.md` chapters (sorted
numerically) plus optional `README.md` (becomes `index.html`). Each page's title
is taken from its first `#` heading.

When you add a chapter, just drop in `03-foo.md` — no array updates needed.

## Build commands

### HTML

```bash
node ~/.claude/skills/user-guide/scripts/build-html.js \
  --src docs/handbook \
  --out docs/handbook/html \
  [--images docs/handbook/images] \
  [--title "My Product Handbook"]
```

Each output page is standalone: images base64-embedded, internal `.md` links
rewritten to `.html`, `README.md` rewritten to `index.html`. Sticky topnav +
footer prev/next nav.

### PDF

```bash
node ~/.claude/skills/user-guide/scripts/build-pdf.js \
  --src docs/handbook \
  --out docs/handbook/Handbook.pdf \
  [--images docs/handbook/images] \
  [--title "My Product Handbook"]
```

Uses Playwright Chromium to render. Preserves clickable internal links via
in-document anchors. Cover page → chapters → page numbers in footer.

## Screenshot capture

If the UI changed and screenshots need refreshing:

1. Start your app's dev servers.
2. From the project root: `npx playwright test e2e/tests/capture-screenshots.spec.js`.
3. The scaffolded spec writes PNGs into `docs/handbook/images/`.
4. Rebuild HTML + PDF so the new images are inlined.

The scaffolded `helpers.js` has a `loginViaUi` stub — implement it once for your
app's auth flow. Common patterns (email/password, OTP-via-file) are shown in
comments.

## Video pipeline

### Producing a new video

For video `NN`:

1. **Copy the template spec** `e2e/tests/video-NN-<name>.spec.js` (the scaffold
   ships `video-01-example.spec.js` as a starter).
2. **Write the narrative beats** as `narrate()`, `click()`, `point()`,
   `highlight()` calls on a `VideoDirector` instance.
3. **Record**: `npx playwright test e2e/tests/video-NN-<name>.spec.js` →
   produces `.webm` + sidecar JSON/VTT/SSML files under
   `docs/handbook/videos/<name>/`.
4. **Generate audio + mux**:
   ```bash
   ELEVENLABS_API_KEY="..." \
     node ~/.claude/skills/user-guide/scripts/build-video.js \
       --videos-dir docs/handbook/videos <name>
   ```

### Voice plan (template)

Default voice settings ship in `voices.json` at the skill root (or fall back to
internal defaults). Override:

- `voices.json` at the skill root — recommended persistent override:
  ```json
  {
    "default": { "id": "<elevenlabs-voice-id>",
                  "settings": { "stability": 0.45, "similarity_boost": 0.75, "style": 0.15, "use_speaker_boost": true } },
    "secondary": { "id": "<another-voice-id>",
                    "settings": { "stability": 0.55, "similarity_boost": 0.75, "style": 0.05, "use_speaker_boost": true } }
  }
  ```
- `VOICE=secondary` env var — pick a named entry from `voices.json` per-run.
- `ELEVENLABS_VOICE_ID` env var — one-off override of just the id.

Model defaults to `eleven_turbo_v2_5`; override with `ELEVENLABS_MODEL`.

### Pronunciation overrides (template)

Visual captions stay clean; audio gets a phonetic override via the third arg to
`narrate(visualText, durationMs, ttsText)`. Useful for brand names with digits,
abbreviations, and any word the TTS regularly mispronounces. Examples:

| Visual | TTS text |
|---|---|
| `OTP` | `O T P` |
| `SLA` | `S L A` |
| `SaaS` | `Sass` |
| `MyApp v2` | `My App version two` |

Maintain a per-project table in `docs/handbook/videos/VOICE-CHOICES.md` if your
script has more than a handful.

### Required env vars

- `ELEVENLABS_API_KEY` — text-to-speech permission.
- `FFMPEG_PATH` — overrides PATH lookup of `ffmpeg`.
- `VOICE` — names a key from `voices.json` (defaults to `default`).
- `ELEVENLABS_VOICE_ID` / `ELEVENLABS_MODEL` — full overrides.
- `REGENERATE_AUDIO=1` — force re-call of ElevenLabs even if cached per-cue MP3s
  exist (cache lives in `<videos-dir>/<name>/_per_cue/`).
- `SINGLE_BLOB=1` — fall back to single-TTS-blob mode (debug only; drift
  accumulates).
- `NO_CLICKS=1` — skip click SFX even if `_assets/click.mp3` exists.
- `NO_MUSIC=1` — skip music bed even if `_assets/music-bg.mp3` exists.

### Assets

`build-video.js` looks for two optional audio assets in `<videos-dir>/_assets/`
(override path with `--assets`):

- `click.mp3` — short UI click SFX overlaid at every `click()` timestamp.
- `music-bg.mp3` — looped background music bed (ducked under narration).

If neither exists, the final MP3 is just the narration. Missing assets are not
an error.

### Visual + audio enhancements

The `VideoDirector` class supports overlay helpers beyond `narrate` / `click`:

- `highlight(selector, ms, {pulse})` — glow ring around an element
- `spotlight(selector, ms)` — dim everything except the cutout
- `callout(selector, label, ms, side)` — labelled bubble with arrow leader
- `beginSteps(n)` / `step(label)` / `endSteps()` — numbered counter top-right
- `showKeys(['Ctrl','S'], ms)` — keyboard chip row
- `setProgress(pct)` / `chapter(label)` — long-form aids
- `introCard({title, subtitle}, ms)` / `outroCard(...)` — branded full-screen cards
- `zoom(selector, ms, {scale})` — CSS-transform zoom (non-interactive only)

Persistent logo bug bottom-right: configured via
`new VideoDirector(page, base, { brand: { html: '...' } })` or
`{ brand: { svgPath: '/path/to/logo.svg' } }`. If neither is supplied, a
generic "?Help" badge renders.

### How per-cue audio sync works

Default behaviour: instead of one TTS call for the whole script, `build-video.js`
generates **one MP3 per cue**, ffprobes each for actual duration, then
concatenates with **calibrated silence** before each so cue N's audio starts
exactly at `cue.tStart` (the timestamp the on-screen caption appeared).

After concat, it prints a sync table: per-cue caption-start, audio-start, drift,
TTS duration, caption duration, overrun. Drift = 0.00s is the goal. Non-zero
drift means the caption window was too short for its TTS — fix by:

- Bumping the visual `ms` in the spec (recommended — keeps the script as written)
- Or shortening the caption text so TTS fits

A `WARNING` line surfaces the worst overrun.

Cached per-cue MP3s live in `<videos-dir>/<name>/_per_cue/`. They survive across
runs so an iteration that only changes one cue doesn't re-pay TTS cost for the
others — only changed cues need `REGENERATE_AUDIO=1` (or delete that one
`cue-NNN.mp3`).

## Common tasks (quick reference)

| Task | Steps |
|---|---|
| Edit prose only | Edit `.md` → rerun build-html.js + build-pdf.js |
| Refresh screenshots | Start servers → run capture spec → rebuild HTML + PDF |
| Add a new chapter | Create `NN-foo.md` → rebuild (auto-discovered) |
| Record next video | Copy `video-01-example.spec.js` → write beats → run Playwright → run build-video.js |
| Swap voice | `VOICE=<name> node …/build-video.js …` or edit voices.json |

## ⚠️ Anti-foot-gun checklist (READ BEFORE EACH RUN)

These four traps have shipped semantically-wrong artifacts more than once. Each is silent — Playwright reports "test passed" while the produced MP4 or PNG is wrong (login page instead of admin page, narrated screenshots instead of training videos, etc.). The pipeline itself is fine; these are usage gotchas you must guard against in your spec.

### A. Hash-routed SPAs — always use `/#/` in URLs

If `page.goto('/some-route')` is used on a hash-routed SPA (Angular `useHash: true` or `Router.forRoot` with `useHash`), the navigation **silently lands on the SPA's default route**, NOT the requested one. AuthGuard then bounces to `/login` or `/dashboard`.

```js
// ❌ WRONG — SPA bounces to default authenticated route
await page.goto(`${UI}/ipsecurity`);

// ✅ CORRECT — hash-route navigation
await page.goto(`${UI}/#/ipsecurity`);
```

Heuristic: paste a route into a browser's address bar. If the URL has `#` after Angular's first redirect, you're hash-routed. Use `/#/` in every Playwright `goto`.

### B. `waitUntil: 'networkidle'` doesn't wait for hash-route component mount

Hash navigation changes the URL fragment only — no fresh HTTP request fires for the route change itself. `networkidle` resolves immediately while the lazy-loaded module is still fetching its chunk. You screenshot the previous page.

**Fix:** wait for a page-specific text/element marker AFTER each hash goto:

```js
// ❌ WRONG — networkidle returns before the new component mounts
await page.goto(`${UI}/#/settings`, { waitUntil: 'networkidle' });
await page.screenshot({ path: 'settings.png' });   // might still be dashboard

// ✅ CORRECT — wait for an element only the target page renders
await page.goto(`${UI}/#/settings`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('text=Settings', { timeout: 15_000 });
await page.screenshot({ path: 'settings.png' });

// ✅ EVEN BETTER — use the VideoDirector.gotoAndWait helper
await v.gotoAndWait(`${UI}/#/settings`, 'text=Settings');
```

### C. Login helpers must wait for AUTH-COMPLETE, not `domcontentloaded`

The SPA's signin-oidc → dashboard auth flow runs AFTER `domcontentloaded`. If your login helper returns at that point and the caller fires the next `goto` immediately, the SPA's auth dance gets interrupted → it bounces back to `/login`.

**Mark of "auth fully complete":** a localStorage key that only the post-token API response can populate (e.g. `employeeDetails`, `userProfile`, `currentUser` — depends on your app).

```js
// ❌ WRONG — returns too early
await page.reload({ waitUntil: 'domcontentloaded' });
// caller now does page.goto() → interrupts auth → SPA → /login

// ✅ CORRECT — wait for the SPA to finish its post-token bootstrap
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(
  () => !!localStorage.getItem('employeeDetails'),  // ← your app's marker
  { timeout: 30_000 },
);
await page.waitForTimeout(500);  // one zone-task settle tick
```

### D. Storyboard sanity-check before recording

If the spec only calls `narrate()` over a static page with no `click()` / `point()` / `highlight()`, the viewer sees nothing happen. The narration says "click X" while the screen shows a still page.

**Rule of thumb:** every chapter ≥ 3s should contain at least one cursor movement (`v.point()` or `v.click()`) or a `v.highlight()`. If a chapter is pure prose, demote it to part of an adjacent action beat.

---

## ✅ Verify-before-claiming-done — MANDATORY for video/screenshot artifacts

Both the video pass and the screenshot pass have shipped semantically-wrong artifacts when this step was skipped. The fix is fast: extract a frame, view it via Claude Code's `Read` tool, confirm the content matches intent BEFORE you commit.

### For videos

```bash
# Extract a mid-content frame from the final MP4
LEAD=$(node -e "process.stdout.write(((require('./<NAME>/<NAME>.meta.json').leadInMs||0)/1000).toFixed(3))")
ffmpeg -y -ss 25 -i <NAME>/<NAME>.mp4 -vframes 1 -vf "scale=1280:-1" /tmp/verify.png
```

Then in your assistant session: `Read('/tmp/verify.png')` — confirm the page on screen matches what the narration is talking about. If the dashboard shows while the caption says "Open Settings", the hash-routing bug (A or B) bit you.

### For screenshots

`Read` each output PNG directly. If the rendered page is `/login` or the dashboard when the filename says `settings-page`, you have a timing bug (C — auth race — or B — hash route mount). Re-run with the fixes above.

### Verification status to surface in the PR

After verifying, the PR comment should literally say something like:

> Verified by extracting frames from each final MP4 and viewing them directly via the Read tool. Confirmed: video 01 frame at 25s shows Settings page with caption "Click the IP Restrictions tab". (Etc per video.)

If you can't say that, **you haven't verified**. Don't ship.

---

## Things to be careful about

1. **Don't commit the ElevenLabs API key.** Only via env var, never in files.
2. **Visual captions ≠ audio narration** for videos. Use the TTS-text override
   (third arg to `narrate()`) for any abbreviation, brand name with digits, or
   word the TTS mishears.
3. **Don't manually edit HTML or PDF output.** Always go through the build.
4. **Don't run both build scripts in watch mode concurrently** — the PDF build
   spawns Playwright Chromium which fights for resources.

## Reference examples

The `reference/` folder in the skill root has a real-world example handbook
(247HRM Helpdesk) — 13 chapters, full video scripts, sample sidecar artifacts
(cues.json / chapters.json / vtt). Read it for inspiration on chapter
granularity and video pacing. These are read-only examples — `scaffold.js` does
not copy them.
