/**
 * Capture screenshots for the user handbook.
 *
 * Output: ../../docs/handbook/images/*.png (adjust SHOTS_DIR below if your
 * handbook lives elsewhere).
 *
 * Run:  npx playwright test tests/capture-screenshots.spec.js
 *
 * ============================================================================
 * TODO before running:
 *   1. Edit `helpers.js` and implement `loginViaUi`.
 *   2. Replace the example selectors below with real ones from your app.
 *   3. Update SHOTS_DIR if your handbook lives somewhere other than
 *      ../../docs/handbook/images relative to this spec file.
 * ============================================================================
 */

const { test, expect } = require('@playwright/test');
const path = require('path');
const { loginViaUi } = require('./helpers');

const SHOTS_DIR = path.resolve(__dirname, '..', '..', 'docs', 'handbook', 'images');

test.describe('user-guide screenshots', () => {
    test.beforeEach(async ({ page }) => {
        await loginViaUi(page);
    });

    test('dashboard', async ({ page }) => {
        // TODO: navigate to your real dashboard URL
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: path.join(SHOTS_DIR, 'dashboard.png'), fullPage: true });
    });

    test('settings page', async ({ page }) => {
        // TODO: replace with your real settings route
        await page.goto('/settings');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: path.join(SHOTS_DIR, 'settings.png'), fullPage: true });
    });

    // TODO: Add more tests, one per screenshot you need.
});
