/**
 * Capture screenshots for the agent user guide.
 *
 * Run with:  cd e2e && npx playwright test tests/capture-user-guide.spec.js --headed=false
 *
 * Output: ../docs/user-guide/images/<name>.png
 *
 * Designed to be non-destructive — only navigates, opens panels, and snaps.
 * No mutations to tickets, clients, or any persisted data.
 */

const { test, expect } = require('@playwright/test');
const { loginViaUi } = require('./helpers');
const path = require('path');
const fs = require('fs');

const NG = process.env.ANGULAR_URL || 'http://localhost:4200';
const EMAIL = process.env.GUIDE_EMAIL || 'varunr@interbiz.in';
const OUT_DIR = path.resolve(__dirname, '..', '..', 'docs', 'user-guide', 'images');

fs.mkdirSync(OUT_DIR, { recursive: true });

async function snap(page, name, opts = {}) {
    const file = path.join(OUT_DIR, `${name}.png`);
    await page.screenshot({ path: file, fullPage: opts.fullPage !== false, ...opts });
    console.log(`  saved ${name}.png`);
}

async function safeGoto(page, url) {
    try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    } catch (_) {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    }
    await page.waitForTimeout(800);
}

test.describe.configure({ mode: 'serial' });

test.describe('User-guide screenshot capture', () => {

    test('01 login page (email step)', async ({ browser }) => {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
        const page = await ctx.newPage();
        await page.goto(`${NG}/login`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);
        await snap(page, '01-login-email');
        // Trigger OTP step for the second screenshot
        await page.fill('input[formcontrolname="email"]', EMAIL);
        await page.click('button:has-text("Send OTP")');
        await page.locator('input[formcontrolname="code"]').waitFor({ state: 'visible', timeout: 10000 });
        await page.waitForTimeout(500);
        await snap(page, '02-login-otp');
        await ctx.close();
    });

    test('rest of guide (logged-in flows)', async ({ browser }) => {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
        const page = await ctx.newPage();
        await loginViaUi(page, EMAIL, { angularUrl: NG });

        // Dashboard
        await safeGoto(page, `${NG}/dashboard`);
        await snap(page, '03-dashboard');

        // Sidenav close-up (top-left crop) — capture the layout shell explicitly
        await snap(page, '04-layout-shell', { fullPage: false, clip: { x: 0, y: 0, width: 320, height: 900 } });

        // Notification bell open
        try {
            const bell = page.locator('button[aria-label*="notification" i], button:has(mat-icon:text("notifications"))').first();
            await bell.click({ timeout: 5000 });
            await page.waitForTimeout(500);
            await snap(page, '05-notification-bell');
            await page.keyboard.press('Escape');
        } catch (e) { console.log('  (bell skipped)', e.message); }

        // Ticket list
        await safeGoto(page, `${NG}/tickets`);
        await snap(page, '10-ticket-list');

        // Ticket pool
        await safeGoto(page, `${NG}/tickets/pool`);
        await snap(page, '11-ticket-pool');

        // First ticket detail (whatever exists)
        await safeGoto(page, `${NG}/tickets`);
        try {
            const firstRow = page.locator('table tbody tr, mat-row').first();
            await firstRow.waitFor({ state: 'visible', timeout: 5000 });
            await firstRow.click();
            await page.waitForURL(/\/tickets\/\d+/, { timeout: 10000 });
            await page.waitForTimeout(1500);
            await snap(page, '20-ticket-detail');

            // Try to scroll down to capture reply box / watchers
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(500);
            await snap(page, '21-ticket-detail-bottom');
        } catch (e) { console.log('  (no tickets)', e.message); }

        // Canned responses
        await safeGoto(page, `${NG}/tickets/canned-responses`);
        await snap(page, '30-canned-responses');

        // Knowledge base
        await safeGoto(page, `${NG}/tickets/knowledge-base`);
        await snap(page, '31-knowledge-base');

        // Automation rules
        await safeGoto(page, `${NG}/tickets/automation-rules`);
        await snap(page, '32-automation-rules');

        // Reports
        await safeGoto(page, `${NG}/tickets/reports`);
        await snap(page, '33-ticket-reports');

        // Clients
        await safeGoto(page, `${NG}/clients`);
        await snap(page, '40-clients-list');

        // Client detail (first row)
        try {
            const firstClient = page.locator('table tbody tr, mat-row').first();
            await firstClient.waitFor({ state: 'visible', timeout: 5000 });
            await firstClient.click();
            await page.waitForURL(/\/clients\/\d+/, { timeout: 10000 });
            await page.waitForTimeout(1500);
            await snap(page, '41-client-detail');
        } catch (e) { console.log('  (client detail skipped)', e.message); }

        // Demo requests
        await safeGoto(page, `${NG}/demo-requests`);
        await snap(page, '50-demo-requests');

        // Support plans
        await safeGoto(page, `${NG}/support-plans`);
        await snap(page, '60-support-plans');

        await ctx.close();
    });

    test('public portal (no login)', async ({ browser }) => {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
        const page = await ctx.newPage();
        await page.goto(`${NG}/public/support`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(800);
        await snap(page, '70-public-portal');
        await ctx.close();
    });
});
