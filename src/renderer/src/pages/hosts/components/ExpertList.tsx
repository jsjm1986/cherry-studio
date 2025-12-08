import type { Expert } from '@renderer/types'
import { Dropdown } from 'antd'
import { AtSign, ChevronDown, Download, MoreHorizontal, Pencil, Plus, Trash2, UserPlus } from 'lucide-react'
import type { FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface Props {
  experts: Expert[]
  onAdd: () => void
  onImport?: () => void
  onEdit: (expert: Expert) => void
  onDelete: (expert: Expert) => void
  onMention: (expert: Expert) => void
  disabled?: boolean
}

const ExpertList: FC<Props> = ({ experts, onAdd, onImport, onEdit, onDelete, onMention, disabled }) => {
  const { t } = useTranslation()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <Container>
      <Header onClick={() => !disabled && setIsCollapsed(!isCollapsed)}>
        <HeaderLeft>
          <CollapseIcon $collapsed={isCollapsed} $disabled={disabled}>
            <ChevronDown size={16} />
          </CollapseIcon>
          <Title $disabled={disabled}>{t('experts.list')}</Title>
          {experts.length > 0 && <Badge>{experts.length}</Badge>}
        </HeaderLeft>
        <HeaderActions>
          <Dropdown
            disabled={disabled}
            trigger={['click']}
            menu={{
              items: [
                {
                  key: 'add',
                  label: t('experts.add_custom'),
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
              <Plus size={14} />
            </AddButton>
          </Dropdown>
        </HeaderActions>
      </Header>
      {!isCollapsed && (
        <List>
          {experts.length === 0 ? (
            <EmptyState $disabled={disabled}>{disabled ? t('hosts.select_hint') : t('experts.empty')}</EmptyState>
          ) : (
            experts.map((expert) => (
              <ExpertItem key={expert.id}>
                <ExpertInfo onClick={() => onMention(expert)}>
                  <ExpertAvatar>{expert.emoji || '👤'}</ExpertAvatar>
                  <ExpertDetails>
                    <ExpertName>{expert.name}</ExpertName>
                    <ExpertHandle>
                      <AtSign size={10} />
                      {expert.handle?.replace('@', '') || expert.name}
                    </ExpertHandle>
                  </ExpertDetails>
                </ExpertInfo>
                <Actions>
                  <MentionButton onClick={() => onMention(expert)} title={t('experts.mention')}>
                    <AtSign size={14} />
                  </MentionButton>
                  <Dropdown
                    trigger={['click']}
                    menu={{
                      items: [
                        {
                          key: 'edit',
                          label: t('experts.edit'),
                          icon: <Pencil size={14} />,
                          onClick: (e) => {
                            e.domEvent.stopPropagation()
                            onEdit(expert)
                          }
                        },
                        {
                          key: 'delete',
                          label: t('experts.delete'),
                          icon: <Trash2 size={14} />,
                          danger: true,
                          onClick: (e) => {
                            e.domEvent.stopPropagation()
                            onDelete(expert)
                          }
                        }
                      ]
                    }}>
                    <MoreButton onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal size={16} />
                    </MoreButton>
                  </Dropdown>
                </Actions>
              </ExpertItem>
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
  padding: 16px 16px 12px;
  cursor: pointer;
  user-select: none;

  &:hover {
    background: var(--color-background-mute);
  }
`

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
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
  font-size: 13px;
  font-weight: 600;
  color: ${({ $disabled }) => ($disabled ? 'var(--color-text-tertiary)' : 'var(--color-text)')};
  letter-spacing: 0.3px;
`

const Badge = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: var(--color-background-mute);
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
`

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const AddButton = styled.button`
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: 6px;
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
  padding: 0 12px 12px;
  gap: 4px;
`

const EmptyState = styled.div<{ $disabled?: boolean }>`
  font-size: 13px;
  color: var(--color-text-tertiary);
  padding: 16px;
  text-align: center;
  background: ${({ $disabled }) => ($disabled ? 'transparent' : 'var(--color-background-mute)')};
  border-radius: 12px;
  border: ${({ $disabled }) => ($disabled ? 'none' : '1px dashed var(--color-border)')};
`

const ExpertItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: var(--color-background-soft);
  }
`

const ExpertInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
  flex: 1;
`

const ExpertAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--color-background-mute);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  transition: all 0.15s ease;

  ${ExpertItem}:hover & {
    background: var(--color-primary-soft);
  }
`

const ExpertDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
`

const ExpertName = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const ExpertHandle = styled.span`
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  color: var(--color-primary);
  opacity: 0.8;
`

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;

  ${ExpertItem}:hover & {
    opacity: 1;
  }
`

const MentionButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
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
  width: 28px;
  height: 28px;
  border-radius: 8px;
  color: var(--color-text-secondary);
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-background);
    color: var(--color-text);
  }
`

export default ExpertList
