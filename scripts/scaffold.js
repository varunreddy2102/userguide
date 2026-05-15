#!/usr/bin/env node
/**
 * Copy the userguide-skill templates into a consumer project.
 *
 * Usage:
 *   node scaffold.js [--target <dir>] [--handbook-dir docs/handbook] [--specs-dir e2e/tests] [--force]
 *
 * Defaults: target = current working directory.
 *
 * Creates:
 *   <target>/<handbook-dir>/  — starter markdown chapters + images/
 *   <target>/<specs-dir>/     — starter Playwright specs (screenshot capture + video)
 *
 * Refuses to overwrite existing files unless --force is passed.
 */

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
    const args = {
        target: process.cwd(),
        handbookDir: 'docs/handbook',
        specsDir: 'e2e/tests',
        force: false,
    };
    for (let i = 2; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--target') args.target = argv[++i];
        else if (a === '--handbook-dir') args.handbookDir = argv[++i];
        else if (a === '--specs-dir') args.specsDir = argv[++i];
        else if (a === '--force') args.force = true;
        else if (a === '--help' || a === '-h') {
            console.log('Usage: scaffold.js [--target <dir>] [--handbook-dir docs/handbook] [--specs-dir e2e/tests] [--force]');
            process.exit(0);
        }
    }
    args.target = path.resolve(args.target);
    return args;
}

const ARGS = parseArgs(process.argv);
const TEMPLATES = path.resolve(__dirname, '..', 'templates');

const HANDBOOK_SRC = path.join(TEMPLATES, 'docs', 'handbook');
const SPECS_SRC = path.join(TEMPLATES, 'e2e', 'tests');
const HANDBOOK_DST = path.join(ARGS.target, ARGS.handbookDir);
const SPECS_DST = path.join(ARGS.target, ARGS.specsDir);

const created = [];
const skipped = [];

function copyTree(srcDir, dstDir) {
    fs.mkdirSync(dstDir, { recursive: true });
    for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
        const src = path.join(srcDir, entry.name);
        const dst = path.join(dstDir, entry.name);
        if (entry.isDirectory()) {
            copyTree(src, dst);
        } else {
            if (fs.existsSync(dst) && !ARGS.force) {
                skipped.push(dst);
                continue;
            }
            fs.copyFileSync(src, dst);
            created.push(dst);
        }
    }
}

console.log(`Scaffolding into: ${ARGS.target}`);
console.log(`  Handbook dir: ${ARGS.handbookDir}`);
console.log(`  Specs dir:    ${ARGS.specsDir}`);
console.log('');

if (fs.existsSync(HANDBOOK_SRC)) copyTree(HANDBOOK_SRC, HANDBOOK_DST);
if (fs.existsSync(SPECS_SRC)) copyTree(SPECS_SRC, SPECS_DST);

console.log(`Created ${created.length} file(s):`);
for (const f of created) console.log(`  + ${path.relative(ARGS.target, f)}`);
if (skipped.length) {
    console.log(`\nSkipped ${skipped.length} existing file(s) (use --force to overwrite):`);
    for (const f of skipped) console.log(`  · ${path.relative(ARGS.target, f)}`);
}

console.log('\nNext steps:');
console.log(`  1. Edit ${ARGS.handbookDir}/01-introduction.md and add chapters.`);
console.log(`  2. (Optional) Capture screenshots: cd to your project then run your screenshot spec.`);
console.log(`  3. Build HTML:  node ~/.claude/skills/user-guide/scripts/build-html.js --src ${ARGS.handbookDir} --out ${ARGS.handbookDir}/html`);
console.log(`  4. Build PDF:   node ~/.claude/skills/user-guide/scripts/build-pdf.js --src ${ARGS.handbookDir} --out ${ARGS.handbookDir}/Handbook.pdf`);
