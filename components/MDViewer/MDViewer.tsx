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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMarkdownFiles } from "@/hooks/useMarkdownFiles"
import { MDViewerSidebar } from "./MDViewerSidebar"
import { MDViewerEditor } from "./MDViewerEditor"
import { MDViewerPreview } from "./MDViewerPreview"
import { cn } from "@/lib/utils"
import { detectFormatByExtension, type ContentFormat } from "@/lib/mediawiki-parser"
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
  } = useMarkdownFiles()

  const [viewMode, setViewMode] = useState<ViewMode>("preview")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [editorContent, setEditorContent] = useState("")
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved")
  const [format, setFormat] = useState<ContentFormat>("markdown")

  // Sync editor content and format with active file
  useEffect(() => {
    if (activeFile) {
      setEditorContent(activeFile.content)
      setSaveStatus(activeFile.isModified ? "unsaved" : "saved")
      setFormat(detectFormatByExtension(activeFile.name))
    } else {
      setEditorContent("")
    }
  }, [activeFileId])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S - Save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        if (activeFile) {
          setSaveStatus("saving")
          saveFile(activeFile.id, editorContent).then((success) => {
            setSaveStatus(success ? "saved" : "unsaved")
          })
        }
      }

      // Ctrl+B or Cmd+B - Toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault()
        setSidebarOpen((prev) => !prev)
      }

      // Ctrl+E or Cmd+E - Switch to edit mode
      if ((e.ctrlKey || e.metaKey) && e.key === "e") {
        e.preventDefault()
        setViewMode("edit")
      }

      // Ctrl+P or Cmd+P - Switch to preview mode
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault()
        setViewMode("preview")
      }

      // Ctrl+\ or Cmd+\ - Switch to split mode
      if ((e.ctrlKey || e.metaKey) && e.key === "\\") {
        e.preventDefault()
        setViewMode("split")
      }

      // Escape - Close keyboard shortcuts modal
      if (e.key === "Escape" && showKeyboardShortcuts) {
        setShowKeyboardShortcuts(false)
      }
    },
    [activeFile, editorContent, saveFile, showKeyboardShortcuts]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  // Handle content changes
  const handleContentChange = useCallback((value: string) => {
    setEditorContent(value)
    setSaveStatus("unsaved")
    if (activeFile) {
      updateFileContent(activeFile.id, value)
    }
  }, [activeFile, updateFileContent])

  // Handle save
  const handleSave = useCallback(async () => {
    if (activeFile) {
      setSaveStatus("saving")
      const success = await saveFile(activeFile.id, editorContent)
      setSaveStatus(success ? "saved" : "unsaved")
    }
  }, [activeFile, editorContent, saveFile])

  // Create new file
  const handleNewFile = useCallback(() => {
    const name = prompt("Enter file name (e.g., notes.md):")
    if (name) {
      createFile(name)
      setViewMode("edit")
    }
  }, [createFile])

  // Handle print — opens a clean window with just the content
  const handlePrint = useCallback(() => {
    const previewEl = document.querySelector("[data-preview-content]") || document.querySelector(".mediawiki-wrapper")
    const editorTextarea = document.querySelector("[data-view-mode] textarea") as HTMLTextAreaElement | null

    let html: string
    if (previewEl) {
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
<title>${activeFile ? activeFile.name : "Print"}</title>
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

  /* Hide the link-suffix on screen, only show in print */
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

  // Empty state when no files are loaded
  if (files.length === 0) {
    return (
      <div className="flex h-screen">
        {/* Sidebar */}
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

        {/* Empty State */}
        <main className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center max-w-md p-8">
            <FileText className="h-20 w-20 mx-auto text-muted-foreground/50 mb-6" />
            <h2 className="text-2xl font-semibold mb-2">No Files Loaded</h2>
            <p className="text-muted-foreground mb-6">
              Open a markdown file to get started with the MDViewer.
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
      {/* Keyboard Shortcuts Modal */}
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
                <span className="text-muted-foreground">Preview mode</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+P</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Split mode</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+\</kbd>
              </div>
            </div>
            <Button
              className="w-full mt-6"
              onClick={() => setShowKeyboardShortcuts(false)}
            >
              Got it!
            </Button>
          </div>
        </div>
      )}

      {/* Sidebar */}
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <header className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            {/* Toggle Sidebar */}
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

            {/* File Name */}
            {activeFile && (
              <div className="flex items-center gap-2 px-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{activeFile.name}</span>
                {saveStatus === "unsaved" && (
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Format Toggle */}
            {activeFile && (
              <div className="flex items-center border-r mr-2 pr-2">
                <Button
                  variant={format === "markdown" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setFormat("markdown")}
                  title="Markdown"
                >
                  MD
                </Button>
                <Button
                  variant={format === "mediawiki" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setFormat("mediawiki")}
                  title="MediaWiki"
                >
                  Wiki
                </Button>
              </div>
            )}
            {/* View Mode Buttons */}
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
                onClick={() => setViewMode("preview")}
                title="Preview Mode (Ctrl+P)"
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

            {/* Save Button */}
            {activeFile && viewMode !== "preview" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={saveStatus === "saving"}
                title="Save (Ctrl+S)"
              >
                <Save className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">
                  {saveStatus === "saving" ? "Saving..." : "Save"}
                </span>
              </Button>
            )}

            {/* Print Button */}
            {activeFile && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                title="Print"
              >
                <Printer className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Print</span>
              </Button>
            )}

            {/* New File Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewFile}
              title="New File"
            >
              <FilePlus className="h-4 w-4" />
            </Button>

            {/* Keyboard Shortcuts Button */}
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

        {/* Content Area */}
        <div data-view-mode={viewMode} className="flex-1 flex overflow-hidden">
          {/* Editor */}
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
                  value={editorContent}
                  onChange={handleContentChange}
                  format={format}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Select a file to edit
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          {(viewMode === "preview" || viewMode === "split") && (
            <div
              className={cn(
                "overflow-hidden bg-background",
                viewMode === "split" ? "w-1/2" : "w-full"
              )}
            >
              <MDViewerPreview
                content={editorContent}
                fileName={activeFile?.name}
                forceFormat={format}
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
    .replace(/"/g, "&quot;")
}
