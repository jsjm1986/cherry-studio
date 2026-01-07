import { useTheme } from '@renderer/context/ThemeProvider'
import { useAppSelector } from '@renderer/store'
import { selectMessagesForTopic } from '@renderer/store/newMessage'
import type { Expert, Host, InfoFolder, RoomUserInfo, Topic } from '@renderer/types'
import { Dropdown } from 'antd'
import {
  AtSign,
  ChevronDown,
  Download,
  FileText,
  FileUp,
  Folder,
  Info,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Settings,
  Trash2,
  User,
  UserPlus,
  Users
} from 'lucide-react'
import type { FC } from 'react'
import { useCallback, useRef, useState } from 'react'
import styled from 'styled-components'

export type TabType = 'chat' | 'configuration'

interface Props {
  // 房间相关
  hosts: Host[]
  activeHost: Host | null
  onSelectHost: (host: Host) => void
  onAddHost: () => void
  onEditHost: (host: Host) => void
  onDeleteHost: (host: Host) => void
  // Tab 相关
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  // 话题相关
  topics: Topic[]
  activeTopic: Topic | null
  onSelectTopic: (topic: Topic) => void
  onAddTopic: () => void
  onDeleteTopic: (topic: Topic) => void
  onRenameTopic: (topic: Topic, newName: string) => void
  // 成员相关
  members: Expert[]
  onAddMember: () => void
  onImportMember?: () => void
  onImportCartridge?: (file: File) => void
  onEditMember: (member: Expert) => void
  onDeleteMember: (member: Expert) => void
  onMentionMember: (member: Expert) => void
  // 资料库相关
  infoFolders: InfoFolder[]
  onAddInfoFolder: () => void
  onSelectInfoFolder: (folder: InfoFolder) => void
  onDeleteInfoFolder: (folder: InfoFolder) => void
  selectedInfoFolderId?: string
  // 用户信息
  onUpdateUserInfo?: (hostId: string, userInfo: RoomUserInfo) => void
}

const HostsLeftSidebar: FC<Props> = ({
  hosts,
  activeHost,
  onSelectHost,
  onAddHost,
  onEditHost,
  onDeleteHost,
  activeTab,
  onTabChange,
  topics,
  activeTopic,
  onSelectTopic,
  onAddTopic,
  onDeleteTopic,
  onRenameTopic,
  members,
  onAddMember,
  onImportMember,
  onImportCartridge,
  onEditMember,
  onDeleteMember,
  onMentionMember,
  infoFolders,
  onAddInfoFolder,
  onSelectInfoFolder,
  onDeleteInfoFolder,
  selectedInfoFolderId,
  onUpdateUserInfo
}) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [showRoomDropdown, setShowRoomDropdown] = useState(false)
  const [projectCollapsed, setProjectCollapsed] = useState(false)
  const [memberCollapsed, setMemberCollapsed] = useState(false)
  const [infoCollapsed, setInfoCollapsed] = useState(false)
  const [aboutCollapsed, setAboutCollapsed] = useState(false)
  const [renamingTopicId, setRenamingTopicId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  // 卡带导入文件输入
  const cartridgeInputRef = useRef<HTMLInputElement>(null)

  // 用户信息编辑状态
  const [isEditingUserInfo, setIsEditingUserInfo] = useState(false)
  const [editingUserInfo, setEditingUserInfo] = useState<RoomUserInfo>({})

  const handleSelectRoom = useCallback(
    (host: Host) => {
      onSelectHost(host)
      setShowRoomDropdown(false)
    },
    [onSelectHost]
  )

  const handleStartRename = useCallback((topic: Topic) => {
    setRenamingTopicId(topic.id)
    setRenameValue(topic.name)
  }, [])

  const handleFinishRename = useCallback(
    (topic: Topic) => {
      if (renameValue.trim() && renameValue !== topic.name) {
        onRenameTopic(topic, renameValue.trim())
      }
      setRenamingTopicId(null)
      setRenameValue('')
    },
    [renameValue, onRenameTopic]
  )

  const handleStartEditUserInfo = useCallback(() => {
    setEditingUserInfo(activeHost?.userInfo || {})
    setIsEditingUserInfo(true)
  }, [activeHost?.userInfo])

  const handleSaveUserInfo = useCallback(() => {
    if (activeHost && onUpdateUserInfo) {
      onUpdateUserInfo(activeHost.id, editingUserInfo)
    }
    setIsEditingUserInfo(false)
  }, [activeHost, editingUserInfo, onUpdateUserInfo])

  // 获取当前话题的消息数量
  const messages = useAppSelector((state) => (activeTopic ? selectMessagesForTopic(state, activeTopic.id) : []))
  const messageCount = messages.length

  const disabled = !activeHost

  return (
    <Container $isDark={isDark}>
      <ScrollArea $isDark={isDark}>
        {/* 房间选择器 */}
        <RoomSelector>
          <RoomButton onClick={() => setShowRoomDropdown(!showRoomDropdown)} $active={showRoomDropdown}>
            {activeHost ? (
              <>
                <RoomEmoji>{activeHost.emoji || '🏠'}</RoomEmoji>
                <RoomInfo>
                  <RoomName>{activeHost.name}</RoomName>
                  {activeHost.description && <RoomDesc>{activeHost.description}</RoomDesc>}
                </RoomInfo>
              </>
            ) : (
              <>
                <RoomEmoji>🏠</RoomEmoji>
                <RoomInfo>
                  <RoomName>选择房间</RoomName>
                </RoomInfo>
              </>
            )}
            <ChevronDown size={16} className={showRoomDropdown ? 'rotate' : ''} />
          </RoomButton>

          {showRoomDropdown && (
            <RoomDropdown>
              {hosts.map((host) => (
                <RoomDropdownItem
                  key={host.id}
                  onClick={() => handleSelectRoom(host)}
                  $active={activeHost?.id === host.id}>
                  <span className="emoji">{host.emoji || '🏠'}</span>
                  <span className="name">{host.name}</span>
                  <RoomItemActions className="actions">
                    <Dropdown
                      trigger={['click']}
                      menu={{
                        items: [
                          {
                            key: 'edit',
                            label: '编辑',
                            icon: <Pencil size={14} />,
                            onClick: (e) => {
                              e.domEvent.stopPropagation()
                              onEditHost(host)
                              setShowRoomDropdown(false)
                            }
                          },
                          {
                            key: 'delete',
                            label: '删除',
                            icon: <Trash2 size={14} />,
                            danger: true,
                            onClick: (e) => {
                              e.domEvent.stopPropagation()
                              onDeleteHost(host)
                              setShowRoomDropdown(false)
                            }
                          }
                        ]
                      }}>
                      <ActionIcon onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal size={14} />
                      </ActionIcon>
                    </Dropdown>
                  </RoomItemActions>
                </RoomDropdownItem>
              ))}
              {hosts.length === 0 && <EmptyHint>暂无房间</EmptyHint>}
              <DropdownDivider />
              <RoomDropdownItem onClick={onAddHost} $isAction>
                <Plus size={14} />
                <span>创建房间</span>
              </RoomDropdownItem>
            </RoomDropdown>
          )}
        </RoomSelector>

        {/* Chat / Configuration 标签 */}
        <TabsContainer>
          <TabButton $active={activeTab === 'chat'} onClick={() => onTabChange('chat')}>
            <MessageSquare size={14} />
            <span>话题</span>
          </TabButton>
          <TabButton $active={activeTab === 'configuration'} onClick={() => onTabChange('configuration')}>
            <Settings size={14} />
            <span>配置</span>
          </TabButton>
        </TabsContainer>

        {/* Chat 标签：显示对话列表 */}
        {activeTab === 'chat' && (
          <Section>
            <SectionHeader onClick={() => !disabled && setProjectCollapsed(!projectCollapsed)}>
              <SectionHeaderLeft>
                <CollapseIcon $collapsed={projectCollapsed} $disabled={disabled}>
                  <ChevronDown size={14} />
                </CollapseIcon>
                <SectionTitle $disabled={disabled}>话题列表</SectionTitle>
                {topics.length > 0 && <Badge>{topics.length}</Badge>}
              </SectionHeaderLeft>
              {!disabled && (
                <AddButton
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddTopic()
                  }}>
                  <Plus size={12} />
                </AddButton>
              )}
            </SectionHeader>
            {!projectCollapsed && (
              <SectionContent>
                {disabled ? (
                  <EmptyState>请先选择一个房间</EmptyState>
                ) : topics.length === 0 ? (
                  <EmptyState>暂无对话记录</EmptyState>
                ) : (
                  topics.map((topic) => (
                    <TopicItem
                      key={topic.id}
                      $active={activeTopic?.id === topic.id}
                      onClick={() => onSelectTopic(topic)}>
                      <FileText size={14} />
                      {renamingTopicId === topic.id ? (
                        <RenameInput
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={() => handleFinishRename(topic)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleFinishRename(topic)
                            if (e.key === 'Escape') {
                              setRenamingTopicId(null)
                              setRenameValue('')
                            }
                          }}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <TopicName>{topic.name}</TopicName>
                      )}
                      <TopicActions className="actions">
                        <ActionIcon
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStartRename(topic)
                          }}>
                          <Pencil size={12} />
                        </ActionIcon>
                        <ActionIcon
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteTopic(topic)
                          }}>
                          <Trash2 size={12} />
                        </ActionIcon>
                      </TopicActions>
                    </TopicItem>
                  ))
                )}
              </SectionContent>
            )}
          </Section>
        )}

        {/* Configuration 标签：显示 Member + Information + About */}
        {activeTab === 'configuration' && (
          <>
            {/* Member 区域 - 成员列表 */}
            <Section>
              <SectionHeader onClick={() => !disabled && setMemberCollapsed(!memberCollapsed)}>
                <SectionHeaderLeft>
                  <CollapseIcon $collapsed={memberCollapsed} $disabled={disabled}>
                    <ChevronDown size={14} />
                  </CollapseIcon>
                  <SectionTitle $disabled={disabled}>Member 角色</SectionTitle>
                  {members.length > 0 && <Badge>{members.length}</Badge>}
                </SectionHeaderLeft>
                {!disabled && (
                  <Dropdown
                    trigger={['click']}
                    menu={{
                      items: [
                        {
                          key: 'add',
                          label: '添加专家',
                          icon: <UserPlus size={14} />,
                          onClick: (e) => {
                            e.domEvent.stopPropagation()
                            onAddMember()
                          }
                        },
                        {
                          key: 'import',
                          label: '从卡带库导入',
                          icon: <Download size={14} />,
                          onClick: (e) => {
                            e.domEvent.stopPropagation()
                            onImportMember?.()
                          }
                        },
                        {
                          key: 'cartridge',
                          label: '从MD导入卡带',
                          icon: <FileUp size={14} />,
                          onClick: (e) => {
                            e.domEvent.stopPropagation()
                            cartridgeInputRef.current?.click()
                          }
                        }
                      ]
                    }}>
                    <AddButton onClick={(e) => e.stopPropagation()}>
                      <Plus size={12} />
                    </AddButton>
                  </Dropdown>
                )}
              </SectionHeader>
              {!memberCollapsed && (
                <SectionContent>
                  {disabled ? (
                    <EmptyState>请先选择一个房间</EmptyState>
                  ) : members.length === 0 ? (
                    <EmptyState>暂无成员</EmptyState>
                  ) : (
                    members.map((member) => (
                      <MemberItem key={member.id}>
                        <MemberInfo onClick={() => onMentionMember(member)}>
                          <MemberAvatar>{member.emoji || '👤'}</MemberAvatar>
                          <MemberDetails>
                            <MemberName>{member.name}</MemberName>
                            <MemberHandle>
                              <AtSign size={10} />
                              {member.handle?.replace('@', '') || member.name}
                            </MemberHandle>
                          </MemberDetails>
                        </MemberInfo>
                        <MemberActions className="actions">
                          <ActionIcon onClick={() => onMentionMember(member)} title="@提及">
                            <AtSign size={12} />
                          </ActionIcon>
                          <Dropdown
                            trigger={['click']}
                            menu={{
                              items: [
                                {
                                  key: 'edit',
                                  label: '编辑',
                                  icon: <Pencil size={14} />,
                                  onClick: () => onEditMember(member)
                                },
                                {
                                  key: 'delete',
                                  label: '删除',
                                  icon: <Trash2 size={14} />,
                                  danger: true,
                                  onClick: () => onDeleteMember(member)
                                }
                              ]
                            }}>
                            <ActionIcon>
                              <MoreHorizontal size={12} />
                            </ActionIcon>
                          </Dropdown>
                        </MemberActions>
                      </MemberItem>
                    ))
                  )}
                </SectionContent>
              )}
            </Section>

            {/* Information 区域 */}
            <Section>
              <SectionHeader onClick={() => !disabled && setInfoCollapsed(!infoCollapsed)}>
                <SectionHeaderLeft>
                  <CollapseIcon $collapsed={infoCollapsed} $disabled={disabled}>
                    <ChevronDown size={14} />
                  </CollapseIcon>
                  <SectionTitle $disabled={disabled}>Information 资料</SectionTitle>
                  {infoFolders.length > 0 && <Badge>{infoFolders.length}</Badge>}
                </SectionHeaderLeft>
                {!disabled && (
                  <AddButton
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddInfoFolder()
                    }}>
                    <Plus size={12} />
                  </AddButton>
                )}
              </SectionHeader>
              {!infoCollapsed && (
                <SectionContent>
                  {disabled ? (
                    <EmptyState>请先选择一个房间</EmptyState>
                  ) : infoFolders.length === 0 ? (
                    <EmptyState>暂无资料</EmptyState>
                  ) : (
                    infoFolders.map((folder) => (
                      <FolderItem
                        key={folder.id}
                        $active={selectedInfoFolderId === folder.id}
                        onClick={() => onSelectInfoFolder(folder)}>
                        <Folder size={14} />
                        <FolderName>
                          {folder.emoji || '📁'} {folder.name}
                        </FolderName>
                        <FolderBadge>{folder.items.length}</FolderBadge>
                        <FolderActions className="actions">
                          <ActionIcon
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteInfoFolder(folder)
                            }}>
                            <Trash2 size={12} />
                          </ActionIcon>
                        </FolderActions>
                      </FolderItem>
                    ))
                  )}
                </SectionContent>
              )}
            </Section>

            {/* About 区域 */}
            <Section>
              <SectionHeader onClick={() => !disabled && setAboutCollapsed(!aboutCollapsed)}>
                <SectionHeaderLeft>
                  <CollapseIcon $collapsed={aboutCollapsed} $disabled={disabled}>
                    <ChevronDown size={14} />
                  </CollapseIcon>
                  <SectionTitle $disabled={disabled}>About 关于</SectionTitle>
                </SectionHeaderLeft>
              </SectionHeader>
              {!aboutCollapsed && (
                <SectionContent>
                  {disabled ? (
                    <EmptyState>请先选择一个房间</EmptyState>
                  ) : isEditingUserInfo ? (
                    <UserInfoForm>
                      <FormGroup>
                        <FormLabel>角色/身份</FormLabel>
                        <FormInput
                          value={editingUserInfo.role || ''}
                          onChange={(e) => setEditingUserInfo({ ...editingUserInfo, role: e.target.value })}
                          placeholder="例如：产品经理、开发者"
                        />
                      </FormGroup>
                      <FormGroup>
                        <FormLabel>自我介绍</FormLabel>
                        <FormTextarea
                          value={editingUserInfo.introduction || ''}
                          onChange={(e) => setEditingUserInfo({ ...editingUserInfo, introduction: e.target.value })}
                          placeholder="简单介绍一下自己"
                          rows={2}
                        />
                      </FormGroup>
                      <FormActions>
                        <FormButton onClick={() => setIsEditingUserInfo(false)}>取消</FormButton>
                        <FormButton $primary onClick={handleSaveUserInfo}>
                          保存
                        </FormButton>
                      </FormActions>
                    </UserInfoForm>
                  ) : (
                    <>
                      <InfoItem>
                        <Info size={12} />
                        <InfoLabel>房间描述</InfoLabel>
                      </InfoItem>
                      <InfoContent>{activeHost?.description || '暂无描述'}</InfoContent>

                      <InfoItem>
                        <Users size={12} />
                        <InfoLabel>成员统计</InfoLabel>
                      </InfoItem>
                      <StatsRow>
                        <StatBox>
                          <StatValue>{members.length}</StatValue>
                          <StatLabel>总成员</StatLabel>
                        </StatBox>
                        <StatBox>
                          <StatValue>{messageCount}</StatValue>
                          <StatLabel>对话信息</StatLabel>
                        </StatBox>
                      </StatsRow>

                      <InfoItem>
                        <User size={12} />
                        <InfoLabel>个人简历</InfoLabel>
                        {(activeHost?.userInfo?.role || activeHost?.userInfo?.introduction) && (
                          <EditButton onClick={handleStartEditUserInfo} title="编辑个人简历">
                            <Pencil size={12} />
                          </EditButton>
                        )}
                      </InfoItem>
                      {activeHost?.userInfo?.role || activeHost?.userInfo?.introduction ? (
                        <>
                          {activeHost?.userInfo?.role && <AboutItem>{activeHost.userInfo.role}</AboutItem>}
                          {activeHost?.userInfo?.introduction && (
                            <AboutItem>{activeHost.userInfo.introduction}</AboutItem>
                          )}
                        </>
                      ) : (
                        <EmptyUserInfo onClick={handleStartEditUserInfo}>点击添加您的个人信息</EmptyUserInfo>
                      )}
                    </>
                  )}
                </SectionContent>
              )}
            </Section>
          </>
        )}
      </ScrollArea>

      {/* 底部设置 */}
      <BottomSection>
        <SettingsButton onClick={() => activeHost && onEditHost(activeHost)} disabled={disabled}>
          <Settings size={16} />
          <span>Settings</span>
        </SettingsButton>
      </BottomSection>

      {/* 隐藏的卡带文件输入 */}
      <input
        ref={cartridgeInputRef}
        type="file"
        accept=".md,.markdown"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file && onImportCartridge) {
            onImportCartridge(file)
          }
          e.target.value = '' // 重置以允许重复选择同一文件
        }}
      />
    </Container>
  )
}

// Styled Components
const Container = styled.div<{ $isDark: boolean }>`
  display: flex;
  flex-direction: column;
  width: 280px;
  min-width: 280px;
  height: 100%;
  background: ${({ $isDark }) => ($isDark ? '#0f0f1a' : '#ffffff')};
  border-radius: 12px;
  box-shadow: ${({ $isDark }) =>
    $isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)'};

  /* 主题变量 - 供子组件使用 */
  --sidebar-bg: ${({ $isDark }) => ($isDark ? '#0f0f1a' : '#ffffff')};
  --sidebar-bg-hover: ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb')};
  --sidebar-bg-active: ${({ $isDark }) => ($isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)')};
  --sidebar-border: ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0')};
  --sidebar-text: ${({ $isDark }) => ($isDark ? '#ffffff' : '#1f2937')};
  --sidebar-text-secondary: ${({ $isDark }) => ($isDark ? '#9ca3af' : '#6b7280')};
  --sidebar-text-muted: ${({ $isDark }) => ($isDark ? '#6b7280' : '#9ca3af')};
  --sidebar-primary: #3b82f6;
  --sidebar-primary-soft: ${({ $isDark }) => ($isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)')};
`

const ScrollArea = styled.div<{ $isDark?: boolean }>`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--sidebar-border);
    border-radius: 2px;
  }
`

// 房间选择器
const RoomSelector = styled.div`
  position: relative;
  padding: 12px;
  border-bottom: 1px solid var(--sidebar-border);
`

const RoomButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  background: ${({ $active }) => ($active ? 'var(--sidebar-bg-active)' : 'var(--sidebar-bg-hover)')};
  border: 1px solid ${({ $active }) => ($active ? 'rgba(59,130,246,0.3)' : 'var(--sidebar-border)')};
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: var(--sidebar-bg-active);
    border-color: rgba(59,130,246,0.3);
  }

  .rotate {
    transform: rotate(180deg);
  }

  svg {
    color: var(--sidebar-text-secondary);
    transition: transform 0.15s ease;
    flex-shrink: 0;
  }
`

const RoomEmoji = styled.span`
  font-size: 20px;
  flex-shrink: 0;
`

const RoomInfo = styled.div`
  flex: 1;
  text-align: left;
  overflow: hidden;
`

const RoomName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: var(--sidebar-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const RoomDesc = styled.div`
  font-size: 11px;
  color: var(--sidebar-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
`

const RoomDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 12px;
  right: 12px;
  margin-top: 4px;
  background: var(--sidebar-bg);
  border: 1px solid var(--sidebar-border);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  padding: 4px;
  max-height: 300px;
  overflow-y: auto;
`

const RoomDropdownItem = styled.div<{ $active?: boolean; $isAction?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 8px;
  font-size: 13px;
  color: ${({ $isAction }) => ($isAction ? 'var(--sidebar-primary)' : 'var(--sidebar-text)')};
  background: ${({ $active }) => ($active ? 'var(--sidebar-primary-soft)' : 'transparent')};
  border: 1px solid ${({ $active }) => ($active ? 'rgba(59,130,246,0.3)' : 'transparent')};
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $active }) => ($active ? 'var(--sidebar-primary-soft)' : 'var(--sidebar-bg-hover)')};
  }

  &:hover .actions {
    opacity: 1;
  }

  .emoji {
    font-size: 16px;
  }

  .name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

const DropdownDivider = styled.div`
  height: 1px;
  background: var(--sidebar-border);
  margin: 4px 0;
`

const EmptyHint = styled.div`
  padding: 12px;
  text-align: center;
  color: var(--sidebar-text-muted);
  font-size: 12px;
`

// 标签切换
const TabsContainer = styled.div`
  display: flex;
  padding: 8px 12px;
  gap: 4px;
  border-bottom: 1px solid var(--sidebar-border);
`

const TabButton = styled.button<{ $active: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  background: ${({ $active }) => ($active ? 'var(--sidebar-primary-soft)' : 'transparent')};
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  color: ${({ $active }) => ($active ? 'var(--sidebar-primary)' : 'var(--sidebar-text-secondary)')};
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $active }) => ($active ? 'var(--sidebar-primary-soft)' : 'var(--sidebar-bg-hover)')};
  }
`

// Section 通用样式
const Section = styled.div`
  border-bottom: 1px solid var(--sidebar-border);
`

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s ease;

  &:hover {
    background: var(--sidebar-bg-hover);
  }
`

const SectionHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

const CollapseIcon = styled.div<{ $collapsed: boolean; $disabled?: boolean }>`
  display: flex;
  align-items: center;
  color: ${({ $disabled }) => ($disabled ? 'var(--sidebar-text-muted)' : 'var(--sidebar-text-secondary)')};
  transition: transform 0.15s ease;
  transform: rotate(${({ $collapsed }) => ($collapsed ? '-90deg' : '0deg')});
`

const SectionTitle = styled.div<{ $disabled?: boolean }>`
  font-size: 12px;
  font-weight: 600;
  color: ${({ $disabled }) => ($disabled ? 'var(--sidebar-text-muted)' : 'var(--sidebar-text-secondary)')};
`

const Badge = styled.span`
  font-size: 10px;
  color: var(--sidebar-primary);
  background: var(--sidebar-primary-soft);
  padding: 2px 6px;
  border-radius: 10px;
`

const AddButton = styled.button`
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  color: var(--sidebar-text-secondary);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &:hover {
    background: var(--sidebar-primary);
    color: white;
  }
`

const SectionContent = styled.div`
  padding: 0 8px 8px;
`

const EmptyState = styled.div`
  font-size: 12px;
  color: var(--sidebar-text-muted);
  padding: 12px;
  text-align: center;
  background: var(--sidebar-bg-hover);
  border-radius: 8px;
`

// Topic 样式
const TopicItem = styled.div<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  background: ${({ $active }) => ($active ? 'var(--sidebar-primary-soft)' : 'transparent')};
  color: ${({ $active }) => ($active ? 'var(--sidebar-primary)' : 'var(--sidebar-text)')};
  border: 1px solid ${({ $active }) => ($active ? 'rgba(59,130,246,0.3)' : 'transparent')};
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $active }) => ($active ? 'var(--sidebar-primary-soft)' : 'var(--sidebar-bg-hover)')};
  }

  &:hover .actions {
    opacity: 1;
  }
`

const TopicName = styled.span`
  flex: 1;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const RenameInput = styled.input`
  flex: 1;
  font-size: 12px;
  padding: 2px 6px;
  border: 1px solid var(--sidebar-primary);
  border-radius: 4px;
  background: var(--sidebar-bg);
  color: var(--sidebar-text);
  outline: none;
`

const TopicActions = styled.div`
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s ease;
`

const ActionIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  color: var(--sidebar-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: var(--sidebar-bg-hover);
    color: var(--sidebar-primary);
  }
`

// Member 样式
const MemberItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  border-radius: 8px;
  transition: all 0.15s ease;

  &:hover {
    background: var(--sidebar-bg-hover);
  }

  &:hover .actions {
    opacity: 1;
  }
`

const MemberInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  cursor: pointer;
  overflow: hidden;
`

const MemberAvatar = styled.div<{ $color?: string }>`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${({ $color }) => ($color ? `${$color}15` : 'rgba(59,130,246,0.1)')};
  color: ${({ $color }) => $color || '#3b82f6'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
`

const MemberDetails = styled.div`
  overflow: hidden;
`

const MemberName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: var(--sidebar-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const MemberHandle = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  color: var(--sidebar-primary);
`

const MemberActions = styled.div`
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s ease;
`

// Room item actions
const RoomItemActions = styled.div`
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s ease;
  margin-left: auto;
`

// Folder 样式
const FolderItem = styled.div<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  background: ${({ $active }) => ($active ? 'var(--sidebar-primary-soft)' : 'transparent')};
  color: ${({ $active }) => ($active ? 'var(--sidebar-primary)' : 'var(--sidebar-text)')};
  border: 1px solid ${({ $active }) => ($active ? 'rgba(59,130,246,0.3)' : 'transparent')};
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $active }) => ($active ? 'var(--sidebar-primary-soft)' : 'var(--sidebar-bg-hover)')};
  }

  &:hover .actions {
    opacity: 1;
  }
`

const FolderName = styled.span`
  flex: 1;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const FolderBadge = styled.span`
  font-size: 10px;
  color: var(--sidebar-text-muted);
  background: var(--sidebar-bg-hover);
  padding: 2px 6px;
  border-radius: 10px;
`

const FolderActions = styled.div`
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s ease;
`

// Info 样式
const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 0;
  color: var(--sidebar-text-muted);
`

const InfoLabel = styled.span`
  font-size: 11px;
  flex: 1;
`

const EditButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--sidebar-text-muted);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: var(--sidebar-bg-hover);
    color: var(--sidebar-primary);
  }
`

const InfoContent = styled.div`
  font-size: 12px;
  color: var(--sidebar-text-secondary);
  padding: 10px 12px;
  background: var(--sidebar-bg-hover);
  border-radius: 8px;
  margin-bottom: 8px;
  line-height: 1.5;
`

const StatsRow = styled.div`
  display: flex;
  gap: 8px;
`

const StatBox = styled.div`
  flex: 1;
  padding: 12px;
  background: var(--sidebar-bg-hover);
  border-radius: 8px;
  text-align: center;
`

const StatValue = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: var(--sidebar-primary);
`

const StatLabel = styled.div`
  font-size: 10px;
  color: var(--sidebar-text-muted);
  margin-top: 4px;
`

// About 样式
const AboutItem = styled.div`
  font-size: 12px;
  color: var(--sidebar-text);
  padding: 8px 12px;
  background: var(--sidebar-bg-hover);
  border-radius: 8px;
  margin-bottom: 6px;
  line-height: 1.5;
`

const EmptyUserInfo = styled.div`
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: var(--sidebar-text-muted);
  background: var(--sidebar-bg-hover);
  border: 1px dashed var(--sidebar-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--sidebar-primary);
    color: var(--sidebar-primary);
    background: var(--sidebar-primary-soft);
  }
`

const UserInfoForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const FormLabel = styled.label`
  font-size: 11px;
  font-weight: 500;
  color: var(--sidebar-text-secondary);
`

const FormInput = styled.input`
  padding: 8px 10px;
  font-size: 12px;
  border: 1px solid var(--sidebar-border);
  border-radius: 6px;
  background: var(--sidebar-bg);
  color: var(--sidebar-text);
  outline: none;
  transition: all 0.15s ease;

  &:focus {
    border-color: var(--sidebar-primary);
    box-shadow: 0 0 0 2px var(--sidebar-primary-soft);
  }
`

const FormTextarea = styled.textarea`
  padding: 8px 10px;
  font-size: 12px;
  border: 1px solid var(--sidebar-border);
  border-radius: 6px;
  background: var(--sidebar-bg);
  color: var(--sidebar-text);
  outline: none;
  resize: none;
  font-family: inherit;
  transition: all 0.15s ease;

  &:focus {
    border-color: var(--sidebar-primary);
    box-shadow: 0 0 0 2px var(--sidebar-primary-soft);
  }
`

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
`

const FormButton = styled.button<{ $primary?: boolean }>`
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: ${({ $primary }) => ($primary ? 'var(--sidebar-primary)' : 'var(--sidebar-bg-hover)')};
  color: ${({ $primary }) => ($primary ? 'white' : 'var(--sidebar-text)')};
  transition: all 0.15s ease;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`

// 底部设置
const BottomSection = styled.div`
  padding: 12px;
  border-top: 1px solid var(--sidebar-border);
`

const SettingsButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px;
  background: transparent;
  border: 1px solid var(--sidebar-border);
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: var(--sidebar-text-secondary);
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: var(--sidebar-bg-hover);
    color: var(--sidebar-text);
    border-color: var(--sidebar-primary);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

export default HostsLeftSidebar
