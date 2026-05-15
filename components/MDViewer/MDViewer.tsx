"use client"

import { useEffect, useCallback, useState } from "react"
import {
  Edit3,
  Eye,
  Columns,
  PanelLeftClose,
  PanelLeftOpen,
  Save,
  FileText,
  FilePlus,
  Keyboard,
  Printer,
  BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMarkdownFiles } from "@/hooks/useMarkdownFiles"
import { MDViewerSidebar } from "./MDViewerSidebar"
import { MDViewerEditor } from "./MDViewerEditor"
import { MDViewerPreview } from "./MDViewerPreview"
import { cn } from "@/lib/utils"
import {
  getContentFormatInfo,
  getFormatCheatsheet,
  type ContentFormat,
} from "@/lib/mediawiki-parser"
import type { ViewMode } from "./types"

export function MDViewer() {
  const {
    files,
    activeFile,
    activeFileId,
    isLoading,
    loadFile,
    saveFile,
    createFile,
    selectFile,
    closeFile,
    updateFileContent,
    updateFileFormat,
  } = useMarkdownFiles()

  const [viewMode, setViewMode] = useState<ViewMode>("preview")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [showCheatsheet, setShowCheatsheet] = useState(false)
  const [cheatsheetFormat, setCheatsheetFormat] = useState<ContentFormat>("markdown")
  const [isSaving, setIsSaving] = useState(false)

  const activeFormat = activeFile?.format ?? "markdown"
  const cheatsheet = getFormatCheatsheet(cheatsheetFormat)

  const toggleCheatsheet = useCallback(() => {
    setCheatsheetFormat(activeFormat)
    setShowCheatsheet((prev) => !prev)
  }, [activeFormat])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        if (activeFile) {
          setIsSaving(true)
          saveFile(activeFile.id, activeFile.content).then(() => setIsSaving(false))
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault()
        setSidebarOpen((prev) => !prev)
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "e") {
        e.preventDefault()
        setViewMode("edit")
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault()
        setViewMode((current) => (current === "preview" ? "edit" : "preview"))
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault()
        toggleCheatsheet()
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "\\") {
        e.preventDefault()
        setViewMode("split")
      }

      if (e.key === "Escape") {
        if (showCheatsheet) {
          setShowCheatsheet(false)
        } else if (showKeyboardShortcuts) {
          setShowKeyboardShortcuts(false)
        }
      }
    },
    [activeFile, saveFile, showCheatsheet, showKeyboardShortcuts, toggleCheatsheet]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  const handleContentChange = useCallback(
    (value: string) => {
      if (activeFile) {
        updateFileContent(activeFile.id, value)
      }
    },
    [activeFile, updateFileContent]
  )

  const handleSave = useCallback(async () => {
    if (!activeFile) return
    setIsSaving(true)
    await saveFile(activeFile.id, activeFile.content)
    setIsSaving(false)
  }, [activeFile, saveFile])

  const handleNewFile = useCallback(() => {
    const name = prompt("Enter file name (e.g., notes.md or notes.wiki):")
    if (name) {
      createFile(name)
      setViewMode("edit")
    }
  }, [createFile])

  const handlePrint = useCallback(() => {
    const previewEl = document.querySelector("[data-preview-content]") || document.querySelector(".mediawiki-wrapper")
    const editorTextarea = document.querySelector("[data-view-mode] textarea") as HTMLTextAreaElement | null

    const previewContent = previewEl?.querySelector("article, .mediawiki-wrapper") as HTMLElement | null

    let html: string
    if (previewContent) {
      html = previewContent.outerHTML
    } else if (previewEl) {
      html = previewEl.innerHTML
    } else if (editorTextarea) {
      html = `<pre style="font-family:monospace;font-size:13px;line-height:1.5;white-space:pre-wrap;word-wrap:break-word">${escapeHtml(editorTextarea.value)}</pre>`
    } else {
      return
    }

    const printWindow = window.open("", "_blank", "width=800,height=600")
    if (!printWindow) return

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
<title>${escapeHtml(activeFile ? activeFile.name : "Print")}</title>
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    line-height: 1.75;
    color: #000;
    max-width: 100%;
    margin: 0;
    padding: 2cm;
  }

  h1, h2, h3, h4, h5, h6 {
    font-weight: 600;
    line-height: 1.25;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    page-break-after: avoid;
    break-after: avoid;
  }
  h1 { font-size: 2em; }
  h2 { font-size: 1.5em; }
  h3 { font-size: 1.25em; }
  h4 { font-size: 1.1em; }

  p { margin: 1em 0; }

  a { color: #000; text-decoration: underline; }
  a::after { content: " (" attr(href) ")"; font-size: 0.85em; color: #555; word-break: break-all; }
  a.wiki-link-internal::after, a[href^="#"]::after { content: none; }

  pre {
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 1em;
    overflow: visible;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-size: 0.875em;
    line-height: 1.5;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    background: #f0f0f0;
    padding: 0.1em 0.3em;
    border-radius: 3px;
    font-size: 0.875em;
  }
  pre code { background: transparent; padding: 0; border-radius: 0; }

  .hljs-keyword, .hljs-selector-tag, .hljs-literal { color: #7b2d8b; }
  .hljs-title, .hljs-section { color: #2f6f9f; }
  .hljs-string, .hljs-regexp { color: #2e7d32; }
  .hljs-number, .hljs-built_in, .hljs-type { color: #b35914; }
  .hljs-comment, .hljs-doctag { color: #888; font-style: italic; }
  .hljs-attr, .hljs-attribute { color: #666; }

  table { border-collapse: collapse; width: 100%; margin: 1em 0; }
  th, td { border: 1px solid #ccc; padding: 0.5em; text-align: left; }
  th { background: #eee; font-weight: 600; }

  blockquote { border-left: 4px solid #999; padding-left: 1em; color: #333; font-style: italic; margin: 1em 0; }
  hr { border: none; border-top: 1px solid #999; margin: 2em 0; }
  img { max-width: 100%; }
  ul, ol { padding-left: 2em; }
  li { margin: 0.25em 0; }

  @page { size: letter; margin: 2cm; }

  @media screen { a::after { content: none !important; } }
</style>
</head>
<body>${html}</body>
</html>`)

    printWindow.document.close()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }, [activeFile])

  if (files.length === 0) {
    return (
      <div className="flex h-screen">
        <aside
          className={cn(
            "transition-all duration-300 ease-in-out bg-muted/30 border-r",
            sidebarOpen ? "w-72" : "w-0"
          )}
        >
          <MDViewerSidebar
            files={files}
            activeFileId={activeFileId}
            isLoading={isLoading}
            onFileSelect={selectFile}
            onLoadFile={loadFile}
            onCloseFile={closeFile}
          />
        </aside>

        <main className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center max-w-md p-8">
            <FileText className="h-20 w-20 mx-auto text-muted-foreground/50 mb-6" />
            <h2 className="text-2xl font-semibold mb-2">No Files Loaded</h2>
            <p className="text-muted-foreground mb-6">
              Open a Markdown or Wiki file to get started.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={loadFile} disabled={isLoading}>
                <FileText className="h-4 w-4 mr-2" />
                Open File
              </Button>
              <Button variant="outline" onClick={handleNewFile}>
                <FilePlus className="h-4 w-4 mr-2" />
                New File
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {showKeyboardShortcuts && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowKeyboardShortcuts(false)}
        >
          <div
            className="bg-card border rounded-lg shadow-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Keyboard Shortcuts</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Save file</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+S</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Toggle sidebar</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+B</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Edit mode</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+E</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Preview / edit toggle</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+Shift+P</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Toggle cheatsheet</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+/</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Split mode</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+\</kbd>
              </div>
            </div>
            <Button className="w-full mt-6" onClick={() => setShowKeyboardShortcuts(false)}>
              Got it!
            </Button>
          </div>
        </div>
      )}

      {showCheatsheet && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowCheatsheet(false)}
        >
          <div
            className="bg-card border rounded-lg shadow-lg max-w-2xl w-full p-6 max-h-[85vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold">{cheatsheet.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{cheatsheet.intro}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={cheatsheetFormat === "markdown" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setCheatsheetFormat("markdown")}
                >
                  Markdown
                </Button>
                <Button
                  variant={cheatsheetFormat === "mediawiki" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setCheatsheetFormat("mediawiki")}
                >
                  Wiki
                </Button>
              </div>
            </div>

            <div className="space-y-5">
              {cheatsheet.sections.map((section) => (
                <section key={section.title}>
                  <h4 className="font-medium mb-3">{section.title}</h4>
                  <div className="space-y-3">
                    {section.items.map((item) => (
                      <div key={item.syntax} className="grid gap-1 rounded-md border bg-muted/20 p-3">
                        <code className="text-sm font-mono text-foreground">{item.syntax}</code>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <Button className="w-full mt-6" onClick={() => setShowCheatsheet(false)}>
              Close
            </Button>
          </div>
        </div>
      )}

      <aside
        className={cn(
          "transition-all duration-300 ease-in-out bg-muted/30 border-r flex flex-col",
          sidebarOpen ? "w-72" : "w-0 overflow-hidden"
        )}
      >
        <MDViewerSidebar
          files={files}
          activeFileId={activeFileId}
          isLoading={isLoading}
          onFileSelect={selectFile}
          onLoadFile={loadFile}
          onCloseFile={closeFile}
        />
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Toggle Sidebar (Ctrl+B)"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeftOpen className="h-4 w-4" />
              )}
            </Button>

            {activeFile && (
              <div className="flex items-center gap-2 px-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{activeFile.name}</span>
                {activeFile.isModified && (
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {activeFile && (
              <div className="flex items-center border-r mr-2 pr-2 gap-1">
                <Button
                  variant={activeFormat === "markdown" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => updateFileFormat(activeFile.id, "markdown")}
                  title={getContentFormatInfo("markdown").description}
                >
                  MD
                </Button>
                <Button
                  variant={activeFormat === "mediawiki" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => updateFileFormat(activeFile.id, "mediawiki")}
                  title={getContentFormatInfo("mediawiki").description}
                >
                  Wiki
                </Button>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCheatsheet}
              title="Toggle cheatsheet (Ctrl+/)"
            >
              <BookOpen className="h-4 w-4" />
            </Button>

            <div className="flex items-center border-r mr-2 pr-2">
              <Button
                variant={viewMode === "edit" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("edit")}
                title="Edit Mode (Ctrl+E)"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "preview" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode((current) => (current === "preview" ? "edit" : "preview"))}
                title="Preview / edit toggle (Ctrl+Shift+P)"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "split" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("split")}
                title="Split Mode (Ctrl+\)"
              >
                <Columns className="h-4 w-4" />
              </Button>
            </div>

            {activeFile && viewMode !== "preview" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                title="Save (Ctrl+S)"
              >
                <Save className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">{isSaving ? "Saving..." : "Save"}</span>
              </Button>
            )}

            {activeFile && (
              <Button variant="outline" size="sm" onClick={handlePrint} title="Print">
                <Printer className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Print</span>
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={handleNewFile} title="New File">
              <FilePlus className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowKeyboardShortcuts(true)}
              title="Keyboard Shortcuts"
            >
              <Keyboard className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div data-view-mode={viewMode} className="flex-1 flex overflow-hidden">
          {(viewMode === "edit" || viewMode === "split") && (
            <div
              data-editor
              className={cn(
                "overflow-hidden border-r",
                viewMode === "split" ? "w-1/2" : "w-full"
              )}
            >
              {activeFile ? (
                <MDViewerEditor
                  value={activeFile.content}
                  onChange={handleContentChange}
                  format={activeFormat}
                  sourceLabel="Source of truth"
                  sourceDescription="Edit here; preview stays derived."
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Select a file to edit
                </div>
              )}
            </div>
          )}

          {(viewMode === "preview" || viewMode === "split") && (
            <div
              className={cn(
                "overflow-hidden bg-background",
                viewMode === "split" ? "w-1/2" : "w-full"
              )}
            >
              <MDViewerPreview
                content={activeFile?.content ?? ""}
                forceFormat={activeFormat}
                sourceLabel="Derived view"
                sourceDescription="Preview updates from the editor's canonical text."
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
