# Markdown & MediaWiki Viewer

A modern web-based markdown and MediaWiki viewer/editor built with Next.js 16, React 19, and shadcn/ui.

## Features

- **Dual Format Support**: View and edit both Markdown (.md) and MediaWiki (.wiki) files
- **File Picker**: Open files from your local filesystem
- **Multiple View Modes**: Edit, Preview, or Split view
- **Syntax Highlighting**: Code blocks with syntax highlighting
- **Responsive Design**: Works on desktop and mobile
- **Dark Mode**: Built-in dark mode support
- **Keyboard Shortcuts**:
  - `Ctrl+S` - Save file
  - `Ctrl+B` - Toggle sidebar
  - `Ctrl+E` - Edit mode
  - `Ctrl+Shift+P` - Preview/edit toggle
  - `Ctrl+\\` - Split mode
- **Format Cheatsheets**: One-click help for Markdown and Wiki syntax

## Getting Started

### Installation

```bash
cd mdviewer
pnpm install
```

If pnpm reports ignored build scripts on a fresh machine, the repo includes
`pnpm-workspace.yaml` with the required build approvals for `msw`, `sharp`, and
`unrs-resolver`.

### Development

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
pnpm run build
pnpm start
```

### Testing

```bash
pnpm test
pnpm lint
```

## Tech Stack

- **Next.js 16.2.6** - React framework with App Router
- **React 19.2.4** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS v4** - Styling
- **shadcn/ui** - UI components
- **react-markdown** - Markdown rendering
- **remark-gfm** - GitHub Flavored Markdown
- **rehype-highlight** - Code syntax highlighting

## Project Structure

```
mdviewer/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main page
│   └── globals.css        # Global styles
├── components/
│   ├── MDViewer/          # Main viewer components
│   │   ├── MDViewer.tsx           # Main container
│   │   ├── MDViewerSidebar.tsx    # File sidebar
│   │   ├── MDViewerEditor.tsx     # Editor component
│   │   ├── MDViewerPreview.tsx    # Preview component
│   │   ├── MDViewerSplitView.tsx  # Split view
│   │   ├── MediaWikiPreview.tsx   # MediaWiki preview
│   │   └── types.ts               # TypeScript types
│   └── ui/                 # shadcn/ui components
├── hooks/
│   └── useMarkdownFiles.ts # File management hook
├── lib/
│   ├── markdown-utils.ts   # Markdown utilities
│   ├── mediawiki-parser.ts # MediaWiki parser
│   └── utils.ts            # General utilities
└── public/
    └── sample.wiki         # Sample MediaWiki file
```

## Usage

1. Click the "Open File" button to select a markdown (.md) or MediaWiki (.wiki) file
2. Use the view mode buttons to switch between Edit, Preview, and Split view
3. Edit files in the editor pane
4. Save changes with the Save button or `Ctrl+S`

## Supported File Formats

### Markdown (.md, .markdown)
- GitHub Flavored Markdown (GFM)
- Tables, task lists, strikethrough
- Code blocks with syntax highlighting
- Frontmatter (YAML)

### MediaWiki (.wiki, .mediawiki, .wikitext)
- Headers with `==`
- Bold/italic with `'''`/`''`
- Internal links `[[Page]]`
- Tables
- Lists
- And more...

## License

MIT
