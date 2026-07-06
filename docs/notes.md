---
type: Notes
title: Notes
description: Gotchas and working notes for MDViewer.
tags: [notes, nextjs]
timestamp: 2026-07-06T00:00:00Z
---

# Notes

- This repo uses Next.js 16; consult local Next docs before changing framework APIs.
- Browser file APIs are central to the app behavior, so test file open/save flows manually when touching `useMarkdownFiles`.
- README notes approved build scripts for fresh `pnpm` installs.
