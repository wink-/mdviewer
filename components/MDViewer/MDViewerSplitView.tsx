"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { MDViewerEditor, MDViewerEditorRef } from "./MDViewerEditor"
import { MDViewerPreview } from "./MDViewerPreview"
import { ViewMode } from "./types"
import { cn } from "@/lib/utils"

interface MDViewerSplitViewProps {
  content: string
  onChange: (value: string) => void
  viewMode: ViewMode
  onViewModeChange?: (mode: ViewMode) => void
  readOnly?: boolean
  className?: string
}

export function MDViewerSplitView({
  content,
  onChange,
  viewMode,
  onViewModeChange,
  readOnly = false,
  className,
}: MDViewerSplitViewProps) {
  const [splitPosition, setSplitPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const editorRef = useRef<MDViewerEditorRef>(null)
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const previewContainerRef = useRef<HTMLDivElement>(null)

  // Calculate new split position
  const updateSplitPosition = useCallback((clientX: number) => {
    if (!editorContainerRef.current) return

    const containerRect = editorContainerRef.current.parentElement?.getBoundingClientRect()
    if (!containerRect) return

    const newPosition = ((clientX - containerRect.left) / containerRect.width) * 100
    setSplitPosition(Math.max(20, Math.min(80, newPosition)))
  }, [])

  // Handle drag start
  const handleDragStart = useCallback(() => {
    setIsDragging(true)
  }, [])

  // Handle drag move
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      updateSplitPosition(e.clientX)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, updateSplitPosition])

  // Sync scrolling from editor to preview
  const handleEditorScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    if (!previewContainerRef.current) return

    const target = e.currentTarget
    const scrollRatio = target.scrollTop / (target.scrollHeight - target.clientHeight)

    const previewContent = previewContainerRef.current.querySelector("[data-preview-content]")
    if (previewContent) {
      (previewContent as HTMLElement).scrollTop = scrollRatio * ((previewContent as HTMLElement).scrollHeight - (previewContent as HTMLElement).clientHeight)
    }
  }, [])

  // Sync scrolling from preview to editor
  const handlePreviewScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!editorRef.current?.textarea) return

    const target = e.currentTarget
    const scrollRatio = target.scrollTop / (target.scrollHeight - target.clientHeight)

    const textarea = editorRef.current.textarea
    if (textarea) {
      textarea.scrollTop = scrollRatio * (textarea.scrollHeight - textarea.clientHeight)

      // Also scroll line numbers
      const editorContainer = editorContainerRef.current
      if (editorContainer) {
        const lineNumbers = editorContainer.querySelector("[data-line-numbers]")
        if (lineNumbers) {
          lineNumbers.scrollTop = scrollRatio * (textarea.scrollHeight - textarea.clientHeight)
        }
      }
    }
  }, [])

  // Render based on view mode
  const renderContent = () => {
    // Mobile: always stack, desktop: based on viewMode
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768

    if (isMobile) {
      return (
        <div className="flex flex-col h-full">
          <div className="flex-1 min-h-0 border-b">
            <MDViewerEditor
              value={content}
              onChange={onChange}
              readOnly={readOnly}
            />
          </div>
          <div className="flex-1 min-h-0">
            <MDViewerPreview content={content} />
          </div>
        </div>
      )
    }

    if (viewMode === "edit") {
      return (
        <MDViewerEditor
          ref={editorRef}
          value={content}
          onChange={onChange}
          readOnly={readOnly}
        />
      )
    }

    if (viewMode === "preview") {
      return <MDViewerPreview content={content} />
    }

    // Split view
    return (
      <div className="flex h-full">
        {/* Editor */}
        <div
          ref={editorContainerRef}
          className="overflow-hidden border-r"
          style={{ width: `${splitPosition}%` }}
        >
          <MDViewerEditor
            ref={editorRef}
            value={content}
            onChange={onChange}
            readOnly={readOnly}
            onScroll={handleEditorScroll}
          />
        </div>

        {/* Resizer */}
        <div
          className={cn(
            "w-1 bg-border hover:bg-primary/50 cursor-col-resize transition-colors",
            "relative flex items-center justify-center"
          )}
          onMouseDown={handleDragStart}
        >
          <div
            className={cn(
              "w-1 h-8 bg-primary rounded-full opacity-0 transition-opacity",
              isDragging && "opacity-100"
            )}
          />
        </div>

        {/* Preview */}
        <div
          ref={previewContainerRef}
          className="flex-1 overflow-hidden"
          onScroll={handlePreviewScroll}
        >
          <MDViewerPreview content={content} />
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* View mode toggle */}
      {onViewModeChange && (
        <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
          <button
            onClick={() => onViewModeChange("edit")}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              viewMode === "edit"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            Edit
          </button>
          <button
            onClick={() => onViewModeChange("split")}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              viewMode === "split"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            Split
          </button>
          <button
            onClick={() => onViewModeChange("preview")}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              viewMode === "preview"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            Preview
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  )
}
