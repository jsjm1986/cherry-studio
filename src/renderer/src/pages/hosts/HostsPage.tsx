import { Navbar, NavbarCenter } from '@renderer/components/app/Navbar'
import { QuickPanelProvider } from '@renderer/components/QuickPanel'
import { useAssistant } from '@renderer/hooks/useAssistant'
import { useNavbarPosition } from '@renderer/hooks/useSettings'
import { db } from '@renderer/databases'
import { getDefaultTopic } from '@renderer/services/AssistantService'
import { useAppDispatch } from '@renderer/store'
import { upsertManyBlocks } from '@renderer/store/messageBlock'
import { newMessagesActions } from '@renderer/store/newMessage'
import { saveMessageAndBlocksToDB } from '@renderer/store/thunk/messageThunk'
import type { Assistant, Expert, Host, Topic } from '@renderer/types'
import { AssistantMessageStatus, MessageBlockStatus } from '@renderer/types/newMessage'
import { createAssistantMessage, createMainTextBlock } from '@renderer/utils/messageUtils/create'
import { Modal } from 'antd'
import type { FC } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import CurrentHostInfo from './components/CurrentHostInfo'
import ExpertEditModal from './components/ExpertEditModal'
import ExpertList from './components/ExpertList'
import ExpertSettingsPopup from './components/ExpertSettingsPopup'
import HostEditModal from './components/HostEditModal'
import HostList from './components/HostList'
import HostsChatArea from './components/HostsChatArea'
import ImportExpertModal from './components/ImportExpertModal'
import TopicList from './components/TopicList'
import { ExpertProvider, useExpertContext } from './context/ExpertContext'
import { useExperts, useHosts } from './hooks/useHosts'

// 内部组件，使用 ExpertContext
const HostsPageContent: FC = () => {
  const { t } = useTranslation()
  const { navbarPosition } = useNavbarPosition()
  const { setMentionedExpert } = useExpertContext()
  const dispatch = useAppDispatch()

  // 主机状态
  const { hosts, createHost, updateHost, deleteHost } = useHosts()
  const [activeHost, setActiveHost] = useState<Host | null>(null)
  const [hostModalOpen, setHostModalOpen] = useState(false)
  const [editingHost, setEditingHost] = useState<Host | null>(null)

  // Topic 状态
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null)

  // 使用 useAssistant hook 获取完整的 assistant 数据
  const { assistant: currentAssistant, addTopic, removeTopic, updateTopic } = useAssistant(activeHost?.id || '')

  // 专家状态
  const { experts, createExpert, updateExpert, deleteExpert, importExpertsFromAssistants } = useExperts(
    activeHost?.id || ''
  )
  const [expertModalOpen, setExpertModalOpen] = useState(false)
  const [editingExpert, setEditingExpert] = useState<Expert | null>(null)
  const [expertSettingsOpen, setExpertSettingsOpen] = useState(false)
  const [settingsExpert, setSettingsExpert] = useState<Expert | null>(null)
  const [importModalOpen, setImportModalOpen] = useState(false)

  // 添加欢迎消息到话题
  const addWelcomeMessage = useCallback(
    async (topicId: string, hostId: string, welcomeMessage: string) => {
      // 创建助手消息
      const message = createAssistantMessage(hostId, topicId)
      message.status = AssistantMessageStatus.SUCCESS

      // 创建文本块
      const textBlock = createMainTextBlock(message.id, welcomeMessage, {
        status: MessageBlockStatus.SUCCESS
      })

      // 更新消息的 blocks 引用
      message.blocks = [textBlock.id]

      // 添加文本块到 Redux store
      dispatch(upsertManyBlocks([textBlock]))

      // 添加消息到 Redux store
      dispatch(newMessagesActions.addMessage({ topicId, message }))

      // 保存到数据库
      await saveMessageAndBlocksToDB(message, [textBlock])
    },
    [dispatch]
  )

  // 当选择主机时，自动加载或创建 Topic
  useEffect(() => {
    const initTopic = async () => {
      if (!activeHost || !currentAssistant) {
        setActiveTopic(null)
        return
      }

      // 如果主机已有 topics，使用第一个
      if (currentAssistant.topics && currentAssistant.topics.length > 0) {
        setActiveTopic(currentAssistant.topics[0])
      } else {
        // 创建新的 topic
        const newTopic = getDefaultTopic(activeHost.id)
        await db.topics.add({ id: newTopic.id, messages: [] })
        addTopic(newTopic)
        setActiveTopic(newTopic)

        // 如果主机有欢迎消息，添加到新话题
        if (activeHost.welcomeMessage) {
          await addWelcomeMessage(newTopic.id, activeHost.id, activeHost.welcomeMessage)
        }
      }
    }

    initTopic()
  }, [activeHost?.id, currentAssistant?.id])

  // 主机操作
  const handleAddHost = useCallback(() => {
    setEditingHost(null)
    setHostModalOpen(true)
  }, [])

  const handleEditHost = useCallback((host: Host) => {
    setEditingHost(host)
    setHostModalOpen(true)
  }, [])

  const handleDeleteHost = useCallback(
    (host: Host) => {
      Modal.confirm({
        title: t('hosts.delete'),
        content: t('assistants.delete.content'),
        okButtonProps: { danger: true },
        onOk: () => {
          deleteHost(host.id)
          if (activeHost?.id === host.id) {
            setActiveHost(null)
          }
        }
      })
    },
    [deleteHost, activeHost, t]
  )

  const handleHostModalOk = useCallback(
    (data: { name: string; emoji: string; description: string; welcomeMessage: string }) => {
      if (editingHost) {
        const updatedData = {
          name: data.name,
          emoji: data.emoji,
          description: data.description,
          prompt: data.description,
          welcomeMessage: data.welcomeMessage
        }
        updateHost(editingHost.id, updatedData)
        // 同步更新本地 activeHost 状态
        if (activeHost?.id === editingHost.id) {
          setActiveHost({ ...activeHost, ...updatedData } as Host)
        }
      } else {
        const newHost = createHost({ ...data, welcomeMessage: data.welcomeMessage })
        setActiveHost(newHost)
      }
      setHostModalOpen(false)
    },
    [editingHost, createHost, updateHost, activeHost]
  )

  // 专家操作
  const handleAddExpert = useCallback(() => {
    if (!activeHost) return
    setEditingExpert(null)
    setExpertModalOpen(true)
  }, [activeHost])

  const handleEditExpert = useCallback((expert: Expert) => {
    // 打开完整的专家设置弹窗
    setSettingsExpert(expert)
    setExpertSettingsOpen(true)
  }, [])

  // 处理专家设置保存
  const handleExpertSettingsSave = useCallback(
    (updatedExpert: Expert) => {
      updateExpert(updatedExpert.id, updatedExpert)
      setSettingsExpert(updatedExpert)
      setExpertSettingsOpen(false)
    },
    [updateExpert]
  )

  const handleDeleteExpert = useCallback(
    (expert: Expert) => {
      Modal.confirm({
        title: t('experts.delete'),
        content: t('assistants.delete.content'),
        okButtonProps: { danger: true },
        onOk: () => {
          deleteExpert(expert.id)
        }
      })
    },
    [deleteExpert, t]
  )

  const handleExpertModalOk = useCallback(
    (data: {
      name: string
      emoji: string
      description: string
      handle: string
      triggerKeywords: string[]
      prompt: string
    }) => {
      if (editingExpert) {
        updateExpert(editingExpert.id, data)
      } else {
        createExpert(data)
      }
      setExpertModalOpen(false)
    },
    [editingExpert, createExpert, updateExpert]
  )

  const handleMentionExpert = useCallback(
    (expert: Expert) => {
      // 通过 ExpertContext 设置选中的专家，HostsInputbar 会自动接收
      setMentionedExpert(expert)
    },
    [setMentionedExpert]
  )

  // 打开导入弹窗
  const handleOpenImport = useCallback(() => {
    if (!activeHost) return
    setImportModalOpen(true)
  }, [activeHost])

  // 创建新话题
  const handleAddTopic = useCallback(async () => {
    if (!activeHost || !currentAssistant) return
    const newTopic = getDefaultTopic(activeHost.id)
    await db.topics.add({ id: newTopic.id, messages: [] })
    addTopic(newTopic)
    setActiveTopic(newTopic)

    // 如果主机有欢迎消息，添加到新话题
    if (activeHost.welcomeMessage) {
      await addWelcomeMessage(newTopic.id, activeHost.id, activeHost.welcomeMessage)
    }
  }, [activeHost, currentAssistant, addTopic, addWelcomeMessage])

  // 删除话题
  const handleDeleteTopic = useCallback(
    (topic: Topic) => {
      Modal.confirm({
        title: t('hosts.topics.delete', { defaultValue: '删除对话' }),
        content: t('hosts.topics.delete_confirm', { defaultValue: '确定要删除这个对话吗？删除后无法恢复。' }),
        okButtonProps: { danger: true },
        onOk: async () => {
          // 如果删除的是当前活动话题，先切换到其他话题
          if (activeTopic?.id === topic.id) {
            const remainingTopics = currentAssistant?.topics?.filter((t) => t.id !== topic.id) || []
            setActiveTopic(remainingTopics.length > 0 ? remainingTopics[0] : null)
          }
          // 从 assistant 中移除话题（这会同时从数据库删除）
          removeTopic(topic)
        }
      })
    },
    [t, removeTopic, activeTopic, currentAssistant]
  )

  // 重命名话题
  const handleRenameTopic = useCallback(
    (topic: Topic, newName: string) => {
      updateTopic({ ...topic, name: newName, isNameManuallyEdited: true })
    },
    [updateTopic]
  )

  // 处理导入助手为专家
  const handleImportExperts = useCallback(
    (assistants: Assistant[]) => {
      const imported = importExpertsFromAssistants(assistants)
      setImportModalOpen(false)
      if (imported.length > 0) {
        window.toast?.success?.(t('experts.import.success', { count: imported.length }))
      }
    },
    [importExpertsFromAssistants, t]
  )

  return (
    <Container>
      <Navbar>
        <NavbarCenter style={{ borderRight: 'none' }}>
          <span>{t('hosts.title')}</span>
        </NavbarCenter>
      </Navbar>
      <MainContent $navbarPosition={navbarPosition}>
        <Sidebar>
          {/* 顶部：当前主机信息 */}
          <CurrentHostInfo host={activeHost} onAdd={handleAddHost} />

          {/* 房间列表 */}
          <HostList
            hosts={hosts}
            activeHostId={activeHost?.id}
            onSelect={setActiveHost}
            onAdd={handleAddHost}
            onEdit={handleEditHost}
            onDelete={handleDeleteHost}
          />

          {/* 专家列表 */}
          <ExpertList
            experts={experts}
            onAdd={handleAddExpert}
            onImport={handleOpenImport}
            onEdit={handleEditExpert}
            onDelete={handleDeleteExpert}
            onMention={handleMentionExpert}
            disabled={!activeHost}
          />
        </Sidebar>

        <ChatArea>
          {currentAssistant && activeTopic ? (
            <QuickPanelProvider>
              <HostsChatArea
                assistant={currentAssistant}
                topic={activeTopic}
                setActiveTopic={setActiveTopic}
                experts={experts}
                activeHost={activeHost}
                onHostClick={() => activeHost && handleEditHost(activeHost)}
              />
            </QuickPanelProvider>
          ) : activeHost ? (
            <ChatPlaceholder>
              <PlaceholderIcon>{activeHost.emoji || '🏠'}</PlaceholderIcon>
              <PlaceholderTitle>{activeHost.name}</PlaceholderTitle>
              <PlaceholderDesc>
                {experts.length > 0 ? t('hosts.chat_hint', { count: experts.length }) : t('experts.empty')}
              </PlaceholderDesc>
            </ChatPlaceholder>
          ) : (
            <EmptyStateCenter>
              <EmptyIcon>🏠</EmptyIcon>
              <EmptyTitle>{t('hosts.welcome')}</EmptyTitle>
              <EmptyDescription>{t('hosts.welcome_desc')}</EmptyDescription>
            </EmptyStateCenter>
          )}
        </ChatArea>

        {/* 右侧栏：对话记录 */}
        {activeHost && (
          <RightSidebar>
            <TopicList
              topics={currentAssistant?.topics || []}
              activeTopicId={activeTopic?.id}
              onSelect={setActiveTopic}
              onAdd={handleAddTopic}
              onDelete={handleDeleteTopic}
              onRename={handleRenameTopic}
              disabled={!activeHost}
            />
          </RightSidebar>
        )}
      </MainContent>

      <HostEditModal
        open={hostModalOpen}
        host={editingHost}
        onOk={handleHostModalOk}
        onCancel={() => setHostModalOpen(false)}
      />

      <ExpertEditModal
        open={expertModalOpen}
        expert={editingExpert}
        onOk={handleExpertModalOk}
        onCancel={() => setExpertModalOpen(false)}
      />

      <ExpertSettingsPopup
        open={expertSettingsOpen}
        expert={settingsExpert}
        onSave={handleExpertSettingsSave}
        onCancel={() => setExpertSettingsOpen(false)}
      />

      <ImportExpertModal
        open={importModalOpen}
        onImport={handleImportExperts}
        onCancel={() => setImportModalOpen(false)}
      />
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  background-color: var(--color-background);
`

const MainContent = styled.div<{ $navbarPosition: string }>`
  display: flex;
  flex: 1;
  overflow: hidden;
  height: ${({ $navbarPosition }) => ($navbarPosition === 'top' ? 'calc(100% - var(--navbar-height))' : '100%')};
`

const Sidebar = styled.div`
  width: 280px;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--color-border);
  background: linear-gradient(180deg, var(--color-background-soft) 0%, var(--color-background) 100%);
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 2px;
  }
`

const ChatArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background);
  overflow: hidden;
  position: relative;
`

const RightSidebar = styled.div`
  width: 240px;
  min-width: 240px;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--color-border);
  background: linear-gradient(180deg, var(--color-background-soft) 0%, var(--color-background) 100%);
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 2px;
  }
`

const ChatPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 16px;
  padding: 40px;
`

const PlaceholderIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 24px;
  background: linear-gradient(135deg, var(--color-primary-soft) 0%, var(--color-background-mute) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
`

const PlaceholderTitle = styled.div`
  font-size: 22px;
  font-weight: 600;
  color: var(--color-text);
  margin-top: 8px;
`

const PlaceholderDesc = styled.div`
  font-size: 14px;
  color: var(--color-text-secondary);
  text-align: center;
  max-width: 320px;
  line-height: 1.6;
`

const EmptyStateCenter = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 16px;
  padding: 40px;
`

const EmptyIcon = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 28px;
  background: linear-gradient(135deg, var(--color-background-mute) 0%, var(--color-background-soft) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
`

const EmptyTitle = styled.div`
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  margin-top: 8px;
`

const EmptyDescription = styled.div`
  font-size: 14px;
  color: var(--color-text-secondary);
  text-align: center;
  max-width: 360px;
  line-height: 1.6;
`

// 外层组件，提供 ExpertContext
const HostsPage: FC = () => {
  return (
    <ExpertProvider>
      <HostsPageContent />
    </ExpertProvider>
  )
}

export default HostsPage
