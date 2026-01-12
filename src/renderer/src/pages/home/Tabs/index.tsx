import { useAssistants, useDefaultAssistant } from '@renderer/hooks/useAssistant'
import { useNavbarPosition } from '@renderer/hooks/useSettings'
import { useAppDispatch } from '@renderer/store'
import { setActiveAgentId, setActiveTopicOrSessionAction } from '@renderer/store/runtime'
import type { Assistant, Topic } from '@renderer/types'
import { uuid } from '@renderer/utils'
import { compileCartridgeToPrompt, extractExpertInfoFromCartridge, parseCartridgeMarkdown } from '@renderer/utils/cartridge'
import { message } from 'antd'
import { Cpu } from 'lucide-react'
import type { FC } from 'react'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import Assistants from './AssistantsTab'

interface Props {
  activeAssistant: Assistant
  activeTopic: Topic
  setActiveAssistant: (assistant: Assistant) => void
  setActiveTopic: (topic: Topic) => void
  position: 'left' | 'right'
  forceToSeeAllTab?: boolean
  style?: React.CSSProperties
}

const HomeTabs: FC<Props> = ({ activeAssistant, setActiveAssistant, style }) => {
  const { addAssistant } = useAssistants()
  const { defaultAssistant } = useDefaultAssistant()
  const { isLeftNavbar } = useNavbarPosition()
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const borderStyle = '0.5px solid var(--color-border)'
  const border = { borderRight: isLeftNavbar ? borderStyle : 'none' }

  // 从MD文件导入卡带
  const onImportCartridgeFile = useCallback(
    (file: File) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const markdown = e.target?.result as string
          const cartridgeData = parseCartridgeMarkdown(markdown)
          const compiledPrompt = compileCartridgeToPrompt(cartridgeData)
          const expertInfo = extractExpertInfoFromCartridge(cartridgeData)

          // 创建助手
          const newAssistant: Assistant = {
            ...defaultAssistant,
            id: uuid(),
            name: expertInfo.name,
            description: cartridgeData.identity.profession || '',
            prompt: compiledPrompt,
            emoji: '👤'
          }

          addAssistant(newAssistant)
          setActiveAssistant(newAssistant)
          dispatch(setActiveAgentId(null))
          dispatch(setActiveTopicOrSessionAction('topic'))

          message.success(t('assistants.cartridgeStore.importSuccess'))
        } catch {
          message.error(t('assistants.cartridgeStore.importError'))
        }
      }
      reader.readAsText(file, 'UTF-8')
    },
    [defaultAssistant, addAssistant, setActiveAssistant, dispatch, t]
  )

  const onCreateDefaultAssistant = () => {
    const assistant = { ...defaultAssistant, id: uuid() }
    addAssistant(assistant)
    setActiveAssistant(assistant)
    dispatch(setActiveAgentId(null))
    dispatch(setActiveTopicOrSessionAction('topic'))
  }

  return (
    <Container style={{ ...border, ...style }} className="home-tabs cartridge-store">
      {/* 卡带商店标题 */}
      <StoreHeader>
        <StoreIcon>
          <Cpu size={24} />
        </StoreIcon>
        <StoreTitle>{t('assistants.cartridgeStore.title')}</StoreTitle>
      </StoreHeader>

      {/* 卡带列表 */}
      <TabContent className="home-tabs-content">
        <Assistants
          activeAssistant={activeAssistant}
          setActiveAssistant={setActiveAssistant}
          onImportCartridgeFile={onImportCartridgeFile}
          onCreateDefaultAssistant={onCreateDefaultAssistant}
        />
      </TabContent>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: calc(100vh - var(--navbar-height));

  [navbar-position='left'] & {
    background-color: var(--color-background);
  }
  [navbar-position='top'] & {
    height: calc(100vh - var(--navbar-height));
  }
  overflow: hidden;
`

const StoreHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background);
  -webkit-app-region: drag;
  position: relative;

  /* 科技感底部线条 */
  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg,
      transparent 0%,
      #3b82f6 20%,
      #8b5cf6 50%,
      #06b6d4 80%,
      transparent 100%
    );
    opacity: 0.6;
  }
`

const StoreIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--color-background-soft) 0%, var(--color-background-mute) 100%);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3b82f6;
  -webkit-app-region: no-drag;
  position: relative;
  box-shadow:
    0 4px 16px rgba(59, 130, 246, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);

  /* 芯片针脚 */
  &::before {
    content: '';
    position: absolute;
    left: -4px;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 24px;
    background: repeating-linear-gradient(
      180deg,
      #fbbf24 0px, #fbbf24 3px,
      transparent 3px, transparent 6px
    );
    border-radius: 1px;
  }

  &::after {
    content: '';
    position: absolute;
    right: -4px;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 24px;
    background: repeating-linear-gradient(
      180deg,
      #fbbf24 0px, #fbbf24 3px,
      transparent 3px, transparent 6px
    );
    border-radius: 1px;
  }
`

const StoreTitle = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);
  -webkit-app-region: no-drag;
  letter-spacing: 1px;
`

const TabContent = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow-y: hidden;
  overflow-x: hidden;
`

export default HomeTabs
