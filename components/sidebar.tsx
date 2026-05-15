"use client"

import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { FileText, Folder, FolderOpen } from "lucide-react"

interface FileNode {
  name: string
  path: string
  type: "file" | "folder"
  children?: FileNode[]
}

const sampleFiles: FileNode[] = [
  {
    name: "docs",
    type: "folder",
    path: "/docs",
    children: [
      { name: "getting-started.md", type: "file", path: "/docs/getting-started.md" },
      { name: "api-reference.md", type: "file", path: "/docs/api-reference.md" },
    ],
  },
  {
    name: "notes",
    type: "folder",
    path: "/notes",
    children: [
      { name: "meeting-notes.md", type: "file", path: "/notes/meeting-notes.md" },
    ],
  },
  {
    name: "wiki",
    type: "folder",
    path: "/wiki",
    children: [
      { name: "sample.wiki", type: "file", path: "/wiki/sample.wiki" },
      { name: "template.wiki", type: "file", path: "/wiki/template.wiki" },
    ],
  },
  { name: "README.md", type: "file", path: "/README.md" },
]

interface SidebarProps {
  onFileSelect: (path: string) => void
  selectedFile: string | null
}

export function Sidebar({ onFileSelect, selectedFile }: SidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["/docs", "/notes", "/wiki"]))

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedFolders(newExpanded)
  }

  const renderFileNode = (node: FileNode, level: number = 0) => {
    const isExpanded = expandedFolders.has(node.path)
    const isSelected = selectedFile === node.path

    if (node.type === "folder") {
      return (
        <div key={node.path}>
          <button
            onClick={() => toggleFolder(node.path)}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
            style={{ paddingLeft: `${level * 16 + 12}px` }}
          >
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Folder className="h-4 w-4 text-muted-foreground" />
            )}
            <span>{node.name}</span>
          </button>
          {isExpanded && node.children && (
            <div>
              {node.children.map((child) => renderFileNode(child, level + 1))}
            </div>
          )}
        </div>
      )
    }

    return (
      <button
        key={node.path}
        onClick={() => onFileSelect(node.path)}
        className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors ${
          isSelected ? "bg-muted" : ""
        }`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span>{node.name}</span>
      </button>
    )
  }

  return (
    <div className="flex flex-col h-full bg-muted/30 border-r">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Document Viewer</h2>
        <p className="text-sm text-muted-foreground">Markdown & MediaWiki</p>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="py-2">
          {sampleFiles.map((file) => renderFileNode(file))}
        </div>
      </ScrollArea>
    </div>
  )
}
