import { useQuickPanel } from '@renderer/components/QuickPanel'
import { useAssistant } from '@renderer/hooks/useAssistant'
import { useInputbarToolsDispatch } from '@renderer/pages/home/Inputbar/context/InputbarToolsProvider'
import type { Assistant, Expert, Model, RoomUserInfo, Topic } from '@renderer/types'
import type { Message, MessageBlock } from '@renderer/types/newMessage'
import { AtSign, ChevronDown } from 'lucide-react'
import type { FC } from 'react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { useExpertContext } from '../context/ExpertContext'
import { MENTION_EXPERTS_SYMBOL, useMentionExpertsPanel } from '../hooks/useMentionExpertsPanel'
import Inputbar from '../../home/Inputbar/Inputbar'

/**
 * 构建增强的专家提示词
 * 根据专家的 promptSettings 配置，生成最终的提示词
 */
function buildExpertPrompt(expert: Expert, hostPrompt?: string, userInfo?: RoomUserInfo): string {
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
    finalPrompt = finalPrompt ? `${finalPrompt}\n\n[背景信息]\n${hostPrompt}` : `[背景信息]\n${hostPrompt}`
  }

  // 添加用户个人信息
  if (userInfo && (userInfo.role || userInfo.introduction)) {
    let userInfoSection = '[对话用户信息]'
    if (userInfo.role) {
      userInfoSection += `\n用户身份/角色: ${userInfo.role}`
    }
    if (userInfo.introduction) {
      userInfoSection += `\n用户自我介绍: ${userInfo.introduction}`
    }
    userInfoSection += '\n请根据用户身份信息调整你的回复方式，更好地为用户服务。'
    finalPrompt = finalPrompt ? `${finalPrompt}\n\n${userInfoSection}` : userInfoSection
  }

  return finalPrompt
}

interface Props {
  assistant: Assistant
  topic: Topic
  setActiveTopic: (topic: Topic) => void
  experts: Expert[]
  /** 外部管理的选中专家状态 */
  selectedExpert: Expert | null
  /** 设置选中专家的回调 */
  setSelectedExpert: (expert: Expert | null) => void
  /** 外部管理的 mentionedModels 状态 */
  mentionedModels: Model[]
  /** mentionedModels 变化时的回调 */
  onMentionedModelsChange: (models: Model[]) => void
  /** 用户在房间中的个人信息 */
  userInfo?: RoomUserInfo
}

/**
 * 专家提及处理器组件
 * 负责注册 QuickPanel 触发器和处理专家选择
 * 必须在 InputbarToolsProvider 内渲染
 */
interface ExpertMentionHandlerProps {
  experts: Expert[]
  selectedExpert: Expert | null
  setSelectedExpert: (expert: Expert | null) => void
  /** 当前输入框文本，用于检测 @ 是否被删除 */
  currentText: string
}

const ExpertMentionHandler: FC<ExpertMentionHandlerProps> = ({
  experts,
  selectedExpert,
  setSelectedExpert,
  currentText
}) => {
  const { recentExpertIds, recordExpertUsage } = useExpertContext()
  const { toolsRegistry, onTextChange } = useInputbarToolsDispatch()
  const quickPanelController = useQuickPanel()

  // 创建 setText 的包装函数 - 使用 onTextChange 支持函数形式
  const setTextWrapper = useCallback<React.Dispatch<React.SetStateAction<string>>>(
    (action) => {
      // 使用 InputbarToolsDispatch 的 onTextChange，它支持函数形式
      onTextChange(action)
    },
    [onTextChange]
  )

  // 包装 setSelectedExpert 以同时记录使用
  const handleSelectExpert = useCallback(
    (expert: Expert | null) => {
      setSelectedExpert(expert)
      if (expert) {
        recordExpertUsage(expert.id)
      }
    },
    [setSelectedExpert, recordExpertUsage]
  )

  // 稳定化 registerTrigger 包装函数，避免每次渲染创建新引用
  const registerTriggerWrapper = useCallback(
    (symbol: any, handler: (payload?: unknown) => void) => {
      return toolsRegistry.registerTrigger('mention-experts', symbol, handler)
    },
    [toolsRegistry]
  )

  // 创建稳定的 quickPanel 对象
  const quickPanelApi = useMemo(
    () => ({
      registerTrigger: registerTriggerWrapper,
      // registerRootMenu is not used by useMentionExpertsPanel but required by type
      registerRootMenu: () => () => {}
    }),
    [registerTriggerWrapper]
  )

  // 使用专家提及面板 hook
  useMentionExpertsPanel(
    {
      quickPanel: quickPanelApi,
      quickPanelController,
      experts,
      recentExpertIds,
      selectedExpert,
      setSelectedExpert: handleSelectExpert,
      setText: setTextWrapper
    },
    'manager'
  )

  // 监听文本变化，当 @handle 被删除时自动清除选中的专家
  useEffect(() => {
    if (!selectedExpert) return

    // 获取专家的 handle（用于匹配输入框中的 @xxx）
    const handle = selectedExpert.handle?.replace('@', '') || selectedExpert.name

    // 检查文本中是否还包含 @handle
    // 使用正则匹配，确保 @ 后面紧跟 handle（避免误匹配）
    const pattern = new RegExp(`@${handle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s|$)`, 'i')

    if (!pattern.test(currentText)) {
      // @ handle 已被删除，清除选中的专家
      setSelectedExpert(null)
    }
  }, [currentText, selectedExpert, setSelectedExpert])

  // 这个组件只是为了注册副作用，不渲染任何内容
  return null
}

/**
 * 专家选择按钮组件
 * 必须在 InputbarToolsProvider 内渲染，以便访问 triggers
 */
interface ExpertSelectorButtonInnerProps {
  experts: Expert[]
  onTextChange: (text: string) => void
}

const ExpertSelectorButtonInner: FC<ExpertSelectorButtonInnerProps> = ({ experts, onTextChange }) => {
  const { t } = useTranslation()
  const { triggers } = useInputbarToolsDispatch()

  const handleOpenExpertPanel = useCallback(() => {
    if (experts.length === 0) {
      window.toast?.info?.(t('experts.empty'))
      return
    }
    // 先设置 @ 文本
    onTextChange('@')
    // 然后触发专家面板打开
    triggers.emit(MENTION_EXPERTS_SYMBOL as any, { type: 'button', position: 0, originalText: '@' })
  }, [experts.length, t, onTextChange, triggers])

  return (
    <SelectExpertButton onClick={handleOpenExpertPanel} $hasExperts={experts.length > 0}>
      <AtSign size={12} />
      <span>{experts.length > 0 ? t('experts.select_expert') : t('experts.empty')}</span>
      {experts.length > 0 && <ChevronDown size={10} />}
    </SelectExpertButton>
  )
}

const HostsInputbar: FC<Props> = ({
  assistant: initialAssistant,
  topic,
  setActiveTopic,
  experts,
  selectedExpert,
  setSelectedExpert,
  mentionedModels,
  onMentionedModelsChange,
  userInfo
}) => {
  // 从 store 获取最新的 assistant 状态（包含工具栏设置如 webSearchProviderId）
  const { assistant } = useAssistant(initialAssistant?.id ?? '')

  // 使用 ExpertContext 来接收从侧边栏点击的专家
  const { mentionedExpert, setMentionedExpert, recordExpertUsage } = useExpertContext()

  // 保存 onTextChange 回调的引用
  const onTextChangeRef = useRef<((text: string) => void) | null>(null)

  // 当从侧边栏点击专家时，自动选中并插入 @名称
  useEffect(() => {
    if (mentionedExpert) {
      setSelectedExpert(mentionedExpert)
      recordExpertUsage(mentionedExpert.id)
      // 插入 @名称 到输入框
      const handle = mentionedExpert.handle?.replace('@', '') || mentionedExpert.name
      if (onTextChangeRef.current) {
        onTextChangeRef.current(`@${handle} `)
      }
      setMentionedExpert(null) // 清除 context 中的值
    }
  }, [mentionedExpert, setMentionedExpert, recordExpertUsage, setSelectedExpert])

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

  // 专家选择器内容 - 只显示选择按钮（标签已移到页面顶部）
  const renderExpertSelector = useCallback(
    ({ text, onTextChange }: { text: string; onTextChange: (text: string) => void }) => {
      // 保存 onTextChange 引用，供其他地方使用
      onTextChangeRef.current = onTextChange
      return (
        <ExpertSelectorContainer className="expert-selector-container">
          {/* 专家提及处理器 - 注册 QuickPanel 触发器 */}
          <ExpertMentionHandler
            experts={experts}
            selectedExpert={selectedExpert}
            setSelectedExpert={setSelectedExpert}
            currentText={text}
          />

          {/* 只显示选择按钮，标签显示在页面顶部 */}
          {!selectedExpert && <ExpertSelectorButtonInner experts={experts} onTextChange={onTextChange} />}
        </ExpertSelectorContainer>
      )
    },
    [selectedExpert, experts, setSelectedExpert]
  )

  // 获取实际用于发送消息的 assistant（选中专家时合并专家和主机的设置）
  const getEffectiveAssistant = useCallback(() => {
    if (selectedExpert) {
      // 从最新的 experts 列表中获取专家数据，确保使用最新状态
      const latestExpert = experts.find((e) => e.id === selectedExpert.id) || selectedExpert

      // 构建增强的专家提示词（包含用户个人信息）
      const enhancedPrompt = buildExpertPrompt(latestExpert, assistant.prompt, userInfo)

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

    // 没有选中专家时，也将用户信息添加到主机的提示词中
    if (userInfo && (userInfo.role || userInfo.introduction)) {
      const basePrompt = assistant.prompt || ''
      let userInfoSection = '[对话用户信息]'
      if (userInfo.role) {
        userInfoSection += `\n用户身份/角色: ${userInfo.role}`
      }
      if (userInfo.introduction) {
        userInfoSection += `\n用户自我介绍: ${userInfo.introduction}`
      }
      userInfoSection += '\n请根据用户身份信息调整你的回复方式，更好地为用户服务。'

      const hostPromptWithUserInfo = basePrompt ? `${basePrompt}\n\n${userInfoSection}` : userInfoSection
      return {
        ...assistant,
        prompt: hostPromptWithUserInfo
      }
    }

    return assistant
  }, [selectedExpert, assistant, experts, userInfo])

  return (
    <Inputbar
      assistant={assistant}
      topic={topic}
      setActiveTopic={setActiveTopic}
      onBeforeSend={handleBeforeSend}
      extraTopContent={renderExpertSelector}
      getEffectiveAssistant={getEffectiveAssistant}
      mentionMode="experts"
      forceEnableQuickPanelTriggers
      externalMentionedModels={mentionedModels}
      onMentionedModelsChange={onMentionedModelsChange}
      showMentionedModelsInInputbar={false}
    />
  )
}

const ExpertSelectorContainer = styled.div`
  width: 100%;
  padding: 5px 15px 5px 15px;
  position: relative;
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

export default HostsInputbar
