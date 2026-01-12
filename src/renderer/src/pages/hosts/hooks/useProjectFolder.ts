import type { Host, ProjectFile } from '@renderer/types'
import { useCallback, useEffect, useState } from 'react'

/**
 * 项目文件夹管理 Hook
 */
export function useProjectFolder(host: Host | null) {
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const projectFolderPath = host?.projectFolderPath

  /** 刷新文件列表 */
  const refreshFiles = useCallback(async () => {
    if (!projectFolderPath) {
      setFiles([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await window.api.file.listDirectory(projectFolderPath)
      // result 是文件路径字符串数组，需要从路径中提取文件名
      const allFiles: ProjectFile[] = result
        .map((filePath: string) => {
          // 跨平台提取文件名：处理 Windows (\) 和 Unix/Mac (/) 路径分隔符
          // 先去除末尾的分隔符，再提取最后一段
          const normalizedPath = filePath.replace(/[/\\]+$/, '')
          const segments = normalizedPath.split(/[/\\]/)
          const name = segments[segments.length - 1] || normalizedPath
          return {
            name,
            path: filePath,
            size: 0,
            modifiedAt: Date.now(),
            isDirectory: false
          }
        })
        .filter((file) => file.name && !file.name.startsWith('.')) // 过滤空名称和隐藏文件

      setFiles(allFiles)
    } catch (err: any) {
      setError(err.message || 'Failed to list files')
      setFiles([])
    } finally {
      setLoading(false)
    }
  }, [projectFolderPath])

  /** 保存文件到项目文件夹 */
  const saveFile = useCallback(
    async (filename: string, content: string): Promise<string | null> => {
      if (!projectFolderPath) {
        return null
      }

      try {
        // 确保文件名以 .md 结尾
        const safeName = filename.endsWith('.md') ? filename : `${filename}.md`
        // 过滤非法字符
        const sanitizedName = safeName.replace(/[/\\:*?"<>|]/g, '_')
        const filePath = `${projectFolderPath}/${sanitizedName}`

        await window.api.file.save(filePath, content)
        await refreshFiles()
        return filePath
      } catch (err: any) {
        setError(err.message || 'Failed to save file')
        return null
      }
    },
    [projectFolderPath, refreshFiles]
  )

  /** 删除文件 */
  const deleteFile = useCallback(
    async (filePath: string): Promise<boolean> => {
      try {
        await window.api.file.delete(filePath)
        await refreshFiles()
        return true
      } catch (err: any) {
        setError(err.message || 'Failed to delete file')
        return false
      }
    },
    [refreshFiles]
  )

  /** 打开文件 */
  const openFile = useCallback(async (filePath: string) => {
    try {
      await window.api.file.openPath(filePath)
    } catch (err: any) {
      setError(err.message || 'Failed to open file')
    }
  }, [])

  /** 打开项目文件夹 */
  const openFolder = useCallback(async () => {
    if (!projectFolderPath) return
    try {
      await window.api.file.openPath(projectFolderPath)
    } catch (err: any) {
      setError(err.message || 'Failed to open folder')
    }
  }, [projectFolderPath])

  /** 读取文件内容 */
  const readFile = useCallback(async (filePath: string): Promise<string | null> => {
    try {
      const content = await window.api.file.readExternal(filePath)
      return content
    } catch (err: any) {
      setError(err.message || 'Failed to read file')
      return null
    }
  }, [])

  /** 选择文件夹 */
  const selectFolder = useCallback(async (): Promise<string | null> => {
    try {
      const path = await window.api.file.selectFolder()
      return path
    } catch (err: any) {
      setError(err.message || 'Failed to select folder')
      return null
    }
  }, [])

  // 当项目文件夹路径变化时，自动刷新文件列表
  useEffect(() => {
    if (projectFolderPath) {
      refreshFiles()
    } else {
      setFiles([])
    }
  }, [projectFolderPath, refreshFiles])

  // 监听文件保存事件，自动刷新文件列表
  useEffect(() => {
    const handleFileSaved = () => {
      if (projectFolderPath) {
        refreshFiles()
      }
    }
    window.addEventListener('project-file-saved', handleFileSaved)
    return () => window.removeEventListener('project-file-saved', handleFileSaved)
  }, [projectFolderPath, refreshFiles])

  return {
    files,
    loading,
    error,
    projectFolderPath,
    hasProjectFolder: !!projectFolderPath,
    refreshFiles,
    saveFile,
    deleteFile,
    openFile,
    openFolder,
    readFile,
    selectFolder
  }
}

export default useProjectFolder
