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
