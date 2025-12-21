import type { Host, RoomUserInfo } from '@renderer/types'
import { ChevronDown, Edit3, Home, Save, User, X } from 'lucide-react'
import type { FC } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface Props {
  host: Host | null
  onUpdateUserInfo?: (hostId: string, userInfo: RoomUserInfo) => void
}

const AboutSection: FC<Props> = ({ host, onUpdateUserInfo }) => {
  const { t } = useTranslation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingUserInfo, setEditingUserInfo] = useState<RoomUserInfo>({})

  // Sync editing state when host changes
  useEffect(() => {
    if (host?.userInfo) {
      setEditingUserInfo(host.userInfo)
    } else {
      setEditingUserInfo({})
    }
    setIsEditing(false)
  }, [host?.id, host?.userInfo])

  const handleStartEdit = useCallback(() => {
    setEditingUserInfo(host?.userInfo || {})
    setIsEditing(true)
  }, [host?.userInfo])

  const handleCancelEdit = useCallback(() => {
    setEditingUserInfo(host?.userInfo || {})
    setIsEditing(false)
  }, [host?.userInfo])

  const handleSave = useCallback(() => {
    if (host && onUpdateUserInfo) {
      onUpdateUserInfo(host.id, editingUserInfo)
    }
    setIsEditing(false)
  }, [host, editingUserInfo, onUpdateUserInfo])

  if (!host) {
    return (
      <Container>
        <Header>
          <HeaderLeft>
            <CollapseIcon $collapsed={false} $disabled>
              <ChevronDown size={14} />
            </CollapseIcon>
            <Title $disabled>{t('hosts.about.title', { defaultValue: '关于' })}</Title>
          </HeaderLeft>
        </Header>
        <EmptyState>{t('hosts.select_hint', { defaultValue: '请先选择一个房间' })}</EmptyState>
      </Container>
    )
  }

  return (
    <Container>
      <Header onClick={() => setIsCollapsed(!isCollapsed)}>
        <HeaderLeft>
          <CollapseIcon $collapsed={isCollapsed}>
            <ChevronDown size={14} />
          </CollapseIcon>
          <Title>{t('hosts.about.title', { defaultValue: '关于' })}</Title>
        </HeaderLeft>
      </Header>

      {!isCollapsed && (
        <Content>
          {/* Room Info */}
          <InfoBlock>
            <InfoLabel>
              <Home size={12} />
              {t('hosts.about.room_info', { defaultValue: '房间信息' })}
            </InfoLabel>
            <RoomCard>
              <RoomEmoji>{host.emoji || '🏠'}</RoomEmoji>
              <RoomDetails>
                <RoomName>{host.name}</RoomName>
                {host.worldName && <RoomWorld>{host.worldName}</RoomWorld>}
              </RoomDetails>
            </RoomCard>
            {host.prompt && (
              <RoomPrompt>
                <PromptLabel>{t('hosts.about.system_prompt', { defaultValue: '系统提示词' })}</PromptLabel>
                <PromptContent>{host.prompt}</PromptContent>
              </RoomPrompt>
            )}
          </InfoBlock>

          {/* User Personal Info */}
          <InfoBlock>
            <InfoLabelWithAction>
              <InfoLabel>
                <User size={12} />
                {t('hosts.about.my_info', { defaultValue: '我的信息' })}
              </InfoLabel>
              {!isEditing ? (
                <EditButton onClick={handleStartEdit} title={t('common.edit', { defaultValue: '编辑' })}>
                  <Edit3 size={12} />
                </EditButton>
              ) : (
                <EditActions>
                  <ActionButton onClick={handleSave} $primary title={t('common.save', { defaultValue: '保存' })}>
                    <Save size={12} />
                  </ActionButton>
                  <ActionButton onClick={handleCancelEdit} title={t('common.cancel', { defaultValue: '取消' })}>
                    <X size={12} />
                  </ActionButton>
                </EditActions>
              )}
            </InfoLabelWithAction>

            <UserInfoHint>
              {t('hosts.about.user_info_hint', {
                defaultValue: '填写您的信息，帮助房间内的成员更好地了解您并进行协作'
              })}
            </UserInfoHint>

            {isEditing ? (
              <UserInfoForm>
                <FormGroup>
                  <FormLabel>{t('hosts.about.role', { defaultValue: '角色/身份' })}</FormLabel>
                  <FormInput
                    type="text"
                    value={editingUserInfo.role || ''}
                    onChange={(e) => setEditingUserInfo({ ...editingUserInfo, role: e.target.value })}
                    placeholder={t('hosts.about.role_placeholder', { defaultValue: '例如：产品经理、开发者、设计师' })}
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t('hosts.about.introduction', { defaultValue: '自我介绍' })}</FormLabel>
                  <FormTextarea
                    value={editingUserInfo.introduction || ''}
                    onChange={(e) => setEditingUserInfo({ ...editingUserInfo, introduction: e.target.value })}
                    placeholder={t('hosts.about.introduction_placeholder', {
                      defaultValue: '简单介绍一下自己，让成员们更了解您'
                    })}
                    rows={3}
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t('hosts.about.notes', { defaultValue: '备注信息' })}</FormLabel>
                  <FormTextarea
                    value={editingUserInfo.notes || ''}
                    onChange={(e) => setEditingUserInfo({ ...editingUserInfo, notes: e.target.value })}
                    placeholder={t('hosts.about.notes_placeholder', {
                      defaultValue: '其他想让成员知道的信息'
                    })}
                    rows={2}
                  />
                </FormGroup>
              </UserInfoForm>
            ) : (
              <UserInfoDisplay>
                {host.userInfo?.role && (
                  <UserInfoItem>
                    <UserInfoItemLabel>{t('hosts.about.role', { defaultValue: '角色/身份' })}</UserInfoItemLabel>
                    <UserInfoItemValue>{host.userInfo.role}</UserInfoItemValue>
                  </UserInfoItem>
                )}
                {host.userInfo?.introduction && (
                  <UserInfoItem>
                    <UserInfoItemLabel>{t('hosts.about.introduction', { defaultValue: '自我介绍' })}</UserInfoItemLabel>
                    <UserInfoItemValue>{host.userInfo.introduction}</UserInfoItemValue>
                  </UserInfoItem>
                )}
                {host.userInfo?.notes && (
                  <UserInfoItem>
                    <UserInfoItemLabel>{t('hosts.about.notes', { defaultValue: '备注信息' })}</UserInfoItemLabel>
                    <UserInfoItemValue>{host.userInfo.notes}</UserInfoItemValue>
                  </UserInfoItem>
                )}
                {!host.userInfo?.role && !host.userInfo?.introduction && !host.userInfo?.notes && (
                  <EmptyUserInfo onClick={handleStartEdit}>
                    {t('hosts.about.no_user_info', { defaultValue: '点击添加您的个人信息' })}
                  </EmptyUserInfo>
                )}
              </UserInfoDisplay>
            )}
          </InfoBlock>
        </Content>
      )}
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 12px 8px;
  cursor: pointer;
  user-select: none;

  &:hover {
    background: var(--color-background-mute);
  }
`

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

const CollapseIcon = styled.div<{ $collapsed: boolean; $disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $disabled }) => ($disabled ? 'var(--color-text-tertiary)' : 'var(--color-text-secondary)')};
  transition: transform 0.2s ease;
  transform: rotate(${({ $collapsed }) => ($collapsed ? '-90deg' : '0deg')});
`

const Title = styled.div<{ $disabled?: boolean }>`
  font-size: 12px;
  font-weight: 600;
  color: ${({ $disabled }) => ($disabled ? 'var(--color-text-tertiary)' : 'var(--color-text-secondary)')};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const EmptyState = styled.div`
  font-size: 12px;
  color: var(--color-text-tertiary);
  padding: 12px;
  text-align: center;
`

const Content = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 12px 12px;
  gap: 16px;
`

const InfoBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const InfoLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
`

const InfoLabelWithAction = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const EditButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
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

const EditActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`

const ActionButton = styled.button<{ $primary?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  background: ${({ $primary }) => ($primary ? 'var(--color-primary)' : 'transparent')};
  color: ${({ $primary }) => ($primary ? 'white' : 'var(--color-text-tertiary)')};
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ $primary }) => ($primary ? 'var(--color-primary-hover)' : 'var(--color-background-mute)')};
    color: ${({ $primary }) => ($primary ? 'white' : 'var(--color-text)')};
  }
`

const RoomCard = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--color-background-soft);
  border-radius: 10px;
`

const RoomEmoji = styled.div`
  font-size: 24px;
`

const RoomDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const RoomName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
`

const RoomWorld = styled.div`
  font-size: 11px;
  color: var(--color-text-tertiary);
`

const RoomPrompt = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const PromptLabel = styled.div`
  font-size: 10px;
  color: var(--color-text-tertiary);
`

const PromptContent = styled.div`
  font-size: 11px;
  color: var(--color-text-secondary);
  padding: 8px 10px;
  background: var(--color-background-soft);
  border-radius: 6px;
  max-height: 80px;
  overflow-y: auto;
  line-height: 1.4;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 2px;
  }
`

const UserInfoHint = styled.div`
  font-size: 11px;
  color: var(--color-text-tertiary);
  line-height: 1.4;
`

const UserInfoForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const FormLabel = styled.label`
  font-size: 11px;
  color: var(--color-text-secondary);
  font-weight: 500;
`

const FormInput = styled.input`
  padding: 8px 10px;
  font-size: 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  color: var(--color-text);
  outline: none;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: var(--color-primary);
  }

  &::placeholder {
    color: var(--color-text-tertiary);
  }
`

const FormTextarea = styled.textarea`
  padding: 8px 10px;
  font-size: 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  color: var(--color-text);
  outline: none;
  resize: none;
  font-family: inherit;
  line-height: 1.4;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: var(--color-primary);
  }

  &::placeholder {
    color: var(--color-text-tertiary);
  }
`

const UserInfoDisplay = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const UserInfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  background: var(--color-background-soft);
  border-radius: 6px;
`

const UserInfoItemLabel = styled.div`
  font-size: 10px;
  color: var(--color-text-tertiary);
`

const UserInfoItemValue = styled.div`
  font-size: 12px;
  color: var(--color-text);
  line-height: 1.4;
`

const EmptyUserInfo = styled.div`
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: var(--color-text-tertiary);
  background: var(--color-background-soft);
  border: 1px dashed var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
`

export default AboutSection
