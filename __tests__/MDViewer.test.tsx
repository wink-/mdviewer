import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import type { ComponentPropsWithoutRef } from "react"
import { MDViewer } from "../components/MDViewer/MDViewer"

const { useMarkdownFilesMock } = vi.hoisted(() => ({
  useMarkdownFilesMock: vi.fn(),
}))

vi.mock("../hooks/useMarkdownFiles", () => ({
  useMarkdownFiles: useMarkdownFilesMock,
}))

vi.mock("../components/ui/button", () => ({
  Button: (props: ComponentPropsWithoutRef<"button"> & {
    variant?: string
    size?: string
  }) => {
    const { children, variant, size, ...buttonProps } = props
    void variant
    void size
    return <button {...buttonProps}>{children}</button>
  },
}))

vi.mock("../components/MDViewer/MDViewerSidebar", () => ({
  MDViewerSidebar: () => <div data-testid="sidebar" />,
}))

vi.mock("../components/MDViewer/MDViewerEditor", () => ({
  MDViewerEditor: () => <div data-testid="editor" />,
}))

vi.mock("../components/MDViewer/MDViewerPreview", () => ({
  MDViewerPreview: () => <div data-testid="preview" />,
}))

function createFile(format: "markdown" | "mediawiki") {
  return {
    id: `${format}-file`,
    name: format === "markdown" ? "notes.md" : "notes.wiki",
    path: format === "markdown" ? "notes.md" : "notes.wiki",
    content: format === "markdown" ? "# Notes" : "== Notes ==",
    format,
    isModified: false,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z"),
  }
}

function renderViewer(format: "markdown" | "mediawiki") {
  const file = createFile(format)
  useMarkdownFilesMock.mockReturnValue({
    files: [file],
    activeFile: file,
    activeFileId: file.id,
    isLoading: false,
    loadFile: vi.fn(),
    saveFile: vi.fn(),
    createFile: vi.fn(),
    selectFile: vi.fn(),
    closeFile: vi.fn(),
    updateFileContent: vi.fn(),
    updateFileFormat: vi.fn(),
  })

  render(<MDViewer />)
}

beforeEach(() => {
  useMarkdownFilesMock.mockReset()
})

describe("MDViewer cheatsheet modal", () => {
  it("opens the markdown cheatsheet for markdown files by default", () => {
    renderViewer("markdown")

    fireEvent.click(screen.getByTitle("Toggle cheatsheet (Ctrl+/)"))

    expect(screen.getByRole("heading", { name: /markdown cheatsheet/i })).toBeInTheDocument()
    expect(screen.getByText(/common markdown patterns you can use right away/i)).toBeInTheDocument()
  })

  it("opens the wiki cheatsheet for mediawiki files by default", () => {
    renderViewer("mediawiki")

    fireEvent.click(screen.getByTitle("Toggle cheatsheet (Ctrl+/)"))

    expect(screen.getByRole("heading", { name: /wiki cheatsheet/i })).toBeInTheDocument()
    expect(screen.getByText(/classic wiki \/ mediawiki markup/i)).toBeInTheDocument()
  })
})
