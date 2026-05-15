"use client"

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react"
import { getMarkdownStats, formatStats } from "@/lib/markdown-utils"
import { getContentFormatInfo } from "@/lib/mediawiki-parser"
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
  format?: "markdown" | "mediawiki"
  sourceLabel?: string
  sourceDescription?: string
}

export const MDViewerEditor = forwardRef<MDViewerEditorRef, MDViewerEditorProps>(function MDViewerEditor({
  value,
  onChange,
  readOnly = false,
  className,
  onScroll,
  format = "markdown",
  sourceLabel = "Source of truth",
  sourceDescription = "This pane is the canonical text source.",
}: MDViewerEditorProps, ref) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [stats, setStats] = useState(getMarkdownStats(""))

  useImperativeHandle(ref, () => ({
    textarea: textareaRef.current,
  }))

  useEffect(() => {
    setStats(getMarkdownStats(value))
  }, [value])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault()
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd

      const newValue = value.substring(0, start) + "  " + value.substring(end)
      onChange(newValue)

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      }, 0)
    }
  }, [value, onChange])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }, [onChange])

  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    const lineNumbers = containerRef.current?.querySelector("[data-line-numbers]") as HTMLElement | null
    if (lineNumbers) {
      lineNumbers.scrollTop = e.currentTarget.scrollTop
    }
    onScroll?.(e)
  }, [onScroll])

  const lineNumbers = Array.from({ length: value.split("\n").length }, (_, index) => index + 1)
  const formatInfo = getContentFormatInfo(format)

  return (
    <div ref={containerRef} className={cn("flex flex-col h-full bg-background", className)}>
      <div className="flex items-center justify-between gap-3 px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Editor</span>
          <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground/80">
            {sourceLabel}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{sourceDescription}</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
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
          placeholder={
            format === "mediawiki"
              ? "Start writing your wiki text here..."
              : "Start writing your markdown here..."
          }
          spellCheck={false}
        />
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30">
        <span className="text-xs text-muted-foreground">{formatStats(stats)}</span>
        <span className="text-xs text-muted-foreground">{formatInfo.label}</span>
      </div>
    </div>
  )
})
