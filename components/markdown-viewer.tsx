"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkFrontmatter from "remark-frontmatter"
import { Card } from "@/components/ui/card"

interface MarkdownViewerProps {
  content: string
  fileName?: string
}

export function MarkdownViewer({ content, fileName }: MarkdownViewerProps) {
  return (
    <div className="flex flex-col h-full">
      {fileName && (
        <div className="px-6 py-4 border-b bg-muted/30">
          <h2 className="text-lg font-semibold">{fileName}</h2>
        </div>
      )}
      <div className="flex-1 overflow-auto p-6">
        <Card className="p-8 prose dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkFrontmatter]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-3xl font-bold mt-8 mb-4">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-2xl font-semibold mt-6 mb-3">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl font-semibold mt-4 mb-2">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="my-4 leading-7">{children}</p>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
              code: ({ className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || "")
                return match ? (
                  <code className={className} {...props}>
                    {children}
                  </code>
                ) : (
                  <code
                    className="bg-muted px-1.5 py-0.5 rounded text-sm"
                    {...props}
                  >
                    {children}
                  </code>
                )
              },
              pre: ({ children }) => (
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-4">
                  {children}
                </pre>
              ),
              ul: ({ children }) => (
                <ul className="list-disc pl-6 my-4 space-y-1">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-6 my-4 space-y-1">{children}</ol>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-primary pl-4 italic my-4">
                  {children}
                </blockquote>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </Card>
      </div>
    </div>
  )
}
