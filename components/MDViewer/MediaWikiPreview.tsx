"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { parseMediaWiki } from "@/lib/mediawiki-parser"
import { cn } from "@/lib/utils"

interface MediaWikiPreviewProps {
  content: string
  className?: string
}

export function MediaWikiPreview({
  content,
  className,
}: MediaWikiPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [html, setHtml] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  // Parse MediaWiki content to HTML (synchronous)
  useEffect(() => {
    if (!content.trim()) {
      setHtml("")
      setError(null)
      return
    }

    try {
      const parsedHtml = parseMediaWiki(content)
      setHtml(parsedHtml)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to parse MediaWiki content"
      setError(message)
      console.error("MediaWiki parse error:", err)
    }
  }, [content])

  // Scroll handler for sync scrolling
  const handleScroll = useCallback((scrollTop: number, scrollHeight: number, clientHeight: number) => {
    if (previewRef.current) {
      const ratio = scrollTop / (scrollHeight - clientHeight)
      previewRef.current.scrollTop = ratio * (previewRef.current.scrollHeight - previewRef.current.clientHeight)
    }
  }, [])

  // Expose scroll handler through ref
  useEffect(() => {
    if (previewRef.current) {
      (previewRef.current as unknown as { handleScroll: typeof handleScroll }).handleScroll = handleScroll
    }
  }, [handleScroll])

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <span className="text-sm text-muted-foreground">Preview (MediaWiki)</span>
      </div>

      {/* MediaWiki content */}
      <div
        ref={previewRef}
        data-preview-content
        className="flex-1 overflow-auto p-6"
      >
        {content.trim() ? (
          error ? (
            <div className="flex flex-col items-center justify-center h-full text-destructive">
              <p className="text-lg font-medium mb-2">Parse Error</p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <details className="text-left">
                <summary className="cursor-pointer text-sm font-medium">View raw content</summary>
                <pre className="mt-4 p-4 bg-muted rounded-lg overflow-auto text-xs">
                  {content}
                </pre>
              </details>
            </div>
          ) : (
            <article
              className="mediawiki-wrapper prose prose-slate dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Preview will appear here</p>
          </div>
        )}
      </div>
    </div>
  )
}
