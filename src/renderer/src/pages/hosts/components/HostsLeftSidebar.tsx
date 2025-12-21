import { useAppSelector } from '@renderer/store'
import { selectMessagesForTopic } from '@renderer/store/newMessage'
import type { Expert, Host, InfoFolder, RoomUserInfo, Topic } from '@renderer/types'
import { Dropdown } from 'antd'
import {
  AtSign,
  ChevronDown,
  Download,
  FileText,
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
import { useCallback, useState } from 'react'
import styled from 'styled-components'

export type TabType = 'chat' | 'configuration'

interface Props {
  // 房间相关
  hosts: Host[]
  activeHost: Host | null
  onSelectHost: (host: Host) => void
  onAddHost: () => void
  onEditHost: (host: Host) => void
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
  const [showRoomDropdown, setShowRoomDropdown] = useState(false)
  const [projectCollapsed, setProjectCollapsed] = useState(false)
  const [memberCollapsed, setMemberCollapsed] = useState(false)
  const [infoCollapsed, setInfoCollapsed] = useState(false)
  const [aboutCollapsed, setAboutCollapsed] = useState(false)
  const [renamingTopicId, setRenamingTopicId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

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
    <Container>
      <ScrollArea>
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
            <span>Chat</span>
          </TabButton>
          <TabButton $active={activeTab === 'configuration'} onClick={() => onTabChange('configuration')}>
            <Settings size={14} />
            <span>Configuration</span>
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
                <SectionTitle $disabled={disabled}>Chat 对话</SectionTitle>
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
                          label: '添加成员',
                          icon: <UserPlus size={14} />,
                          onClick: (e) => {
                            e.domEvent.stopPropagation()
                            onAddMember()
                          }
                        },
                        {
                          key: 'import',
                          label: '从助手导入',
                          icon: <Download size={14} />,
                          onClick: (e) => {
                            e.domEvent.stopPropagation()
                            onImportMember?.()
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
    </Container>
  )
}

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 280px;
  min-width: 280px;
  height: 100%;
  background: var(--color-background);
  border-right: 1px solid var(--color-border);
`

const ScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 2px;
  }
`

// 房间选择器
const RoomSelector = styled.div`
  position: relative;
  padding: 12px;
  border-bottom: 1px solid var(--color-border);
`

const RoomButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  background: ${({ $active }) => ($active ? 'var(--color-background-mute)' : 'var(--color-background-soft)')};
  border: 1px solid var(--color-border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-background-mute);
  }

  .rotate {
    transform: rotate(180deg);
  }

  svg {
    color: var(--color-text-secondary);
    transition: transform 0.2s ease;
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
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const RoomDesc = styled.div`
  font-size: 11px;
  color: var(--color-text-tertiary);
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
  background: var(--color-background);
  border: 1px solid var(--color-border);
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
  border-radius: 6px;
  font-size: 13px;
  color: ${({ $isAction }) => ($isAction ? 'var(--color-primary)' : 'var(--color-text)')};
  background: ${({ $active }) => ($active ? 'var(--color-primary-soft)' : 'transparent')};

  &:hover {
    background: ${({ $active }) => ($active ? 'var(--color-primary-soft)' : 'var(--color-background-soft)')};
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
  background: var(--color-border);
  margin: 4px 0;
`

const EmptyHint = styled.div`
  padding: 12px;
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: 12px;
`

// 标签切换
const TabsContainer = styled.div`
  display: flex;
  padding: 8px 12px;
  gap: 4px;
  border-bottom: 1px solid var(--color-border);
`

const TabButton = styled.button<{ $active: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  background: ${({ $active }) => ($active ? 'var(--color-primary-soft)' : 'transparent')};
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  color: ${({ $active }) => ($active ? 'var(--color-primary)' : 'var(--color-text-secondary)')};
  transition: all 0.2s ease;

  &:hover {
    background: ${({ $active }) => ($active ? 'var(--color-primary-soft)' : 'var(--color-background-soft)')};
  }
`

// Section 通用样式
const Section = styled.div`
  border-bottom: 1px solid var(--color-border);
`

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  user-select: none;

  &:hover {
    background: var(--color-background-soft);
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
  color: ${({ $disabled }) => ($disabled ? 'var(--color-text-tertiary)' : 'var(--color-text-secondary)')};
  transition: transform 0.2s ease;
  transform: rotate(${({ $collapsed }) => ($collapsed ? '-90deg' : '0deg')});
`

const SectionTitle = styled.div<{ $disabled?: boolean }>`
  font-size: 12px;
  font-weight: 600;
  color: ${({ $disabled }) => ($disabled ? 'var(--color-text-tertiary)' : 'var(--color-text-secondary)')};
`

const Badge = styled.span`
  font-size: 10px;
  color: var(--color-text-tertiary);
  background: var(--color-background-mute);
  padding: 1px 5px;
  border-radius: 8px;
`

const AddButton = styled.button`
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: var(--color-primary);
    color: white;
  }
`

const SectionContent = styled.div`
  padding: 0 8px 8px;
`

const EmptyState = styled.div`
  font-size: 12px;
  color: var(--color-text-tertiary);
  padding: 12px;
  text-align: center;
  background: var(--color-background-soft);
  border-radius: 6px;
`

// Topic 样式
const TopicItem = styled.div<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  background: ${({ $active }) => ($active ? 'var(--color-primary-soft)' : 'transparent')};
  color: ${({ $active }) => ($active ? 'var(--color-primary)' : 'var(--color-text)')};

  &:hover {
    background: ${({ $active }) => ($active ? 'var(--color-primary-soft)' : 'var(--color-background-soft)')};
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
  padding: 2px 4px;
  border: 1px solid var(--color-primary);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text);
  outline: none;
`

const TopicActions = styled.div`
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s ease;
`

const ActionIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  color: var(--color-text-secondary);
  cursor: pointer;

  &:hover {
    background: var(--color-background-mute);
    color: var(--color-text);
  }
`

// Member 样式
const MemberItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  border-radius: 6px;

  &:hover {
    background: var(--color-background-soft);
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

const MemberAvatar = styled.div`
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

const MemberDetails = styled.div`
  overflow: hidden;
`

const MemberName = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const MemberHandle = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  color: var(--color-primary);
  opacity: 0.8;
`

const MemberActions = styled.div`
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s ease;
`

// Folder 样式
const FolderItem = styled.div<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  background: ${({ $active }) => ($active ? 'var(--color-primary-soft)' : 'transparent')};
  color: ${({ $active }) => ($active ? 'var(--color-primary)' : 'var(--color-text)')};

  &:hover {
    background: ${({ $active }) => ($active ? 'var(--color-primary-soft)' : 'var(--color-background-soft)')};
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
  color: var(--color-text-tertiary);
  background: var(--color-background-mute);
  padding: 1px 5px;
  border-radius: 8px;
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
  padding: 4px 0;
  color: var(--color-text-tertiary);
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
  color: var(--color-text-tertiary);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-background-mute);
    color: var(--color-primary);
  }
`

const InfoContent = styled.div`
  font-size: 12px;
  color: var(--color-text-secondary);
  padding: 8px;
  background: var(--color-background-soft);
  border-radius: 6px;
  margin-bottom: 8px;
`

const StatsRow = styled.div`
  display: flex;
  gap: 8px;
`

const StatBox = styled.div`
  flex: 1;
  padding: 10px;
  background: var(--color-background-soft);
  border-radius: 6px;
  text-align: center;
`

const StatValue = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: var(--color-primary);
`

const StatLabel = styled.div`
  font-size: 10px;
  color: var(--color-text-tertiary);
  margin-top: 2px;
`

// About 样式
const AboutItem = styled.div`
  font-size: 12px;
  color: var(--color-text);
  padding: 6px 8px;
  background: var(--color-background-soft);
  border-radius: 6px;
  margin-bottom: 4px;
`

const EmptyUserInfo = styled.div`
  padding: 12px;
  text-align: center;
  font-size: 12px;
  color: var(--color-text-tertiary);
  background: var(--color-background-soft);
  border: 1px dashed var(--color-border);
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
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
  color: var(--color-text-secondary);
`

const FormInput = styled.input`
  padding: 6px 8px;
  font-size: 12px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text);
  outline: none;

  &:focus {
    border-color: var(--color-primary);
  }
`

const FormTextarea = styled.textarea`
  padding: 6px 8px;
  font-size: 12px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text);
  outline: none;
  resize: none;
  font-family: inherit;

  &:focus {
    border-color: var(--color-primary);
  }
`

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
`

const FormButton = styled.button<{ $primary?: boolean }>`
  padding: 6px 12px;
  font-size: 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: ${({ $primary }) => ($primary ? 'var(--color-primary)' : 'var(--color-background-mute)')};
  color: ${({ $primary }) => ($primary ? 'white' : 'var(--color-text)')};

  &:hover {
    opacity: 0.9;
  }
`

// 底部设置
const BottomSection = styled.div`
  padding: 12px;
  border-top: 1px solid var(--color-border);
`

const SettingsButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: var(--color-text-secondary);
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: var(--color-background-soft);
    color: var(--color-text);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

export default HostsLeftSidebar
