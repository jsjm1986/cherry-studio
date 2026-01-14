import ProjectFileEditPopup from '@renderer/components/Popups/ProjectFileEditPopup'
import { useTheme } from '@renderer/context/ThemeProvider'
import { useAppDispatch } from '@renderer/store'
import { removeNotebookItem, updateNotebookItem } from '@renderer/store/assistants'
import type { Host, NotebookItem } from '@renderer/types'
import { formatFileSize } from '@renderer/utils'
import { exportRoomToProjectFolder } from '@renderer/utils/export'
import { Button, Empty, Modal, Tabs, Tooltip } from 'antd'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  File,
  FileText,
  Folder,
  FolderOpen,
  RefreshCw,
  Trash2
} from 'lucide-react'
import type { FC } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { useProjectFolder } from '../hooks/useProjectFolder'

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
  onUpdateHost?: (hostId: string, data: Partial<Host>) => void
}

const NotebookPanel: FC<Props> = ({ host, collapsed, onToggleCollapse, onUpdateHost }) => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [editingItem, setEditingItem] = useState<NotebookItem | null>(null)
  const [editContent, setEditContent] = useState('')
  const [width, setWidth] = useState(loadSavedWidth)
  const [isResizing, setIsResizing] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const notebook = host?.notebook || []

  // 项目文件夹 Hook
  const { files, hasProjectFolder, projectFolderPath, refreshFiles, openFolder } =
    useProjectFolder(host)

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

  // 选择文件夹
  const handleSelectFolder = useCallback(async () => {
    const path = await window.api.file.selectFolder()
    if (path && host && onUpdateHost) {
      onUpdateHost(host.id, { projectFolderPath: path })
    }
  }, [host, onUpdateHost])

  // 导出所有对话到项目文件夹
  const handleExportToFolder = useCallback(async () => {
    if (!host || !host.projectFolderPath) return
    await exportRoomToProjectFolder(host)
    refreshFiles()
  }, [host, refreshFiles])

  // 打开文件编辑弹窗
  const handleOpenFile = useCallback(
    async (filePath: string, fileName: string) => {
      const saved = await ProjectFileEditPopup.show({ filePath, fileName })
      if (saved) {
        refreshFiles()
      }
    },
    [refreshFiles]
  )

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
  const renderNotebookItem = (item: NotebookItem) => {
    const isEditing = editingItem?.id === item.id

    if (isEditing) {
      return (
        <NoteCard key={item.id} $editing $color={item.color}>
          <NoteDate>{formatDate(item.createdAt)}</NoteDate>
          <EditTextArea
            $color={item.color}
            value={editContent}
            onChange={(e) => {
              setEditContent(e.target.value)
              // 自适应高度
              e.target.style.height = 'auto'
              e.target.style.height = e.target.scrollHeight + 'px'
            }}
            autoFocus
            ref={(el) => {
              if (el) {
                el.style.height = 'auto'
                el.style.height = el.scrollHeight + 'px'
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') handleCancelEdit()
              if (e.key === 'Enter' && e.metaKey) handleSaveEdit()
            }}
          />
          <EditActions>
            <EditButton onClick={handleCancelEdit}>{t('common.cancel')}</EditButton>
            <EditButton $primary onClick={handleSaveEdit}>
              {t('common.save')}
            </EditButton>
          </EditActions>
        </NoteCard>
      )
    }

    return (
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
  }

  // 折叠状态
  if (collapsed) {
    return (
      <CollapsedPanel $isDark={isDark}>
        <CollapseButton onClick={onToggleCollapse}>
          <ChevronLeft size={16} />
        </CollapseButton>
      </CollapsedPanel>
    )
  }

  const tabItems = [
    // Info 标签 - 暂时隐藏，后续开发
    // {
    //   key: 'info',
    //   label: (
    //     <TabLabel>
    //       <Info size={14} />
    //       <span>Info</span>
    //     </TabLabel>
    //   ),
    //   children: (
    //     <TabContent>
    //       <PlaceholderText>{t('notebook.info.placeholder', { defaultValue: '待开发' })}</PlaceholderText>
    //     </TabContent>
    //   )
    // },
    {
      key: 'notebook',
      label: (
        <TabLabel>
          <FileText size={14} />
          <span>摘录</span>
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
    },
    {
      key: 'files',
      label: (
        <TabLabel>
          <Folder size={14} />
          <span>{t('hosts.project.files')}</span>
        </TabLabel>
      ),
      children: (
        <TabContent>
          {!hasProjectFolder ? (
            <EmptyContainer>
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('hosts.project.folder_empty')} />
              <Button type="primary" onClick={handleSelectFolder} icon={<Folder size={14} />}>
                {t('hosts.project.select_folder')}
              </Button>
            </EmptyContainer>
          ) : (
            <FilesQuickView>
              <FilesHeader>
                <FolderPath title={projectFolderPath}>
                  <FolderOpen size={14} />
                  <span>{projectFolderPath}</span>
                </FolderPath>
                <HeaderActions>
                  <Tooltip title={t('hosts.export.sync_all')}>
                    <SmallActionButton onClick={handleExportToFolder}>
                      <Download size={14} />
                    </SmallActionButton>
                  </Tooltip>
                  <Tooltip title={t('hosts.project.refresh')}>
                    <SmallActionButton onClick={refreshFiles}>
                      <RefreshCw size={14} />
                    </SmallActionButton>
                  </Tooltip>
                  <Tooltip title={t('hosts.project.open_folder')}>
                    <SmallActionButton onClick={openFolder}>
                      <FolderOpen size={14} />
                    </SmallActionButton>
                  </Tooltip>
                </HeaderActions>
              </FilesHeader>

              {files.length === 0 ? (
                <EmptyFiles>
                  <File size={32} />
                  <span>{t('files.empty', { defaultValue: '暂无文件' })}</span>
                </EmptyFiles>
              ) : (
                <FilesList>
                  {files.map((file) => (
                    <FileItem key={file.path} onClick={() => handleOpenFile(file.path, file.name)}>
                      <FileIcon>
                        <File size={16} />
                      </FileIcon>
                      <FileInfo>
                        <FileName title={file.name}>{file.name}</FileName>
                        <FileMeta>
                          {new Date(file.modifiedAt).toLocaleDateString('zh-CN')}
                          {file.size > 0 && ` · ${formatFileSize(file.size)}`}
                        </FileMeta>
                      </FileInfo>
                    </FileItem>
                  ))}
                </FilesList>
              )}
            </FilesQuickView>
          )}
        </TabContent>
      )
    }
  ]

  return (
    <PanelContainer ref={panelRef} style={{ width }} $isResizing={isResizing} $isDark={isDark}>
      <ResizeHandle onMouseDown={handleMouseDown} $isResizing={isResizing} />
      <PanelHeader>
        <CollapseButton onClick={onToggleCollapse}>
          <ChevronRight size={16} />
        </CollapseButton>
      </PanelHeader>
      <Tabs items={tabItems} defaultActiveKey="notebook" size="small" />
    </PanelContainer>
  )
}

const PanelContainer = styled.div<{ $isResizing: boolean; $isDark: boolean }>`
  height: 100%;
  background: ${({ $isDark }) => ($isDark ? '#0f0f1a' : '#ffffff')};
  border-radius: 12px;
  box-shadow: ${({ $isDark }) =>
    $isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)'};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  user-select: ${(props) => (props.$isResizing ? 'none' : 'auto')};

  /* 主题变量 - 供子组件使用 */
  --panel-bg: ${({ $isDark }) => ($isDark ? '#0f0f1a' : '#ffffff')};
  --panel-bg-hover: ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb')};
  --panel-bg-soft: ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6')};
  --panel-border: ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0')};
  --panel-text: ${({ $isDark }) => ($isDark ? '#ffffff' : '#1f2937')};
  --panel-text-secondary: ${({ $isDark }) => ($isDark ? '#9ca3af' : '#6b7280')};
  --panel-text-muted: ${({ $isDark }) => ($isDark ? '#6b7280' : '#9ca3af')};
  --panel-primary: #3b82f6;
  --panel-primary-soft: ${({ $isDark }) => ($isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)')};

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
  background: ${(props) => (props.$isResizing ? 'var(--panel-primary)' : 'transparent')};
  transition: background 0.15s ease;
  z-index: 10;

  &:hover {
    background: var(--panel-primary);
  }
`

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 8px 12px;
`

const CollapseButton = styled.button`
  width: 26px;
  height: 26px;
  border: none;
  background: transparent;
  color: var(--panel-text-secondary);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &:hover {
    background: var(--panel-bg-soft);
    color: var(--panel-primary);
  }
`

const CollapsedPanel = styled.div<{ $isDark: boolean }>`
  width: 32px;
  min-width: 32px;
  height: 100%;
  background: ${({ $isDark }) => ($isDark ? '#0f0f1a' : '#ffffff')};
  border-radius: 12px;
  box-shadow: ${({ $isDark }) =>
    $isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)'};
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 12px;

  /* 主题变量 */
  --panel-bg-soft: ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6')};
  --panel-text-secondary: ${({ $isDark }) => ($isDark ? '#9ca3af' : '#6b7280')};
  --panel-primary: #3b82f6;
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

const NoteList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const NoteCard = styled.div<{ $editing?: boolean; $color?: string }>`
  background: var(--panel-bg-hover);
  border-radius: 10px;
  padding: 14px;
  position: relative;
  overflow: hidden;
  border: 1px solid ${(props) => (props.$editing ? (props.$color || 'var(--color-primary)') : 'var(--panel-border)')};
  transition: all 0.15s ease;

  &:hover {
    border-color: ${(props) => (props.$editing ? (props.$color || 'var(--color-primary)') : 'rgba(59, 130, 246, 0.2)')};
    .note-actions {
      opacity: 1;
    }
  }
`

const EditTextArea = styled.textarea<{ $color?: string }>`
  width: 100%;
  padding: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: ${(props) => props.$color || 'var(--panel-text)'};
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 6px;
  resize: none;
  outline: none;
  font-family: inherit;
  overflow: hidden;

  &:focus {
    border-color: ${(props) => props.$color || 'var(--color-primary)'};
  }
`

const EditActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
`

const EditButton = styled.button<{ $primary?: boolean }>`
  padding: 6px 14px;
  font-size: 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  background: ${(props) => (props.$primary ? 'var(--color-primary)' : 'var(--panel-bg-soft)')};
  color: ${(props) => (props.$primary ? '#fff' : 'var(--panel-text-secondary)')};

  &:hover {
    opacity: 0.9;
  }
`

const NoteDate = styled.div`
  font-size: 11px;
  color: var(--panel-text-muted);
  margin-bottom: 8px;
`

const NoteContent = styled.div<{ $color?: string }>`
  font-size: 13px;
  color: ${(props) => props.$color || 'var(--panel-text)'};
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
`

const NoteSource = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 10px;
  font-size: 11px;
  color: var(--panel-primary);
  opacity: 0.8;
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
  background: var(--panel-bg);
  color: var(--panel-text-secondary);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &:hover {
    background: var(--panel-primary-soft);
    color: var(--panel-primary);
  }
`

// 项目文件相关样式
const FilesHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--panel-border);
`

const FolderPath = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--panel-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  margin-right: 8px;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
  }
`

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`

const SmallActionButton = styled.button`
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--panel-text-secondary);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &:hover {
    background: var(--panel-primary-soft);
    color: var(--panel-primary);
  }
`

const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 30px 20px;
`

const FilesQuickView = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`

const EmptyFiles = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  color: var(--panel-text-muted);
  font-size: 13px;
`

const FilesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  overflow-y: auto;
`

const FileItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: var(--panel-bg-soft);
  }
`

const FileIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: var(--panel-primary-soft);
  color: var(--panel-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`

const FileInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const FileName = styled.div`
  font-size: 13px;
  color: var(--panel-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const FileMeta = styled.div`
  font-size: 11px;
  color: var(--panel-text-muted);
`

export default NotebookPanel
