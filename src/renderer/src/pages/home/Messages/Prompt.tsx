import { useTheme } from '@renderer/context/ThemeProvider'
import { usePromptProcessor } from '@renderer/hooks/usePromptProcessor'
import AssistantSettingsPopup from '@renderer/pages/settings/AssistantSettings'
import type { Assistant, Topic } from '@renderer/types'
import { isHost } from '@renderer/types'
import { containsSupportedVariables } from '@renderer/utils/prompt'
import type { FC } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface Props {
  assistant: Assistant
  topic?: Topic
  onHostClick?: () => void
}

const Prompt: FC<Props> = ({ assistant, topic, onHostClick }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  const prompt = assistant.prompt || t('chat.default.description')
  const topicPrompt = topic?.prompt || ''
  const isDark = theme === 'dark'

  const processedPrompt = usePromptProcessor({ prompt, modelName: assistant.model?.name })

  // 用于控制显示的状态
  const [displayText, setDisplayText] = useState(prompt)
  const [isVisible, setIsVisible] = useState(true)

  const handleClick = useCallback(() => {
    // 主机类型使用简化的设置弹窗
    if (isHost(assistant)) {
      onHostClick?.()
      return
    }
    // 其他类型使用完整的助手设置弹窗
    AssistantSettingsPopup.show({ assistant })
  }, [assistant, onHostClick])

  useEffect(() => {
    // 如果没有变量需要替换，直接显示处理后的内容
    if (!containsSupportedVariables(prompt)) {
      setDisplayText(processedPrompt)
      setIsVisible(true)
      return
    }

    // 如果有变量需要替换，先显示原始prompt
    setDisplayText(prompt)
    setIsVisible(true)

    // 延迟过渡
    let innerTimer: NodeJS.Timeout
    const outerTimer = setTimeout(() => {
      // 先淡出
      setIsVisible(false)

      // 切换内容并淡入
      innerTimer = setTimeout(() => {
        setDisplayText(processedPrompt)
        setIsVisible(true)
      }, 300)
    }, 300)

    return () => {
      clearTimeout(outerTimer)
      clearTimeout(innerTimer)
    }
  }, [prompt, processedPrompt])

  if (!prompt && !topicPrompt) {
    return null
  }

  // Host 类型不显示 Prompt 组件，因为 HostsChatArea 已经有 ChatHeader 显示主机信息
  if (isHost(assistant)) {
    return null
  }

  return (
    <Container className="system-prompt" onClick={handleClick} $isDark={isDark}>
      <Text $isVisible={isVisible}>{displayText}</Text>
    </Container>
  )
}

const Container = styled.div<{ $isDark: boolean }>`
  padding: 11px 16px;
  border-radius: 10px;
  cursor: pointer;
  border: 0.5px solid var(--color-border);
  margin: 15px 20px;
  margin-bottom: 0;
`

const Text = styled.div<{ $isVisible: boolean }>`
  color: var(--color-text-2);
  font-size: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  user-select: none;

  opacity: ${(props) => (props.$isVisible ? 1 : 0)};
  transition: opacity 0.3s ease-in-out;
`

export default Prompt
