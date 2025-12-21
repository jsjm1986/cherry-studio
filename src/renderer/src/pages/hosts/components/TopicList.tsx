import 'dayjs/locale/zh-cn'

import type { Topic } from '@renderer/types'
import { Dropdown } from 'antd'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { ChevronDown, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import type { FC } from 'react'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

dayjs.extend(relativeTime)

interface Props {
  topics: Topic[]
  activeTopicId?: string
  onSelect: (topic: Topic) => void
  onAdd: () => void
  onDelete?: (topic: Topic) => void
  onRename?: (topic: Topic, newName: string) => void
  disabled?: boolean
}

const TopicList: FC<Props> = ({ topics, activeTopicId, onSelect, onAdd, onDelete, onRename, disabled }) => {
  const { t, i18n } = useTranslation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  // 设置 dayjs 语言
  dayjs.locale(i18n.language === 'zh-CN' ? 'zh-cn' : 'en')

  // 格式化时间
  const formatTime = useCallback((dateStr: string) => {
    const date = dayjs(dateStr)
    const now = dayjs()

    if (now.diff(date, 'day') < 1) {
      return date.fromNow()
    } else if (now.diff(date, 'day') < 7) {
      return date.format('ddd HH:mm')
    } else {
      return date.format('MM/DD')
    }
  }, [])

  // 获取话题显示名称
  const getTopicDisplayName = useCallback(
    (topic: Topic) => {
      if (topic.name) return topic.name
      return t('chat.default.topic.name')
    },
    [t]
  )

  // 开始编辑
  const handleStartEdit = useCallback(
    (topic: Topic, e: React.MouseEvent) => {
      e.stopPropagation()
      setEditingId(topic.id)
      setEditingName(getTopicDisplayName(topic))
    },
    [getTopicDisplayName]
  )

  // 保存编辑
  const handleSaveEdit = useCallback(() => {
    if (editingId && editingName.trim() && onRename) {
      const topic = topics.find((t) => t.id === editingId)
      if (topic) {
        onRename(topic, editingName.trim())
      }
    }
    setEditingId(null)
    setEditingName('')
  }, [editingId, editingName, topics, onRename])

  // 取消编辑
  const handleCancelEdit = useCallback(() => {
    setEditingId(null)
    setEditingName('')
  }, [])

  // 处理删除
  const handleDelete = useCallback(
    (topic: Topic, e: React.MouseEvent) => {
      e.stopPropagation()
      onDelete?.(topic)
    },
    [onDelete]
  )

  // 按更新时间排序（最新的在前）
  const sortedTopics = [...topics].sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  return (
    <Container>
      <Header onClick={() => !disabled && setIsCollapsed(!isCollapsed)}>
        <HeaderLeft>
          <CollapseIcon $collapsed={isCollapsed} $disabled={disabled}>
            <ChevronDown size={16} />
          </CollapseIcon>
          <Title $disabled={disabled}>{t('hosts.topics.title', { defaultValue: '对话记录' })}</Title>
          {topics.length > 0 && <Badge>{topics.length}</Badge>}
        </HeaderLeft>
        <HeaderActions>
          <AddButton
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation()
              onAdd()
            }}
            title={t('hosts.topics.add', { defaultValue: '新建对话' })}>
            <Plus size={14} />
          </AddButton>
        </HeaderActions>
      </Header>
      {!isCollapsed && (
        <List>
          {sortedTopics.length === 0 ? (
            <EmptyState $disabled={disabled}>
              {disabled ? t('hosts.select_hint') : t('hosts.topics.empty', { defaultValue: '暂无对话记录' })}
            </EmptyState>
          ) : (
            sortedTopics.map((topic) => (
              <TopicItem key={topic.id} $isActive={topic.id === activeTopicId} onClick={() => onSelect(topic)}>
                {editingId === topic.id ? (
                  <EditInput
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={handleSaveEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit()
                      if (e.key === 'Escape') handleCancelEdit()
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <TopicContent>
                      <TopicName>{getTopicDisplayName(topic)}</TopicName>
                      <TopicTime>{formatTime(topic.updatedAt)}</TopicTime>
                    </TopicContent>
                    <TopicActions className="topic-actions">
                      <Dropdown
                        menu={{
                          items: [
                            {
                              key: 'rename',
                              label: t('common.rename', { defaultValue: '重命名' }),
                              icon: <Pencil size={14} />,
                              onClick: (e) => handleStartEdit(topic, e.domEvent as React.MouseEvent)
                            },
                            {
                              key: 'delete',
                              label: t('common.delete'),
                              icon: <Trash2 size={14} />,
                              danger: true,
                              onClick: (e) => handleDelete(topic, e.domEvent as React.MouseEvent)
                            }
                          ]
                        }}
                        trigger={['click']}
                        placement="bottomRight">
                        <MoreButton onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal size={16} />
                        </MoreButton>
                      </Dropdown>
                    </TopicActions>
                  </>
                )}
              </TopicItem>
            ))
          )}
        </List>
      )}
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 16px 12px;
  cursor: pointer;
  user-select: none;

  &:hover {
    background: var(--color-background-mute);
  }
`

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const CollapseIcon = styled.div<{ $collapsed: boolean; $disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $disabled }) => ($disabled ? 'var(--color-text-tertiary)' : 'var(--color-text-secondary)')};
  transition: transform 0.2s ease;
  transform: rotate(${({ $collapsed }) => ($collapsed ? '-90deg' : '0deg')});
`

const Title = styled.div<{ $disabled?: boolean }>`
  font-size: 13px;
  font-weight: 600;
  color: ${({ $disabled }) => ($disabled ? 'var(--color-text-tertiary)' : 'var(--color-text)')};
  letter-spacing: 0.3px;
`

const Badge = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: var(--color-background-mute);
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
`

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const AddButton = styled.button`
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: var(--color-primary);
    color: white;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`

const List = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 12px 12px;
  gap: 4px;
`

const EmptyState = styled.div<{ $disabled?: boolean }>`
  font-size: 13px;
  color: var(--color-text-tertiary);
  padding: 16px;
  text-align: center;
  background: ${({ $disabled }) => ($disabled ? 'transparent' : 'var(--color-background-mute)')};
  border-radius: 12px;
  border: ${({ $disabled }) => ($disabled ? 'none' : '1px dashed var(--color-border)')};
`

const TopicItem = styled.div<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
  background: ${({ $isActive }) => ($isActive ? 'var(--color-background-soft)' : 'transparent')};
  border: 1px solid ${({ $isActive }) => ($isActive ? 'var(--color-border)' : 'transparent')};
  transition: all 0.15s ease;

  &:hover {
    background: var(--color-background-soft);
  }

  .topic-actions {
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  &:hover .topic-actions {
    opacity: 1;
  }
`

const TopicContent = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const TopicName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const TopicTime = styled.div`
  font-size: 12px;
  color: var(--color-text-tertiary);
`

const TopicActions = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
`

const MoreButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  color: var(--color-text-secondary);
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-background);
    color: var(--color-text);
  }
`

const EditInput = styled.input`
  flex: 1;
  font-size: 13px;
  padding: 6px 10px;
  border: 1px solid var(--color-primary);
  border-radius: 6px;
  background: var(--color-background);
  color: var(--color-text);
  outline: none;

  &:focus {
    box-shadow: 0 0 0 2px var(--color-primary-soft);
  }
`

export default TopicList
