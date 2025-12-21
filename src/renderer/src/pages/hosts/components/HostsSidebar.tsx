import type { Expert, Host, RoomUserInfo } from '@renderer/types'
import type { FC } from 'react'
import styled from 'styled-components'

import AboutSection from './AboutSection'
import InformationSection from './InformationSection'
import MemberList from './MemberList'

interface Props {
  host: Host | null
  members: Expert[]
  onAddMember: () => void
  onImportMember?: () => void
  onEditMember: (member: Expert) => void
  onDeleteMember: (member: Expert) => void
  onMentionMember: (member: Expert) => void
  onUpdateUserInfo?: (hostId: string, userInfo: RoomUserInfo) => void
}

const HostsSidebar: FC<Props> = ({
  host,
  members,
  onAddMember,
  onImportMember,
  onEditMember,
  onDeleteMember,
  onMentionMember,
  onUpdateUserInfo
}) => {
  const disabled = !host

  return (
    <Container>
      <ScrollArea>
        {/* Project Section - Member List */}
        <Section>
          <MemberList
            members={members}
            onAdd={onAddMember}
            onImport={onImportMember}
            onEdit={onEditMember}
            onDelete={onDeleteMember}
            onMention={onMentionMember}
            disabled={disabled}
          />
        </Section>

        <Divider />

        {/* Information Section */}
        <Section>
          <InformationSection host={host} members={members} />
        </Section>

        <Divider />

        {/* About Section */}
        <Section>
          <AboutSection host={host} onUpdateUserInfo={onUpdateUserInfo} />
        </Section>
      </ScrollArea>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 260px;
  min-width: 260px;
  height: 100%;
  background: var(--color-background);
  border-left: 1px solid var(--color-border);
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

  &::-webkit-scrollbar-thumb:hover {
    background: var(--color-text-tertiary);
  }
`

const Section = styled.div``

const Divider = styled.div`
  height: 1px;
  background: var(--color-border);
  margin: 4px 12px;
`

export default HostsSidebar
