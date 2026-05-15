# User Handbook

Welcome. This is the index page for your product's user handbook. Edit this file and the numbered chapters next to it — everything else (HTML, PDF, videos) is generated.

## Where to start

| If you are… | Read |
|---|---|
| Brand new to the product | [1 — Introduction](01-introduction.md) |
| Setting up for the first time | [2 — Getting started](02-getting-started.md) |

## Table of contents

1. [Introduction](01-introduction.md)
2. [Getting started](02-getting-started.md)

## How to extend this handbook

- Add new chapters as `NN-short-name.md` (two-digit prefix, sorted numerically).
- Drop screenshots into `images/` — reference them with `![alt](images/file.png)`.
- Cross-link with relative `.md` paths — the build rewrites them to `.html` automatically.

## Build

```bash
node ~/.claude/skills/user-guide/scripts/build-html.js --src docs/handbook --out docs/handbook/html
node ~/.claude/skills/user-guide/scripts/build-pdf.js  --src docs/handbook --out docs/handbook/Handbook.pdf
```
