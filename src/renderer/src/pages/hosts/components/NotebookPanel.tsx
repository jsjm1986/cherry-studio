import { useAppDispatch } from '@renderer/store'
import { removeNotebookItem, updateNotebookItem } from '@renderer/store/assistants'
import type { Host, NotebookItem } from '@renderer/types'
import { Empty, Input, Modal, Tabs, Tooltip } from 'antd'
import { ChevronLeft, ChevronRight, Edit3, FileText, Info, Trash2 } from 'lucide-react'
import type { FC } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

const NOTEBOOK_WIDTH_KEY = 'cherry-studio:notebook-width'
const DEFAULT_WIDTH = 280
const MIN_WIDTH = 200
const MAX_WIDTH = 500

const loadSavedWidth = (): number => {
  const saved = localStorage.getItem(NOTEBOOK_WIDTH_KEY)
  if (saved) {
    const width = parseInt(saved, 10)
    if (!isNaN(width) && width >= MIN_WIDTH && width <= MAX_WIDTH) {
      return width
    }
  }
  return DEFAULT_WIDTH
}

const saveWidth = (width: number): void => {
  localStorage.setItem(NOTEBOOK_WIDTH_KEY, String(width))
}

interface Props {
  host: Host | null
  collapsed: boolean
  onToggleCollapse: () => void
}

const NotebookPanel: FC<Props> = ({ host, collapsed, onToggleCollapse }) => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [editingItem, setEditingItem] = useState<NotebookItem | null>(null)
  const [editContent, setEditContent] = useState('')
  const [width, setWidth] = useState(loadSavedWidth)
  const [isResizing, setIsResizing] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const notebook = host?.notebook || []

  // 拖拽调整宽度
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!panelRef.current) return
      const containerRect = panelRef.current.parentElement?.getBoundingClientRect()
      if (!containerRect) return

      // 计算新宽度（从右边界到鼠标位置）
      const newWidth = containerRect.right - e.clientX
      const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth))
      setWidth(clampedWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      saveWidth(width)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, width])

  // 删除笔记
  const handleDelete = useCallback(
    (itemId: string) => {
      if (!host) return
      Modal.confirm({
        title: t('notebook.delete.title', { defaultValue: '删除笔记' }),
        content: t('notebook.delete.confirm', { defaultValue: '确定要删除这条笔记吗？' }),
        okButtonProps: { danger: true },
        onOk: () => {
          dispatch(removeNotebookItem({ hostId: host.id, itemId }))
        }
      })
    },
    [host, dispatch, t]
  )

  // 开始编辑
  const handleStartEdit = useCallback((item: NotebookItem) => {
    setEditingItem(item)
    setEditContent(item.content)
  }, [])

  // 保存编辑
  const handleSaveEdit = useCallback(() => {
    if (!host || !editingItem) return
    dispatch(
      updateNotebookItem({
        hostId: host.id,
        item: {
          ...editingItem,
          content: editContent,
          updatedAt: Date.now()
        }
      })
    )
    setEditingItem(null)
    setEditContent('')
  }, [host, editingItem, editContent, dispatch])

  // 取消编辑
  const handleCancelEdit = useCallback(() => {
    setEditingItem(null)
    setEditContent('')
  }, [])

  // 格式化日期
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // 渲染笔记卡片
  const renderNotebookItem = (item: NotebookItem) => (
    <NoteCard key={item.id}>
      <NoteDate>{formatDate(item.createdAt)}</NoteDate>
      <NoteContent $color={item.color}>{item.content}</NoteContent>
      {item.sourceTopicName && (
        <NoteSource>
          <FileText size={12} />
          <span>{item.sourceTopicName}</span>
          {item.sourceExpertName && <span> · {item.sourceExpertName}</span>}
        </NoteSource>
      )}
      <NoteActions>
        <Tooltip title={t('common.edit')}>
          <ActionButton onClick={() => handleStartEdit(item)}>
            <Edit3 size={14} />
          </ActionButton>
        </Tooltip>
        <Tooltip title={t('common.delete')}>
          <ActionButton onClick={() => handleDelete(item.id)}>
            <Trash2 size={14} />
          </ActionButton>
        </Tooltip>
      </NoteActions>
    </NoteCard>
  )

  // 折叠状态
  if (collapsed) {
    return (
      <CollapsedPanel>
        <CollapseButton onClick={onToggleCollapse}>
          <ChevronLeft size={16} />
        </CollapseButton>
      </CollapsedPanel>
    )
  }

  const tabItems = [
    {
      key: 'info',
      label: (
        <TabLabel>
          <Info size={14} />
          <span>Info</span>
        </TabLabel>
      ),
      children: (
        <TabContent>
          <PlaceholderText>{t('notebook.info.placeholder', { defaultValue: '待开发' })}</PlaceholderText>
        </TabContent>
      )
    },
    {
      key: 'notebook',
      label: (
        <TabLabel>
          <FileText size={14} />
          <span>Notebook</span>
        </TabLabel>
      ),
      children: (
        <TabContent>
          {notebook.length === 0 ? (
            <Empty
              description={t('notebook.empty', { defaultValue: '暂无笔记' })}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <NoteList>{notebook.map(renderNotebookItem)}</NoteList>
          )}
        </TabContent>
      )
    }
  ]

  return (
    <PanelContainer ref={panelRef} style={{ width }} $isResizing={isResizing}>
      <ResizeHandle onMouseDown={handleMouseDown} $isResizing={isResizing} />
      <PanelHeader>
        <CollapseButton onClick={onToggleCollapse}>
          <ChevronRight size={16} />
        </CollapseButton>
      </PanelHeader>
      <Tabs items={tabItems} defaultActiveKey="notebook" size="small" />

      {/* 编辑弹窗 */}
      <Modal
        title={t('notebook.edit.title', { defaultValue: '编辑笔记' })}
        open={!!editingItem}
        onOk={handleSaveEdit}
        onCancel={handleCancelEdit}
        okText={t('common.save')}
        cancelText={t('common.cancel')}>
        <Input.TextArea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={6}
          placeholder={t('notebook.edit.placeholder', { defaultValue: '输入笔记内容...' })}
        />
      </Modal>
    </PanelContainer>
  )
}

const PanelContainer = styled.div<{ $isResizing: boolean }>`
  height: 100%;
  background: var(--color-background);
  border-left: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  user-select: ${(props) => (props.$isResizing ? 'none' : 'auto')};

  .ant-tabs {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .ant-tabs-nav {
    margin: 0;
    padding: 0 12px;
  }

  .ant-tabs-content-holder {
    flex: 1;
    overflow: hidden;
  }

  .ant-tabs-content {
    height: 100%;
  }

  .ant-tabs-tabpane {
    height: 100%;
  }
`

const ResizeHandle = styled.div<{ $isResizing: boolean }>`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: col-resize;
  background: ${(props) => (props.$isResizing ? 'var(--color-primary)' : 'transparent')};
  transition: background 0.15s ease;
  z-index: 10;

  &:hover {
    background: var(--color-primary);
  }
`

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 8px 12px;
`

const CollapseButton = styled.button`
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-background-soft);
    color: var(--color-text);
  }
`

const CollapsedPanel = styled.div`
  width: 32px;
  min-width: 32px;
  height: 100%;
  background: var(--color-background);
  border-left: 1px solid var(--color-border);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 12px;
`

const TabLabel = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
`

const TabContent = styled.div`
  height: 100%;
  overflow-y: auto;
  padding: 12px;
`

const PlaceholderText = styled.div`
  color: var(--color-text-tertiary);
  text-align: center;
  padding: 40px 20px;
  font-size: 14px;
`

const NoteList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const NoteCard = styled.div`
  background: var(--color-background-soft);
  border-radius: 8px;
  padding: 12px;
  position: relative;
  overflow: hidden;

  &:hover {
    .note-actions {
      opacity: 1;
    }
  }
`

const NoteDate = styled.div`
  font-size: 11px;
  color: var(--color-text-tertiary);
  margin-bottom: 8px;
`

const NoteContent = styled.div<{ $color?: string }>`
  font-size: 13px;
  color: var(--color-text);
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  background: ${(props) => (props.$color ? `${props.$color}20` : 'transparent')};
  padding: ${(props) => (props.$color ? '4px 6px' : '0')};
  border-radius: 4px;
  border-bottom: 2px solid ${(props) => props.$color || 'transparent'};
`

const NoteSource = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 11px;
  color: var(--color-text-tertiary);
`

const NoteActions = styled.div.attrs({ className: 'note-actions' })`
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
`

const ActionButton = styled.button`
  width: 24px;
  height: 24px;
  border: none;
  background: var(--color-background);
  color: var(--color-text-secondary);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-background-mute);
    color: var(--color-text);
  }
`

export default NotebookPanel
