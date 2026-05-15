/**
 * Video framework for instructional Playwright recordings.
 *
 * Provides:
 *  - Animated custom cursor that moves smoothly to the next click target
 *  - Click ripple effect for emphasis
 *  - Caption overlay at the bottom of the viewport
 *  - Narration tracking that emits .vtt / .ssml.txt / .script.md / .cues.json /
 *    .clicks.json / .chapters.json / .meta.json sidecars for the build pipeline
 *
 * Usage in a spec:
 *   const { VideoDirector } = require('userguide-skill/scripts/video-helpers');
 *   // or by absolute path:
 *   //   require(require('os').homedir() + '/.claude/skills/user-guide/scripts/video-helpers');
 *
 *   const v = new VideoDirector(page, path.join(outDir, '01-intro'));
 *   await v.install();
 *   await v.narrate('Welcome.', 3500);
 *   await v.click('button:has-text("Send OTP")', { announce: 'Click Send OTP.' });
 *   await v.flush();
 *
 * Constructor opts:
 *   { pace?: number, recordingStartedAt?: number, brand?: { html?: string, svgPath?: string } }
 *
 * Brand resolution order:
 *   1. opts.brand.html  — full HTML snippet for the logo bug
 *   2. opts.brand.svgPath — path to an SVG file; loaded + inlined
 *   3. Generic embedded fallback (a small circular badge with "?" inside)
 */

const fs = require('fs');
const path = require('path');

// Generic fallback brand: a tiny inline SVG badge. NOT product-specific.
const GENERIC_FALLBACK_BRAND_HTML = `<span class="logo-svg"><svg xmlns="http://www.w3.org/2000/svg" width="64" height="32" viewBox="0 0 64 32"><circle cx="16" cy="16" r="13" fill="#ffb800"/><text x="16" y="21" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="700" fill="#1a202c">?</text><text x="34" y="21" font-family="Segoe UI, Arial, sans-serif" font-size="14" font-weight="700" fill="#ffffff">Help</text></svg></span>`;

function resolveBrand(brandOpt) {
    if (brandOpt && brandOpt.html) return { html: brandOpt.html };
    if (brandOpt && brandOpt.svgPath) {
        try {
            const svg = fs.readFileSync(brandOpt.svgPath, 'utf8');
            const cleaned = svg.replace(/<\?xml[\s\S]*?\?>/, '').replace(/<!--[\s\S]*?-->/g, '').trim();
            return { html: `<span class="logo-svg">${cleaned}</span>` };
        } catch (_) {
            // fall through to generic
        }
    }
    return { html: GENERIC_FALLBACK_BRAND_HTML };
}

// === In-page CSS + DOM injection (runs in the browser) ============================
function PAGE_INSTALL_SCRIPT(brand) {
    if (window.__videoOverlay) return;
    const css = `
        #__video_cursor { position: fixed; top: 0; left: 0; width: 30px; height: 30px; transform: translate(-100px, -100px); border-radius: 50%; pointer-events: none; z-index: 2147483646; background: radial-gradient(circle, rgba(255,82,82,0.95) 0%, rgba(255,82,82,0.7) 50%, rgba(255,82,82,0) 70%); transition: transform 700ms cubic-bezier(.22,.61,.36,1), opacity 380ms ease; mix-blend-mode: normal; box-shadow: 0 0 0 2px rgba(255,255,255,0.7), 0 4px 12px rgba(0,0,0,.25); opacity: 0; }
        #__video_cursor.active { opacity: 1; }
        #__video_ripple { position: fixed; top: 0; left: 0; width: 60px; height: 60px; transform: translate(-100px, -100px) scale(0); border: 2px solid rgba(255,82,82,0.9); border-radius: 50%; pointer-events: none; z-index: 2147483645; opacity: 0; }
        #__video_ripple.fire { animation: __video_ripple_anim 600ms ease-out forwards; }
        @keyframes __video_ripple_anim { 0% { transform: translate(var(--x,0px), var(--y,0px)) scale(.2); opacity: 1; } 100% { transform: translate(var(--x,0px), var(--y,0px)) scale(2.6); opacity: 0; } }
        #__video_caption_wrap { position: fixed; left: 0; right: 0; bottom: 0; display: flex; justify-content: center; align-items: flex-end; pointer-events: none; z-index: 2147483647; padding: 0 0 56px 0; }
        #__video_caption { max-width: 80%; background: rgba(15, 18, 30, 0.86); color: #fff; font: 600 22px/1.45 -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; padding: 14px 22px; border-radius: 10px; text-align: center; box-shadow: 0 8px 28px rgba(0,0,0,.35); opacity: 0; transform: translateY(8px); transition: opacity 280ms ease, transform 280ms ease; text-shadow: 0 1px 2px rgba(0,0,0,.5); letter-spacing: .005em; }
        #__video_caption.visible { opacity: 1; transform: translateY(0); }
        #__video_highlight { position: fixed; top: 0; left: 0; box-sizing: border-box; border: 3px solid rgba(255, 184, 0, 0.95); border-radius: 8px; box-shadow: 0 0 0 4px rgba(255, 184, 0, 0.25), 0 0 24px rgba(255, 184, 0, 0.6); pointer-events: none; z-index: 2147483640; opacity: 0; transition: opacity 220ms ease, top 380ms ease, left 380ms ease, width 380ms ease, height 380ms ease; }
        #__video_highlight.visible { opacity: 1; }
        #__video_highlight.pulse { animation: __video_pulse 1.4s ease-in-out infinite; }
        @keyframes __video_pulse { 0%, 100% { box-shadow: 0 0 0 4px rgba(255, 184, 0, 0.25), 0 0 24px rgba(255, 184, 0, 0.55); } 50% { box-shadow: 0 0 0 10px rgba(255, 184, 0, 0.18), 0 0 36px rgba(255, 184, 0, 0.85); } }
        #__video_spotlight { position: fixed; inset: 0; pointer-events: none; z-index: 2147483635; opacity: 0; transition: opacity 240ms ease; }
        #__video_spotlight.visible { opacity: 1; }
        #__video_spotlight svg { width: 100%; height: 100%; }
        #__video_callout { position: fixed; top: 0; left: 0; background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #fff; font: 600 14px/1.4 -apple-system, "Segoe UI", Roboto, sans-serif; padding: 10px 14px; border-radius: 8px; pointer-events: none; z-index: 2147483643; opacity: 0; box-shadow: 0 4px 14px rgba(0,0,0,.25); transform: translate(-50%, -50%) translateY(8px); transition: opacity 220ms ease, transform 220ms ease; max-width: 240px; text-align: center; }
        #__video_callout.visible { opacity: 1; transform: translate(-50%, -50%) translateY(0); }
        #__video_callout::after { content: ""; position: absolute; border: 8px solid transparent; }
        #__video_callout[data-arrow="down"]::after { top: 100%; left: 50%; margin-left: -8px; border-top-color: #4f46e5; }
        #__video_callout[data-arrow="up"]::after   { bottom: 100%; left: 50%; margin-left: -8px; border-bottom-color: #6366f1; }
        #__video_callout[data-arrow="left"]::after { right: 100%; top: 50%; margin-top: -8px; border-right-color: #4f46e5; }
        #__video_callout[data-arrow="right"]::after{ left: 100%; top: 50%; margin-top: -8px; border-left-color: #6366f1; }
        #__video_step { position: fixed; top: 16px; right: 16px; background: rgba(15, 18, 30, 0.88); color: #fff; font: 600 13px/1.3 -apple-system, "Segoe UI", Roboto, sans-serif; padding: 8px 12px; border-radius: 6px; pointer-events: none; z-index: 2147483644; opacity: 0; transition: opacity 220ms ease; box-shadow: 0 2px 10px rgba(0,0,0,.3); }
        #__video_step.visible { opacity: 1; }
        #__video_step strong { color: #ffb800; margin-right: 6px; }
        #__video_logo { position: fixed; bottom: 14px; right: 16px; pointer-events: none; z-index: 2147483630; box-shadow: 0 2px 10px rgba(0,0,0,.35); border-radius: 6px; overflow: hidden; opacity: 0.96; }
        #__video_logo:not(:has(.logo-svg)) { background: rgba(15, 18, 30, 0.85); color: #fff; font: 700 12px/1 -apple-system, "Segoe UI", Roboto, sans-serif; padding: 7px 11px; letter-spacing: 0.04em; }
        #__video_logo .accent { color: #ffb800; }
        #__video_logo .logo-svg { display: block; }
        #__video_logo .logo-svg svg { display: block; height: 32px; width: auto; }
        #__video_keys { position: fixed; bottom: 56px; right: 16px; display: flex; gap: 4px; pointer-events: none; z-index: 2147483641; opacity: 0; transition: opacity 200ms ease; }
        #__video_keys.visible { opacity: 1; }
        #__video_keys .k { background: #fff; color: #1a202c; font: 600 12px/1 -apple-system, "Segoe UI", Roboto, monospace; padding: 6px 9px; border-radius: 4px; border: 1px solid #cbd5e0; box-shadow: 0 2px 0 #cbd5e0; min-width: 18px; text-align: center; }
        #__video_progress { position: fixed; left: 0; right: 0; bottom: 0; height: 3px; background: rgba(255,255,255,0.12); pointer-events: none; z-index: 2147483642; }
        #__video_progress > div { height: 100%; background: linear-gradient(90deg, #4f46e5, #ffb800); width: 0%; transition: width 160ms linear; }
        #__video_card { position: fixed; inset: 0; background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.08) 0%, transparent 50%), linear-gradient(135deg, #3b3f8c 0%, #5d62b5 60%, #6b56b5 100%); color: #fff; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; pointer-events: none; z-index: 2147483647; opacity: 0; transition: opacity 420ms ease; font-family: -apple-system, "Segoe UI", Roboto, sans-serif; }
        #__video_card.visible { opacity: 1; }
        #__video_card::before { content: ""; position: absolute; inset: -50%; background: radial-gradient(circle, rgba(255,184,0,0.10) 0%, transparent 40%); animation: __video_card_drift 14s ease-in-out infinite alternate; }
        @keyframes __video_card_drift { 0% { transform: translate(0%, 0%); } 100% { transform: translate(15%, 8%); } }
        #__video_card .brand { font: 700 22px/1.2 inherit; letter-spacing: 0.05em; opacity: 0; transform: scale(0.85); margin-bottom: 22px; display: inline-flex; align-items: center; transition: opacity 600ms ease 200ms, transform 600ms cubic-bezier(.22,.61,.36,1) 200ms; }
        #__video_card.visible .brand { opacity: 0.95; transform: scale(1); }
        #__video_card .brand .accent { color: #ffb800; }
        #__video_card .brand .logo-svg svg { height: 64px; width: auto; display: block; }
        #__video_card h1 { font: 700 48px/1.15 inherit; margin: 0 0 14px; letter-spacing: -0.01em; opacity: 0; transform: translateY(14px); transition: opacity 540ms ease 600ms, transform 540ms cubic-bezier(.22,.61,.36,1) 600ms; }
        #__video_card.visible h1 { opacity: 1; transform: translateY(0); }
        #__video_card .sub { font: 400 20px/1.4 inherit; opacity: 0; max-width: 70%; transform: translateY(8px); transition: opacity 480ms ease 950ms, transform 480ms ease 950ms; }
        #__video_card.visible .sub { opacity: 0.85; transform: translateY(0); }
        #__video_card .meta { position: absolute; bottom: 32px; font: 400 13px/1 inherit; opacity: 0; letter-spacing: 0.18em; transition: opacity 420ms ease 1300ms; }
        #__video_card.visible .meta { opacity: 0.6; }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    function div(id) { const d = document.createElement('div'); d.id = id; document.body.appendChild(d); return d; }

    const cursor = div('__video_cursor');
    const ripple = div('__video_ripple');
    const wrap = div('__video_caption_wrap');
    const cap = document.createElement('div');
    cap.id = '__video_caption';
    wrap.appendChild(cap);
    const highlight = div('__video_highlight');
    const spotlight = div('__video_spotlight');
    spotlight.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"><defs><mask id="__sm"><rect width="100%" height="100%" fill="white"/><rect id="__sh" x="0" y="0" width="0" height="0" rx="12" ry="12" fill="black"/></mask></defs><rect width="100%" height="100%" fill="rgba(0,0,0,0.62)" mask="url(#__sm)"/></svg>`;
    const callout = div('__video_callout');
    const step = div('__video_step');
    const logo = div('__video_logo');
    logo.innerHTML = brand && brand.html ? brand.html : `<span class="accent">?</span>Help`;
    const keys = div('__video_keys');
    const progress = div('__video_progress');
    progress.innerHTML = `<div></div>`;
    const card = div('__video_card');

    let cursorIdleTimer = null;
    function bumpCursor() {
        cursor.classList.add('active');
        if (cursorIdleTimer) clearTimeout(cursorIdleTimer);
        cursorIdleTimer = setTimeout(() => { cursor.classList.remove('active'); }, 1500);
    }

    window.__videoOverlay = {
        moveCursor(x, y) { cursor.style.transform = `translate(${x - 15}px, ${y - 15}px)`; bumpCursor(); },
        ripple(x, y) { ripple.style.setProperty('--x', `${x - 30}px`); ripple.style.setProperty('--y', `${y - 30}px`); ripple.classList.remove('fire'); void ripple.offsetWidth; ripple.classList.add('fire'); bumpCursor(); },
        showCaption(text) { cap.textContent = text; cap.classList.add('visible'); },
        hideCaption() { cap.classList.remove('visible'); },
        highlight(rect, opts) {
            const pad = (opts && opts.pad) || 8;
            highlight.style.left = (rect.x - pad) + 'px';
            highlight.style.top = (rect.y - pad) + 'px';
            highlight.style.width = (rect.width + 2 * pad) + 'px';
            highlight.style.height = (rect.height + 2 * pad) + 'px';
            highlight.classList.toggle('pulse', !!(opts && opts.pulse));
            highlight.classList.add('visible');
        },
        hideHighlight() { highlight.classList.remove('visible'); highlight.classList.remove('pulse'); },
        spotlight(rect, opts) {
            const pad = (opts && opts.pad) || 12;
            const hole = document.getElementById('__sh');
            hole.setAttribute('x', rect.x - pad);
            hole.setAttribute('y', rect.y - pad);
            hole.setAttribute('width', rect.width + 2 * pad);
            hole.setAttribute('height', rect.height + 2 * pad);
            spotlight.classList.add('visible');
        },
        hideSpotlight() { spotlight.classList.remove('visible'); },
        callout(rect, label, side) {
            callout.textContent = label;
            const margin = 14;
            let x, y, arrow;
            switch (side) {
                case 'right': x = rect.x + rect.width + margin + 120; y = rect.y + rect.height / 2; arrow = 'left'; break;
                case 'left':  x = rect.x - margin - 120; y = rect.y + rect.height / 2; arrow = 'right'; break;
                case 'up':    x = rect.x + rect.width / 2; y = rect.y - margin - 25; arrow = 'down'; break;
                case 'down':
                default:      x = rect.x + rect.width / 2; y = rect.y + rect.height + margin + 25; arrow = 'up'; break;
            }
            callout.style.left = x + 'px';
            callout.style.top = y + 'px';
            callout.dataset.arrow = arrow;
            callout.classList.add('visible');
        },
        hideCallout() { callout.classList.remove('visible'); },
        showStep(n, total, label) { step.innerHTML = `<strong>Step ${n} of ${total}</strong> ${label || ''}`; step.classList.add('visible'); },
        hideStep() { step.classList.remove('visible'); },
        showKeys(keysList) { keys.innerHTML = keysList.map(k => `<span class="k">${k}</span>`).join(''); keys.classList.add('visible'); },
        hideKeys() { keys.classList.remove('visible'); },
        setProgress(pct) { progress.firstElementChild.style.width = Math.max(0, Math.min(100, pct)) + '%'; },
        showCard(html) { card.innerHTML = html; card.classList.add('visible'); },
        hideCard() { card.classList.remove('visible'); },
    };
}

function fmtVtt(ms) {
    const s = Math.floor(ms / 1000);
    const ms3 = String(ms % 1000).padStart(3, '0');
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${ss}.${ms3}`;
}

class VideoDirector {
    /**
     * @param {import('@playwright/test').Page} page
     * @param {string} outBaseAbsPath  absolute path WITHOUT extension
     * @param {{ pace?: number, recordingStartedAt?: number, brand?: { html?: string, svgPath?: string } }} [opts]
     */
    constructor(page, outBaseAbsPath, opts = {}) {
        this.page = page;
        this.outBase = outBaseAbsPath;
        this.timeline = [];
        this.clickEvents = [];
        this.chapters = [];
        this.recordingStartedAt = opts.recordingStartedAt || null;
        this.startedAt = null;
        this._installed = false;
        this.pace = opts.pace ?? 1.0;
        this.brand = resolveBrand(opts.brand);
        this.totalSteps = null;
        this.currentStep = 0;
    }

    _ms(ms) { return Math.max(250, Math.round(ms * this.pace)); }

    async install() {
        await this.page.evaluate(PAGE_INSTALL_SCRIPT, this.brand);
        this._installed = true;
        this.startedAt = Date.now();
    }

    async reinstall() {
        await this.page.evaluate(PAGE_INSTALL_SCRIPT, this.brand);
    }

    _now() { return this.startedAt ? Date.now() - this.startedAt : 0; }

    async narrate(text, ms = 3000, ttsText) {
        const tStart = this._now();
        await this.page.evaluate(t => window.__videoOverlay && window.__videoOverlay.showCaption(t), text);
        await this.page.waitForTimeout(this._ms(ms));
        await this.page.evaluate(() => window.__videoOverlay && window.__videoOverlay.hideCaption());
        const tEnd = this._now();
        this.timeline.push({ tStart, tEnd, text, ttsText: ttsText || text });
        await this.page.waitForTimeout(this._ms(180));
    }

    async point(selector, opts = {}) {
        const el = this.page.locator(selector).first();
        await el.scrollIntoViewIfNeeded();
        const box = await el.boundingBox();
        if (!box) throw new Error(`No bounding box for ${selector}`);
        const x = box.x + box.width / 2;
        const y = box.y + box.height / 2;
        await this.page.evaluate(([x, y]) => window.__videoOverlay && window.__videoOverlay.moveCursor(x, y), [x, y]);
        await this.page.waitForTimeout(this._ms(opts.holdMs ?? 850));
    }

    async click(selector, opts = {}) {
        if (!opts.announce || opts.sequential) {
            if (opts.announce) await this.narrate(opts.announce, opts.announceMs ?? 2500, opts.announceTts);
            await this.point(selector, { holdMs: 600 });
            const box = await this.page.locator(selector).first().boundingBox();
            if (box) {
                const x = box.x + box.width / 2;
                const y = box.y + box.height / 2;
                await this.page.evaluate(([x, y]) => window.__videoOverlay && window.__videoOverlay.ripple(x, y), [x, y]);
            }
            await this.page.waitForTimeout(this._ms(150));
            this.clickEvents.push({ tMs: this._now() });
            await this.page.locator(selector).first().click();
            await this.page.waitForTimeout(this._ms(opts.afterMs ?? 600));
            return;
        }

        const announceMs = opts.announceMs ?? 2500;
        const totalMs = this._ms(announceMs);
        const cursorAtMs = Math.round(totalMs * 0.55);
        const clickAtMs  = Math.round(totalMs * 0.85);
        const tStart = this._now();
        await this.page.evaluate(t => window.__videoOverlay && window.__videoOverlay.showCaption(t), opts.announce);
        await this.page.waitForTimeout(cursorAtMs);

        const el = this.page.locator(selector).first();
        await el.scrollIntoViewIfNeeded();
        const box = await el.boundingBox();
        if (box) {
            const cx = box.x + box.width / 2;
            const cy = box.y + box.height / 2;
            await this.page.evaluate(([x, y]) => window.__videoOverlay && window.__videoOverlay.moveCursor(x, y), [cx, cy]);
        }
        await this.page.waitForTimeout(clickAtMs - cursorAtMs);

        if (box) {
            const cx = box.x + box.width / 2;
            const cy = box.y + box.height / 2;
            await this.page.evaluate(([x, y]) => window.__videoOverlay && window.__videoOverlay.ripple(x, y), [cx, cy]);
        }
        await this.page.waitForTimeout(this._ms(80));
        this.clickEvents.push({ tMs: this._now() });
        await el.click();

        await this.page.waitForTimeout(totalMs - clickAtMs);
        await this.page.evaluate(() => window.__videoOverlay && window.__videoOverlay.hideCaption());

        const tEnd = this._now();
        this.timeline.push({ tStart, tEnd, text: opts.announce, ttsText: opts.announceTts || opts.announce });
        await this.page.waitForTimeout(this._ms(180));
        await this.page.waitForTimeout(this._ms(opts.afterMs ?? 400));
    }

    async type(selector, text, opts = {}) {
        await this.point(selector);
        await this.page.locator(selector).first().fill('');
        await this.page.locator(selector).first().pressSequentially(text, { delay: opts.charDelayMs ?? 60 });
        await this.page.waitForTimeout(300);
    }

    async pause(ms) { await this.page.waitForTimeout(this._ms(ms)); }

    async _bbox(selector) {
        const el = this.page.locator(selector).first();
        await el.scrollIntoViewIfNeeded();
        const box = await el.boundingBox();
        if (!box) throw new Error(`No bounding box for ${selector}`);
        return box;
    }

    async highlight(selector, ms = 2500, opts = {}) {
        const box = await this._bbox(selector);
        await this.page.evaluate(([r, o]) => window.__videoOverlay && window.__videoOverlay.highlight(r, o), [box, opts]);
        await this.page.waitForTimeout(this._ms(ms));
        await this.page.evaluate(() => window.__videoOverlay && window.__videoOverlay.hideHighlight());
    }

    async highlightAll(selector, msTotal = 4000, opts = {}) {
        const els = this.page.locator(selector);
        const count = await els.count();
        if (count === 0) return;
        const each = Math.max(180, Math.round(msTotal / count));
        for (let i = 0; i < count; i++) {
            const el = els.nth(i);
            try { await el.scrollIntoViewIfNeeded(); } catch (_) {}
            const box = await el.boundingBox();
            if (!box) continue;
            await this.page.evaluate(([r, o]) => window.__videoOverlay && window.__videoOverlay.highlight(r, o), [box, opts]);
            await this.page.waitForTimeout(this._ms(each));
        }
        await this.page.evaluate(() => window.__videoOverlay && window.__videoOverlay.hideHighlight());
    }

    async zoom(selector, ms = 2200, opts = {}) {
        const scale = opts.scale ?? 1.4;
        const box = await this._bbox(selector);
        const cx = box.x + box.width / 2;
        const cy = box.y + box.height / 2;
        await this.page.evaluate(([s, x, y]) => {
            const root = document.documentElement;
            root.style.transformOrigin = `${x}px ${y}px`;
            root.style.transition = 'transform 380ms cubic-bezier(.22,.61,.36,1)';
            root.style.transform = `scale(${s})`;
        }, [scale, cx, cy]);
        await this.page.waitForTimeout(this._ms(ms));
        await this.page.evaluate(() => {
            const root = document.documentElement;
            root.style.transform = '';
        });
        await this.page.waitForTimeout(this._ms(420));
    }

    async spotlight(selector, ms = 2500, opts = {}) {
        const box = await this._bbox(selector);
        await this.page.evaluate(([r, o]) => window.__videoOverlay && window.__videoOverlay.spotlight(r, o), [box, opts]);
        await this.page.waitForTimeout(this._ms(ms));
        await this.page.evaluate(() => window.__videoOverlay && window.__videoOverlay.hideSpotlight());
    }

    async callout(selector, label, ms = 2800, side = 'down') {
        const box = await this._bbox(selector);
        await this.page.evaluate(([r, l, s]) => window.__videoOverlay && window.__videoOverlay.callout(r, l, s), [box, label, side]);
        await this.page.waitForTimeout(this._ms(ms));
        await this.page.evaluate(() => window.__videoOverlay && window.__videoOverlay.hideCallout());
    }

    beginSteps(total) { this.totalSteps = total; this.currentStep = 0; }

    async step(label) {
        if (!this.totalSteps) throw new Error('Call beginSteps(total) before step().');
        this.currentStep++;
        await this.page.evaluate(([n, t, l]) => window.__videoOverlay && window.__videoOverlay.showStep(n, t, l), [this.currentStep, this.totalSteps, label || '']);
    }
    async endSteps() {
        await this.page.evaluate(() => window.__videoOverlay && window.__videoOverlay.hideStep());
        this.totalSteps = null;
        this.currentStep = 0;
    }

    async showKeys(keysList, ms = 1500) {
        await this.page.evaluate(k => window.__videoOverlay && window.__videoOverlay.showKeys(k), keysList);
        await this.page.waitForTimeout(this._ms(ms));
        await this.page.evaluate(() => window.__videoOverlay && window.__videoOverlay.hideKeys());
    }

    async setProgress(pct) {
        await this.page.evaluate(p => window.__videoOverlay && window.__videoOverlay.setProgress(p), pct);
    }

    chapter(label) { this.chapters.push({ tMs: this._now(), label }); }

    async introCard(opts = {}, ms = 3500) {
        const html = opts.html || `
            <div class="brand">${this.brand.html}</div>
            <h1>${opts.title || 'Quickstart'}</h1>
            <div class="sub">${opts.subtitle || ''}</div>
            <div class="meta">${opts.meta || ''}</div>
        `;
        await this.page.evaluate(h => window.__videoOverlay && window.__videoOverlay.showCard(h), html);
        await this.page.waitForTimeout(this._ms(ms));
        await this.page.evaluate(() => window.__videoOverlay && window.__videoOverlay.hideCard());
        await this.page.waitForTimeout(this._ms(300));
    }

    async outroCard(opts = {}, ms = 3500) {
        const html = opts.html || `
            <div class="brand">${this.brand.html}</div>
            <h1>${opts.title || 'Thanks for watching'}</h1>
            <div class="sub">${opts.subtitle || ''}</div>
            <div class="meta">${opts.meta || ''}</div>
        `;
        await this.page.evaluate(h => window.__videoOverlay && window.__videoOverlay.showCard(h), html);
        await this.page.waitForTimeout(this._ms(ms));
    }

    async goto(url) {
        await this.page.goto(url, { waitUntil: 'networkidle' });
        await this.reinstall();
    }

    async flush() {
        const vtt = this._buildVtt();
        const ssml = this._buildSsml();
        const md = this._buildScriptMd();

        fs.mkdirSync(path.dirname(this.outBase), { recursive: true });
        fs.writeFileSync(this.outBase + '.vtt', vtt);
        fs.writeFileSync(this.outBase + '.ssml.txt', ssml);
        fs.writeFileSync(this.outBase + '.script.md', md);
        fs.writeFileSync(this.outBase + '.cues.json', JSON.stringify(this.timeline, null, 2));
        fs.writeFileSync(this.outBase + '.clicks.json', JSON.stringify(this.clickEvents, null, 2));
        fs.writeFileSync(this.outBase + '.chapters.json', JSON.stringify(this.chapters, null, 2));
        const leadInMs = this.recordingStartedAt && this.startedAt
            ? Math.max(0, this.startedAt - this.recordingStartedAt)
            : 0;
        fs.writeFileSync(this.outBase + '.meta.json', JSON.stringify({ leadInMs, pace: this.pace }, null, 2));
        console.log(`  sidecars written (${this.timeline.length} cues, ${this.clickEvents.length} clicks, ${this.chapters.length} chapters, leadIn=${leadInMs}ms)`);
    }

    _buildVtt() {
        const lines = ['WEBVTT', ''];
        for (let i = 0; i < this.timeline.length; i++) {
            const c = this.timeline[i];
            lines.push(String(i + 1));
            lines.push(`${fmtVtt(c.tStart)} --> ${fmtVtt(c.tEnd)}`);
            lines.push(c.text);
            lines.push('');
        }
        return lines.join('\n');
    }

    _buildSsml() {
        const parts = [];
        for (let i = 0; i < this.timeline.length; i++) {
            const c = this.timeline[i];
            parts.push(c.ttsText || c.text);
            if (i < this.timeline.length - 1) {
                const gapMs = Math.max(200, this.timeline[i + 1].tStart - c.tEnd);
                const sec = Math.min(5.0, gapMs / 1000).toFixed(1);
                parts.push(`<break time="${sec}s"/>`);
            }
        }
        return parts.join('\n');
    }

    _buildScriptMd() {
        const lines = [
            `# Narration script — ${path.basename(this.outBase)}`,
            '',
            `Generated ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`,
            '',
            `Total cues: ${this.timeline.length}`,
            `Total duration: ${(this.timeline[this.timeline.length - 1]?.tEnd / 1000).toFixed(1)}s`,
            '',
            '| # | Start | End | Caption |',
            '|---|---|---|---|',
        ];
        for (let i = 0; i < this.timeline.length; i++) {
            const c = this.timeline[i];
            lines.push(`| ${i + 1} | ${fmtVtt(c.tStart)} | ${fmtVtt(c.tEnd)} | ${c.text.replace(/\|/g, '\\|')} |`);
        }
        lines.push('', '## TTS input (paste-ready)', '', '```text');
        lines.push(this._buildSsml());
        lines.push('```');
        return lines.join('\n');
    }
}

module.exports = { VideoDirector, resolveBrand };
