<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md

Next.js 16 / React 19 Markdown and MediaWiki viewer/editor. The app runs through the App Router and a client-side viewer that uses browser file APIs for local open/edit/save flows.

<!-- PROJECT-DOCS:START -->
## Project Docs

- Start with `docs/index.md` for the OKF documentation map.
- Keep `docs/status.md` current when project phase, blockers, or next tasks change.
- Add framework, file API, or parser gotchas to `docs/notes.md`.
- Record significant documentation/project changes in `docs/log.md`.
<!-- PROJECT-DOCS:END -->

## Commands

```bash
pnpm install
pnpm run dev
pnpm test
pnpm lint
pnpm run build
```

Lightweight documentation validation when dependencies are unavailable:

```bash
node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))"
git diff --check
```

## Guardrails

- Follow the Next.js 16 warning above before changing application code.
- Do not install dependencies unless explicitly asked.
- Test browser file open/save behavior manually when touching `hooks/useMarkdownFiles.ts` or viewer state.
- Keep README feature/command descriptions aligned with `package.json` scripts.
