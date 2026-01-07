import MultiSelectActionPopup from '@renderer/components/Popups/MultiSelectionPopup'
import SaveToLibraryPopup from '@renderer/components/Popups/SaveToLibraryPopup'
import TextSelectionToolbar from '@renderer/components/Popups/TextSelectionToolbar'
import CustomTag from '@renderer/components/Tags/CustomTag'
import { useTheme } from '@renderer/context/ThemeProvider'
import { useChatContext } from '@renderer/hooks/useChatContext'
import { useAppDispatch } from '@renderer/store'
import { addNotebookItem } from '@renderer/store/assistants'
import type { Assistant, Expert, Host, Model, Topic } from '@renderer/types'
import { nanoid } from '@reduxjs/toolkit'
import { AtSign, ChevronDown, Settings2, Users } from 'lucide-react'
import type { FC } from 'react'
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import Messages from '../../home/Messages/Messages'
import { useExpertContext } from '../context/ExpertContext'
import HostsInputbar from './HostsInputbar'

interface Props {
  assistant: Assistant
  topic: Topic
  setActiveTopic: (topic: Topic) => void
  experts: Expert[]
  activeHost: Host | null
  onHostClick?: () => void
}

const HostsChatArea: FC<Props> = ({ assistant, topic, setActiveTopic, experts, activeHost, onHostClick }) => {
  const { t } = useTranslation()
  const { isMultiSelectMode } = useChatContext(topic)
  const chatContentRef = useRef<HTMLDivElement>(null)
  const dispatch = useAppDispatch()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { setMentionedExpert } = useExpertContext()

  // 提升的状态：选中的专家和模型
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null)
  const [mentionedModels, setMentionedModels] = useState<Model[]>([])
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false)

  // 清除选中的专家
  const handleClearExpert = useCallback(() => {
    setSelectedExpert(null)
  }, [])

  // 移除模型
  const handleRemoveModel = useCallback((model: Model) => {
    setMentionedModels((prev) => prev.filter((m) => m.id !== model.id))
  }, [])

  // 处理选中文字后的操作
  const handleCopy = useCallback((selectedText: string) => {
    navigator.clipboard.writeText(selectedText)
  }, [])

  const handleAskHer = useCallback((selectedText: string) => {
    console.log('Ask Her:', selectedText)
    // TODO: 实现问 Her 功能
  }, [])

  const handleSaveToLibrary = useCallback(
    async (selectedText: string) => {
      if (!activeHost) return
      await SaveToLibraryPopup.show({
        hostId: activeHost.id,
        content: selectedText,
        sourceTopicId: topic.id
      })
    },
    [activeHost, topic.id]
  )

  const handleSaveToNotebook = useCallback(
    (selectedText: string, color: string) => {
      if (!activeHost) return
      const now = Date.now()
      dispatch(
        addNotebookItem({
          hostId: activeHost.id,
          item: {
            id: nanoid(),
            content: selectedText,
            color,
            createdAt: now,
            updatedAt: now,
            sourceTopicId: topic.id,
            sourceTopicName: topic.name
          }
        })
      )
      window.toast?.success?.(t('notebook.save.success', { defaultValue: '已保存到笔记本' }))
    },
    [activeHost, topic.id, topic.name, dispatch, t]
  )

  return (
    <>
      <ChatHeaderWrapper $isDark={isDark}>
        <ChatHeader onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}>
          <ChatHeaderLeft>
            <ChatHeaderIcon onClick={onHostClick}>{activeHost?.emoji || '🏠'}</ChatHeaderIcon>
            <ChatHeaderTitle>{activeHost?.name}</ChatHeaderTitle>
            {experts.length > 0 && (
              <ExpertBadge>
                <Users size={12} />
                <span>{experts.length}</span>
              </ExpertBadge>
            )}
          </ChatHeaderLeft>

          <ChatHeaderCenter>
            {selectedExpert && (
              <CustomTag
                icon={<AtSign size={12} />}
                color="var(--color-primary)"
                closable
                onClose={(e) => {
                  e?.stopPropagation()
                  handleClearExpert()
                }}>
                <TagContent>
                  <span>{selectedExpert.emoji || '👤'}</span>
                  <span>{selectedExpert.name}</span>
                </TagContent>
              </CustomTag>
            )}
            {mentionedModels.map((model) => (
              <CustomTag
                key={model.id}
                icon={<AtSign size={12} />}
                color="#1677ff"
                closable
                onClose={(e) => {
                  e?.stopPropagation()
                  handleRemoveModel(model)
                }}>
                {model.name}
              </CustomTag>
            ))}
          </ChatHeaderCenter>

          <ChatHeaderRight>
            {experts.length > 0 && (
              <ExpertAvatars>
                {experts.slice(0, 3).map((expert) => (
                  <ExpertAvatarSmall key={expert.id} title={expert.name}>
                    {expert.emoji || '👤'}
                  </ExpertAvatarSmall>
                ))}
                {experts.length > 3 && <ExpertCount>+{experts.length - 3}</ExpertCount>}
              </ExpertAvatars>
            )}
            <ExpandButton $expanded={isHeaderExpanded}>
              <ChevronDown size={16} />
            </ExpandButton>
            <SettingsButton
              onClick={(e) => {
                e.stopPropagation()
                onHostClick?.()
              }}
              title={t('hosts.settings')}>
              <Settings2 size={18} />
            </SettingsButton>
          </ChatHeaderRight>
        </ChatHeader>

        {/* 展开的详情面板 */}
        <ExpandedPanel $expanded={isHeaderExpanded}>
          <PanelContent>
            <PanelHint>
              {experts.length > 0
                ? t('hosts.chat_hint', { count: experts.length })
                : t('hosts.no_experts_hint', { defaultValue: '添加专家开始对话' })}
            </PanelHint>
            {experts.length > 0 && (
              <ExpertList>
                {experts.map((expert) => (
                  <ExpertChip
                    key={expert.id}
                    $active={selectedExpert?.id === expert.id}
                    onClick={() => setMentionedExpert(expert)}>
                    <span className="emoji">{expert.emoji || '👤'}</span>
                    <span className="name">{expert.name}</span>
                  </ExpertChip>
                ))}
              </ExpertList>
            )}
          </PanelContent>
        </ExpandedPanel>
      </ChatHeaderWrapper>
      <ChatContent ref={chatContentRef}>
        <Messages assistant={assistant} topic={topic} setActiveTopic={setActiveTopic} onHostClick={onHostClick} />
        {!isMultiSelectMode && (
          <HostsInputbar
            assistant={assistant}
            topic={topic}
            setActiveTopic={setActiveTopic}
            experts={experts}
            selectedExpert={selectedExpert}
            setSelectedExpert={setSelectedExpert}
            mentionedModels={mentionedModels}
            onMentionedModelsChange={setMentionedModels}
            userInfo={activeHost?.userInfo}
          />
        )}
        {isMultiSelectMode && <MultiSelectActionPopup topic={topic} />}
      </ChatContent>

      {/* 文字选中工具栏 */}
      <TextSelectionToolbar
        containerRef={chatContentRef}
        onCopy={handleCopy}
        onAskHer={handleAskHer}
        showSaveToLibrary={!!activeHost}
        onSaveToLibrary={handleSaveToLibrary}
        showSaveToNotebook={!!activeHost}
        onSaveToNotebook={handleSaveToNotebook}
      />
    </>
  )
}

const ChatHeaderWrapper = styled.div<{ $isDark: boolean }>`
  flex-shrink: 0;
  background: ${({ $isDark }) => ($isDark ? '#0f0f1a' : '#ffffff')};
  border-bottom: 1px solid ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0')};

  /* 主题变量 */
  --chat-bg: ${({ $isDark }) => ($isDark ? '#0f0f1a' : '#ffffff')};
  --chat-bg-soft: ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6')};
  --chat-bg-mute: ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb')};
  --chat-border: ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0')};
  --chat-text: ${({ $isDark }) => ($isDark ? '#ffffff' : '#1f2937')};
  --chat-text-secondary: ${({ $isDark }) => ($isDark ? '#9ca3af' : '#6b7280')};
  --chat-primary: #3b82f6;
  --chat-primary-soft: ${({ $isDark }) => ($isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)')};
`

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: var(--chat-bg-soft);
  }
`

const ChatHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`

const ChatHeaderCenter = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: center;
  padding: 0 16px;
`

const ChatHeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const TagContent = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
`

const ChatHeaderIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--chat-primary-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;

  &:hover {
    border-color: rgba(59, 130, 246, 0.3);
    transform: scale(1.05);
  }
`

const ChatHeaderTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: var(--chat-text);
`

const ExpertBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--chat-bg-soft);
  border-radius: 12px;
  font-size: 12px;
  color: var(--chat-text-secondary);

  svg {
    opacity: 0.7;
  }
`

const ExpertAvatars = styled.div`
  display: flex;
  align-items: center;
`

const ExpertAvatarSmall = styled.div`
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: var(--chat-primary-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  margin-left: -6px;
  border: 2px solid var(--chat-bg);
  cursor: default;
  transition: all 0.15s ease;

  &:first-child {
    margin-left: 0;
  }

  &:hover {
    transform: translateY(-2px);
    z-index: 1;
  }
`

const ExpertCount = styled.div`
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: var(--chat-bg-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: var(--chat-primary);
  margin-left: -6px;
  border: 2px solid var(--chat-bg);
`

const ExpandButton = styled.button<{ $expanded: boolean }>`
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--chat-text-secondary);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  svg {
    transition: transform 0.2s ease;
    transform: rotate(${({ $expanded }) => ($expanded ? '180deg' : '0deg')});
  }

  &:hover {
    background: var(--chat-bg-soft);
  }
`

const SettingsButton = styled.button`
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--chat-text-secondary);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &:hover {
    background: var(--chat-primary-soft);
    color: var(--chat-primary);
  }
`

const ExpandedPanel = styled.div<{ $expanded: boolean }>`
  max-height: ${({ $expanded }) => ($expanded ? '200px' : '0')};
  overflow: hidden;
  transition: max-height 0.25s ease;
  border-top: ${({ $expanded }) => ($expanded ? '1px solid var(--chat-border)' : 'none')};
`

const PanelContent = styled.div`
  padding: 12px 20px 16px;
`

const PanelHint = styled.div`
  font-size: 12px;
  color: var(--chat-text-secondary);
  margin-bottom: 12px;
`

const ExpertList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const ExpertChip = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid ${({ $active }) => ($active ? 'var(--chat-primary)' : 'var(--chat-border)')};
  background: ${({ $active }) => ($active ? 'var(--chat-primary-soft)' : 'var(--chat-bg)')};
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 13px;

  .emoji {
    font-size: 14px;
  }

  .name {
    color: ${({ $active }) => ($active ? 'var(--chat-primary)' : 'var(--chat-text)')};
  }

  &:hover {
    border-color: var(--chat-primary);
    background: var(--chat-primary-soft);
  }
`

const ChatContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  overflow: hidden;

  /* Messages 组件占据剩余空间 */
  & > .messages-container {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }
`

export default HostsChatArea
