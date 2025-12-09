import type { Host } from '@renderer/types'
import { Dropdown } from 'antd'
import { ChevronDown, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import type { FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface Props {
  hosts: Host[]
  activeHostId?: string
  onSelect: (host: Host) => void
  onAdd: () => void
  onEdit: (host: Host) => void
  onDelete: (host: Host) => void
}

const HostList: FC<Props> = ({ hosts, activeHostId, onSelect, onAdd, onEdit, onDelete }) => {
  const { t } = useTranslation()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <Container>
      <Header onClick={() => setIsCollapsed(!isCollapsed)}>
        <HeaderLeft>
          <CollapseIcon $collapsed={isCollapsed}>
            <ChevronDown size={16} />
          </CollapseIcon>
          <Title>{t('hosts.list')}</Title>
        </HeaderLeft>
        <HeaderActions>
          <AddButton
            onClick={(e) => {
              e.stopPropagation()
              onAdd()
            }}>
            <Plus size={14} />
          </AddButton>
        </HeaderActions>
      </Header>
      {!isCollapsed && (
        <List>
          {hosts.length === 0 ? (
            <EmptyState>{t('hosts.empty')}</EmptyState>
          ) : (
            hosts.map((host) => (
              <HostItem key={host.id} $active={host.id === activeHostId} onClick={() => onSelect(host)}>
                <HostAvatar $active={host.id === activeHostId}>{host.emoji || '🏠'}</HostAvatar>
                <HostInfo>
                  <HostName $active={host.id === activeHostId}>{host.name}</HostName>
                  {host.description && <HostDesc>{host.description}</HostDesc>}
                </HostInfo>
                <Dropdown
                  trigger={['click']}
                  menu={{
                    items: [
                      {
                        key: 'edit',
                        label: t('hosts.edit'),
                        icon: <Pencil size={14} />,
                        onClick: (e) => {
                          e.domEvent.stopPropagation()
                          onEdit(host)
                        }
                      },
                      {
                        key: 'delete',
                        label: t('hosts.delete'),
                        icon: <Trash2 size={14} />,
                        danger: true,
                        onClick: (e) => {
                          e.domEvent.stopPropagation()
                          onDelete(host)
                        }
                      }
                    ]
                  }}>
                  <MoreButton onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal size={16} />
                  </MoreButton>
                </Dropdown>
              </HostItem>
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

const CollapseIcon = styled.div<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  transition: transform 0.2s ease;
  transform: rotate(${({ $collapsed }) => ($collapsed ? '-90deg' : '0deg')});
`

const Title = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: 0.3px;
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

  &:hover {
    background: var(--color-primary);
    color: white;
  }
`

const List = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 12px 12px;
  gap: 4px;
  max-height: 340px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 2px;
  }
`

const EmptyState = styled.div`
  font-size: 13px;
  color: var(--color-text-tertiary);
  padding: 16px;
  text-align: center;
  background: var(--color-background-mute);
  border-radius: 12px;
  border: 1px dashed var(--color-border);
`

const HostItem = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
  background: ${({ $active }) => ($active ? 'var(--color-background-soft)' : 'transparent')};
  border: 1px solid ${({ $active }) => ($active ? 'var(--color-border)' : 'transparent')};
  transition: all 0.15s ease;

  &:hover {
    background: var(--color-background-soft);
  }
`

const HostAvatar = styled.div<{ $active: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${({ $active }) => ($active ? 'var(--color-primary)' : 'var(--color-background-mute)')};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  transition: all 0.15s ease;
`

const HostInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
  flex: 1;
`

const HostName = styled.span<{ $active: boolean }>`
  font-size: 13px;
  font-weight: ${({ $active }) => ($active ? '600' : '500')};
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const HostDesc = styled.span`
  font-size: 12px;
  color: var(--color-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const MoreButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  color: var(--color-text-secondary);
  opacity: 0;
  transition: all 0.2s ease;
  flex-shrink: 0;

  ${HostItem}:hover & {
    opacity: 1;
  }

  &:hover {
    background: var(--color-background);
    color: var(--color-text);
  }
`

export default HostList
