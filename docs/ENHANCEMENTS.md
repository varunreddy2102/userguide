# Video framework enhancements

Reference for every visual + audio element available in `e2e/tests/video-helpers.js` and `docs/user-guide/videos/build-video.js`.

## Visual overlays (Playwright DOM injection)

All overlays are `position: fixed` with `pointer-events: none` so they never block the underlying app. Drawn at high z-index to sit above everything.

### Already in v1
| Method | What it does |
|---|---|
| `narrate(text, ms, ttsText?)` | Caption at the bottom of the screen + records timeline cue. Optional TTS-text override for pronunciation fixes. |
| `point(selector, opts)` | Animated red cursor lands on the element. |
| `click(selector, opts)` | Concurrent narration + cursor + click. Pass `sequential: true` for old explain-then-do ordering. |
| `type(selector, text)` | Type with realistic key cadence. |
| `pause(ms)` | Silent wait. |

### New visual helpers
| Method | What it does | Best for |
|---|---|---|
| `highlight(selector, ms, opts)` | Yellow glow ring around the element. `opts.pulse=true` for breathing animation. | "Look at this" |
| `spotlight(selector, ms, opts)` | Dims everything except a rounded cutout around the target. | Crowded screens, focus on one thing |
| `callout(selector, label, ms, side)` | Indigo bubble with leader arrow pointing at the element. `side` ∈ `down`/`up`/`left`/`right`. | Annotation that names something |
| `beginSteps(total)` + `step(label?)` + `endSteps()` | Top-right "Step N of M — label" counter. | Multi-step click sequences |
| `showKeys(['Ctrl','S'], ms)` | Bottom-right keyboard-key chip row. | Showing keyboard shortcuts |
| `setProgress(pct)` | Thin gradient bar across the bottom edge. Pass 0-100. | Long-form videos with chapters |
| `chapter(label)` | Marks a chapter at the current timeline position. Embedded in MP4 metadata so players show chapter list. | Multi-section videos |
| `introCard({title, subtitle}, ms)` | Branded full-screen card before content starts. | Series intro |
| `outroCard({title, subtitle}, ms)` | Branded full-screen card after content ends — typically "Up next: ..." | Series ladder |

### Persistent overlays (always on once `install()` is called)
- **Logo bug** — small `247HRM` chip in the bottom-right corner, never dismissed. Configurable via `new VideoDirector(page, base, { brand: { html: '...' } })`.

## Audio enhancements (build-video.js pipeline)

The pipeline now does:
1. Per-cue narration TTS (Amara / Gaurav)
2. Calibrated silences between cues so caption start = audio start
3. **Click sound effect overlay** at every `click()` timestamp from `.clicks.json`
4. **Background music bed** — looped + faded in/out, mixed under narration at low volume
5. **Final video fade in/out** — 0.6s at start and end of MP4
6. **Chapter metadata** embedded in MP4

### Assets

Stored once at `docs/user-guide/videos/_assets/` and reused across all videos:

| File | Source | Notes |
|---|---|---|
| `click.mp3` | ElevenLabs `/v1/sound-generation` (prompt: "subtle UI click") + ffmpeg trim to 0.18s | Mixed at 45% volume |
| `music-bg.mp3` | ElevenLabs `/v1/music` (prompt: "soft warm cinematic instrumental ambient...") + ffmpeg fade + 18% gain | 60s loop. Stream-looped to fit any video duration; 2s fade-in + 1.5s fade-out applied per video |

Regenerate either with: see [VOICE-CHOICES.md](VOICE-CHOICES.md) for the API call patterns.

### Disabling audio enhancements

Per-build env vars:
- `NO_CLICKS=1` — skip click SFX overlay
- `NO_MUSIC=1` — skip music bed

## Output sidecar files (per video)

When the spec runs, `flush()` writes:

| File | Content |
|---|---|
| `<name>.webm` | Raw Playwright recording (no audio) |
| `<name>.cues.json` | `[{tStart, tEnd, text, ttsText}]` — drives per-cue TTS + sync validation |
| `<name>.clicks.json` | `[{tMs}]` — click timestamps for SFX mixing |
| `<name>.chapters.json` | `[{tMs, label}]` — chapter metadata for MP4 muxing |
| `<name>.vtt` | WebVTT captions |
| `<name>.ssml.txt` | ElevenLabs-ready text (single blob fallback) |
| `<name>.script.md` | Human-readable narration timeline |

After `build-video.js`:

| File | Content |
|---|---|
| `<name>.narration.mp3` | TTS only (cached for re-mixing without re-paying TTS) |
| `<name>.mp3` | Final mix (narration + clicks + music) |
| `<name>.mp4` | Final video with audio + fades + chapters |
| `<name>.thumb.png` | 16:9 thumbnail |
| `_per_cue/cue-NNN.mp3` | Cached per-cue TTS — survives across runs |

## Example spec — using the new helpers

```js
const v = new VideoDirector(page, outBase, { pace: 0.85 });
await v.install();

// Intro card
await v.introCard({ title: 'Triaging your inbox', subtitle: '247HRM Helpdesk · Quickstart 2' }, 3500);
v.chapter('Intro');

// Spotlight while narrating
await v.spotlight('.stat-strip', 3500);
await v.narrate('Six counters at the top show today\'s pulse.', 3500);

// Highlight with callout
await v.highlight('.unassigned-card', 4000, { pulse: true });
await v.callout('.unassigned-card', 'Click here to claim a ticket', 3500, 'down');

// Numbered steps
v.beginSteps(3);
await v.step('Open the ticket');
await v.click('mat-row:first-child', { announce: 'Click any row to open it.' });
await v.step('Self-assign');
await v.click('button:has-text("Self-assign")', { announce: 'Hit Self-assign.' });
await v.step('Reply');
await v.click('button:has-text("Send")', { announce: 'Send your first reply.' });
await v.endSteps();

// Keyboard shortcut display
await v.showKeys(['Ctrl', 'K'], 1800);
await v.narrate('Ctrl-K opens the command palette.', 3000);

// Outro
v.chapter('Wrap');
await v.outroCard({ title: 'Up next', subtitle: 'Video 3 — Replying to a customer' }, 3000);

await v.flush();
```

## What we deliberately skipped

- **Picture-in-picture narrator face** — no video of Amara/Gaurav exists; faking it would feel cheap.
- **Heavy color grading** — distorts UI screenshots; B2B viewers expect to see the real product.
- **Whoosh/transition sound effects** — too cinematic for B2B helpdesk content.
- **YouTube-style end-screen cards** — only useful if hosted on YouTube; the outro card serves the same purpose for any host.

If you want any of these added later, all are doable — track them via `narrate()` overrides + ffmpeg post-process steps.

— *Last updated 2026-05-06.*
