import { useAppDispatch, useAppSelector } from '@renderer/store'
import {
  addInfoFolder,
  addInfoItem,
  removeInfoFolder,
  removeInfoItem,
  selectInfoFoldersByHostId,
  updateInfoFolder,
  updateInfoItem
} from '@renderer/store/assistants'
import type { InfoFolder, InfoItem } from '@renderer/types'
import { useCallback, useMemo } from 'react'
import { v4 as uuid } from 'uuid'

/**
 * 资料库 Hook - 管理主机的资料文件夹和内容
 */
export function useInfoLibrary(hostId: string) {
  const dispatch = useAppDispatch()
  const selectFolders = useMemo(() => selectInfoFoldersByHostId(hostId), [hostId])
  const folders = useAppSelector(selectFolders)

  /** 创建文件夹 */
  const createFolder = useCallback(
    (data: { name: string; emoji?: string }) => {
      const folder: InfoFolder = {
        id: uuid(),
        hostId,
        name: data.name,
        emoji: data.emoji || '📁',
        items: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      dispatch(addInfoFolder({ hostId, folder }))
      return folder
    },
    [dispatch, hostId]
  )

  /** 删除文件夹 */
  const deleteFolder = useCallback(
    (folderId: string) => {
      dispatch(removeInfoFolder({ hostId, folderId }))
    },
    [dispatch, hostId]
  )

  /** 重命名文件夹 */
  const renameFolder = useCallback(
    (folderId: string, name: string) => {
      const folder = folders.find((f) => f.id === folderId)
      if (folder) {
        dispatch(
          updateInfoFolder({
            hostId,
            folder: { ...folder, items: [...folder.items], name, updatedAt: Date.now() }
          })
        )
      }
    },
    [dispatch, hostId, folders]
  )

  /** 保存内容到文件夹 */
  const saveItem = useCallback(
    (
      folderId: string,
      data: {
        content: string
        sourceMessageId?: string
        sourceTopicId?: string
      }
    ) => {
      const item: InfoItem = {
        id: uuid(),
        folderId,
        content: data.content,
        sourceMessageId: data.sourceMessageId,
        sourceTopicId: data.sourceTopicId,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      dispatch(addInfoItem({ hostId, folderId, item }))
      return item
    },
    [dispatch, hostId]
  )

  /** 删除内容 */
  const deleteItem = useCallback(
    (folderId: string, itemId: string) => {
      dispatch(removeInfoItem({ hostId, folderId, itemId }))
    },
    [dispatch, hostId]
  )

  /** 更新内容 */
  const editItem = useCallback(
    (folderId: string, item: InfoItem) => {
      dispatch(updateInfoItem({ hostId, folderId, item: { ...item, updatedAt: Date.now() } }))
    },
    [dispatch, hostId]
  )

  return {
    folders,
    createFolder,
    deleteFolder,
    renameFolder,
    saveItem,
    deleteItem,
    editItem
  }
}
