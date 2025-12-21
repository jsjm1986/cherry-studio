/**
 * Information Library Types
 * 资料库类型定义 - 用于保存聊天内容到项目文件夹
 */

/** 资料文件夹 */
export interface InfoFolder {
  id: string
  name: string
  hostId: string
  emoji?: string
  items: InfoItem[]
  createdAt: number
  updatedAt: number
}

/** 资料项（保存的内容） */
export interface InfoItem {
  id: string
  folderId: string
  content: string
  sourceMessageId?: string
  sourceTopicId?: string
  createdAt: number
  updatedAt: number
}

/** 类型守卫 */
export const isInfoItem = (obj: unknown): obj is InfoItem => {
  if (typeof obj !== 'object' || obj === null) return false
  const item = obj as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    item.id.length > 0 &&
    typeof item.folderId === 'string' &&
    typeof item.content === 'string' &&
    typeof item.createdAt === 'number' &&
    typeof item.updatedAt === 'number'
  )
}

export const isInfoFolder = (obj: unknown): obj is InfoFolder => {
  if (typeof obj !== 'object' || obj === null) return false
  const folder = obj as Record<string, unknown>
  return (
    typeof folder.id === 'string' &&
    folder.id.length > 0 &&
    typeof folder.hostId === 'string' &&
    typeof folder.name === 'string' &&
    typeof folder.createdAt === 'number' &&
    typeof folder.updatedAt === 'number' &&
    Array.isArray(folder.items)
  )
}
