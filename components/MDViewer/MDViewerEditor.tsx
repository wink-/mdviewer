"use client"

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react"
import { getMarkdownStats, formatStats } from "@/lib/markdown-utils"
import { cn } from "@/lib/utils"

export interface MDViewerEditorRef {
  textarea: HTMLTextAreaElement | null
}

interface MDViewerEditorProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  className?: string
  onScroll?: (e: React.UIEvent<HTMLTextAreaElement>) => void
  fileName?: string
  format?: 'markdown' | 'mediawiki'
}

export const MDViewerEditor = forwardRef<MDViewerEditorRef, MDViewerEditorProps>(function MDViewerEditor({
  value,
  onChange,
  readOnly = false,
  className,
  onScroll,
  fileName,
  format = 'markdown',
}: MDViewerEditorProps, ref) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [stats, setStats] = useState(getMarkdownStats(""))

  // Expose textarea through ref
  useImperativeHandle(ref, () => ({
    textarea: textareaRef.current,
  }))

  // Update stats when value changes
  useEffect(() => {
    setStats(getMarkdownStats(value))
  }, [value])

  // Handle tab key - insert 2 spaces instead of changing focus
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault()
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd

      const newValue = value.substring(0, start) + "  " + value.substring(end)

      onChange(newValue)
      // Set cursor position after the inserted spaces
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      }, 0)
    }
  }, [value, onChange])

  // Handle value changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }, [onChange])

  // Sync scroll with line numbers and external scroll handler
  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    const lineNumbers = containerRef.current?.querySelector('[data-line-numbers]')
    if (lineNumbers) {
      lineNumbers.scrollTop = e.currentTarget.scrollTop
    }
    onScroll?.(e)
  }, [onScroll])

  // Get line numbers array
  const lineNumbers = Array.from({ length: value.split("\n").length }, (_, i) => i + 1)

  return (
    <div ref={containerRef} className={cn("flex flex-col h-full bg-background", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <span className="text-sm text-muted-foreground">Editor</span>
      </div>

      {/* Editor with line numbers */}
      <div className="flex-1 flex overflow-hidden">
        {/* Line numbers */}
        <div
          data-line-numbers
          className="hidden sm:block py-4 px-2 bg-muted/20 text-right select-none overflow-hidden"
          style={{
            minWidth: "3rem",
            maxWidth: "3rem",
          }}
        >
          {lineNumbers.map((num) => (
            <div
              key={num}
              className="text-sm text-muted-foreground leading-6"
              style={{ height: "1.5rem" }}
            >
              {num}
            </div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          readOnly={readOnly}
          className={cn(
            "flex-1 w-full p-4 bg-transparent resize-none outline-none",
            "font-mono text-sm leading-6",
            "[font-variant-ligatures:none]",
            "placeholder:text-muted-foreground",
            readOnly && "cursor-default"
          )}
          placeholder="Start writing your markdown here..."
          spellCheck={false}
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30">
        <span className="text-xs text-muted-foreground">{formatStats(stats)}</span>
        <span className="text-xs text-muted-foreground">{format === 'mediawiki' ? 'MediaWiki' : 'Markdown'}</span>
      </div>
    </div>
  )
})
