import type { Expert } from '@renderer/types'
import { Dropdown } from 'antd'
import { AtSign, ChevronDown, Download, MoreHorizontal, Pencil, Plus, Trash2, UserPlus } from 'lucide-react'
import type { FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface Props {
  members: Expert[]
  onAdd: () => void
  onImport?: () => void
  onEdit: (member: Expert) => void
  onDelete: (member: Expert) => void
  onMention: (member: Expert) => void
  disabled?: boolean
}

const MemberList: FC<Props> = ({ members, onAdd, onImport, onEdit, onDelete, onMention, disabled }) => {
  const { t } = useTranslation()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <Container>
      <Header onClick={() => !disabled && setIsCollapsed(!isCollapsed)}>
        <HeaderLeft>
          <CollapseIcon $collapsed={isCollapsed} $disabled={disabled}>
            <ChevronDown size={14} />
          </CollapseIcon>
          <Title $disabled={disabled}>{t('hosts.project.title', { defaultValue: '项目' })}</Title>
          {members.length > 0 && <Badge>{members.length}</Badge>}
        </HeaderLeft>
        <HeaderActions>
          <Dropdown
            disabled={disabled}
            trigger={['click']}
            menu={{
              items: [
                {
                  key: 'add',
                  label: t('hosts.member.add', { defaultValue: '添加成员' }),
                  icon: <UserPlus size={14} />,
                  onClick: (e) => {
                    e.domEvent.stopPropagation()
                    onAdd()
                  }
                },
                {
                  key: 'import',
                  label: t('experts.import.from_assistants'),
                  icon: <Download size={14} />,
                  onClick: (e) => {
                    e.domEvent.stopPropagation()
                    onImport?.()
                  }
                }
              ]
            }}>
            <AddButton
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation()
              }}>
              <Plus size={12} />
            </AddButton>
          </Dropdown>
        </HeaderActions>
      </Header>
      {!isCollapsed && (
        <List>
          {members.length === 0 ? (
            <EmptyState $disabled={disabled}>
              {disabled
                ? t('hosts.select_hint', { defaultValue: '请先选择一个房间' })
                : t('hosts.member.empty', { defaultValue: '暂无成员' })}
            </EmptyState>
          ) : (
            members.map((member) => (
              <MemberItem key={member.id}>
                <MemberInfo onClick={() => onMention(member)}>
                  <MemberAvatar>{member.emoji || '👤'}</MemberAvatar>
                  <MemberDetails>
                    <MemberName>{member.name}</MemberName>
                    <MemberHandle>
                      <AtSign size={10} />
                      {member.handle?.replace('@', '') || member.name}
                    </MemberHandle>
                  </MemberDetails>
                </MemberInfo>
                <Actions>
                  <MentionButton onClick={() => onMention(member)} title={t('experts.mention')}>
                    <AtSign size={12} />
                  </MentionButton>
                  <Dropdown
                    trigger={['click']}
                    menu={{
                      items: [
                        {
                          key: 'edit',
                          label: t('common.edit', { defaultValue: '编辑' }),
                          icon: <Pencil size={14} />,
                          onClick: (e) => {
                            e.domEvent.stopPropagation()
                            onEdit(member)
                          }
                        },
                        {
                          key: 'delete',
                          label: t('common.delete', { defaultValue: '删除' }),
                          icon: <Trash2 size={14} />,
                          danger: true,
                          onClick: (e) => {
                            e.domEvent.stopPropagation()
                            onDelete(member)
                          }
                        }
                      ]
                    }}>
                    <MoreButton onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal size={14} />
                    </MoreButton>
                  </Dropdown>
                </Actions>
              </MemberItem>
            ))
          )}
        </List>
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

const Badge = styled.span`
  font-size: 10px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  background: var(--color-background-mute);
  padding: 1px 5px;
  border-radius: 8px;
  min-width: 16px;
  text-align: center;
`

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
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
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: var(--color-primary);
    color: white;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`

const List = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 8px 8px;
  gap: 2px;
`

const EmptyState = styled.div<{ $disabled?: boolean }>`
  font-size: 12px;
  color: var(--color-text-tertiary);
  padding: 12px;
  text-align: center;
  background: ${({ $disabled }) => ($disabled ? 'transparent' : 'var(--color-background-mute)')};
  border-radius: 8px;
  border: ${({ $disabled }) => ($disabled ? 'none' : '1px dashed var(--color-border)')};
`

const MemberItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: var(--color-background-soft);
  }
`

const MemberInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  flex: 1;
`

const MemberAvatar = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--color-background-mute);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
  transition: all 0.15s ease;

  ${MemberItem}:hover & {
    background: var(--color-primary-soft);
  }
`

const MemberDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow: hidden;
`

const MemberName = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const MemberHandle = styled.span`
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  color: var(--color-primary);
  opacity: 0.8;
`

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s ease;

  ${MemberItem}:hover & {
    opacity: 1;
  }
`

const MentionButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  color: var(--color-primary);
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-primary-soft);
  }
`

const MoreButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  color: var(--color-text-secondary);
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-background);
    color: var(--color-text);
  }
`

export default MemberList
