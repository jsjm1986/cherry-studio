import MultiSelectActionPopup from '@renderer/components/Popups/MultiSelectionPopup'
import SaveToLibraryPopup from '@renderer/components/Popups/SaveToLibraryPopup'
import TextSelectionToolbar from '@renderer/components/Popups/TextSelectionToolbar'
import CustomTag from '@renderer/components/Tags/CustomTag'
import { useChatContext } from '@renderer/hooks/useChatContext'
import type { Assistant, Expert, Host, Model, Topic } from '@renderer/types'
import { AtSign, Settings2 } from 'lucide-react'
import type { FC } from 'react'
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import Messages from '../../home/Messages/Messages'
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

  // 提升的状态：选中的专家和模型
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null)
  const [mentionedModels, setMentionedModels] = useState<Model[]>([])

  // 清除选中的专家
  const handleClearExpert = useCallback(() => {
    setSelectedExpert(null)
  }, [])

  // 移除模型
  const handleRemoveModel = useCallback((model: Model) => {
    setMentionedModels((prev) => prev.filter((m) => m.id !== model.id))
  }, [])

  // 处理选中文字后的操作（暂时只打印，后续实现功能）
  const handleCopy = useCallback((selectedText: string) => {
    console.log('Copy:', selectedText)
    navigator.clipboard.writeText(selectedText)
  }, [])

  const handleAskHer = useCallback((selectedText: string) => {
    console.log('Ask Her:', selectedText)
    // TODO: 实现问 Her 功能
  }, [])

  const handleFormat = useCallback((selectedText: string) => {
    console.log('Format:', selectedText)
    // TODO: 实现格式化功能
  }, [])

  const handleHighlight = useCallback((selectedText: string) => {
    console.log('Highlight:', selectedText)
    // TODO: 实现高亮功能
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

  return (
    <>
      <ChatHeader>
        <ChatHeaderLeft>
          <ChatHeaderIcon onClick={onHostClick}>{activeHost?.emoji || '🏠'}</ChatHeaderIcon>
          <ChatHeaderInfo>
            <ChatHeaderTitle>{activeHost?.name}</ChatHeaderTitle>
            <ChatHeaderSubtitle>
              {experts.length > 0 ? t('hosts.chat_hint', { count: experts.length }) : t('hosts.current')}
            </ChatHeaderSubtitle>
          </ChatHeaderInfo>
        </ChatHeaderLeft>

        {/* 标签显示区域 */}
        {(selectedExpert || mentionedModels.length > 0) && (
          <ChatHeaderTags>
            {selectedExpert && (
              <CustomTag
                icon={<AtSign size={12} />}
                color="var(--color-primary)"
                closable
                onClose={handleClearExpert}>
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
                onClose={() => handleRemoveModel(model)}>
                {model.name}
              </CustomTag>
            ))}
          </ChatHeaderTags>
        )}

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
          <SettingsButton onClick={onHostClick} title={t('hosts.settings')}>
            <Settings2 size={18} />
          </SettingsButton>
        </ChatHeaderRight>
      </ChatHeader>
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
        onFormat={handleFormat}
        onHighlight={handleHighlight}
        showSaveToLibrary={!!activeHost}
        onSaveToLibrary={handleSaveToLibrary}
      />
    </>
  )
}

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
`

const ChatHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const ChatHeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const ChatHeaderTags = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: center;
  padding: 0 16px;
  overflow-x: auto;

  &::-webkit-scrollbar {
    height: 0;
  }
`

const TagContent = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
`

const ChatHeaderIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--color-background-mute);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: var(--color-primary-soft);
  }
`

const ChatHeaderInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const ChatHeaderTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
`

const ChatHeaderSubtitle = styled.div`
  font-size: 12px;
  color: var(--color-text-secondary);
`

const ExpertAvatars = styled.div`
  display: flex;
  align-items: center;
`

const ExpertAvatarSmall = styled.div`
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: var(--color-background-mute);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  margin-left: -6px;
  border: 2px solid var(--color-background-soft);
  cursor: default;

  &:first-child {
    margin-left: 0;
  }
`

const ExpertCount = styled.div`
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: var(--color-background-mute);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-left: -6px;
  border: 2px solid var(--color-background-soft);
`

const SettingsButton = styled.button`
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: 8px;
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
