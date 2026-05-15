#!/usr/bin/env node
/**
 * Build self-contained HTML pages from a markdown user guide.
 *
 * Usage:
 *   node build-html.js --src <dir> --out <dir> [--images <dir>] [--title "..."]
 *
 * Discovers all NN-*.md files in --src (sorted numerically) plus README.md (becomes index.html).
 * Each output page is standalone — images base64-embedded, .md links rewritten to .html,
 * README.md links rewritten to index.html. Sticky topnav + footer prev/next.
 */

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

function parseArgs(argv) {
    const args = { src: null, out: null, images: null, title: 'Handbook' };
    for (let i = 2; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--src') args.src = argv[++i];
        else if (a === '--out') args.out = argv[++i];
        else if (a === '--images') args.images = argv[++i];
        else if (a === '--title') args.title = argv[++i];
        else if (a === '--help' || a === '-h') {
            console.log('Usage: build-html.js --src <dir> --out <dir> [--images <dir>] [--title "..."]');
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
fs.mkdirSync(ARGS.out, { recursive: true });

// Pre-load every image as a base64 data URI
const imageDataUris = {};
if (fs.existsSync(ARGS.images)) {
    for (const f of fs.readdirSync(ARGS.images)) {
        if (!/\.(png|jpg|jpeg|gif|svg)$/i.test(f)) continue;
        const buf = fs.readFileSync(path.join(ARGS.images, f));
        const lower = f.toLowerCase();
        const mime = lower.endsWith('.svg') ? 'image/svg+xml'
            : lower.endsWith('.jpg') || lower.endsWith('.jpeg') ? 'image/jpeg'
            : lower.endsWith('.gif') ? 'image/gif'
            : 'image/png';
        imageDataUris[f] = `data:${mime};base64,${buf.toString('base64')}`;
    }
}

// Auto-discover sources: README.md + NN-*.md sorted by number
function discoverSources(srcDir) {
    const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.md'));
    const chapters = files
        .filter(f => /^\d{2}-.*\.md$/.test(f))
        .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    const sources = [];
    if (files.includes('README.md')) {
        sources.push({ md: 'README.md', out: 'index.html' });
    }
    for (const f of chapters) {
        sources.push({ md: f, out: f.replace(/\.md$/, '.html') });
    }
    return sources;
}

// Extract title from first H1 in markdown, fall back to filename
function extractTitle(md, fallback) {
    const m = md.match(/^#\s+(.+?)\s*$/m);
    return m ? m[1] : fallback;
}

// Custom renderer (marked v15+ token-object API)
const renderer = new marked.Renderer();
renderer.link = (token) => {
    let { href, title, text, tokens } = token;
    if (typeof href === 'string') {
        if (href === 'README.md' || href.startsWith('README.md#')) {
            href = href.replace(/^README\.md/, 'index.html');
        } else if (/\.md(#|$)/.test(href)) {
            href = href.replace(/\.md(#|$)/, '.html$1');
        }
    }
    const inner = tokens ? renderer.parser.parseInline(tokens) : (text || '');
    const t = title ? ` title="${String(title).replace(/"/g, '&quot;')}"` : '';
    return `<a href="${href}"${t}>${inner}</a>`;
};
renderer.image = (token) => {
    let { href, title, text } = token;
    let src = href;
    const base = path.basename(href);
    if (imageDataUris[base]) src = imageDataUris[base];
    const alt = (text || '').replace(/"/g, '&quot;');
    const t = title ? ` title="${String(title).replace(/"/g, '&quot;')}"` : '';
    return `<img src="${src}" alt="${alt}"${t} loading="lazy">`;
};

marked.setOptions({ renderer, gfm: true, breaks: false });

const CSS = `
:root {
    --fg: #1a202c; --muted: #4a5568; --bg: #ffffff; --bg-soft: #f7fafc;
    --border: #e2e8f0; --accent: #3b3f8c; --accent-soft: #e9eafc;
    --code-bg: #2d3748; --code-fg: #e2e8f0;
}
* { box-sizing: border-box; }
body { font: 16px/1.65 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: var(--fg); background: var(--bg); margin: 0; padding: 0; }
.shell { max-width: 920px; margin: 0 auto; padding: 32px 24px 80px; }
.topnav { background: var(--accent); color: #fff; padding: 14px 24px; position: sticky; top: 0; z-index: 10; box-shadow: 0 1px 0 rgba(0,0,0,.05); }
.topnav a { color: #fff; text-decoration: none; font-weight: 600; }
h1, h2, h3, h4 { line-height: 1.25; }
h1 { font-size: 2.2rem; margin: .2em 0 .6em; }
h2 { font-size: 1.6rem; margin: 2.4em 0 .6em; padding-bottom: .25em; border-bottom: 1px solid var(--border); }
h3 { font-size: 1.25rem; margin: 1.8em 0 .4em; color: var(--accent); }
h4 { font-size: 1.05rem; margin: 1.4em 0 .3em; }
p { margin: .8em 0; }
a { color: var(--accent); text-decoration: none; border-bottom: 1px dotted currentColor; }
a:hover { border-bottom-style: solid; }
ul, ol { padding-left: 1.4em; }
li { margin: .25em 0; }
img { max-width: 100%; height: auto; border: 1px solid var(--border); border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,.06); margin: .5em 0; display: block; }
table { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: .95rem; }
th, td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
th { background: var(--bg-soft); font-weight: 600; }
tr:nth-child(even) td { background: var(--bg-soft); }
code { font: 0.92em/1.4 ui-monospace, "Cascadia Code", Menlo, Consolas, monospace; background: var(--accent-soft); padding: 1px 5px; border-radius: 3px; }
pre { background: var(--code-bg); color: var(--code-fg); padding: 14px 16px; border-radius: 6px; overflow-x: auto; }
pre code { background: transparent; color: inherit; padding: 0; font-size: .9em; }
blockquote { border-left: 4px solid var(--accent); background: var(--accent-soft); padding: .6em 1em; margin: 1em 0; border-radius: 0 6px 6px 0; }
blockquote p { margin: .35em 0; }
hr { border: none; border-top: 1px solid var(--border); margin: 2.5em 0; }
.footer-nav { margin-top: 60px; padding-top: 16px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; color: var(--muted); font-size: .9rem; }
@media (max-width: 640px) { .shell { padding: 20px 14px 60px; } h1 { font-size: 1.7rem; } h2 { font-size: 1.3rem; } }
`;

const SOURCES = discoverSources(ARGS.src);
if (SOURCES.length === 0) {
    console.error(`No markdown sources found in ${ARGS.src}. Expected README.md and/or NN-*.md files.`);
    process.exit(1);
}

// Compute order + titles for nav
const ORDER = SOURCES.map(s => {
    const md = fs.readFileSync(path.join(ARGS.src, s.md), 'utf8');
    const title = s.md === 'README.md' ? 'Home' : extractTitle(md, s.md.replace(/\.md$/, ''));
    return { file: s.out, title, md: s.md, body: md };
});

function shell(pageTitle, bodyHtml, currentFile) {
    const idx = ORDER.findIndex(o => o.file === currentFile);
    const prev = idx > 0 ? ORDER[idx - 1] : null;
    const next = idx >= 0 && idx < ORDER.length - 1 ? ORDER[idx + 1] : null;
    const footerNav = (idx >= 0) ? `
    <div class="footer-nav">
        <span>${prev ? `← <a href="${prev.file}">${prev.title}</a>` : ''}</span>
        <span><a href="index.html">Home</a></span>
        <span>${next ? `<a href="${next.file}">${next.title}</a> →` : ''}</span>
    </div>` : '';

    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${pageTitle} — ${ARGS.title}</title>
    <style>${CSS}</style>
</head>
<body>
    <nav class="topnav">
        <a href="index.html">${ARGS.title}</a>
    </nav>
    <main class="shell">
        ${bodyHtml}
        ${footerNav}
    </main>
</body>
</html>
`;
}

let bytesOut = 0;
for (const o of ORDER) {
    const body = marked.parse(o.body);
    const html = shell(o.title, body, o.file);
    fs.writeFileSync(path.join(ARGS.out, o.file), html);
    bytesOut += html.length;
    console.log(`  ${o.md.padEnd(34)} → ${o.file}  (${(html.length / 1024).toFixed(1)} KB)`);
}
console.log(`\nDone. ${ORDER.length} pages, ${(bytesOut / 1024 / 1024).toFixed(2)} MB total (images inlined).`);
console.log(`Open: ${path.join(ARGS.out, 'index.html')}`);
