/**
 * Video 4 — Watchers, CCs, contacts: pulling people in.
 *
 * Run:  cd e2e && npx playwright test tests/video-04-watchers-ccs-contacts.spec.js --reporter=list
 * Outputs:
 *   docs/user-guide/videos/04-watchers-ccs-contacts/04-watchers-ccs-contacts.{webm,vtt,ssml.txt,script.md}
 *
 * Safety: opens the +Watcher picker and the New-Contact dialog for visual context but
 * presses Escape rather than committing — no real watcher emails, no junk contact rows.
 */

const { test } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const { readOtpFromFile } = require('./helpers');
const { VideoDirector } = require('./video-helpers');

const NG = process.env.ANGULAR_URL || 'http://localhost:4200';
const EMAIL = process.env.GUIDE_EMAIL || 'varunr@interbiz.in';
const NAME = '04-watchers-ccs-contacts';
const VIDEO_DIR = path.resolve(__dirname, '..', '..', 'docs', 'user-guide', 'videos', NAME);
fs.mkdirSync(VIDEO_DIR, { recursive: true });

test.describe.configure({ mode: 'serial' });

async function tryHighlight(v, page, sel, ms, opts = {}, cap = 1500) {
    try {
        const count = await page.locator(sel).first().count();
        if (count === 0) return false;
        await page.locator(sel).first().waitFor({ state: 'visible', timeout: cap }).catch(() => {});
        await v.highlight(sel, ms, opts);
        return true;
    } catch (_) { return false; }
}

async function tryClick(v, page, sel, opts = {}, cap = 1500) {
    try {
        const count = await page.locator(sel).first().count();
        if (count === 0) return false;
        await page.locator(sel).first().waitFor({ state: 'visible', timeout: cap }).catch(() => {});
        await v.click(sel, opts);
        return true;
    } catch (_) { return false; }
}

test('Video 4 — Watchers, CCs, contacts', async ({ browser }) => {
    test.setTimeout(180_000);

    const recordingStartedAt = Date.now();
    const ctx = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        ignoreHTTPSErrors: true,
        recordVideo: { dir: VIDEO_DIR, size: { width: 1440, height: 900 } },
    });
    const page = await ctx.newPage();
    page.setDefaultTimeout(5000);

    // ===== Silent login =====
    await page.goto(`${NG}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[formcontrolname="email"]', EMAIL);
    await page.click('button:has-text("Send OTP")');
    await page.locator('input[formcontrolname="code"]').waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(700);
    const otp = await readOtpFromFile(EMAIL);
    await page.fill('input[formcontrolname="code"]', otp);
    await page.click('button:has-text("Validate OTP")');
    await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 15000 });

    // Open first ticket detail
    await page.goto(`${NG}/tickets`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const firstTicket = page.locator('a[href^="/tickets/"]:not([href="/tickets"])').first();
    if (await firstTicket.count() === 0) {
        throw new Error('No ticket links found on /tickets');
    }
    await firstTicket.click();
    await page.waitForURL(/\/tickets\/\d+/, { timeout: 10000 });
    await page.waitForTimeout(1800);

    const v = new VideoDirector(page, path.join(VIDEO_DIR, NAME), {
        pace: parseFloat(process.env.PACE || '0.85'),
        recordingStartedAt,
    });
    await v.install();

    // ===== Scene 0: Intro =====
    v.chapter('Intro');
    await v.introCard({
        title: 'Watchers, CCs & contacts',
        subtitle: 'Three ways to pull people in',
        meta: 'AGENT QUICKSTART · VIDEO 4 OF 9',
    }, 3200);

    // ===== Scene 1: Right-hand panel context =====
    v.chapter('People panel');
    const rightPanel = '.ticket-side, .right-panel, [class*="sidebar"][class*="ticket"], aside';
    await Promise.all([
        tryHighlight(v, page, rightPanel, 4200, { pad: 4 }, 1500),
        v.narrate('Three ways to pull people in.', 3500),
    ]);

    // ===== Scene 2: Watchers section =====
    v.chapter('Watcher');
    const watchersSection = [
        ':has(> :text("Watchers"))',
        'section:has-text("Watchers")',
        '.watchers, .watchers-section',
    ].join(', ');
    await Promise.all([
        tryHighlight(v, page, watchersSection, 3800, { pad: 6, pulse: true }, 1500),
        v.narrate('Watcher — any active internal user.', 3800),
    ]);

    // ===== Scene 3: CC section =====
    v.chapter('CC participant');
    const ccSection = [
        ':has(> :text("CC"))',
        'section:has-text("CC")',
        '.cc-participants, .cc-section',
    ].join(', ');
    await Promise.all([
        tryHighlight(v, page, ccSection, 3800, { pad: 6, pulse: true }, 1500),
        v.narrate('CC participant — an external email address.',
            3800,
            'C C participant — an external email address.'),
    ]);

    // ===== Scene 4: Contact / Reporter =====
    v.chapter('Contact');
    const reporterCard = [
        ':has(> :text("Reporter"))',
        'section:has-text("Reporter")',
        '.reporter, .reporter-card',
    ].join(', ');
    await Promise.all([
        tryHighlight(v, page, reporterCard, 4200, { pad: 6, pulse: true }, 1500),
        v.narrate('Contact — someone in the customer\'s organisation.', 4200),
    ]);

    // ===== Scene 5: Add a watcher =====
    v.chapter('Add watcher');
    await v.narrate('Add a teammate as a watcher.', 2800);

    const addWatcherBtn = [
        'button[aria-label*="watcher" i]',
        'button:has-text("Add watcher")',
        'button:has(mat-icon:has-text("add")):near(:text("Watchers"))',
        ':text("Watchers") + button',
        'button.add-watcher',
    ].join(', ');
    const opened = await tryClick(v, page, addWatcherBtn, {
        announce: 'Click the plus next to Watchers.', announceMs: 3200,
    }, 2500);

    if (opened) {
        await page.waitForTimeout(700);
        await v.reinstall();

        // Type a name to show the search affordance
        const watcherSearch = 'input[placeholder*="search" i], input[placeholder*="watcher" i], mat-form-field input';
        try {
            const ws = page.locator(watcherSearch).first();
            if (await ws.count() > 0) {
                await ws.waitFor({ state: 'visible', timeout: 1500 }).catch(() => {});
                await Promise.all([
                    v.narrate('Search by name or email.', 3500),
                    (async () => {
                        try { await ws.type('Varun', { delay: 90 }); } catch (_) {}
                    })(),
                ]);
            } else {
                await v.narrate('Search by name or email.', 3500);
            }
        } catch (_) {
            await v.narrate('Search by name or email.', 3500);
        }

        await v.narrate('Pick — the chip is added, picker closes.', 3800);

        // Close the picker without committing — Escape, then click somewhere safe.
        try {
            await page.keyboard.press('Escape');
            await page.waitForTimeout(400);
        } catch (_) {}
        await v.reinstall();
    } else {
        await v.narrate('Search by name or email.', 3500);
        await v.narrate('Pick — the chip is added, picker closes.', 3800);
    }

    // ===== Scene 6: Remove a watcher (highlight X, do not click) =====
    v.chapter('Remove watcher');
    const watcherChipX = [
        '.watcher-chip button[aria-label*="remove" i]',
        'mat-chip button.mat-mdc-chip-remove',
        '.watchers mat-icon:has-text("close")',
        'button:has(mat-icon:has-text("close")):near(:text("Watchers"))',
    ].join(', ');
    await Promise.all([
        tryHighlight(v, page, watcherChipX, 3800, { pad: 4, pulse: true }, 1500),
        v.narrate('Removing a watcher is one click on the X.', 3800),
    ]);

    // ===== Scene 7: Add new contact via person-add =====
    v.chapter('Add contact');
    const personAddIcon = [
        'button[aria-label*="add contact" i]',
        'button:has(mat-icon:has-text("person_add"))',
        'mat-icon:has-text("person_add")',
    ].join(', ');
    const dialogOpened = await tryClick(v, page, personAddIcon, {
        announce: 'To capture a new contact, hit person-add.', announceMs: 4000,
    }, 2500);

    if (dialogOpened) {
        await page.waitForTimeout(900);
        await v.reinstall();
        // Highlight the dialog, narrate, then close without saving.
        const dialogSel = 'mat-dialog-container, [role="dialog"]';
        await Promise.all([
            tryHighlight(v, page, dialogSel, 4000, { pad: 4 }, 1500),
            v.narrate('Fill the form and the contact saves on the client.', 4000),
        ]);
        // Close the dialog. Try Cancel button first, then Escape.
        const cancelBtn = 'mat-dialog-container button:has-text("Cancel"), [role="dialog"] button:has-text("Cancel")';
        const closed = await tryClick(v, page, cancelBtn, {}, 1200);
        if (!closed) {
            try { await page.keyboard.press('Escape'); } catch (_) {}
        }
        await page.waitForTimeout(500);
        await v.reinstall();
    } else {
        await v.narrate('Fill the form and the contact saves on the client.', 4000);
    }

    // ===== Scene 8: Outro =====
    v.chapter('Wrap');
    await v.outroCard({
        title: 'Up next',
        subtitle: 'Video 5 — Status & SLA in practice',
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
