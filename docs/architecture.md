---
type: Architecture
title: Architecture
description: Runtime shape and key files for MDViewer.
tags: [architecture, nextjs, react, markdown]
timestamp: 2026-07-06T00:00:00Z
---

# Architecture

## Runtime

- Next.js 16 App Router application using React 19 and TypeScript.
- Main page at `app/page.tsx` renders the client-side `MDViewer` component.
- Styling uses Tailwind CSS v4 and local UI components.

## Key Files

- `components/MDViewer/MDViewer.tsx` coordinates file loading, view mode, keyboard shortcuts, save flow, and dialogs.
- `components/MDViewer/*` contains sidebar, editor, preview, split view, MediaWiki preview, and shared types.
- `hooks/useMarkdownFiles.ts` manages local file state and browser file APIs.
- `lib/markdown-utils.ts` and `lib/mediawiki-parser.ts` handle rendering/parsing helpers.
- `__tests__/` contains Vitest coverage.

## Data Flow

1. Users open or create Markdown/MediaWiki files in the browser.
2. `useMarkdownFiles` tracks active file content and metadata.
3. `MDViewer` renders edit, preview, or split modes and delegates parsing/rendering to lib helpers.
