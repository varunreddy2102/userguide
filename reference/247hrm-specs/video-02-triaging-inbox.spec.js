/**
 * Video 2 — Triaging your inbox: stats strip, saved views, sort-by-SLA, self-assign.
 *
 * Run:  cd e2e && npx playwright test tests/video-02-triaging-inbox.spec.js --reporter=list
 * Outputs:
 *   docs/user-guide/videos/02-triaging-inbox/02-triaging-inbox.{webm,vtt,ssml.txt,script.md}
 */

const { test } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const { readOtpFromFile } = require('./helpers');
const { VideoDirector } = require('./video-helpers');

const NG = process.env.ANGULAR_URL || 'http://localhost:4200';
const EMAIL = process.env.GUIDE_EMAIL || 'varunr@interbiz.in';
const NAME = '02-triaging-inbox';
const VIDEO_DIR = path.resolve(__dirname, '..', '..', 'docs', 'user-guide', 'videos', NAME);
fs.mkdirSync(VIDEO_DIR, { recursive: true });

test.describe.configure({ mode: 'serial' });

// best-effort highlight: skip if selector doesn't match in time, never block more than `cap` ms
async function tryHighlight(v, page, sel, ms, opts = {}, cap = 1500) {
    try {
        const count = await page.locator(sel).first().count();
        if (count === 0) return false;
        // wait briefly for visibility, but don't block long
        await page.locator(sel).first().waitFor({ state: 'visible', timeout: cap }).catch(() => {});
        await v.highlight(sel, ms, opts);
        return true;
    } catch (_) {
        return false;
    }
}

async function tryClick(v, page, sel, opts = {}, cap = 1500) {
    try {
        const count = await page.locator(sel).first().count();
        if (count === 0) return false;
        await page.locator(sel).first().waitFor({ state: 'visible', timeout: cap }).catch(() => {});
        await v.click(sel, opts);
        return true;
    } catch (_) {
        return false;
    }
}

test('Video 2 — Triaging your inbox', async ({ browser }) => {
    test.setTimeout(180_000);

    const recordingStartedAt = Date.now();
    const ctx = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        ignoreHTTPSErrors: true,
        recordVideo: { dir: VIDEO_DIR, size: { width: 1440, height: 900 } },
    });
    const page = await ctx.newPage();
    page.setDefaultTimeout(5000);

    // ===== Silent login (off-screen / pre-tour) =====
    await page.goto(`${NG}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[formcontrolname="email"]', EMAIL);
    await page.click('button:has-text("Send OTP")');
    await page.locator('input[formcontrolname="code"]').waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(700);
    const otp = await readOtpFromFile(EMAIL);
    await page.fill('input[formcontrolname="code"]', otp);
    await page.click('button:has-text("Validate OTP")');
    await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 15000 });

    await page.goto(`${NG}/tickets`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1800);

    const v = new VideoDirector(page, path.join(VIDEO_DIR, NAME), {
        pace: parseFloat(process.env.PACE || '0.85'),
        recordingStartedAt,
    });
    await v.install();

    // ===== Scene 0: Branded intro card =====
    v.chapter('Intro');
    await v.introCard({
        title: 'Triaging your inbox',
        subtitle: 'Counters, saved views, SLA sort & self-assign',
        meta: 'AGENT QUICKSTART · VIDEO 2 OF 9',
    }, 3200);

    // ===== Scene 1: Six stat counters =====
    v.chapter('Pulse');

    // Resolve a selector that returns 6 counter cards. Try several; pick the first that
    // yields >= 4 elements (the stat strip).
    const candidateStatSelectors = [
        '.ticket-list-stats > div',
        '.stats-row > div',
        'mat-card.stat-card',
        '.ticket-stat-card',
    ];
    let statSel = null;
    for (const cand of candidateStatSelectors) {
        const n = await page.locator(cand).count().catch(() => 0);
        if (n >= 4) { statSel = cand; break; }
    }
    // Fallback: highlight the strip as a whole using Waiting/Pool text anchors.
    if (statSel) {
        await Promise.all([
            v.highlightAll(statSel, 4200, { pad: 3 }),
            v.narrate('Six counters at the top show today\'s pulse.', 4200),
        ]);
    } else {
        // Highlight a parent that contains all six labels. Use first-match safely.
        const stripSel = ':has(> :text("Waiting")):has(> :text("Pool"))';
        const ok = await tryHighlight(v, page, stripSel, 4200, { pad: 6 });
        if (!ok) {
            await v.narrate('Six counters at the top show today\'s pulse.', 4200);
        } else {
            await v.narrate('Six counters at the top show today\'s pulse.', 4200);
        }
    }

    // ===== Scene 2: Waiting + Pool are the start =====
    await v.narrate('Waiting and Pool are where you start.', 3800);

    // ===== Scene 3: Saved views (buttons, not chips) =====
    v.chapter('Views');
    // Try to highlight the row of saved-view buttons. There's no class given, so anchor
    // on a known set of button labels and find their nearest common ancestor by selector union.
    await v.narrate('Saved views narrow the list to what matters now.', 4200);

    // ===== Scene 4: Click Unassigned =====
    const clickedUnassigned = await tryClick(v, page,
        'button:has-text("Unassigned")',
        { announce: 'Click Unassigned to see the pool.', announceMs: 3000 },
        2500);
    if (!clickedUnassigned) {
        await v.narrate('Click Unassigned to see the pool.', 3000);
    } else {
        await page.waitForTimeout(900);
        await v.reinstall();
    }

    // ===== Scene 5: Sort by SLA =====
    v.chapter('Sort by SLA');
    // Syncfusion grid renders columnheaders as <th> with role=columnheader.
    // Avoid matching the "SLA Breach" counter or "SLA At Risk" view button by scoping to columnheader role.
    const slaHeaderSel = '[role="columnheader"]:has-text("SLA")';
    const hl = await tryHighlight(v, page, slaHeaderSel, 3800, { pad: 4, pulse: true }, 2000);
    await v.narrate(
        hl ? 'Sort by SLA to see what\'s about to breach.'
           : 'Sort by SLA to see what\'s about to breach.',
        3800,
        'Sort by S L A to see what\'s about to breach.'
    );

    // ===== Scene 6: Pick a ticket =====
    v.chapter('Pick one up');
    await v.narrate('Now let\'s pick one up.', 1900);

    // Prefer clicking an Unassigned-ticket row (so the "Me" self-assign affordance is visible).
    // Fall back to first ticket link if no unassigned row exists.
    const unassignedRowLink = 'tr:has(button:has-text("Me")) a[href^="/tickets/"]';
    const anyTicketLink = 'a[href^="/tickets/"]:not([href="/tickets"])';
    let opened = await tryClick(v, page, unassignedRowLink, {
        announce: 'Click any ticket to open it.', announceMs: 3200,
    }, 2500);
    if (!opened) {
        opened = await tryClick(v, page, anyTicketLink, {
            announce: 'Click any ticket to open it.', announceMs: 3200,
        }, 2500);
    }
    if (opened) {
        await page.waitForTimeout(1400);
        await v.reinstall();
    } else {
        await v.narrate('Click any ticket to open it.', 3200);
    }

    // ===== Scene 7: Self-assign =====
    v.chapter('Self-assign');
    // On ticket detail, the affordance might be a "Self-assign" button OR the inline "Me" button on assignee row.
    const selfAssignSelectors = [
        'button:has-text("Self-assign")',
        'button:has-text("Self assign")',
        'button:has-text("Assign to me")',
        'button:has-text("Me"):has(img:has-text("person_add"))',
        'button:has-text("Me")',
    ];
    let pointed = false;
    for (const sel of selfAssignSelectors) {
        const n = await page.locator(sel).first().count().catch(() => 0);
        if (n > 0) {
            await Promise.all([
                v.highlight(sel, 3800, { pad: 6, pulse: true }),
                v.narrate('Once it\'s yours, hit Self-assign.', 3800),
            ]);
            try { await v.point(sel, { holdMs: 600 }); } catch (_) {}
            pointed = true;
            break;
        }
    }
    if (!pointed) {
        await v.narrate('Once it\'s yours, hit Self-assign.', 3800);
    }

    await v.narrate('That\'s how a ticket lands on your plate.', 3300);

    // ===== Scene 8: Outro =====
    v.chapter('Wrap');
    await v.outroCard({
        title: 'Up next',
        subtitle: 'Video 3 — Replying to your customer',
        meta: '247HRM HELPDESK · AGENT HANDBOOK',
    }, 3500);

    await v.flush();
    await ctx.close();

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
    for (const w of webms) {
        if (w.f !== path.basename(target) && fs.existsSync(w.full)) fs.unlinkSync(w.full);
    }
    console.log(`  ${NAME}.webm written (${(winner.size / 1024 / 1024).toFixed(2)} MB)`);
});
