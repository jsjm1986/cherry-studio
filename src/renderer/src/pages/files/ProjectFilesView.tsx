import { useTheme } from '@renderer/context/ThemeProvider'
import type { Host, ProjectFile } from '@renderer/types'
import { Button, Empty, Popconfirm, Spin, Tooltip } from 'antd'
import {
  ChevronDown,
  ChevronRight,
  File,
  Folder,
  FolderOpen,
  RefreshCw,
  Trash2
} from 'lucide-react'
import type { FC } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { useHosts } from '../hosts/hooks/useHosts'
import { useProjectFolder } from '../hosts/hooks/useProjectFolder'

interface HostFilesProps {
  host: Host
  isExpanded: boolean
  onToggle: () => void
}

const HostFiles: FC<HostFilesProps> = ({ host, isExpanded, onToggle }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const { files, loading, hasProjectFolder, refreshFiles, deleteFile, openFile, openFolder } =
    useProjectFolder(host)

  // 格式化文件日期
  const formatFileDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 格式化文件大小
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (!hasProjectFolder) {
    return null
  }

  return (
    <HostSection $isDark={isDark}>
      <HostHeader onClick={onToggle}>
        <ExpandIcon>
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </ExpandIcon>
        <HostEmoji>{host.emoji || '🏠'}</HostEmoji>
        <HostName>{host.name}</HostName>
        <FileCount>{files.length} {t('files.project.files_count')}</FileCount>
        <HeaderActions onClick={(e) => e.stopPropagation()}>
          <Tooltip title={t('hosts.project.refresh')}>
            <ActionButton onClick={refreshFiles}>
              <RefreshCw size={14} />
            </ActionButton>
          </Tooltip>
          <Tooltip title={t('hosts.project.open_folder')}>
            <ActionButton onClick={openFolder}>
              <FolderOpen size={14} />
            </ActionButton>
          </Tooltip>
        </HeaderActions>
      </HostHeader>

      {isExpanded && (
        <HostContent>
          {loading ? (
            <LoadingContainer>
              <Spin size="small" />
            </LoadingContainer>
          ) : files.length === 0 ? (
            <EmptyFiles>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('hosts.project.no_files')}
              />
            </EmptyFiles>
          ) : (
            <FilesList>
              {files.map((file: ProjectFile) => (
                <FileItem key={file.path} $isDark={isDark}>
                  <FileIcon>
                    <File size={14} />
                  </FileIcon>
                  <FileInfo onClick={() => openFile(file.path)}>
                    <FileName title={file.name}>{file.name}</FileName>
                  </FileInfo>
                  <FileMeta>
                    <FileDate>{formatFileDate(file.modifiedAt)}</FileDate>
                    <FileSize>{formatSize(file.size)}</FileSize>
                  </FileMeta>
                  <FileActions>
                    <Popconfirm
                      title={t('files.delete.title')}
                      onConfirm={() => deleteFile(file.path)}
                      okText={t('common.confirm')}
                      cancelText={t('common.cancel')}
                      okButtonProps={{ danger: true }}>
                      <DeleteBtn>
                        <Trash2 size={14} />
                      </DeleteBtn>
                    </Popconfirm>
                  </FileActions>
                </FileItem>
              ))}
            </FilesList>
          )}
        </HostContent>
      )}
    </HostSection>
  )
}

const ProjectFilesView: FC = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const navigate = useNavigate()

  const { hosts } = useHosts()
  const [expandedHosts, setExpandedHosts] = useState<Set<string>>(new Set())

  // 过滤出有项目文件夹的主机
  const hostsWithProjectFolder = hosts.filter((host) => host.projectFolderPath)

  // 默认展开所有有项目文件夹的主机
  useEffect(() => {
    if (hostsWithProjectFolder.length > 0 && expandedHosts.size === 0) {
      setExpandedHosts(new Set(hostsWithProjectFolder.map((h) => h.id)))
    }
  }, [hostsWithProjectFolder.length])

  const toggleHost = useCallback((hostId: string) => {
    setExpandedHosts((prev) => {
      const next = new Set(prev)
      if (next.has(hostId)) {
        next.delete(hostId)
      } else {
        next.add(hostId)
      }
      return next
    })
  }, [])

  const handleGoToHosts = useCallback(() => {
    navigate('/hosts')
  }, [navigate])

  if (hostsWithProjectFolder.length === 0) {
    return (
      <EmptyContainer $isDark={isDark}>
        <EmptyIcon>
          <Folder size={48} />
        </EmptyIcon>
        <EmptyTitle>{t('files.project.empty_title')}</EmptyTitle>
        <EmptyDesc>{t('files.project.empty_desc')}</EmptyDesc>
        <Button type="primary" onClick={handleGoToHosts}>
          {t('files.project.go_to_hosts')}
        </Button>
      </EmptyContainer>
    )
  }

  return (
    <Container $isDark={isDark}>
      <ViewHeader $isDark={isDark}>
        <ViewTitle>
          <Folder size={18} />
          <span>{t('files.project.title')}</span>
        </ViewTitle>
        <ViewDesc>
          {hostsWithProjectFolder.length} {t('files.project.hosts_count')}
        </ViewDesc>
      </ViewHeader>

      <HostsList>
        {hostsWithProjectFolder.map((host) => (
          <HostFiles
            key={host.id}
            host={host}
            isExpanded={expandedHosts.has(host.id)}
            onToggle={() => toggleHost(host.id)}
          />
        ))}
      </HostsList>
    </Container>
  )
}

const Container = styled.div<{ $isDark: boolean }>`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
`

const ViewHeader = styled.div<{ $isDark: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 0.5px solid var(--color-border);
  background: ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.02)' : '#fafafa')};
`

const ViewTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
`

const ViewDesc = styled.div`
  font-size: 13px;
  color: var(--color-text-secondary);
`

const HostsList = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  padding: 8px;
`

const HostSection = styled.div<{ $isDark: boolean }>`
  margin-bottom: 8px;
  border-radius: 8px;
  border: 0.5px solid var(--color-border);
  overflow: hidden;
  background: ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.02)' : '#fff')};
`

const HostHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: var(--color-background-soft);
  }
`

const ExpandIcon = styled.div`
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
`

const HostEmoji = styled.span`
  font-size: 18px;
`

const HostName = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  flex: 1;
`

const FileCount = styled.span`
  font-size: 12px;
  color: var(--color-text-secondary);
  background: var(--color-background-soft);
  padding: 2px 8px;
  border-radius: 10px;
`

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s ease;

  ${HostHeader}:hover & {
    opacity: 1;
  }
`

const ActionButton = styled.button`
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &:hover {
    background: var(--color-primary-soft);
    color: var(--color-primary);
  }
`

const HostContent = styled.div`
  border-top: 0.5px solid var(--color-border);
`

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`

const EmptyFiles = styled.div`
  padding: 24px;
`

const FilesList = styled.div`
  display: flex;
  flex-direction: column;
`

const FileItem = styled.div<{ $isDark: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px 10px 36px;
  border-bottom: 0.5px solid var(--color-border);
  transition: background 0.15s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb')};
  }
`

const FileIcon = styled.div`
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
`

const FileInfo = styled.div`
  flex: 1;
  cursor: pointer;
  min-width: 0;

  &:hover {
    color: var(--color-primary);
  }
`

const FileName = styled.span`
  font-size: 13px;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;

  ${FileInfo}:hover & {
    color: var(--color-primary);
  }
`

const FileMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const FileDate = styled.span`
  font-size: 12px;
  color: var(--color-text-secondary);
`

const FileSize = styled.span`
  font-size: 12px;
  color: var(--color-text-secondary);
  min-width: 60px;
`

const FileActions = styled.div`
  display: flex;
  align-items: center;
  opacity: 0;
  transition: opacity 0.15s ease;

  ${FileItem}:hover & {
    opacity: 1;
  }
`

const DeleteBtn = styled.button`
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }
`

const EmptyContainer = styled.div<{ $isDark: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 16px;
  padding: 40px;
`

const EmptyIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: var(--color-background-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
`

const EmptyTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
`

const EmptyDesc = styled.div`
  font-size: 13px;
  color: var(--color-text-secondary);
  text-align: center;
  max-width: 280px;
`

export default ProjectFilesView
