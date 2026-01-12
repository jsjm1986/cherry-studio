import { useTheme } from '@renderer/context/ThemeProvider'
import type { InfoFolder, InfoItem } from '@renderer/types'
import { Input, Modal, Typography } from 'antd'
import { ChevronLeft, ChevronRight, FileText, Pencil, Trash2, X } from 'lucide-react'
import type { FC } from 'react'
import { useCallback, useState } from 'react'
import styled from 'styled-components'

import { useInfoLibrary } from '../hooks/useInfoLibrary'

const { Paragraph } = Typography
const { TextArea } = Input

const INFO_PANEL_EXPANDED_KEY = 'cherry-studio:info-panel-expanded'
const NARROW_WIDTH = 360
const WIDE_WIDTH = 520

const loadExpandedState = (): boolean => {
  const saved = localStorage.getItem(INFO_PANEL_EXPANDED_KEY)
  return saved === 'true'
}

const saveExpandedState = (expanded: boolean): void => {
  localStorage.setItem(INFO_PANEL_EXPANDED_KEY, String(expanded))
}

interface Props {
  folder: InfoFolder
  hostId: string
  onClose: () => void
}

const InfoFolderContentPanel: FC<Props> = ({ folder, hostId, onClose }) => {
  const { deleteItem, editItem } = useInfoLibrary(hostId)
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isExpanded, setIsExpanded] = useState(loadExpandedState)

  // 切换宽窄模式
  const handleToggleWidth = useCallback(() => {
    setIsExpanded((prev) => {
      const newState = !prev
      saveExpandedState(newState)
      return newState
    })
  }, [])

  const panelWidth = isExpanded ? WIDE_WIDTH : NARROW_WIDTH

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
    <PanelContainer style={{ width: panelWidth }} $isDark={isDark}>
      <ExpandToggle onClick={handleToggleWidth} $isDark={isDark} title={isExpanded ? '收窄' : '展开'}>
        {isExpanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </ExpandToggle>
      <PanelHeader $isDark={isDark}>
        <HeaderLeft>
          <FolderIcon $isDark={isDark}>{folder.emoji || '📁'}</FolderIcon>
          <HeaderInfo>
            <Title>{folder.name}</Title>
            <ItemCount>{folder.items.length} 条资料</ItemCount>
          </HeaderInfo>
        </HeaderLeft>
        <CloseButton onClick={onClose} $isDark={isDark}>
          <X size={16} />
        </CloseButton>
      </PanelHeader>

      <PanelContent>
        {folder.items.length === 0 ? (
          <EmptyState $isDark={isDark}>
            <EmptyIcon $isDark={isDark}>
              <FileText size={32} />
            </EmptyIcon>
            <EmptyText>暂无保存的内容</EmptyText>
            <EmptyHint>在对话中选择文本，点击"保存到资料库"即可添加</EmptyHint>
          </EmptyState>
        ) : (
          <ItemList>
            {folder.items.map((item, index) => (
              <ItemCard key={item.id} $isDark={isDark}>
                <ItemIndex $isDark={isDark}>{index + 1}</ItemIndex>
                {editingItemId === item.id ? (
                  <EditArea>
                    <StyledTextArea
                      $isDark={isDark}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={4}
                      autoFocus
                    />
                    <EditActions>
                      <CancelButton onClick={handleCancelEdit} $isDark={isDark}>
                        取消
                      </CancelButton>
                      <SaveButton onClick={() => handleSaveEdit(item)}>保存</SaveButton>
                    </EditActions>
                  </EditArea>
                ) : (
                  <ItemBody>
                    <ItemContent $isDark={isDark}>
                      <Paragraph
                        ellipsis={{ rows: 4, expandable: true, symbol: '展开' }}
                        style={{ margin: 0, color: 'inherit' }}>
                        {item.content}
                      </Paragraph>
                    </ItemContent>
                    <ItemFooter>
                      <ItemMeta $isDark={isDark}>{formatDate(item.createdAt)}</ItemMeta>
                      <ItemActions className="item-actions">
                        <ActionButton onClick={() => handleEdit(item)} title="编辑" $isDark={isDark}>
                          <Pencil size={13} />
                        </ActionButton>
                        <ActionButton onClick={() => handleDelete(item)} title="删除" $isDark={isDark} $danger>
                          <Trash2 size={13} />
                        </ActionButton>
                      </ItemActions>
                    </ItemFooter>
                  </ItemBody>
                )}
              </ItemCard>
            ))}
          </ItemList>
        )}
      </PanelContent>
    </PanelContainer>
  )
}

const PanelContainer = styled.div<{ $isDark: boolean }>`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${({ $isDark }) => ($isDark ? '#0f0f1a' : '#ffffff')};
  border-left: 1px solid ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb')};
  box-shadow: ${({ $isDark }) =>
    $isDark ? '-4px 0 24px rgba(0,0,0,0.3)' : '-4px 0 24px rgba(0,0,0,0.08)'};
  position: relative;
  transition: width 0.2s ease;
`

const ExpandToggle = styled.button<{ $isDark: boolean }>`
  position: absolute;
  right: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 48px;
  border: 1px solid ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb')};
  border-radius: 0 6px 6px 0;
  background: ${({ $isDark }) => ($isDark ? '#1a1a2e' : '#ffffff')};
  color: ${({ $isDark }) => ($isDark ? '#9ca3af' : '#6b7280')};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.15s ease;
  box-shadow: ${({ $isDark }) =>
    $isDark ? '2px 0 8px rgba(0,0,0,0.3)' : '2px 0 8px rgba(0,0,0,0.06)'};

  &:hover {
    background: ${({ $isDark }) => ($isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)')};
    color: #3b82f6;
    border-color: ${({ $isDark }) => ($isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.3)')};
  }
`

const PanelHeader = styled.div<{ $isDark: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.02)' : '#fafafa')};
  border-bottom: 1px solid ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb')};
`

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const FolderIcon = styled.div<{ $isDark: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${({ $isDark }) =>
    $isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
`

const HeaderInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const Title = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
`

const ItemCount = styled.div`
  font-size: 12px;
  color: var(--color-text-secondary);
`

const CloseButton = styled.button<{ $isDark: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: ${({ $isDark }) => ($isDark ? '#9ca3af' : '#6b7280')};
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6')};
    color: ${({ $isDark }) => ($isDark ? '#ffffff' : '#1f2937')};
  }
`

const PanelContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--color-text-secondary);
  }
`

const EmptyState = styled.div<{ $isDark: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px 20px;
  text-align: center;
`

const EmptyIcon = styled.div<{ $isDark: boolean }>`
  width: 72px;
  height: 72px;
  border-radius: 18px;
  background: ${({ $isDark }) =>
    $isDark ? 'rgba(255,255,255,0.03)' : '#f3f4f6'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $isDark }) => ($isDark ? '#4b5563' : '#9ca3af')};
  margin-bottom: 16px;
`

const EmptyText = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
`

const EmptyHint = styled.div`
  font-size: 12px;
  color: var(--color-text-tertiary);
  max-width: 200px;
  line-height: 1.5;
`

const ItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const ItemCard = styled.div<{ $isDark: boolean }>`
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  background: ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.02)' : '#fafafa')};
  border: 1px solid ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.04)' : '#e5e7eb')};
  border-radius: 12px;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6')};
    border-color: ${({ $isDark }) => ($isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)')};
    box-shadow: ${({ $isDark }) =>
      $isDark ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.05)'};

    .item-actions {
      opacity: 1;
    }
  }
`

const ItemIndex = styled.div<{ $isDark: boolean }>`
  width: 24px;
  height: 24px;
  min-width: 24px;
  border-radius: 6px;
  background: ${({ $isDark }) =>
    $isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)'};
  color: #3b82f6;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
`

const ItemBody = styled.div`
  flex: 1;
  min-width: 0;
`

const ItemContent = styled.div<{ $isDark: boolean }>`
  font-size: 13px;
  color: ${({ $isDark }) => ($isDark ? '#e5e7eb' : '#374151')};
  line-height: 1.6;
  margin-bottom: 10px;

  .ant-typography {
    color: inherit !important;
  }
`

const ItemFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const ItemMeta = styled.span<{ $isDark: boolean }>`
  font-size: 11px;
  color: ${({ $isDark }) => ($isDark ? '#6b7280' : '#9ca3af')};
`

const ItemActions = styled.div`
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s ease;
`

const ActionButton = styled.button<{ $isDark: boolean; $danger?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: ${({ $isDark }) => ($isDark ? '#9ca3af' : '#6b7280')};
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $isDark, $danger }) =>
      $danger
        ? 'rgba(239, 68, 68, 0.1)'
        : $isDark
          ? 'rgba(59, 130, 246, 0.15)'
          : 'rgba(59, 130, 246, 0.08)'};
    color: ${({ $danger }) => ($danger ? '#ef4444' : '#3b82f6')};
  }
`

const EditArea = styled.div`
  flex: 1;
  min-width: 0;
`

const StyledTextArea = styled(TextArea)<{ $isDark: boolean }>`
  background: ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.05)' : '#ffffff')} !important;
  border-color: ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb')} !important;
  color: ${({ $isDark }) => ($isDark ? '#ffffff' : '#1f2937')} !important;
  border-radius: 8px !important;
  font-size: 13px !important;

  &:focus {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15) !important;
  }
`

const EditActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
`

const CancelButton = styled.button<{ $isDark: boolean }>`
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb')};
  border-radius: 6px;
  background: transparent;
  color: ${({ $isDark }) => ($isDark ? '#9ca3af' : '#6b7280')};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6')};
  }
`

const SaveButton = styled.button`
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  background: #3b82f6;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: #2563eb;
  }
`

export default InfoFolderContentPanel
