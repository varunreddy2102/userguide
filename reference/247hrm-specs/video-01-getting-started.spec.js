/**
 * Video 1 — Getting started: login + the layout tour.
 *
 * Run:  cd e2e && npx playwright test tests/video-01-getting-started.spec.js --reporter=list
 * Outputs:
 *   docs/user-guide/videos/01-getting-started/01-getting-started.webm
 *   docs/user-guide/videos/01-getting-started/01-getting-started.vtt
 *   docs/user-guide/videos/01-getting-started/01-getting-started.ssml.txt
 *   docs/user-guide/videos/01-getting-started/01-getting-started.script.md
 */

const { test } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const { readOtpFromFile } = require('./helpers');
const { VideoDirector } = require('./video-helpers');

const NG = process.env.ANGULAR_URL || 'http://localhost:4200';
const EMAIL = process.env.GUIDE_EMAIL || 'varunr@interbiz.in';
const NAME = '01-getting-started';
const VIDEO_DIR = path.resolve(__dirname, '..', '..', 'docs', 'user-guide', 'videos', NAME);
fs.mkdirSync(VIDEO_DIR, { recursive: true });

test.describe.configure({ mode: 'serial' });

test('Video 1 — Getting started', async ({ browser }) => {
    test.setTimeout(180_000);

    const recordingStartedAt = Date.now();
    const ctx = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        ignoreHTTPSErrors: true,
        recordVideo: { dir: VIDEO_DIR, size: { width: 1440, height: 900 } },
    });
    const page = await ctx.newPage();

    // ===== Scene 0: Branded intro card =====
    await page.goto(`${NG}/login`, { waitUntil: 'networkidle' });
    const v = new VideoDirector(page, path.join(VIDEO_DIR, NAME), {
        pace: parseFloat(process.env.PACE || '0.85'),
        recordingStartedAt,
    });
    await v.install();

    v.chapter('Intro');
    await v.introCard({
        title: 'Getting started',
        subtitle: 'Logging in & touring the screen',
        meta: 'AGENT QUICKSTART · VIDEO 1 OF 9',
    }, 3200);

    // ===== Scene 1: Welcome on the login page =====
    v.chapter('Welcome');
    await v.narrate('Welcome to the 247HRM Helpdesk Agent Handbook.', 3600,
        'Welcome to the Twenty four seven H R M Helpdesk Agent Handbook.');
    await v.narrate('In ninety seconds, we\'ll log you in and tour the screen.', 3800);

    // ===== Scene 2: Email + OTP =====
    v.chapter('Login');
    await v.narrate('Login is passwordless. Just your work email and a one-time code.', 4000);

    // Email — highlight while pointing/typing so the eye locks on
    const emailSel = 'input[formcontrolname="email"]';
    await v.point(emailSel, { holdMs: 600 });
    await Promise.all([
        v.highlight(emailSel, 2400, { pad: 6 }),
        v.type(emailSel, EMAIL, { charDelayMs: 45 }),
    ]);

    await v.click('button:has-text("Send OTP")', { announce: 'Click Send OTP.', announceMs: 2400, announceTts: 'Click Send O T P.' });

    await page.locator('input[formcontrolname="code"]').waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(700);
    const otp = await readOtpFromFile(EMAIL);

    await v.narrate('Check your email — a six-digit code arrives in seconds.', 3800);

    // OTP field — highlight while typing the code
    const otpSel = 'input[formcontrolname="code"]';
    await Promise.all([
        v.highlight(otpSel, 2200, { pad: 6, pulse: true }),
        v.type(otpSel, otp, { charDelayMs: 110 }),
    ]);

    await v.click('button:has-text("Validate OTP")', { announce: 'Click Validate to sign in.', announceMs: 2600, announceTts: 'Click Validate to sign in.' });

    await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 15000 });
    await page.waitForTimeout(1000);
    await v.reinstall();

    // ===== Scene 3: Dashboard arrival =====
    v.chapter('Tour');
    await v.narrate('You land on the dashboard.', 2600);
    await v.narrate('Three regions repeat across every screen.', 3200);

    // ===== Scene 4: Top bar — highlight (spotlight on a wide thin strip looks awkward) =====
    try {
        const topBar = 'mat-toolbar, header, .topbar, nav.toolbar';
        await Promise.all([
            v.highlight(topBar, 4200, { pad: 4 }),
            v.narrate('Top — the global bar. Timezone, notifications, your role.', 4200),
        ]);
    } catch (_) {
        await v.narrate('Top — the global bar. Timezone, notifications, your role.', 4200);
    }

    // ===== Scene 5: Sidenav — highlight (vertical column reads cleaner with a glow than a cutout) =====
    try {
        const sidenav = 'mat-sidenav, nav[role="navigation"], .sidenav';
        await Promise.all([
            v.highlight(sidenav, 4400, { pad: 4 }),
            v.narrate('Left — the sidenav. Each link is a module you have access to.', 4400),
        ]);
    } catch (_) {
        await v.narrate('Left — the sidenav. Each link is a module you have access to.', 4400);
    }

    // ===== Scene 6: Main content =====
    await v.narrate('And the main area, which changes as you navigate.', 3500);

    // ===== Scene 7: Click into Tickets =====
    v.chapter('Open Tickets');
    await v.click('a[routerlink="/tickets"], a:has-text("Tickets")', {
        announce: 'Most days you\'ll spend in Tickets.',
        announceMs: 2800,
    });
    // Bridge the navigation with a follow-up caption so there's no dead air.
    await v.narrate('Let\'s open it.', 1700);
    await page.waitForTimeout(800);
    await v.reinstall();

    await v.narrate('Your inbox.', 1900);

    // Pulse each of the 6 counter cards in sequence, narration covers them all
    try {
        // Try several selectors for the per-counter element
        const cardSel = '.ticket-list-stats mat-card, .stats-row mat-card, mat-card.stat-card, .ticket-stat-card';
        const fallback = 'mat-card';
        const sel = (await page.locator(cardSel).count()) > 0 ? cardSel : fallback;
        await Promise.all([
            v.highlightAll(sel, 4200, { pad: 3, pulse: false }),
            v.narrate('Six counters at the top show today\'s pulse.', 4200),
        ]);
    } catch (_) {
        await v.narrate('Six counters at the top show today\'s pulse.', 3800);
    }

    // ===== Scene 8: Outro card =====
    v.chapter('Wrap');
    await v.outroCard({
        title: 'Up next',
        subtitle: 'Video 2 — Triaging your inbox',
        meta: '247HRM HELPDESK · AGENT HANDBOOK',
    }, 3500);

    await v.flush();
    await ctx.close(); // finalises the .webm

    // Pick the largest .webm (most recent / most-recorded) and overwrite the canonical name.
    // Defensive: stale or partial webms from prior failed runs may also be present.
    const target = path.join(VIDEO_DIR, `${NAME}.webm`);
    const webms = fs.readdirSync(VIDEO_DIR)
        .filter(f => f.endsWith('.webm'))
        .map(f => ({ f, full: path.join(VIDEO_DIR, f), size: fs.statSync(path.join(VIDEO_DIR, f)).size }))
        .sort((a, b) => b.size - a.size);
    if (webms.length === 0) throw new Error('No webm written by Playwright');
    const winner = webms[0];
    if (winner.full !== target) {
        if (fs.existsSync(target)) fs.unlinkSync(target);
        fs.renameSync(winner.full, target);
    }
    // Delete any other leftover .webm files
    for (const w of webms) {
        if (w.f !== path.basename(target) && fs.existsSync(w.full)) fs.unlinkSync(w.full);
    }
    console.log(`  ${NAME}.webm written (${(winner.size / 1024 / 1024).toFixed(2)} MB)`);
});
