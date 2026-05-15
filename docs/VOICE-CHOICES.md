# Video voice choices & settings

Locked-in voice plan for the helpdesk training video series. These choices were picked after auditioning ~30 voices across premade + community libraries; this file is the authoritative record.

## Voices

### Amara — primary narrator
- **Voice ID:** `IEBxKtmsE9KTrXUwNazR`
- **Library description:** "Amara - Calm & Intellectual Narrator"
- **Accent:** Indian English
- **Use case:** `informative_educational`
- **Why we picked her:** clean polished delivery, calm intellectual register that matches B2B training content. Not overly authoritative (which can feel cold) and not chatty (which feels unprofessional).
- **Voice settings:**
  ```json
  { "stability": 0.45, "similarity_boost": 0.75, "style": 0.15, "use_speaker_boost": true }
  ```

### Gaurav — secondary / "now let's do it" narrator
- **Voice ID:** `SXuKWBhKoIoAHKlf6Gt3`
- **Library description:** "Gaurav - Professional and Calm Indian English"
- **Accent:** Indian English (same family as Amara — duo coherent)
- **Use case:** `informative_educational`
- **Why we picked him:** matches Amara's register so the duo doesn't clash; takes over for action-oriented "now let's click X" beats while she handles explanatory content.
- **Voice settings:** flatter than Amara to avoid over-stressed words (e.g. "ticket" sounded over-emphasised on default settings):
  ```json
  { "stability": 0.55, "similarity_boost": 0.75, "style": 0.05, "use_speaker_boost": true }
  ```
- **Speed:** 1.0× (no atempo). Earlier tested 1.02× — too much, dropped.

## Model

`eleven_turbo_v2_5` for everything. Cheaper than `eleven_multilingual_v2`, virtually indistinguishable for spoken-word, fast generation.

## Pronunciation rules

These wording substitutions are applied via the **TTS-text override** in `e2e/tests/video-helpers.js` — visual captions stay clean, audio gets the phonetic version.

| Visual caption | TTS audio text | Reason |
|---|---|---|
| `247HRM` (full title) | `Twenty-four-seven HRM` (hyphenated) | Hyphens give clean prosody on full-title mentions |
| `247HRM` (short reference) | `Twenty four seven HRM` (spaced) | Spaces also work; either is acceptable |
| `OTP` | `O T P` | Spell out three-letter abbrevs that aren't household words |
| `SLA` | `S L A` | Same — spell out |
| `SaaS` | `Sass` | Industry pronunciation, not "S-A-A-S" |
| `MOS` | `M O S` | Spell out |
| `Jira` | `Jira` | Pronounced naturally — no override |
| Ticket IDs (`TKT-1234`) | `T K T dash one two three four` | Spell letters; speak digits one-by-one |
| Email addresses | spell-friendly form | e.g. `varunr at interbiz dot in` |

## Voice plan across the series

| # | Topic | Primary voice | Secondary appearance |
|---|---|---|---|
| 01 | Getting started | Amara | none |
| 02 | Triaging your inbox | Amara | Gaurav demos picking up a ticket |
| 03 | Replying to a customer | Amara explains | Gaurav narrates the reply itself |
| 04 | Watchers, contacts, CC | Amara | Gaurav demos add-watcher click flow |
| 05 | Status & SLA in practice | Amara explains | Gaurav demos the transition dialog |
| 06 | Escalating to Jira | Amara explains | Gaurav narrates the dialog form |
| 07 | Saved views & automation | Gaurav (single host) | none — short tactical video |
| 08 | Notification preferences | Amara | none |
| 09 | Public portal (customer's view) | Amara (customer-perspective) | none |

The split keeps Amara as the educational anchor; Gaurav appears specifically for "watch me do this" demonstration beats. The contrast cues the viewer that the screen action is the focus, not the explanation.

## How to swap voices later

- **Different voice for one video:** set `VOICE=gaurav` (or another key) when calling the build script:
  ```bash
  VOICE=gaurav node docs/user-guide/videos/build-video.js 07-automation
  ```
- **Add a new voice:** edit the `VOICES` map in [docs/user-guide/videos/build-video.js](build-video.js).
- **Different voice settings:** edit the `settings` object on the corresponding voice in the `VOICES` map.
- **Override single render:** set env vars `ELEVENLABS_VOICE_ID=<id>` to bypass the map entirely.

## Mixing two voices in one video

The current build script runs **one voice per video**. If a video needs both speakers in one run:
1. Generate two `.ssml.txt` files (one per voice) — split the script in the spec file
2. Run `build-video.js` twice with different `VOICE=` values producing two MP3s
3. Use `ffmpeg` `-filter_complex concat` to splice them in order
4. Mux the combined audio with the original webm

For now (videos 02-06) the simplest pattern is **call the spec twice** — once for Amara segments, once for Gaurav segments — and concat the audio. Documented as `MIXING.md` if/when we hit it.

— *Last updated 2026-05-06.*
