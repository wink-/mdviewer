"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkFrontmatter from "remark-frontmatter"
import rehypeHighlight from "rehype-highlight"
import { useRef } from "react"
import { cn } from "@/lib/utils"
import { MediaWikiPreview } from "./MediaWikiPreview"
import { getContentFormatInfo, type ContentFormat } from "@/lib/mediawiki-parser"

interface MDViewerPreviewProps {
  content: string
  className?: string
  forceFormat?: ContentFormat
  sourceLabel?: string
  sourceDescription?: string
}

function CodeBlock({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLPreElement>) {
  return (
    <pre
      className={cn(
        "bg-muted p-4 rounded-lg overflow-x-auto my-4",
        "text-sm leading-relaxed",
        className
      )}
      {...props}
    >
      <code className="font-mono">{children}</code>
    </pre>
  )
}

function InlineCode({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <code
      className={cn(
        "bg-muted px-1.5 py-0.5 rounded text-sm font-mono",
        "text-foreground/90",
        className
      )}
      {...props}
    >
      {children}
    </code>
  )
}

export function MDViewerPreview({
  content,
  className,
  forceFormat,
  sourceLabel = "Derived view",
  sourceDescription = "Rendered from the editor's canonical text.",
}: MDViewerPreviewProps) {
  const format = forceFormat ?? "markdown"
  const formatInfo = getContentFormatInfo(format)
  const previewRef = useRef<HTMLDivElement>(null)

  if (format === "mediawiki") {
    return <MediaWikiPreview content={content} className={className} />
  }

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      <div className="flex items-center justify-between gap-3 px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Preview ({formatInfo.label})</span>
          <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground/80">
            {sourceLabel}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{sourceDescription}</span>
      </div>

      <div
        ref={previewRef}
        data-preview-content
        className="flex-1 overflow-auto p-6"
      >
        {content.trim() ? (
          <article className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-img:shadow-md prose-pre:bg-muted/50">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkFrontmatter]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                h1: ({ children }) => (
                  <h1 className="text-3xl font-bold mt-8 mb-4 first:mt-0">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-2xl font-semibold mt-6 mb-3 first:mt-0">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl font-semibold mt-4 mb-2 first:mt-0">{children}</h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-lg font-medium mt-3 mb-2 first:mt-0">{children}</h4>
                ),
                h5: ({ children }) => (
                  <h5 className="text-base font-medium mt-2 mb-1 first:mt-0">{children}</h5>
                ),
                h6: ({ children }) => (
                  <h6 className="text-sm font-medium mt-2 mb-1 first:mt-0 text-muted-foreground">{children}</h6>
                ),
                p: ({ children }) => (
                  <p className="my-4 leading-7 first:mt-0 last:mb-0">{children}</p>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    className="text-primary hover:underline transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-6 my-4 space-y-1 marker:text-muted-foreground">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-6 my-4 space-y-1 marker:text-muted-foreground">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="my-1">{children}</li>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary/50 pl-4 italic my-4 text-muted-foreground">
                    {children}
                  </blockquote>
                ),
                pre: CodeBlock,
                code: ({ className, children, ...props }) => {
                  const isInline = !className
                  return isInline ? (
                    <InlineCode {...props}>{children}</InlineCode>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  )
                },
                table: ({ children }) => (
                  <div className="my-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-border border border-border rounded-lg overflow-hidden">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-muted/50">{children}</thead>
                ),
                tbody: ({ children }) => (
                  <tbody className="divide-y divide-border bg-background">{children}</tbody>
                ),
                tr: ({ children }) => (
                  <tr className="hover:bg-muted/30 transition-colors">{children}</tr>
                ),
                th: ({ children }) => (
                  <th className="px-4 py-2 text-left text-sm font-semibold">{children}</th>
                ),
                td: ({ children }) => (
                  <td className="px-4 py-2 text-sm">{children}</td>
                ),
                hr: () => (
                  <hr className="my-6 border-t border-border" />
                ),
                img: ({ src, alt, ...props }) => {
                  // Markdown image sources are user-authored and may be arbitrary remote URLs.
                  // Next/Image cannot safely optimize every possible source here, so we keep
                  // a native <img> renderer and isolate the lint exception to this one case.
                  // eslint-disable-next-line @next/next/no-img-element
                  return <img
                    src={src}
                    alt={alt ?? "Markdown image"}
                    className="rounded-lg shadow-md my-4 max-w-full h-auto"
                    loading="lazy"
                    decoding="async"
                    {...props}
                  />
                },
                strong: ({ children }) => (
                  <strong className="font-semibold">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic">{children}</em>
                ),
                del: ({ children }) => (
                  <del className="line-through text-muted-foreground">{children}</del>
                ),
                kbd: ({ children }) => (
                  <kbd className="px-2 py-1 text-xs font-mono bg-muted border border-border rounded">
                    {children}
                  </kbd>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </article>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Preview will appear here</p>
          </div>
        )}
      </div>
    </div>
  )
}
