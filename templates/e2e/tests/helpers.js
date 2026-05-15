/**
 * Shared helpers for user-guide screenshot / video specs.
 *
 * TODO: Replace this stub `loginViaUi` with your app's actual sign-in flow.
 *       Examples below — pick the one that matches your auth model.
 */

/**
 * Sign in to your app via the UI.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ email?: string, password?: string }} [opts]
 */
async function loginViaUi(page, opts = {}) {
    const email = opts.email || process.env.USERGUIDE_LOGIN_EMAIL;
    const password = opts.password || process.env.USERGUIDE_LOGIN_PASSWORD;

    if (!email) {
        throw new Error('loginViaUi: no email provided. Pass { email } or set USERGUIDE_LOGIN_EMAIL.');
    }

    // ====================================================================
    // TODO: Replace this block with your real sign-in flow.
    // ====================================================================

    await page.goto(process.env.USERGUIDE_BASE_URL || 'http://localhost:3000');

    // Example A — basic email/password form:
    //   await page.fill('input[name="email"]', email);
    //   await page.fill('input[name="password"]', password);
    //   await page.click('button[type="submit"]');
    //   await page.waitForURL('**/dashboard');

    // Example B — OTP / magic-link flow (read OTP from a dev-mode file):
    //   const fs = require('fs');
    //   await page.fill('input[name="email"]', email);
    //   await page.click('button:has-text("Send OTP")');
    //   const otpPath = `latest_otp_${email.replace(/[^a-z0-9]/gi, '_')}.txt`;
    //   await new Promise(r => setTimeout(r, 1500));
    //   const otp = fs.readFileSync(otpPath, 'utf8').trim();
    //   await page.fill('input[name="otp"]', otp);
    //   await page.click('button:has-text("Verify")');

    throw new Error('loginViaUi: not implemented. Open e2e/tests/helpers.js and wire it up.');
}

module.exports = { loginViaUi };
