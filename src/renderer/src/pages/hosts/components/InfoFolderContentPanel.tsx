import type { InfoFolder, InfoItem } from '@renderer/types'
import { Button, Input, Modal, Typography } from 'antd'
import { Pencil, Trash2, X } from 'lucide-react'
import type { FC } from 'react'
import { useCallback, useState } from 'react'
import styled from 'styled-components'

import { useInfoLibrary } from '../hooks/useInfoLibrary'

const { Paragraph } = Typography
const { TextArea } = Input

interface Props {
  folder: InfoFolder
  hostId: string
  onClose: () => void
}

const InfoFolderContentPanel: FC<Props> = ({ folder, hostId, onClose }) => {
  const { deleteItem, editItem } = useInfoLibrary(hostId)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const handleEdit = useCallback((item: InfoItem) => {
    setEditingItemId(item.id)
    setEditContent(item.content)
  }, [])

  const handleCancelEdit = useCallback(() => {
    setEditingItemId(null)
    setEditContent('')
  }, [])

  const handleSaveEdit = useCallback(
    (item: InfoItem) => {
      if (!editContent.trim()) {
        window.toast?.warning?.('内容不能为空')
        return
      }
      editItem(folder.id, { ...item, content: editContent.trim() })
      window.toast?.success?.('保存成功')
      setEditingItemId(null)
      setEditContent('')
    },
    [editContent, editItem, folder.id]
  )

  const handleDelete = useCallback(
    (item: InfoItem) => {
      Modal.confirm({
        title: '删除内容',
        content: '确定要删除这条内容吗？删除后无法恢复。',
        okButtonProps: { danger: true },
        onOk: () => {
          deleteItem(folder.id, item.id)
          window.toast?.success?.('删除成功')
        }
      })
    },
    [deleteItem, folder.id]
  )

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const isCurrentYear = date.getFullYear() === now.getFullYear()
    return date.toLocaleString('zh-CN', {
      year: isCurrentYear ? undefined : 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <PanelContainer>
      <PanelHeader>
        <Title>
          {folder.emoji || '📁'} {folder.name}
        </Title>
        <CloseButton onClick={onClose}>
          <X size={16} />
        </CloseButton>
      </PanelHeader>
      <PanelContent>
        {folder.items.length === 0 ? (
          <EmptyState>暂无保存的内容</EmptyState>
        ) : (
          folder.items.map((item) => (
            <ItemCard key={item.id}>
              {editingItemId === item.id ? (
                <EditArea>
                  <TextArea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={4} autoFocus />
                  <EditActions>
                    <Button size="small" onClick={handleCancelEdit}>
                      取消
                    </Button>
                    <Button size="small" type="primary" onClick={() => handleSaveEdit(item)}>
                      保存
                    </Button>
                  </EditActions>
                </EditArea>
              ) : (
                <>
                  <ItemContent>
                    <Paragraph ellipsis={{ rows: 4, expandable: true, symbol: '展开' }} style={{ margin: 0 }}>
                      {item.content}
                    </Paragraph>
                  </ItemContent>
                  <ItemFooter>
                    <ItemMeta>{formatDate(item.createdAt)}</ItemMeta>
                    <ItemActions>
                      <ActionButton onClick={() => handleEdit(item)} title="编辑">
                        <Pencil size={14} />
                      </ActionButton>
                      <ActionButton onClick={() => handleDelete(item)} title="删除">
                        <Trash2 size={14} />
                      </ActionButton>
                    </ItemActions>
                  </ItemFooter>
                </>
              )}
            </ItemCard>
          ))
        )}
      </PanelContent>
    </PanelContainer>
  )
}

const PanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 320px;
  height: 100%;
  background: var(--color-background);
  border-left: 1px solid var(--color-border);
`

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
`

const Title = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
`

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: var(--color-text-secondary);

  &:hover {
    background: var(--color-background-mute);
    color: var(--color-text);
  }
`

const PanelContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 2px;
  }
`

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  font-size: 13px;
  color: var(--color-text-tertiary);
`

const ItemCard = styled.div`
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  margin-bottom: 12px;
  overflow: hidden;
`

const ItemContent = styled.div`
  padding: 12px;
  font-size: 13px;
  color: var(--color-text);
  line-height: 1.6;
`

const ItemFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-top: 1px solid var(--color-border);
  background: var(--color-background-mute);
`

const ItemMeta = styled.span`
  font-size: 11px;
  color: var(--color-text-tertiary);
`

const ItemActions = styled.div`
  display: flex;
  gap: 4px;
`

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: var(--color-text-secondary);

  &:hover {
    background: var(--color-background-soft);
    color: var(--color-text);
  }
`

const EditArea = styled.div`
  padding: 12px;
`

const EditActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
`

export default InfoFolderContentPanel
