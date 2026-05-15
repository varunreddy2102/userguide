/**
 * Example video recording spec. Copy + rename for each new video.
 *
 * Run:  npx playwright test tests/video-01-example.spec.js
 *
 * Emits (under <videos-dir>/01-example/):
 *   01-example.webm           — silent recording
 *   01-example.cues.json      — per-cue caption timeline (consumed by build-video.js)
 *   01-example.clicks.json    — click SFX timestamps
 *   01-example.chapters.json  — chapter markers
 *   01-example.vtt            — captions
 *   01-example.ssml.txt       — TTS narration text
 *   01-example.script.md      — human-readable script
 *   01-example.meta.json      — leadInMs etc
 *
 * Then run build-video.js to turn the recording into a final MP4:
 *   ELEVENLABS_API_KEY=... \
 *   node ~/.claude/skills/user-guide/scripts/build-video.js \
 *     --videos-dir docs/handbook/videos 01-example
 *
 * ============================================================================
 * TODO before running:
 *   1. Wire up `loginViaUi` in helpers.js.
 *   2. Replace example selectors with real ones from your app.
 *   3. Make sure `VIDEOS_DIR` below points at the right place for your project.
 *   4. Adjust paragraph timings (the `ms` arg to narrate) to fit your script.
 * ============================================================================
 */

const { test } = require('@playwright/test');
const path = require('path');
const os = require('os');
const { loginViaUi } = require('./helpers');

// Load VideoDirector from the installed skill at user scope.
// Adjust this require if you installed the skill somewhere else.
const SKILL_ROOT = process.env.USERGUIDE_SKILL_ROOT
    || path.join(os.homedir(), '.claude', 'skills', 'user-guide');
const { VideoDirector } = require(path.join(SKILL_ROOT, 'scripts', 'video-helpers'));

const NAME = '01-example';
const VIDEOS_DIR = path.resolve(__dirname, '..', '..', 'docs', 'handbook', 'videos');
const OUT_DIR = path.join(VIDEOS_DIR, NAME);

test.use({
    viewport: { width: 1280, height: 720 },
    video: { mode: 'on', size: { width: 1280, height: 720 } },
});

test('record ' + NAME, async ({ page, context }) => {
    test.setTimeout(120000);
    const recordingStartedAt = Date.now();

    // TODO: implement loginViaUi or replace this call with your own flow.
    await loginViaUi(page);

    const v = new VideoDirector(page, path.join(OUT_DIR, NAME), {
        recordingStartedAt,
        // brand: { svgPath: '/path/to/your/logo.svg' },
        // brand: { html: '<span class="accent">My</span>App' },
    });
    await v.install();

    await v.introCard({ title: 'Quick tour', subtitle: 'Your product in 60 seconds' });

    await v.narrate('Welcome. This is a 60-second tour of the dashboard.', 3500);

    // TODO: swap the selector below for one that exists in your app
    await v.highlight('h1', 2000, { pulse: true });

    await v.narrate('That is the main heading. Make this script your own.', 3000);

    await v.outroCard({ title: 'Thanks for watching', subtitle: 'See the handbook for more' });

    await v.flush();

    // Save the recorded webm next to the sidecars
    await context.close();
    // Playwright writes the video to a temp dir; you may need to move it.
    // Easiest pattern: configure outputDir in playwright.config.js and
    // copy / rename the resulting .webm into OUT_DIR/<NAME>.webm here.
    console.log(`Recording complete. Move the .webm into ${OUT_DIR}/${NAME}.webm before running build-video.js.`);
});
