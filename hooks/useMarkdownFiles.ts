"use client"

import { useState, useCallback } from 'react'
import type { MarkdownFile } from '@/components/MDViewer/types'

export function useMarkdownFiles() {
  const [files, setFiles] = useState<MarkdownFile[]>([])
  const [activeFileId, setActiveFileId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const activeFile = files.find(f => f.id === activeFileId) || null

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  const loadFile = useCallback(async (): Promise<MarkdownFile | null> => {
    if (typeof window === 'undefined' || !window.showOpenFilePicker) {
      // Fallback for browsers without File System Access API
      return await loadFileFallback()
    }

    try {
      setIsLoading(true)
      const [handle] = await window.showOpenFilePicker({
        types: [{
          description: 'Markdown files',
          accept: {
            'text/markdown': ['.md', '.markdown', '.wiki'],
            'text/plain': ['.md', '.markdown', '.wiki']
          }
        }],
        multiple: false
      })

      const file = await handle.getFile()
      const content = await readFileContent(file)

      const newFile: MarkdownFile = {
        id: crypto.randomUUID(),
        name: file.name,
        path: file.name,
        content,
        folder: undefined,
        isModified: false,
        createdAt: new Date(file.lastModified),
        updatedAt: new Date()
      }

      setFiles(prev => {
        const exists = prev.some(f => f.path === newFile.path)
        if (exists) {
          return prev.map(f => f.path === newFile.path ? newFile : f)
        }
        return [...prev, newFile]
      })
      setActiveFileId(newFile.id)

      return newFile
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Failed to load file:', error)
      }
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadFileFallback = useCallback(async (): Promise<MarkdownFile | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.md,.markdown,.wiki,text/markdown,text/plain'

      input.onchange = async (e) => {
        const target = e.target as HTMLInputElement
        const file = target.files?.[0]
        if (!file) {
          resolve(null)
          return
        }

        try {
          setIsLoading(true)
          const content = await readFileContent(file)

          const newFile: MarkdownFile = {
            id: crypto.randomUUID(),
            name: file.name,
            path: file.name,
            content,
            folder: undefined,
            isModified: false,
            createdAt: new Date(file.lastModified),
            updatedAt: new Date()
          }

          setFiles(prev => {
            const exists = prev.some(f => f.path === newFile.path)
            if (exists) {
              return prev.map(f => f.path === newFile.path ? newFile : f)
            }
            return [...prev, newFile]
          })
          setActiveFileId(newFile.id)

          resolve(newFile)
        } catch (error) {
          console.error('Failed to load file:', error)
          resolve(null)
        } finally {
          setIsLoading(false)
        }
      }

      input.oncancel = () => resolve(null)
      input.click()
    })
  }, [])

  const saveFile = useCallback(async (fileId: string, content?: string) => {
    const file = files.find(f => f.id === fileId)
    if (!file) return false

    const newContent = content ?? file.content

    try {
      setIsLoading(true)

      // Create download link for saving
      const blob = new Blob([newContent], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Update file state
      setFiles(prev => prev.map(f =>
        f.id === fileId
          ? { ...f, content: newContent, isModified: false, updatedAt: new Date() }
          : f
      ))

      return true
    } catch (error) {
      console.error('Failed to save file:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [files])

  const createFile = useCallback((name: string, content: string = ''): MarkdownFile => {
    const newFile: MarkdownFile = {
      id: crypto.randomUUID(),
      name,
      path: name,
      content,
      isModified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setFiles(prev => [...prev, newFile])
    setActiveFileId(newFile.id)

    return newFile
  }, [])

  const selectFile = useCallback((fileId: string) => {
    setActiveFileId(fileId)
  }, [])

  const closeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
    if (activeFileId === fileId) {
      setActiveFileId(prev => {
        const remaining = files.filter(f => f.id !== fileId)
        return remaining.length > 0 ? remaining[0].id : null
      })
    }
  }, [activeFileId, files])

  const updateFileContent = useCallback((fileId: string, content: string) => {
    setFiles(prev => prev.map(f =>
      f.id === fileId
        ? { ...f, content, isModified: true, updatedAt: new Date() }
        : f
    ))
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
    updateFileContent
  }
}
