import HorizontalScrollContainer from '@renderer/components/HorizontalScrollContainer'
import CustomTag from '@renderer/components/Tags/CustomTag'
import { useAssistant } from '@renderer/hooks/useAssistant'
import type { Assistant, Expert, Topic } from '@renderer/types'
import type { Message, MessageBlock } from '@renderer/types/newMessage'
import { AtSign, ChevronDown } from 'lucide-react'
import type { FC } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { useExpertContext } from '../context/ExpertContext'
import Inputbar from '../../home/Inputbar/Inputbar'

/**
 * 构建增强的专家提示词
 * 根据专家的 promptSettings 配置，生成最终的提示词
 */
function buildExpertPrompt(expert: Expert, hostPrompt?: string): string {
  const promptSettings = expert.promptSettings
  const enableEnhancedMode = promptSettings?.enableEnhancedMode ?? true
  const hostPromptMode = promptSettings?.hostPromptMode ?? 'append'

  let finalPrompt = ''

  if (enableEnhancedMode) {
    // 增强模式：添加身份强化指令
    finalPrompt = `[当前专家身份]
你现在是 ${expert.name}${expert.description ? `（${expert.description}）` : ''}。

[核心指令 - 必须严格遵守]
${expert.prompt || ''}

[重要提醒]
- 你必须始终保持 ${expert.name} 的身份和风格
- 即使对话历史中有其他风格的回复，你也必须按照上述核心指令行事
- 对话历史仅供参考上下文信息，不要模仿其中的回复风格`
  } else {
    // 非增强模式：直接使用专家提示词
    finalPrompt = expert.prompt || ''
  }

  // 处理主机提示词
  if (hostPromptMode === 'append' && hostPrompt) {
    finalPrompt += `\n\n[背景信息]\n${hostPrompt}`
  }

  return finalPrompt
}

interface Props {
  assistant: Assistant
  topic: Topic
  setActiveTopic: (topic: Topic) => void
  experts: Expert[]
}

const HostsInputbar: FC<Props> = ({ assistant: initialAssistant, topic, setActiveTopic, experts }) => {
  const { t } = useTranslation()
  // 从 store 获取最新的 assistant 状态（包含工具栏设置如 webSearchProviderId）
  const { assistant } = useAssistant(initialAssistant?.id ?? '')
  // 当前选中的专家（单选）
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null)
  // 是否显示专家选择下拉
  const [showDropdown, setShowDropdown] = useState(false)

  // 使用 ExpertContext 来接收从侧边栏点击的专家
  const { mentionedExpert, setMentionedExpert } = useExpertContext()

  // 当从侧边栏点击专家时，自动选中
  useEffect(() => {
    if (mentionedExpert) {
      setSelectedExpert(mentionedExpert)
      setMentionedExpert(null) // 清除 context 中的值
    }
  }, [mentionedExpert, setMentionedExpert])

  // 选择专家（单选）
  const handleSelectExpert = useCallback((expert: Expert) => {
    setSelectedExpert(expert)
    setShowDropdown(false)
  }, [])

  // 清除选中的专家
  const handleClearExpert = useCallback(() => {
    setSelectedExpert(null)
  }, [])

  // 切换下拉显示
  const toggleDropdown = useCallback(() => {
    if (experts.length === 0) {
      window.toast?.info?.(t('experts.empty'))
      return
    }
    setShowDropdown((prev) => !prev)
  }, [experts.length, t])

  // 点击外部关闭下拉
  useEffect(() => {
    if (!showDropdown) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.expert-selector-container')) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showDropdown])

  // 发送前的消息转换回调，将专家信息附加到消息中
  const handleBeforeSend = useCallback(
    (message: Message, blocks: MessageBlock[]): { message: Message; blocks: MessageBlock[] } => {
      if (selectedExpert) {
        return {
          message: {
            ...message,
            expertId: selectedExpert.id,
            expertName: selectedExpert.name,
            expertEmoji: selectedExpert.emoji || '👤'
          },
          blocks
        }
      }
      return { message, blocks }
    },
    [selectedExpert]
  )

  // 专家选择器内容 - 融合到输入框内部
  const expertSelectorContent = (
    <ExpertSelectorContainer className="expert-selector-container">
      <HorizontalScrollContainer dependencies={[selectedExpert, experts]} expandable>
        {selectedExpert ? (
          <CustomTag
            icon={<AtSign size={12} />}
            color="var(--color-primary)"
            closable
            onClose={handleClearExpert}
            onClick={toggleDropdown}
            style={{ cursor: 'pointer' }}>
            <TagContent>
              <span>{selectedExpert.emoji || '👤'}</span>
              <span>{selectedExpert.name}</span>
              <ChevronDown size={10} style={{ marginLeft: 2, opacity: 0.7 }} />
            </TagContent>
          </CustomTag>
        ) : (
          <SelectExpertButton onClick={toggleDropdown} $hasExperts={experts.length > 0}>
            <AtSign size={12} />
            <span>{experts.length > 0 ? t('experts.select_expert') : t('experts.empty')}</span>
            {experts.length > 0 && <ChevronDown size={10} />}
          </SelectExpertButton>
        )}
      </HorizontalScrollContainer>

      {/* 专家下拉列表 */}
      {showDropdown && experts.length > 0 && (
        <DropdownList>
          {experts.map((expert) => (
            <DropdownItem
              key={expert.id}
              onClick={() => handleSelectExpert(expert)}
              $isSelected={selectedExpert?.id === expert.id}>
              <ItemEmoji>{expert.emoji || '👤'}</ItemEmoji>
              <ItemInfo>
                <ItemName>
                  <AtSymbol>@</AtSymbol>
                  {expert.handle?.replace('@', '') || expert.name}
                </ItemName>
                {expert.description && <ItemDescription>{expert.description}</ItemDescription>}
              </ItemInfo>
              {selectedExpert?.id === expert.id && <SelectedMark>✓</SelectedMark>}
            </DropdownItem>
          ))}
        </DropdownList>
      )}
    </ExpertSelectorContainer>
  )

  // 获取实际用于发送消息的 assistant（选中专家时合并专家和主机的设置）
  const getEffectiveAssistant = useCallback(() => {
    if (selectedExpert) {
      // 从最新的 experts 列表中获取专家数据，确保使用最新状态
      const latestExpert = experts.find((e) => e.id === selectedExpert.id) || selectedExpert

      // 构建增强的专家提示词
      const enhancedPrompt = buildExpertPrompt(latestExpert, assistant.prompt)

      // 合并主机和专家的设置
      // 优先使用专家的设置，但如果专家没有设置某项，则使用主机的设置
      return {
        ...assistant,
        // 专家的基本信息
        id: latestExpert.id,
        name: latestExpert.name,
        emoji: latestExpert.emoji,
        prompt: enhancedPrompt, // 使用增强后的提示词
        type: latestExpert.type,
        hostId: latestExpert.hostId,
        // 模型设置：优先使用专家的，否则使用主机的
        model: latestExpert.model || assistant.model,
        defaultModel: latestExpert.defaultModel || assistant.defaultModel,
        // 工具设置：合并主机和专家的设置（专家有设置则用专家的，否则用主机的）
        webSearchProviderId: latestExpert.webSearchProviderId || assistant.webSearchProviderId,
        enableWebSearch: latestExpert.enableWebSearch ?? assistant.enableWebSearch,
        knowledge_bases: latestExpert.knowledge_bases?.length
          ? latestExpert.knowledge_bases
          : assistant.knowledge_bases,
        mcpServers: latestExpert.mcpServers?.length ? latestExpert.mcpServers : assistant.mcpServers,
        enableMemory: latestExpert.enableMemory ?? assistant.enableMemory,
        enableGenerateImage: latestExpert.enableGenerateImage ?? assistant.enableGenerateImage,
        // 保留主机的 topics（专家没有自己的 topics）
        topics: assistant.topics,
        // 设置：合并（确保有默认的 toolUseMode 等关键设置）
        settings: {
          toolUseMode: 'function' as const, // 确保工具使用模式默认为 function
          ...assistant.settings,
          ...latestExpert.settings
        }
      }
    }
    return assistant
  }, [selectedExpert, assistant, experts])

  return (
    <Inputbar
      assistant={assistant}
      topic={topic}
      setActiveTopic={setActiveTopic}
      onBeforeSend={handleBeforeSend}
      extraTopContent={expertSelectorContent}
      getEffectiveAssistant={getEffectiveAssistant}
    />
  )
}

const ExpertSelectorContainer = styled.div`
  width: 100%;
  padding: 5px 15px 5px 15px;
  position: relative;
`

const TagContent = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
`

const SelectExpertButton = styled.button<{ $hasExperts: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border: 1px dashed ${({ $hasExperts }) => ($hasExperts ? 'var(--color-primary)' : 'var(--color-border)')};
  background: transparent;
  color: ${({ $hasExperts }) => ($hasExperts ? 'var(--color-primary)' : 'var(--color-text-tertiary)')};
  font-size: 12px;
  border-radius: 14px;
  cursor: ${({ $hasExperts }) => ($hasExperts ? 'pointer' : 'default')};
  transition: all 0.15s ease;
  height: 22px;

  &:hover {
    ${({ $hasExperts }) =>
      $hasExperts &&
      `
      background: var(--color-primary);
      color: white;
      border-style: solid;
    `}
  }
`

const DropdownList = styled.div`
  position: absolute;
  bottom: 100%;
  left: 15px;
  width: 280px;
  max-height: 280px;
  overflow-y: auto;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
  margin-bottom: 6px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 2px;
  }
`

const DropdownItem = styled.div<{ $isSelected: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.15s ease;
  background: ${({ $isSelected }) => ($isSelected ? 'var(--color-background-soft)' : 'transparent')};

  &:hover {
    background: var(--color-background-soft);
  }

  &:first-child {
    border-radius: 10px 10px 0 0;
  }

  &:last-child {
    border-radius: 0 0 10px 10px;
  }

  &:only-child {
    border-radius: 10px;
  }
`

const ItemEmoji = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--color-background-mute);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
`

const ItemInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const ItemName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  display: flex;
  align-items: center;
`

const AtSymbol = styled.span`
  color: var(--color-primary);
  font-weight: 600;
  margin-right: 1px;
`

const ItemDescription = styled.div`
  font-size: 11px;
  color: var(--color-text-secondary);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const SelectedMark = styled.span`
  color: var(--color-primary);
  font-size: 12px;
  flex-shrink: 0;
  align-self: center;
`

export default HostsInputbar
