#!/usr/bin/env node
/**
 * Build a single self-contained PDF from a markdown user guide.
 *
 * Usage:
 *   node build-pdf.js --src <dir> --out <file.pdf> [--images <dir>] [--title "..."]
 *
 * Concatenates README.md + all NN-*.md into one HTML doc with anchor-based internal
 * links + base64-inlined images, then uses Playwright Chromium to render
 * a PDF that preserves clickable links.
 */

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const { chromium } = require('@playwright/test');

function parseArgs(argv) {
    const args = { src: null, out: null, images: null, title: 'Handbook' };
    for (let i = 2; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--src') args.src = argv[++i];
        else if (a === '--out') args.out = argv[++i];
        else if (a === '--images') args.images = argv[++i];
        else if (a === '--title') args.title = argv[++i];
        else if (a === '--help' || a === '-h') {
            console.log('Usage: build-pdf.js --src <dir> --out <file.pdf> [--images <dir>] [--title "..."]');
            process.exit(0);
        }
    }
    if (!args.src || !args.out) {
        console.error('Missing required --src and/or --out. Run with --help.');
        process.exit(1);
    }
    args.src = path.resolve(args.src);
    args.out = path.resolve(args.out);
    args.images = args.images ? path.resolve(args.images) : path.join(args.src, 'images');
    return args;
}

const ARGS = parseArgs(process.argv);
fs.mkdirSync(path.dirname(ARGS.out), { recursive: true });

const TMP_HTML = path.join(path.dirname(ARGS.out), '.pdf-source.html');

// Inline images as data URIs
const imageDataUris = {};
if (fs.existsSync(ARGS.images)) {
    for (const f of fs.readdirSync(ARGS.images)) {
        if (!/\.(png|jpg|jpeg|gif|svg)$/i.test(f)) continue;
        const buf = fs.readFileSync(path.join(ARGS.images, f));
        const lower = f.toLowerCase();
        const mime = lower.endsWith('.svg') ? 'image/svg+xml'
            : /\.jpe?g$/i.test(lower) ? 'image/jpeg'
            : lower.endsWith('.gif') ? 'image/gif'
            : 'image/png';
        imageDataUris[f] = `data:${mime};base64,${buf.toString('base64')}`;
    }
}

function extractTitle(md, fallback) {
    const m = md.match(/^#\s+(.+?)\s*$/m);
    return m ? m[1] : fallback;
}

function discoverOrder(srcDir) {
    const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.md'));
    const chapters = files
        .filter(f => /^\d{2}-.*\.md$/.test(f))
        .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    const order = [];
    if (files.includes('README.md')) {
        const md = fs.readFileSync(path.join(srcDir, 'README.md'), 'utf8');
        order.push({ md: 'README.md', anchor: 'home', title: extractTitle(md, 'Cover') });
    }
    for (const f of chapters) {
        const md = fs.readFileSync(path.join(srcDir, f), 'utf8');
        const anchor = f.replace(/\.md$/, '');
        order.push({ md: f, anchor, title: extractTitle(md, f.replace(/\.md$/, '')) });
    }
    return order;
}

const ORDER = discoverOrder(ARGS.src);
if (ORDER.length === 0) {
    console.error(`No markdown sources found in ${ARGS.src}.`);
    process.exit(1);
}
const mdToAnchor = Object.fromEntries(ORDER.map(o => [o.md, o.anchor]));

function makeRenderer() {
    const renderer = new marked.Renderer();
    renderer.link = (token) => {
        let { href, title, tokens } = token;
        if (typeof href === 'string') {
            const m = href.match(/^([^/#]+\.md)(#.+)?$/);
            if (m) {
                const baseAnchor = mdToAnchor[m[1]];
                if (baseAnchor) {
                    href = m[2] ? `#${baseAnchor}__${m[2].slice(1)}` : `#${baseAnchor}`;
                }
            }
        }
        const inner = tokens ? renderer.parser.parseInline(tokens) : '';
        const t = title ? ` title="${String(title).replace(/"/g, '&quot;')}"` : '';
        return `<a href="${href}"${t}>${inner}</a>`;
    };
    renderer.image = (token) => {
        let { href, title, text } = token;
        const base = path.basename(href);
        const src = imageDataUris[base] || href;
        const alt = (text || '').replace(/"/g, '&quot;');
        const t = title ? ` title="${String(title).replace(/"/g, '&quot;')}"` : '';
        return `<img src="${src}" alt="${alt}"${t}>`;
    };
    return renderer;
}

function renderSection(md, sectionAnchor) {
    const renderer = makeRenderer();
    let html = marked.parse(md, { renderer, gfm: true, breaks: false });
    html = html.replace(/(<h[1-6][^>]*\sid=")([^"]+)(")/g,
        (_, a, id, c) => `${a}${sectionAnchor}__${id}${c}`);
    html = html.replace(/(href=")#([^"]+)(")/g, (m, a, frag, c) => {
        if (frag.includes('__') || ORDER.some(o => o.anchor === frag)) return m;
        return `${a}#${sectionAnchor}__${frag}${c}`;
    });
    return html;
}

const sections = ORDER.map(o => {
    const md = fs.readFileSync(path.join(ARGS.src, o.md), 'utf8');
    const body = renderSection(md, o.anchor);
    return `<section id="${o.anchor}" class="page">${body}</section>`;
}).join('\n');

const CSS = `
:root { --fg:#1a202c; --muted:#4a5568; --border:#e2e8f0; --accent:#3b3f8c; --soft:#f7fafc; --accent-soft:#e9eafc; }
* { box-sizing: border-box; }
@page { size: A4; margin: 18mm 16mm 20mm; }
@page :first { margin: 0; }
html, body { margin: 0; padding: 0; }
body { font: 11pt/1.55 -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: var(--fg); background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
section.page { page-break-before: always; }
section.page:first-of-type { page-break-before: auto; }
h1 { font-size: 24pt; margin: 0 0 12pt; line-height: 1.2; }
h2 { font-size: 17pt; margin: 22pt 0 8pt; padding-bottom: 4pt; border-bottom: 1px solid var(--border); page-break-after: avoid; }
h3 { font-size: 13pt; margin: 16pt 0 6pt; color: var(--accent); page-break-after: avoid; }
h4 { font-size: 11.5pt; margin: 12pt 0 4pt; page-break-after: avoid; }
p { margin: 6pt 0; }
ul, ol { padding-left: 20pt; margin: 6pt 0; }
li { margin: 2pt 0; }
img { max-width: 100%; height: auto; border: 1px solid var(--border); border-radius: 4px; margin: 6pt 0; page-break-inside: avoid; }
table { border-collapse: collapse; width: 100%; margin: 8pt 0; font-size: 10pt; page-break-inside: avoid; }
th, td { border: 1px solid var(--border); padding: 5pt 8pt; text-align: left; vertical-align: top; }
th { background: var(--soft); font-weight: 600; }
tr:nth-child(even) td { background: var(--soft); }
code { font: 0.92em/1.4 ui-monospace, "Cascadia Code", Consolas, monospace; background: var(--accent-soft); padding: 1pt 4pt; border-radius: 2pt; }
pre { background: #2d3748; color: #e2e8f0; padding: 10pt 12pt; border-radius: 4pt; overflow-x: auto; font-size: 9.5pt; page-break-inside: avoid; }
pre code { background: transparent; color: inherit; padding: 0; }
blockquote { border-left: 3pt solid var(--accent); background: var(--accent-soft); padding: 6pt 10pt; margin: 8pt 0; border-radius: 0 4pt 4pt 0; }
blockquote p { margin: 2pt 0; }
hr { border: none; border-top: 1px solid var(--border); margin: 14pt 0; }
.cover { page-break-after: always; height: 297mm; width: 210mm; display: flex; flex-direction: column; justify-content: center; align-items: center; background: linear-gradient(135deg, var(--accent) 0%, #5d62b5 100%); color: #fff; text-align: center; padding: 40mm; }
.cover h1 { font-size: 36pt; color: #fff; margin: 0 0 8pt; }
.cover .sub { font-size: 14pt; opacity: .9; margin-bottom: 24pt; }
.cover .meta { font-size: 10pt; opacity: .75; margin-top: 40pt; }
`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${ARGS.title}</title>
<style>${CSS}</style>
</head>
<body>
<div class="cover">
    <h1>${ARGS.title}</h1>
    <div class="sub">User Handbook</div>
    <div class="meta">Generated ${new Date().toISOString().slice(0, 10)}</div>
</div>
${sections}
</body>
</html>`;

fs.writeFileSync(TMP_HTML, html);
console.log(`Wrote intermediate HTML: ${TMP_HTML} (${(html.length / 1024).toFixed(1)} KB)`);

(async () => {
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 1240, height: 1754 } });
    const page = await ctx.newPage();
    await page.goto('file:///' + TMP_HTML.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
    await page.pdf({
        path: ARGS.out,
        format: 'A4',
        printBackground: true,
        margin: { top: '18mm', right: '16mm', bottom: '20mm', left: '16mm' },
        displayHeaderFooter: true,
        headerTemplate: `<div></div>`,
        footerTemplate: `<div style="font-size:8pt; width:100%; text-align:center; color:#888;">${ARGS.title} · <span class="pageNumber"></span> / <span class="totalPages"></span></div>`,
    });
    await browser.close();
    fs.unlinkSync(TMP_HTML);
    const stat = fs.statSync(ARGS.out);
    console.log(`\nPDF written: ${ARGS.out}`);
    console.log(`Size: ${(stat.size / 1024 / 1024).toFixed(2)} MB`);
})().catch(e => { console.error(e); process.exit(1); });
