import { Navbar, NavbarCenter } from '@renderer/components/app/Navbar'
import { QuickPanelProvider } from '@renderer/components/QuickPanel'
import { useAssistant } from '@renderer/hooks/useAssistant'
import { useNavbarPosition } from '@renderer/hooks/useSettings'
import { db } from '@renderer/databases'
import { getDefaultTopic } from '@renderer/services/AssistantService'
import { useAppDispatch } from '@renderer/store'
import { upsertManyBlocks } from '@renderer/store/messageBlock'
import { newMessagesActions } from '@renderer/store/newMessage'
import { loadTopicMessagesThunk, saveMessageAndBlocksToDB } from '@renderer/store/thunk/messageThunk'
import type { Assistant, Expert, Host, InfoFolder, RoomUserInfo, Topic } from '@renderer/types'
import { AssistantMessageStatus, MessageBlockStatus } from '@renderer/types/newMessage'
import { createAssistantMessage, createMainTextBlock } from '@renderer/utils/messageUtils/create'
import { Input, Modal } from 'antd'
import type { FC } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import ExpertEditModal from './components/ExpertEditModal'
import ExpertSettingsPopup from './components/ExpertSettingsPopup'
import HostEditModal from './components/HostEditModal'
import HostsChatArea from './components/HostsChatArea'
import HostsLeftSidebar, { type TabType } from './components/HostsLeftSidebar'
import ImportExpertModal from './components/ImportExpertModal'
import InfoFolderContentPanel from './components/InfoFolderContentPanel'
import { ExpertProvider, useExpertContext } from './context/ExpertContext'
import { useExperts, useHosts } from './hooks/useHosts'
import { useInfoLibrary } from './hooks/useInfoLibrary'

// 内部组件，使用 ExpertContext
const HostsPageContent: FC = () => {
  const { t } = useTranslation()
  const { navbarPosition } = useNavbarPosition()
  const { setMentionedExpert } = useExpertContext()
  const dispatch = useAppDispatch()

  // 主机状态
  const { hosts, createHost, updateHost } = useHosts()
  const [activeHost, setActiveHost] = useState<Host | null>(null)
  const [hostModalOpen, setHostModalOpen] = useState(false)
  const [editingHost, setEditingHost] = useState<Host | null>(null)

  // Topic 状态
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null)

  // Tab 状态
  const [activeTab, setActiveTab] = useState<TabType>('chat')

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

  // 资料库状态
  const { folders: infoFolders, createFolder, deleteFolder } = useInfoLibrary(activeHost?.id || '')
  const [selectedInfoFolder, setSelectedInfoFolder] = useState<InfoFolder | null>(null)

  // 添加欢迎消息到话题
  const addWelcomeMessage = useCallback(
    async (topicId: string, hostId: string, welcomeMessage: string) => {
      const message = createAssistantMessage(hostId, topicId)
      message.status = AssistantMessageStatus.SUCCESS

      const textBlock = createMainTextBlock(message.id, welcomeMessage, {
        status: MessageBlockStatus.SUCCESS
      })

      message.blocks = [textBlock.id]
      dispatch(upsertManyBlocks([textBlock]))
      dispatch(newMessagesActions.addMessage({ topicId, message }))
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

      if (currentAssistant.topics && currentAssistant.topics.length > 0) {
        setActiveTopic(currentAssistant.topics[0])
      } else {
        const newTopic = getDefaultTopic(activeHost.id)
        await db.topics.add({ id: newTopic.id, messages: [] })
        addTopic(newTopic)
        setActiveTopic(newTopic)

        if (activeHost.welcomeMessage) {
          await addWelcomeMessage(newTopic.id, activeHost.id, activeHost.welcomeMessage)
        }
      }
    }

    initTopic()
  }, [activeHost?.id, currentAssistant?.id])

  // 当 activeTopic 改变时，加载消息
  useEffect(() => {
    if (activeTopic) {
      dispatch(loadTopicMessagesThunk(activeTopic.id))
    }
  }, [activeTopic?.id, dispatch])

  // 主机操作
  const handleAddHost = useCallback(() => {
    setEditingHost(null)
    setHostModalOpen(true)
  }, [])

  const handleEditHost = useCallback((host: Host) => {
    setEditingHost(host)
    setHostModalOpen(true)
  }, [])

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
    setSettingsExpert(expert)
    setExpertSettingsOpen(true)
  }, [])

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
      setMentionedExpert(expert)
    },
    [setMentionedExpert]
  )

  const handleOpenImport = useCallback(() => {
    if (!activeHost) return
    setImportModalOpen(true)
  }, [activeHost])

  // 话题操作
  const handleAddTopic = useCallback(async () => {
    if (!activeHost || !currentAssistant) return
    const newTopic = getDefaultTopic(activeHost.id)
    await db.topics.add({ id: newTopic.id, messages: [] })
    addTopic(newTopic)
    setActiveTopic(newTopic)

    if (activeHost.welcomeMessage) {
      await addWelcomeMessage(newTopic.id, activeHost.id, activeHost.welcomeMessage)
    }
  }, [activeHost, currentAssistant, addTopic, addWelcomeMessage])

  const handleDeleteTopic = useCallback(
    (topic: Topic) => {
      Modal.confirm({
        title: '删除对话',
        content: '确定要删除这个对话吗？删除后无法恢复。',
        okButtonProps: { danger: true },
        onOk: async () => {
          if (activeTopic?.id === topic.id) {
            const remainingTopics = currentAssistant?.topics?.filter((t) => t.id !== topic.id) || []
            setActiveTopic(remainingTopics.length > 0 ? remainingTopics[0] : null)
          }
          removeTopic(topic)
        }
      })
    },
    [removeTopic, activeTopic, currentAssistant]
  )

  const handleRenameTopic = useCallback(
    (topic: Topic, newName: string) => {
      updateTopic({ ...topic, name: newName, isNameManuallyEdited: true })
    },
    [updateTopic]
  )

  const handleImportExperts = useCallback(
    (assistants: Assistant[]) => {
      const imported = importExpertsFromAssistants(assistants)
      setImportModalOpen(false)
      if (imported.length > 0) {
        window.toast?.success?.(`成功导入 ${imported.length} 位专家`)
      }
    },
    [importExpertsFromAssistants]
  )

  const handleUpdateUserInfo = useCallback(
    (hostId: string, userInfo: RoomUserInfo) => {
      updateHost(hostId, { userInfo })
      if (activeHost?.id === hostId) {
        setActiveHost({ ...activeHost, userInfo } as Host)
      }
    },
    [updateHost, activeHost]
  )

  // 资料库操作
  const handleAddInfoFolder = useCallback(() => {
    if (!activeHost) return
    let folderName = ''
    Modal.confirm({
      title: '新建文件夹',
      content: (
        <Input
          placeholder="请输入文件夹名称"
          onChange={(e) => {
            folderName = e.target.value
          }}
          onPressEnter={() => {
            if (folderName.trim()) {
              Modal.destroyAll()
              createFolder({ name: folderName.trim() })
            }
          }}
          autoFocus
        />
      ),
      okText: '创建',
      cancelText: '取消',
      onOk: () => {
        if (folderName.trim()) {
          createFolder({ name: folderName.trim() })
        }
      }
    })
  }, [activeHost, createFolder])

  const handleSelectInfoFolder = useCallback((folder: InfoFolder) => {
    setSelectedInfoFolder(folder)
  }, [])

  const handleDeleteInfoFolder = useCallback(
    (folder: InfoFolder) => {
      Modal.confirm({
        title: '删除文件夹',
        content: `确定要删除文件夹 "${folder.name}" 及其所有内容吗？`,
        okButtonProps: { danger: true },
        onOk: () => {
          deleteFolder(folder.id)
          setSelectedInfoFolder((prev) => (prev?.id === folder.id ? null : prev))
        }
      })
    },
    [deleteFolder]
  )

  const handleCloseInfoPanel = useCallback(() => {
    setSelectedInfoFolder(null)
  }, [])

  return (
    <Container>
      <Navbar>
        <NavbarCenter style={{ borderRight: 'none' }}>
          <span>{t('hosts.title')}</span>
        </NavbarCenter>
      </Navbar>

      <MainContent $navbarPosition={navbarPosition}>
        {/* 左侧边栏 */}
        <HostsLeftSidebar
          hosts={hosts}
          activeHost={activeHost}
          onSelectHost={setActiveHost}
          onAddHost={handleAddHost}
          onEditHost={handleEditHost}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          topics={currentAssistant?.topics || []}
          activeTopic={activeTopic}
          onSelectTopic={setActiveTopic}
          onAddTopic={handleAddTopic}
          onDeleteTopic={handleDeleteTopic}
          onRenameTopic={handleRenameTopic}
          members={experts}
          onAddMember={handleAddExpert}
          onImportMember={handleOpenImport}
          onEditMember={handleEditExpert}
          onDeleteMember={handleDeleteExpert}
          onMentionMember={handleMentionExpert}
          onUpdateUserInfo={handleUpdateUserInfo}
          infoFolders={infoFolders}
          onAddInfoFolder={handleAddInfoFolder}
          onSelectInfoFolder={handleSelectInfoFolder}
          onDeleteInfoFolder={handleDeleteInfoFolder}
          selectedInfoFolderId={selectedInfoFolder?.id}
        />

        {/* 主内容区域 - 始终显示聊天界面 */}
        <ContentArea>
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
                  {experts.length > 0
                    ? `已添加 ${experts.length} 位专家，使用 @ 提及专家开始对话`
                    : '暂无专家，请先添加专家'}
                </PlaceholderDesc>
              </ChatPlaceholder>
            ) : (
              <EmptyStateCenter>
                <EmptyIcon>🏠</EmptyIcon>
                <EmptyTitle>欢迎使用主机与专家</EmptyTitle>
                <EmptyDescription>创建主机并添加专家，开始多角色协作对话</EmptyDescription>
              </EmptyStateCenter>
            )}
          </ChatArea>

          {/* 资料库内容面板 */}
          {selectedInfoFolder && activeHost && (
            <InfoFolderContentPanel folder={selectedInfoFolder} hostId={activeHost.id} onClose={handleCloseInfoPanel} />
          )}
        </ContentArea>
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

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const ChatArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background);
  overflow: hidden;
  position: relative;
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
