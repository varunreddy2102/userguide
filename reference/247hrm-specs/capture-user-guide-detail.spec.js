/**
 * Follow-up to capture-user-guide.spec.js — captures the two screens that needed
 * a real ticket/client ID. Navigates directly by URL so we don't depend on
 * Syncfusion grid row-click visibility.
 */

const { test } = require('@playwright/test');
const { loginViaUi } = require('./helpers');
const path = require('path');
const fs = require('fs');

const NG = process.env.ANGULAR_URL || 'http://localhost:4200';
const EMAIL = process.env.GUIDE_EMAIL || 'varunr@interbiz.in';
const TICKET_ID = process.env.GUIDE_TICKET_ID || '14195';
const CLIENT_ID = process.env.GUIDE_CLIENT_ID || '1';
const OUT_DIR = path.resolve(__dirname, '..', '..', 'docs', 'user-guide', 'images');
fs.mkdirSync(OUT_DIR, { recursive: true });

async function snap(page, name, opts = {}) {
    const file = path.join(OUT_DIR, `${name}.png`);
    await page.screenshot({ path: file, fullPage: opts.fullPage !== false, ...opts });
    console.log(`  saved ${name}.png`);
}

test('capture ticket-detail and client-detail by direct URL', async ({ browser }) => {
    test.setTimeout(60_000);
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
    const page = await ctx.newPage();
    await loginViaUi(page, EMAIL, { angularUrl: NG });

    await page.goto(`${NG}/tickets/${TICKET_ID}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await snap(page, '20-ticket-detail');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);
    await snap(page, '21-ticket-detail-bottom');

    await page.goto(`${NG}/clients/${CLIENT_ID}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await snap(page, '41-client-detail');

    await ctx.close();
});
