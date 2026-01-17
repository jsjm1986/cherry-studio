import PromptPopup from '@renderer/components/Popups/PromptPopup'
import { QuickPanelProvider } from '@renderer/components/QuickPanel'
import WindowControls from '@renderer/components/WindowControls'
import { useTheme } from '@renderer/context/ThemeProvider'
import { db } from '@renderer/databases'
import { useAssistant } from '@renderer/hooks/useAssistant'
import { useNavbarPosition } from '@renderer/hooks/useSettings'
import { finishTopicRenaming, startTopicRenaming, TopicManager } from '@renderer/hooks/useTopic'
import { fetchMessagesSummary } from '@renderer/services/ApiService'
import { getDefaultTopic } from '@renderer/services/AssistantService'
import { EVENT_NAMES, EventEmitter } from '@renderer/services/EventService'
import store, { useAppDispatch } from '@renderer/store'
import { upsertManyBlocks } from '@renderer/store/messageBlock'
import { newMessagesActions } from '@renderer/store/newMessage'
import { setGenerating } from '@renderer/store/runtime'
import { loadTopicMessagesThunk, saveMessageAndBlocksToDB } from '@renderer/store/thunk/messageThunk'
import type { Assistant, Expert, Host, InfoFolder, RoomUserInfo, Topic } from '@renderer/types'
import { TopicType } from '@renderer/types'
import { AssistantMessageStatus, MessageBlockStatus } from '@renderer/types/newMessage'
import {
  compileCartridgeToPrompt,
  extractExpertInfoFromCartridge,
  parseCartridgeMarkdown
} from '@renderer/utils/cartridge'
import { copyTopicAsMarkdown } from '@renderer/utils/copy'
import { exportTopicAsMarkdown } from '@renderer/utils/export'
import { createAssistantMessage, createMainTextBlock } from '@renderer/utils/messageUtils/create'
import { Input, message, Modal } from 'antd'
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
import NotebookPanel from './components/NotebookPanel'
import { ExpertProvider, useExpertContext } from './context/ExpertContext'
import { useExperts, useHosts } from './hooks/useHosts'
import { useInfoLibrary } from './hooks/useInfoLibrary'

// localStorage 存储最后选中的主机
const LAST_HOST_KEY = 'roome:last-active-host'
const NOTEBOOK_COLLAPSED_KEY = 'roome:notebook-collapsed'

const loadLastHostId = (): string | null => {
  return localStorage.getItem(LAST_HOST_KEY)
}

const saveLastHostId = (hostId: string | null): void => {
  if (hostId) {
    localStorage.setItem(LAST_HOST_KEY, hostId)
  } else {
    localStorage.removeItem(LAST_HOST_KEY)
  }
}

const loadNotebookCollapsed = (): boolean => {
  return localStorage.getItem(NOTEBOOK_COLLAPSED_KEY) === 'true'
}

const saveNotebookCollapsed = (collapsed: boolean): void => {
  localStorage.setItem(NOTEBOOK_COLLAPSED_KEY, String(collapsed))
}

// 内部组件，使用 ExpertContext
const HostsPageContent: FC = () => {
  const { t } = useTranslation()
  const { navbarPosition } = useNavbarPosition()
  const { setMentionedExpert } = useExpertContext()
  const dispatch = useAppDispatch()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // 主机状态
  const { hosts, createHost, updateHost, deleteHost } = useHosts()
  const [activeHost, setActiveHost] = useState<Host | null>(null)
  const [hostModalOpen, setHostModalOpen] = useState(false)
  const [editingHost, setEditingHost] = useState<Host | null>(null)

  // Topic 状态
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null)

  // Tab 状态
  const [activeTab, setActiveTab] = useState<TabType>('chat')

  // Notebook 面板折叠状态
  const [notebookCollapsed, setNotebookCollapsed] = useState(loadNotebookCollapsed)

  // 切换 Notebook 面板折叠状态
  const handleToggleNotebook = useCallback(() => {
    setNotebookCollapsed((prev) => {
      const newValue = !prev
      saveNotebookCollapsed(newValue)
      return newValue
    })
  }, [])

  // 使用 useAssistant hook 获取完整的 assistant 数据
  const {
    assistant: currentAssistant,
    addTopic,
    removeTopic,
    updateTopic,
    updateTopics
  } = useAssistant(activeHost?.id || '')

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

  // 恢复上次选中的主机
  useEffect(() => {
    if (hosts.length > 0 && !activeHost) {
      const lastHostId = loadLastHostId()
      if (lastHostId) {
        const foundHost = hosts.find((h) => h.id === lastHostId)
        if (foundHost) {
          setActiveHost(foundHost)
        }
      }
    }
  }, [hosts, activeHost])

  // 同步 activeHost 与 Redux store（当 hosts 更新时同步 activeHost）
  useEffect(() => {
    if (activeHost) {
      const updatedHost = hosts.find((h) => h.id === activeHost.id)
      if (updatedHost) {
        // 使用 JSON 比较避免不必要的更新
        if (JSON.stringify(updatedHost) !== JSON.stringify(activeHost)) {
          setActiveHost(updatedHost)
        }
      }
    }
  }, [hosts, activeHost])

  // 保存当前选中的主机
  useEffect(() => {
    saveLastHostId(activeHost?.id || null)
  }, [activeHost?.id])

  // 当选择主机时，自动加载或创建 Topic
  useEffect(() => {
    const initTopic = async () => {
      if (!activeHost || !currentAssistant) {
        setActiveTopic(null)
        return
      }

      if (currentAssistant.topics && currentAssistant.topics.length > 0) {
        // 确保话题有正确的 type 字段（用于控制工具栏显示）
        const existingTopic = currentAssistant.topics[0]
        setActiveTopic({ ...existingTopic, type: TopicType.Host })
      } else {
        const newTopic = getDefaultTopic(activeHost.id, TopicType.Host)
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
    (data: {
      name: string
      emoji: string
      description: string
      prompt: string
      welcomeMessage: string
      projectFolderPath: string
    }) => {
      if (editingHost) {
        const updatedData = {
          name: data.name,
          emoji: data.emoji,
          description: data.description,
          prompt: data.prompt,
          welcomeMessage: data.welcomeMessage,
          projectFolderPath: data.projectFolderPath
        }
        updateHost(editingHost.id, updatedData)
        if (activeHost?.id === editingHost.id) {
          setActiveHost({ ...activeHost, ...updatedData } as Host)
        }
      } else {
        const newHost = createHost({ ...data })
        setActiveHost(newHost)
      }
      setHostModalOpen(false)
    },
    [editingHost, createHost, updateHost, activeHost]
  )

  const handleDeleteHost = useCallback(
    (host: Host) => {
      Modal.confirm({
        title: '删除房间',
        content: `确定要删除房间 "${host.name}" 吗？删除后所有相关数据将无法恢复。`,
        okButtonProps: { danger: true },
        onOk: () => {
          deleteHost(host.id)
          if (activeHost?.id === host.id) {
            const remainingHosts = hosts.filter((h) => h.id !== host.id)
            setActiveHost(remainingHosts.length > 0 ? remainingHosts[0] : null)
          }
        }
      })
    },
    [deleteHost, activeHost, hosts]
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
      cartridgeMarkdown?: string
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

  const handleImportCartridge = useCallback(
    (file: File) => {
      if (!activeHost) return
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const markdown = e.target?.result as string
          const cartridgeData = parseCartridgeMarkdown(markdown)
          const compiledPrompt = compileCartridgeToPrompt(cartridgeData)
          const expertInfo = extractExpertInfoFromCartridge(cartridgeData)

          // 创建专家
          createExpert({
            name: expertInfo.name,
            emoji: '👤',
            description: cartridgeData.identity.profession || '',
            handle: expertInfo.handle,
            triggerKeywords: expertInfo.triggerKeywords,
            prompt: compiledPrompt,
            cartridgeMarkdown: markdown
          })

          message.success(t('experts.cartridge.importSuccess'))
        } catch {
          message.error(t('experts.cartridge.importError'))
        }
      }
      reader.readAsText(file, 'UTF-8')
    },
    [activeHost, createExpert, t]
  )

  // 话题操作
  const handleAddTopic = useCallback(async () => {
    if (!activeHost || !currentAssistant) return
    const newTopic = getDefaultTopic(activeHost.id, TopicType.Host)
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

  // 选择话题时确保设置正确的 type 字段
  const handleSelectTopic = useCallback((topic: Topic | null) => {
    if (topic) {
      setActiveTopic({ ...topic, type: TopicType.Host })
    } else {
      setActiveTopic(null)
    }
  }, [])

  // 生成话题名
  const handleGenerateTopicName = useCallback(
    async (topic: Topic) => {
      const messages = await TopicManager.getTopicMessages(topic.id)
      if (messages.length >= 2) {
        startTopicRenaming(topic.id)
        try {
          const summaryText = await fetchMessagesSummary({ messages, assistant: currentAssistant })
          if (summaryText) {
            const updatedTopic = { ...topic, name: summaryText, isNameManuallyEdited: false }
            updateTopic(updatedTopic)
          } else {
            window.toast?.error(t('message.error.fetchTopicName'))
          }
        } finally {
          finishTopicRenaming(topic.id)
        }
      } else {
        window.toast?.warning('需要至少2条消息才能生成话题名')
      }
    },
    [currentAssistant, updateTopic, t]
  )

  // 固定/取消固定话题
  const handlePinTopic = useCallback(
    (topic: Topic) => {
      const updatedTopic = { ...topic, pinned: !topic.pinned }
      updateTopic(updatedTopic)
    },
    [updateTopic]
  )

  // 上移话题
  const handleMoveTopicUp = useCallback(
    (topic: Topic) => {
      if (!currentAssistant?.topics) return
      const topics = [...currentAssistant.topics]
      const index = topics.findIndex((t) => t.id === topic.id)
      if (index > 0) {
        ;[topics[index - 1], topics[index]] = [topics[index], topics[index - 1]]
        updateTopics(topics)
      }
    },
    [currentAssistant?.topics, updateTopics]
  )

  // 下移话题
  const handleMoveTopicDown = useCallback(
    (topic: Topic) => {
      if (!currentAssistant?.topics) return
      const topics = [...currentAssistant.topics]
      const index = topics.findIndex((t) => t.id === topic.id)
      if (index < topics.length - 1) {
        ;[topics[index], topics[index + 1]] = [topics[index + 1], topics[index]]
        updateTopics(topics)
      }
    },
    [currentAssistant?.topics, updateTopics]
  )

  // 复制话题
  const handleCopyTopic = useCallback((topic: Topic) => {
    copyTopicAsMarkdown(topic)
  }, [])

  // 导出话题
  const handleExportTopic = useCallback((topic: Topic) => {
    exportTopicAsMarkdown(topic)
  }, [])

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
    <Container $isDark={isDark}>
      <DragRegion />
      <WindowControls />

      <MainContent $navbarPosition={navbarPosition} $isDark={isDark}>
        {/* 左侧边栏 */}
        <HostsLeftSidebar
          hosts={hosts}
          activeHost={activeHost}
          onSelectHost={setActiveHost}
          onAddHost={handleAddHost}
          onEditHost={handleEditHost}
          onDeleteHost={handleDeleteHost}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          topics={currentAssistant?.topics || []}
          activeTopic={activeTopic}
          onSelectTopic={handleSelectTopic}
          onAddTopic={handleAddTopic}
          onDeleteTopic={handleDeleteTopic}
          onRenameTopic={handleRenameTopic}
          onGenerateTopicName={handleGenerateTopicName}
          onPinTopic={handlePinTopic}
          onMoveTopicUp={handleMoveTopicUp}
          onMoveTopicDown={handleMoveTopicDown}
          onCopyTopic={handleCopyTopic}
          onExportTopic={handleExportTopic}
          members={experts}
          onAddMember={handleAddExpert}
          onImportMember={handleOpenImport}
          onImportCartridge={handleImportCartridge}
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
        <ContentArea $isDark={isDark}>
          <ChatArea $isDark={isDark}>
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
                <EmptyTitle>欢迎使用房间与专家</EmptyTitle>
                <EmptyDescription>创建房间并添加专家，开始多角色协作对话</EmptyDescription>
              </EmptyStateCenter>
            )}
          </ChatArea>

          {/* 资料库内容面板 */}
          {selectedInfoFolder && activeHost && (
            <InfoFolderContentPanel folder={selectedInfoFolder} hostId={activeHost.id} onClose={handleCloseInfoPanel} />
          )}
        </ContentArea>

        {/* 右侧 Notebook 面板 */}
        {activeHost && (
          <NotebookPanel
            host={activeHost}
            collapsed={notebookCollapsed}
            onToggleCollapse={handleToggleNotebook}
            onUpdateHost={updateHost}
          />
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

const Container = styled.div<{ $isDark: boolean }>`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  background-color: ${({ $isDark }) => ($isDark ? '#1a1a2e' : '#f8fafc')};

  /* 覆盖全局主色为蓝色 - 影响所有子组件 */
  --color-primary: #3b82f6;
  --color-primary-soft: rgba(59, 130, 246, 0.15);
  --color-primary-mute: rgba(59, 130, 246, 0.08);
  --color-primary-hover: #2563eb;

  /* 主题变量 */
  --hosts-bg: ${({ $isDark }) => ($isDark ? '#1a1a2e' : '#f8fafc')};
  --hosts-bg-soft: ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb')};
  --hosts-text: ${({ $isDark }) => ($isDark ? '#ffffff' : '#1f2937')};
  --hosts-text-secondary: ${({ $isDark }) => ($isDark ? '#9ca3af' : '#6b7280')};
  --hosts-primary: #3b82f6;
  --hosts-primary-soft: ${({ $isDark }) => ($isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)')};
`

const DragRegion = styled.div`
  position: fixed;
  top: 0;
  left: var(--sidebar-width);
  right: 140px;
  height: var(--navbar-height);
  -webkit-app-region: drag;
  z-index: 100;
`

const MainContent = styled.div<{ $navbarPosition: string; $isDark: boolean }>`
  display: flex;
  flex: 1;
  overflow: hidden;
  height: 100%;
  background-color: ${({ $isDark }) => ($isDark ? '#1a1a2e' : '#f8fafc')};
  gap: 12px;
  padding: 12px;
  padding-top: calc(var(--navbar-height) + 4px);
`

const ContentArea = styled.div<{ $isDark: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: ${({ $isDark }) => ($isDark ? '#0f0f1a' : '#ffffff')};
  border-radius: 12px;
  box-shadow: ${({ $isDark }) => ($isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)')};
`

const ChatArea = styled.div<{ $isDark: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: ${({ $isDark }) => ($isDark ? '#0f0f1a' : '#ffffff')};
  overflow: hidden;
  position: relative;
  border-radius: 12px;
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
  background: linear-gradient(135deg, var(--hosts-primary-soft) 0%, var(--hosts-bg-soft) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.1);
`

const PlaceholderTitle = styled.div`
  font-size: 22px;
  font-weight: 600;
  color: var(--hosts-text);
  margin-top: 8px;
`

const PlaceholderDesc = styled.div`
  font-size: 14px;
  color: var(--hosts-text-secondary);
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
  background: linear-gradient(135deg, var(--hosts-primary-soft) 0%, var(--hosts-bg-soft) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.1);
`

const EmptyTitle = styled.div`
  font-size: 20px;
  font-weight: 600;
  color: var(--hosts-text);
  margin-top: 8px;
`

const EmptyDescription = styled.div`
  font-size: 14px;
  color: var(--hosts-text-secondary);
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
