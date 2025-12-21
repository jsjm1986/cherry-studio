import type { Host } from '@renderer/types'
import { PlusIcon } from 'lucide-react'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface Props {
  host: Host | null
  onAdd?: () => void
}

const CurrentHostInfo: FC<Props> = ({ host, onAdd }) => {
  const { t } = useTranslation()

  if (!host) {
    return (
      <Container>
        <EmptyCard onClick={onAdd}>
          <EmptyIcon>🏠</EmptyIcon>
          <EmptyContent>
            <EmptyTitle>{t('hosts.create_first', { defaultValue: '创建房间' })}</EmptyTitle>
            <EmptyText>{t('hosts.select_hint')}</EmptyText>
          </EmptyContent>
          {onAdd && (
            <AddButton>
              <PlusIcon size={16} />
            </AddButton>
          )}
        </EmptyCard>
      </Container>
    )
  }

  return (
    <Container>
      <HostCard>
        <HostAvatar>{host.emoji || '🏠'}</HostAvatar>
        <HostMeta>
          <HostName>{host.name}</HostName>
          {(host.description || host.prompt) && <HostDescription>{host.description || host.prompt}</HostDescription>}
        </HostMeta>
      </HostCard>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 12px;
  flex-shrink: 0;
`

const EmptyCard = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: var(--color-background);
  border: 1px dashed var(--color-border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--color-primary);
    background: var(--color-background-soft);
  }
`

const EmptyIcon = styled.div`
  font-size: 24px;
  flex-shrink: 0;
`

const EmptyContent = styled.div`
  flex: 1;
  min-width: 0;
`

const EmptyTitle = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
`

const EmptyText = styled.div`
  font-size: 11px;
  color: var(--color-text-tertiary);
  margin-top: 2px;
`

const AddButton = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`

const HostCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--color-background);
  border-radius: 10px;
  border: 1px solid var(--color-border);
`

const HostAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--color-background-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
`

const HostMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  overflow: hidden;
`

const HostName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const HostDescription = styled.div`
  font-size: 11px;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

export default CurrentHostInfo
