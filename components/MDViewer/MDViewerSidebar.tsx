"use client"

import { FileText, File, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { MarkdownFile } from "./types"

interface MDViewerSidebarProps {
  files: MarkdownFile[]
  activeFileId: string | null
  isLoading: boolean
  onFileSelect: (fileId: string) => void
  onLoadFile: () => void
  onCloseFile?: (fileId: string) => void
}

function getFileIcon(filename: string) {
  const ext = filename.toLowerCase().split('.').pop()
  if (ext === 'md' || ext === 'markdown') {
    return <FileText className="h-4 w-4 text-blue-500" />
  }
  if (ext === 'wiki') {
    return <FileText className="h-4 w-4 text-purple-500" />
  }
  return <File className="h-4 w-4 text-muted-foreground" />
}

export function MDViewerSidebar({
  files,
  activeFileId,
  isLoading,
  onFileSelect,
  onLoadFile,
  onCloseFile
}: MDViewerSidebarProps) {
  return (
    <div className="flex flex-col h-full bg-muted/30 border-r">
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-semibold">Markdown Viewer</h2>
            <p className="text-xs text-muted-foreground">
              {files.length} {files.length === 1 ? 'file' : 'files'} loaded
            </p>
          </div>
        </div>

        {/* File Picker Button */}
        <Button
          onClick={onLoadFile}
          disabled={isLoading}
          className="w-full"
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Open File
            </>
          )}
        </Button>
      </div>

      <Separator />

      {/* File List */}
      <ScrollArea className="flex-1">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 px-4 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              No files loaded
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Click "Open File" to get started
            </p>
          </div>
        ) : (
          <div className="py-2">
            {files.map((file) => (
              <div
                key={file.id}
                className={cn(
                  "group flex items-center gap-2 px-3 py-2 mx-2 rounded-md transition-colors cursor-pointer",
                  activeFileId === file.id
                    ? "bg-muted"
                    : "hover:bg-muted/50"
                )}
                onClick={() => onFileSelect(file.id)}
              >
                <div className="flex-shrink-0">
                  {getFileIcon(file.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {file.name}
                  </p>
                  {file.isModified && (
                    <span className="text-xs text-amber-600 dark:text-amber-400">
                      Modified
                    </span>
                  )}
                </div>

                {onCloseFile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      onCloseFile(file.id)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {files.length > 0 && (
        <>
          <Separator />
          <div className="p-3 border-t bg-background">
            <p className="text-xs text-muted-foreground text-center">
              Supports .md, .markdown, and .wiki files
            </p>
          </div>
        </>
      )}
    </div>
  )
}
