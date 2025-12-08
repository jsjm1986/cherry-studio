import HorizontalScrollContainer from '@renderer/components/HorizontalScrollContainer'
import CustomTag from '@renderer/components/Tags/CustomTag'
import type { Expert } from '@renderer/types'
import { AtSign, Plus } from 'lucide-react'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface Props {
  mentionedExperts: Expert[]
  onRemoveExpert: (expert: Expert) => void
  onAddExpert?: () => void
  required?: boolean
}

const MentionedExpertsInput: FC<Props> = ({ mentionedExperts, onRemoveExpert, onAddExpert, required }) => {
  const { t } = useTranslation()

  // 如果没有专家且不是必需的，不显示
  if (mentionedExperts.length === 0 && !required) {
    return null
  }

  return (
    <Container $hasExperts={mentionedExperts.length > 0}>
      <HorizontalScrollContainer dependencies={[mentionedExperts]} expandable>
        {mentionedExperts.map((expert) => (
          <CustomTag
            icon={<AtSign size={12} />}
            color="var(--color-primary)"
            key={expert.id}
            closable
            onClose={() => onRemoveExpert(expert)}>
            {expert.emoji || '👤'} {expert.name}
          </CustomTag>
        ))}
        {onAddExpert && (
          <AddExpertButton onClick={onAddExpert}>
            <Plus size={14} />
            <span>{mentionedExperts.length === 0 ? t('experts.select_expert') : t('experts.add_more')}</span>
          </AddExpertButton>
        )}
      </HorizontalScrollContainer>
    </Container>
  )
}

const Container = styled.div<{ $hasExperts: boolean }>`
  width: 100%;
  padding: ${({ $hasExperts }) => ($hasExperts ? '10px 18px' : '8px 18px')};
  background: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: 8px;
`

const AddExpertButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border: 1px dashed var(--color-primary);
  border-radius: 16px;
  background: var(--color-background);
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    border-style: solid;
    background: var(--color-primary);
    color: white;
  }
`

export default MentionedExpertsInput
