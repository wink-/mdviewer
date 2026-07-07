---
type: Status
title: Status
description: Current project state and next work for MDViewer.
tags: [status, roadmap]
timestamp: 2026-07-06T00:00:00Z
---

# Status: Documentation Refinement

Functional Next.js Markdown/MediaWiki viewer/editor with tests and lint scripts defined.

## Completed

- README documents features, commands, stack, and project structure.
- Main viewer component and supporting hooks/libs are present.
- Vitest and ESLint scripts are configured.
- OKF documentation bootstrap added.

## Next Tasks

- Run full `pnpm test`, `pnpm lint`, and `pnpm run build` after dependencies are available.
- Keep docs aligned with any viewer, parser, or keyboard shortcut changes.

## Blockers/Risks

- Full validation depends on installed Node dependencies.
- Next.js 16 APIs may differ from older assumptions; consult local Next docs before application changes.

## Last Worked On

- 2026-07-07: Refined OKF documentation after inspecting package scripts, app structure, tests, and parser/helper files.

## Suggested First Command

```bash
pnpm test
```
