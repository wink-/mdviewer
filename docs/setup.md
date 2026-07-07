---
type: Setup
title: Setup
description: Install, run, test, and build instructions for MDViewer.
tags: [setup, pnpm, nextjs]
timestamp: 2026-07-06T00:00:00Z
---

# Setup

## Requirements

- Node.js compatible with Next.js 16.
- `pnpm` 11.1.2, as declared in `package.json`.

## Install

```bash
pnpm install
```

## Run

```bash
pnpm run dev
```

Open `http://localhost:3000`.

## Test And Build

```bash
pnpm test
pnpm lint
pnpm run build
```

For documentation-only changes, lightweight validation can use JSON/config checks and `git status` when dependencies are not installed.

```bash
node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))"
git diff --check
```
