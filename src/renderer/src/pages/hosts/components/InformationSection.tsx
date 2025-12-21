import type { Expert, Host } from '@renderer/types'
import { ChevronDown, Info, Users } from 'lucide-react'
import type { FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface Props {
  host: Host | null
  members: Expert[]
}

const InformationSection: FC<Props> = ({ host, members }) => {
  const { t } = useTranslation()
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (!host) {
    return (
      <Container>
        <Header>
          <HeaderLeft>
            <CollapseIcon $collapsed={false} $disabled>
              <ChevronDown size={14} />
            </CollapseIcon>
            <Title $disabled>{t('hosts.information.title', { defaultValue: '信息' })}</Title>
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
          <Title>{t('hosts.information.title', { defaultValue: '信息' })}</Title>
        </HeaderLeft>
      </Header>

      {!isCollapsed && (
        <Content>
          {/* Room Description */}
          <InfoBlock>
            <InfoLabel>
              <Info size={12} />
              {t('hosts.information.description', { defaultValue: '房间描述' })}
            </InfoLabel>
            <InfoContent>
              {host.description || t('hosts.information.no_description', { defaultValue: '暂无描述' })}
            </InfoContent>
          </InfoBlock>

          {/* Member Stats */}
          <InfoBlock>
            <InfoLabel>
              <Users size={12} />
              {t('hosts.information.members', { defaultValue: '成员统计' })}
            </InfoLabel>
            <StatsGrid>
              <StatItem>
                <StatValue>{members.length}</StatValue>
                <StatLabel>{t('hosts.information.total_members', { defaultValue: '总成员' })}</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>{members.filter((m) => m.model).length}</StatValue>
                <StatLabel>{t('hosts.information.configured', { defaultValue: '已配置模型' })}</StatLabel>
              </StatItem>
            </StatsGrid>
          </InfoBlock>

          {/* Member List Preview */}
          {members.length > 0 && (
            <InfoBlock>
              <InfoLabel>{t('hosts.information.member_list', { defaultValue: '成员列表' })}</InfoLabel>
              <MemberPreviewList>
                {members.slice(0, 5).map((member) => (
                  <MemberPreviewItem key={member.id}>
                    <MemberEmoji>{member.emoji || '👤'}</MemberEmoji>
                    <MemberName>{member.name}</MemberName>
                    {member.handle && <MemberHandle>@{member.handle.replace('@', '')}</MemberHandle>}
                  </MemberPreviewItem>
                ))}
                {members.length > 5 && (
                  <MoreHint>
                    {t('hosts.information.more_members', {
                      count: members.length - 5,
                      defaultValue: `还有 ${members.length - 5} 位成员...`
                    })}
                  </MoreHint>
                )}
              </MemberPreviewList>
            </InfoBlock>
          )}
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
  gap: 12px;
`

const InfoBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
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

const InfoContent = styled.div`
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  padding: 8px 10px;
  background: var(--color-background-soft);
  border-radius: 8px;
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  background: var(--color-background-soft);
  border-radius: 8px;
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

const MemberPreviewList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const MemberPreviewItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--color-background-soft);
  border-radius: 6px;
`

const MemberEmoji = styled.span`
  font-size: 14px;
`

const MemberName = styled.span`
  font-size: 12px;
  color: var(--color-text);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const MemberHandle = styled.span`
  font-size: 10px;
  color: var(--color-primary);
  opacity: 0.8;
`

const MoreHint = styled.div`
  font-size: 11px;
  color: var(--color-text-tertiary);
  text-align: center;
  padding: 4px;
`

export default InformationSection
