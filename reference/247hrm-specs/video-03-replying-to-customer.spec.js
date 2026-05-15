/**
 * Video 3 — Replying to your customer: tabs, toolbar, canned responses, mentions, send.
 *
 * Run:  cd e2e && npx playwright test tests/video-03-replying-to-customer.spec.js --reporter=list
 * Outputs:
 *   docs/user-guide/videos/03-replying-to-customer/03-replying-to-customer.{webm,vtt,ssml.txt,script.md}
 *
 * Safety: never CLICKS Send — only highlights it. Avoids triggering real outbound email
 * from the test ticket in this dev DB.
 */

const { test } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const { readOtpFromFile } = require('./helpers');
const { VideoDirector } = require('./video-helpers');

const NG = process.env.ANGULAR_URL || 'http://localhost:4200';
const EMAIL = process.env.GUIDE_EMAIL || 'varunr@interbiz.in';
const NAME = '03-replying-to-customer';
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

async function tryPoint(v, page, sel, opts = {}, cap = 1200) {
    try {
        const count = await page.locator(sel).first().count();
        if (count === 0) return false;
        await page.locator(sel).first().waitFor({ state: 'visible', timeout: cap }).catch(() => {});
        await v.point(sel, opts);
        return true;
    } catch (_) { return false; }
}

test('Video 3 — Replying to your customer', async ({ browser }) => {
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

    // Open ticket list, then drill into the first ticket detail.
    await page.goto(`${NG}/tickets`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Click first ticket link in the table
    const firstTicket = page.locator('a[href^="/tickets/"]:not([href="/tickets"])').first();
    if (await firstTicket.count() === 0) {
        throw new Error('No ticket links found on /tickets — cannot record reply walkthrough');
    }
    await firstTicket.click();
    await page.waitForURL(/\/tickets\/\d+/, { timeout: 10000 });
    await page.waitForTimeout(1800); // let detail page settle

    const v = new VideoDirector(page, path.join(VIDEO_DIR, NAME), {
        pace: parseFloat(process.env.PACE || '0.85'),
        recordingStartedAt,
    });
    await v.install();

    // ===== Scene 0: Intro =====
    v.chapter('Intro');
    await v.introCard({
        title: 'Replying to your customer',
        subtitle: 'Tabs, toolbar, canned responses, mentions',
        meta: 'AGENT QUICKSTART · VIDEO 3 OF 9',
    }, 3200);

    // ===== Scene 1: The reply box has tabs =====
    v.chapter('Reply tabs');
    await v.narrate('The reply box has two tabs at the top.', 4000);

    // Find the Public Reply / Internal Note tabs.
    const publicTab = 'mat-tab[role="tab"]:has-text("Public Reply"), [role="tab"]:has-text("Public Reply"), button:has-text("Public Reply")';
    const internalTab = 'mat-tab[role="tab"]:has-text("Internal Note"), [role="tab"]:has-text("Internal Note"), button:has-text("Internal Note")';

    const hl1 = await tryHighlight(v, page, publicTab, 3500, { pad: 4, pulse: true }, 2000);
    await v.narrate('Public Reply emails the customer.', 3500);

    const hl2 = await tryHighlight(v, page, internalTab, 3800, { pad: 4, pulse: true }, 2000);
    await v.narrate('Internal Note is private — only your team sees it.', 4200);

    // ===== Scene 2: Editor toolbar =====
    v.chapter('Toolbar');
    const toolbarSel = '.ql-toolbar, .editor-toolbar, [class*="toolbar"]:has(button)';
    await Promise.all([
        tryHighlight(v, page, toolbarSel, 3500, { pad: 4 }, 2000),
        v.narrate('The toolbar gives you formatting basics.', 3500),
    ]);

    // ===== Scene 3: Footer row — Attach, Client's input required, Send =====
    v.chapter('Footer');
    await v.narrate('Below: Attach, "Client\'s input required", and Send.',
        4500,
        'Below: Attach, Client\'s input required, and Send.');

    // ===== Scene 4: Canned response =====
    v.chapter('Canned response');
    await v.narrate('Start with a canned response to save typing.', 3800);

    const cannedDropdown = [
        'button:has-text("Canned Response")',
        'button:has-text("Canned response")',
        'button:has-text("Templates")',
        'mat-select:has-text("Canned")',
        '[aria-label*="canned" i]',
    ].join(', ');
    const opened = await tryClick(v, page, cannedDropdown, {
        announce: 'Open the canned response dropdown.', announceMs: 3200,
    }, 2500);

    if (opened) {
        await page.waitForTimeout(700);
        // Pick the first menu item (without committing irreversibly — these are templates, safe)
        const firstOption = 'mat-option:first-of-type, [role="option"]:first-of-type, .mat-mdc-menu-item:first-of-type';
        await tryClick(v, page, firstOption, {
            announce: 'Pick a template and the editor fills in.', announceMs: 4000,
        }, 2500);
        await page.waitForTimeout(700);
        await v.reinstall();
    } else {
        await v.narrate('Pick a template and the editor fills in.', 4000);
    }

    // ===== Scene 5: At-mention =====
    v.chapter('Mention');
    await v.narrate('At-mention pulls a teammate in.', 3800);
    // Best-effort: only type if we can actually find the editor. Don't block long.
    const editor = '[contenteditable="true"], .ql-editor, textarea[name="reply"]';
    try {
        const ed = page.locator(editor).first();
        if (await ed.count() > 0) {
            await ed.waitFor({ state: 'visible', timeout: 1500 }).catch(() => {});
            // Don't actually type the @ trigger — UIs can hijack focus or open dropdowns mid-shot.
            // Just point at the editor for visual context.
            await tryPoint(v, page, editor, { holdMs: 800 }, 1200);
        }
    } catch (_) {}

    // ===== Scene 6: Client's input required =====
    v.chapter('Client input required');
    const clientInputCheckbox = [
        'mat-checkbox:has-text("Client")',
        'mat-checkbox:has-text("input required")',
        'label:has-text("Client\'s input required")',
        'input[type="checkbox"][name*="client" i]',
    ].join(', ');
    await Promise.all([
        tryHighlight(v, page, clientInputCheckbox, 4500, { pad: 6, pulse: true }, 2000),
        v.narrate('Tick "Client\'s input required" if you\'re waiting on info.',
            4500,
            'Tick Client\'s input required if you\'re waiting on info.'),
    ]);
    await v.narrate('That moves the ticket to Pending and pauses the SLA.',
        4500,
        'That moves the ticket to Pending and pauses the S L A.');

    // ===== Scene 7: Send (highlight only — NEVER click in dev/prod) =====
    v.chapter('Send');
    const sendBtn = 'button:has-text("Send"):not([disabled]), button[type="submit"]:has-text("Send")';
    const sendHl = await tryHighlight(v, page, sendBtn, 3500, { pad: 6, pulse: true }, 2000);
    await v.narrate('Hit Send — the customer gets the email.', 3500);

    // ===== Scene 8: Outro =====
    v.chapter('Wrap');
    await v.outroCard({
        title: 'Up next',
        subtitle: 'Video 4 — Watchers, CCs & contacts',
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
