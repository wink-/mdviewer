# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `pnpm dev` — dev server (port 3000)
- `pnpm build` — production build
- `pnpm lint` — ESLint (core-web-vitals + typescript configs)

Package manager is **pnpm** (v11). There is no test runner configured.

## Architecture

Next.js 16 App Router app. Single-page client-only app — the root `page.tsx` renders `<MDViewer />` and all logic runs in the browser.

### Data flow

`MDViewer` (orchestrator) → `useMarkdownFiles` hook manages file state (load/save/create/select/close). Content flows down to editor or preview components based on `ViewMode`.

### Format detection and rendering

`MDViewerPreview` detects whether content is Markdown or MediaWiki using `lib/mediawiki-parser.ts` utilities (`detectFormatByExtension`, `detectFormatByContent`). MediaWiki content is delegated to `MediaWikiPreview`, which uses a custom line-by-line parser with no external library. Markdown uses `react-markdown` with remark-gfm, remark-frontmatter, and rehype-highlight.

### Key files

- `components/MDViewer/MDViewer.tsx` — main container, view mode state, keyboard shortcuts
- `components/MDViewer/types.ts` — `MarkdownFile` and `ViewMode` types
- `hooks/useMarkdownFiles.ts` — all file I/O via File System Access API with fallback to `<input type="file">`
- `lib/mediawiki-parser.ts` — format detection + custom MediaWiki-to-HTML parser
- `components/MDViewer/MDViewerPreview.tsx` — format router + Markdown renderer
- `components/MDViewer/MediaWikiPreview.tsx` — MediaWiki renderer

### UI

shadcn/ui (base-nova style) with Tailwind CSS v4. Path alias `@/*` maps to project root. Icons from `lucide-react`.

### File saving

Save triggers a browser download (creates a Blob and clicks a generated `<a>` element) — no server-side persistence.

## Next.js 16 notes

Per AGENTS.md: this Next.js version has breaking changes from what training data may cover. Consult `node_modules/next/dist/docs/` before writing code that uses Next.js APIs.
