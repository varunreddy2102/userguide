# userguide-skill

A Claude Code skill that builds multi-format product handbooks from a single markdown source:

- Self-contained HTML pages (sticky nav, base64-inlined images, prev/next)
- A single PDF with anchored TOC and clickable internal links
- Instructional MP4 videos (Playwright recording + ElevenLabs TTS + ffmpeg mux)

Once installed at user scope it's reusable across every project on your machine — no per-project copy of the scripts.

## Install (at user scope)

```bash
git clone https://github.com/varunreddy2102/userguide ~/.claude/skills/user-guide
cd ~/.claude/skills/user-guide && npm install
```

That's it. The scripts are now invokable from anywhere via absolute path.

## First-run scaffold in a consumer project

From inside any project you want to document:

```bash
node ~/.claude/skills/user-guide/scripts/scaffold.js
```

Defaults: `target = cwd`, `handbook-dir = docs/handbook`, `specs-dir = e2e/tests`. Override with `--target`, `--handbook-dir`, `--specs-dir`, `--force`.

Output:
- `docs/handbook/{README,01-introduction,02-getting-started}.md` + `images/`
- `e2e/tests/{helpers,capture-screenshots,video-01-example}.spec.js`

The scaffolded specs have prominent `TODO` markers — wire up `loginViaUi` in `helpers.js` and swap example selectors for ones that exist in your app.

## Building

### HTML

```bash
node ~/.claude/skills/user-guide/scripts/build-html.js \
  --src docs/handbook \
  --out docs/handbook/html \
  --title "My Product Handbook"
```

Auto-discovers `README.md` (becomes `index.html`) plus all `NN-*.md` chapters (sorted numerically). Each chapter's title is taken from its first `#` heading.

### PDF

```bash
node ~/.claude/skills/user-guide/scripts/build-pdf.js \
  --src docs/handbook \
  --out docs/handbook/Handbook.pdf \
  --title "My Product Handbook"
```

### Videos

```bash
# Record (writes .webm + sidecars):
npx playwright test e2e/tests/video-01-example.spec.js

# Mux + add narration + final MP4:
ELEVENLABS_API_KEY=... \
  node ~/.claude/skills/user-guide/scripts/build-video.js \
    --videos-dir docs/handbook/videos 01-example
```

## Configuration

### Environment variables

| Var | Default | Used by |
|---|---|---|
| `ELEVENLABS_API_KEY` | required for video | build-video |
| `ELEVENLABS_VOICE_ID` | from voices.json | build-video |
| `ELEVENLABS_MODEL` | `eleven_turbo_v2_5` | build-video |
| `VOICE` | `default` | build-video (selects from voices.json) |
| `FFMPEG_PATH` | `ffmpeg` on PATH | build-video |
| `REGENERATE_AUDIO` | unset | build-video (set to `1` to bypass cache) |
| `SINGLE_BLOB` | unset | build-video (debug; bypass per-cue sync) |
| `NO_CLICKS` | unset | build-video (skip click SFX) |
| `NO_MUSIC` | unset | build-video (skip music bed) |
| `USERGUIDE_SKILL_ROOT` | `~/.claude/skills/user-guide` | template specs (override install path) |

### Brand override

The video logo bug is configured per-`VideoDirector` instance:

```js
new VideoDirector(page, base, {
    brand: { html: '<span class="accent">My</span>App' }
    // or:
    brand: { svgPath: '/abs/path/to/logo.svg' }
});
```

If neither is supplied, a generic `?Help` badge renders.

### voices.json

Drop a `voices.json` at the skill root to override built-in voice presets:

```json
{
  "default": {
    "id": "<elevenlabs-voice-id>",
    "settings": {
      "stability": 0.45,
      "similarity_boost": 0.75,
      "style": 0.15,
      "use_speaker_boost": true
    }
  },
  "secondary": {
    "id": "<another-voice-id>",
    "settings": {
      "stability": 0.55,
      "similarity_boost": 0.75,
      "style": 0.05,
      "use_speaker_boost": true
    }
  }
}
```

Select per-run with `VOICE=secondary`.

## Adapting the scaffolded specs to your app

The scaffolded `helpers.js` ships a `loginViaUi(page)` stub with two example flows (basic email/password, OTP-from-file) commented in. Pick the one that matches your app and replace the stub body.

The scaffolded `capture-screenshots.spec.js` and `video-01-example.spec.js` use placeholder selectors (`h1`, `/dashboard`, `/settings`). Replace these with real selectors from your app before running.

## Reference

The `reference/` folder contains a real-world example handbook (247HRM Helpdesk — 13 chapters, full video scripts, sample sidecar artifacts). Read it for ideas on chapter granularity and video pacing. These are read-only — `scaffold.js` does not copy them.

## Docs

- `docs/VOICE-CHOICES.md` — notes on picking ElevenLabs voices and tuning settings
- `docs/SCRIPTS.md` — example shooting scripts
- `docs/ENHANCEMENTS.md` — full reference for the VideoDirector overlay helpers

## License

MIT — see [LICENSE](LICENSE).
