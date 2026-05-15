export type ContentFormat = "markdown" | "mediawiki"

export interface MarkdownFile {
  id: string
  name: string
  path: string
  content: string
  format: ContentFormat
  folder?: string
  isModified?: boolean
  createdAt: Date
  updatedAt: Date
}

export type ViewMode = "edit" | "preview" | "split"
