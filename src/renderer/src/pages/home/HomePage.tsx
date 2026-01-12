import { ErrorBoundary } from '@renderer/components/ErrorBoundary'
import { useAgentSessionInitializer } from '@renderer/hooks/agents/useAgentSessionInitializer'
import { useAssistants } from '@renderer/hooks/useAssistant'
import { useRuntime } from '@renderer/hooks/useRuntime'
import { useNavbarPosition } from '@renderer/hooks/useSettings'
import { useActiveTopic } from '@renderer/hooks/useTopic'
import NavigationService from '@renderer/services/NavigationService'
import { newMessagesActions } from '@renderer/store/newMessage'
import { setActiveAgentId, setActiveTopicOrSessionAction } from '@renderer/store/runtime'
import type { Assistant, Topic } from '@renderer/types'
import type { FC } from 'react'
import { startTransition, useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import Navbar from './Navbar'
import HomeTabs from './Tabs'

let _activeAssistant: Assistant

const HomePage: FC = () => {
  const { assistants } = useAssistants()
  const navigate = useNavigate()
  const { isLeftNavbar } = useNavbarPosition()

  // Initialize agent session hook
  useAgentSessionInitializer()

  const location = useLocation()
  const state = location.state

  const [activeAssistant, _setActiveAssistant] = useState<Assistant>(
    state?.assistant || _activeAssistant || assistants[0]
  )
  const { activeTopic, setActiveTopic: _setActiveTopic } = useActiveTopic(activeAssistant?.id ?? '', state?.topic)
  const dispatch = useDispatch()
  const { chat } = useRuntime()
  const { activeTopicOrSession } = chat

  _activeAssistant = activeAssistant

  const setActiveAssistant = useCallback(
    // TODO: allow to set it as null.
    (newAssistant: Assistant) => {
      if (newAssistant.id === activeAssistant?.id) return
      startTransition(() => {
        _setActiveAssistant(newAssistant)
        if (newAssistant.id !== 'fake') {
          dispatch(setActiveAgentId(null))
        }
        // 同步更新 active topic，避免不必要的重新渲染
        const newTopic = newAssistant.topics?.[0]
        _setActiveTopic((prev) => (newTopic?.id === prev?.id ? prev : newTopic))
      })
    },
    [_setActiveTopic, activeAssistant?.id, dispatch]
  )

  const setActiveTopic = useCallback(
    (newTopic: Topic) => {
      startTransition(() => {
        _setActiveTopic((prev) => (newTopic?.id === prev?.id ? prev : newTopic))
        dispatch(newMessagesActions.setTopicFulfilled({ topicId: newTopic.id, fulfilled: false }))
        dispatch(setActiveTopicOrSessionAction('topic'))
      })
    },
    [_setActiveTopic, dispatch]
  )

  useEffect(() => {
    NavigationService.setNavigate(navigate)
  }, [navigate])

  useEffect(() => {
    state?.assistant && setActiveAssistant(state?.assistant)
    state?.topic && setActiveTopic(state?.topic)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <Container id="home-page">
      {isLeftNavbar && (
        <Navbar
          activeAssistant={activeAssistant}
          activeTopic={activeTopic}
          setActiveTopic={setActiveTopic}
          setActiveAssistant={setActiveAssistant}
          position="left"
          activeTopicOrSession={activeTopicOrSession}
        />
      )}
      <ContentContainer id={isLeftNavbar ? 'content-container' : undefined}>
        {/* 卡带商店 - 全宽显示，隐藏聊天窗口 */}
        <ErrorBoundary>
          <HomeTabs
            activeAssistant={activeAssistant}
            activeTopic={activeTopic}
            setActiveAssistant={setActiveAssistant}
            setActiveTopic={setActiveTopic}
            position="left"
            style={{ width: '100%', flex: 1 }}
          />
        </ErrorBoundary>
      </ContentContainer>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  [navbar-position='left'] & {
    max-width: calc(100vw - var(--sidebar-width));
  }
  [navbar-position='top'] & {
    max-width: 100vw;
  }
`

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  overflow: hidden;
`

export default HomePage
