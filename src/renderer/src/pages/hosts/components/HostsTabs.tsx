import { MessageSquare, Settings } from 'lucide-react'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

export type TabType = 'chat' | 'configuration'

interface Props {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

const HostsTabs: FC<Props> = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation()

  return (
    <TabsContainer>
      <TabButton $active={activeTab === 'chat'} onClick={() => onTabChange('chat')}>
        <MessageSquare size={16} />
        <span>{t('hosts.tabs.chat', { defaultValue: '聊天' })}</span>
      </TabButton>
      <TabButton $active={activeTab === 'configuration'} onClick={() => onTabChange('configuration')}>
        <Settings size={16} />
        <span>{t('hosts.tabs.configuration', { defaultValue: '配置' })}</span>
      </TabButton>
      <TabIndicator $activeIndex={activeTab === 'chat' ? 0 : 1} />
    </TabsContainer>
  )
}

const TabsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  background: var(--color-background-soft);
  border-radius: 10px;
  position: relative;
  width: fit-content;
  margin: 0 auto;
`

const TabButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: ${({ $active }) => ($active ? 'var(--color-primary)' : 'var(--color-text-secondary)')};
  transition: all 0.2s ease;
  position: relative;
  z-index: 1;

  &:hover {
    color: ${({ $active }) => ($active ? 'var(--color-primary)' : 'var(--color-text)')};
  }

  svg {
    transition: color 0.2s ease;
  }
`

const TabIndicator = styled.div<{ $activeIndex: number }>`
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: calc(50% - 4px);
  background: var(--color-background);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease;
  transform: translateX(${({ $activeIndex }) => $activeIndex * 100}%);
  z-index: 0;
`

export default HostsTabs
