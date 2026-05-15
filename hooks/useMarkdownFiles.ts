"use client"

import { useCallback, useEffect, useState } from "react"
import type { MarkdownFile, ContentFormat } from "../components/MDViewer/types"
import {
  CONTENT_FORMATS,
  detectFormatByContent,
  getContentFormatInfo,
} from "../lib/mediawiki-parser"

const LAST_FORMAT_STORAGE_KEY = "mdviewer:last-used-format"
const KNOWN_EXTENSIONS = [
  ...CONTENT_FORMATS.markdown.extensions,
  ...CONTENT_FORMATS.mediawiki.extensions,
]

type FilePickerWindow = Window & {
  showOpenFilePicker?: (options: {
    types: Array<{
      description: string
      accept: Record<string, string[]>
    }>
    multiple: boolean
  }) => Promise<FileSystemFileHandle[]>
}

export function buildFileRecord(file: File, content: string): MarkdownFile {
  const format = detectFormatByContent(content, file.name)

  return {
    id: crypto.randomUUID(),
    name: file.name,
    path: file.name,
    content,
    format,
    folder: undefined,
    isModified: false,
    createdAt: new Date(file.lastModified),
    updatedAt: new Date(),
  }
}

export function getDownloadFileName(fileName: string, formatInfo: ReturnType<typeof getContentFormatInfo>): string {
  const lower = fileName.toLowerCase()
  const matchingExtension = formatInfo.extensions.find((extension) => lower.endsWith(extension))
  if (matchingExtension) {
    return fileName
  }

  const baseName = fileName.replace(/\.[^.]+$/, "")
  return `${baseName}${formatInfo.extensions[0]}`
}

function hasKnownFormatExtension(fileName: string) {
  const lower = fileName.toLowerCase()
  return KNOWN_EXTENSIONS.some((extension) => lower.endsWith(extension))
}

export function useMarkdownFiles() {
  const [files, setFiles] = useState<MarkdownFile[]>([])
  const [activeFileId, setActiveFileId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [preferredFormat, setPreferredFormat] = useState<ContentFormat>(() => {
    if (typeof window === "undefined") {
      return "markdown"
    }

    const storedFormat = window.localStorage.getItem(LAST_FORMAT_STORAGE_KEY)
    return storedFormat === "mediawiki" ? "mediawiki" : "markdown"
  })

  useEffect(() => {
    window.localStorage.setItem(LAST_FORMAT_STORAGE_KEY, preferredFormat)
  }, [preferredFormat])

  const activeFile = files.find((file) => file.id === activeFileId) || null

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => resolve(event.target?.result as string)
      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsText(file)
    })
  }

  const loadFileFallback = useCallback(async (): Promise<MarkdownFile | null> => {
    return new Promise((resolve) => {
      const input = document.createElement("input")
      input.type = "file"
      input.accept = ".md,.markdown,.wiki,.mediawiki,.wikitext,.wt,text/markdown,text/plain"

      input.onchange = async (event) => {
        const target = event.target as HTMLInputElement
        const file = target.files?.[0]
        if (!file) {
          resolve(null)
          return
        }

        try {
          setIsLoading(true)
          const content = await readFileContent(file)
          const newFile = buildFileRecord(file, content)

          setFiles((prev) => {
            const exists = prev.some((existing) => existing.path === newFile.path)
            if (exists) {
              return prev.map((existing) =>
                existing.path === newFile.path ? newFile : existing
              )
            }
            return [...prev, newFile]
          })
          setActiveFileId(newFile.id)

          resolve(newFile)
        } catch (error) {
          console.error("Failed to load file:", error)
          resolve(null)
        } finally {
          setIsLoading(false)
        }
      }

      input.oncancel = () => resolve(null)
      input.click()
    })
  }, [])

  const loadFile = useCallback(async (): Promise<MarkdownFile | null> => {
    const filePickerWindow = window as FilePickerWindow

    if (typeof window === "undefined" || !filePickerWindow.showOpenFilePicker) {
      return loadFileFallback()
    }

    try {
      setIsLoading(true)
      const [handle] = await filePickerWindow.showOpenFilePicker({
        types: [
          {
            description: "Markdown and wiki files",
            accept: {
              "text/markdown": [
                ...CONTENT_FORMATS.markdown.extensions,
                ...CONTENT_FORMATS.mediawiki.extensions,
              ],
              "text/plain": [
                ...CONTENT_FORMATS.markdown.extensions,
                ...CONTENT_FORMATS.mediawiki.extensions,
              ],
            },
          },
        ],
        multiple: false,
      })

      const file = await handle.getFile()
      const content = await readFileContent(file)
      const newFile = buildFileRecord(file, content)

      setFiles((prev) => {
        const exists = prev.some((existing) => existing.path === newFile.path)
        if (exists) {
          return prev.map((existing) =>
            existing.path === newFile.path ? newFile : existing
          )
        }
        return [...prev, newFile]
      })
      setActiveFileId(newFile.id)

      return newFile
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Failed to load file:", error)
      }
      return null
    } finally {
      setIsLoading(false)
    }
  }, [loadFileFallback])

  const saveFile = useCallback(async (fileId: string, content?: string) => {
    const file = files.find((entry) => entry.id === fileId)
    if (!file) return false

    const newContent = content ?? file.content

    try {
      setIsLoading(true)

      const formatInfo = getContentFormatInfo(file.format)
      const blob = new Blob([newContent], { type: formatInfo.mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = getDownloadFileName(file.name, formatInfo)
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setFiles((prev) =>
        prev.map((entry) =>
          entry.id === fileId
            ? { ...entry, content: newContent, isModified: false, updatedAt: new Date() }
            : entry
        )
      )

      return true
    } catch (error) {
      console.error("Failed to save file:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [files])

  const createFile = useCallback((name: string, content: string = ""): MarkdownFile => {
    const format = !content.trim() && !hasKnownFormatExtension(name)
      ? preferredFormat
      : detectFormatByContent(content, name)

    const newFile: MarkdownFile = {
      id: crypto.randomUUID(),
      name,
      path: name,
      content,
      format,
      isModified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setFiles((prev) => [...prev, newFile])
    setActiveFileId(newFile.id)

    return newFile
  }, [preferredFormat])

  const selectFile = useCallback((fileId: string) => {
    setActiveFileId(fileId)
  }, [])

  const closeFile = useCallback((fileId: string) => {
    const remainingFiles = files.filter((file) => file.id !== fileId)
    setFiles(remainingFiles)

    if (activeFileId === fileId) {
      setActiveFileId(remainingFiles[0]?.id ?? null)
    }
  }, [activeFileId, files])

  const updateFileContent = useCallback((fileId: string, content: string) => {
    setFiles((prev) =>
      prev.map((file) =>
        file.id === fileId
          ? { ...file, content, isModified: true, updatedAt: new Date() }
          : file
      )
    )
  }, [])

  const updateFileFormat = useCallback((fileId: string, format: ContentFormat) => {
    setPreferredFormat(format)
    setFiles((prev) =>
      prev.map((file) =>
        file.id === fileId
          ? { ...file, format, updatedAt: new Date() }
          : file
      )
    )
  }, [])

  return {
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
    updateFileFormat,
  }
}
