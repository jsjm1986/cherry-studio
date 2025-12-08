import { HStack } from '@renderer/components/Layout'
import { useAppSelector } from '@renderer/store'
import { selectRegularAssistants } from '@renderer/store/assistants'
import type { Assistant } from '@renderer/types'
import { Checkbox, Input, List, Modal } from 'antd'
import type { FC } from 'react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface Props {
  open: boolean
  onImport: (assistants: Assistant[]) => void
  onCancel: () => void
}

const ImportExpertModal: FC<Props> = ({ open, onImport, onCancel }) => {
  const { t } = useTranslation()
  const assistants = useAppSelector(selectRegularAssistants)
  const [searchText, setSearchText] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // 过滤助手列表
  const filteredAssistants = useMemo(() => {
    if (!searchText.trim()) {
      return assistants
    }
    const lowerSearch = searchText.toLowerCase()
    return assistants.filter(
      (a) =>
        a.name.toLowerCase().includes(lowerSearch) ||
        a.description?.toLowerCase().includes(lowerSearch) ||
        a.prompt?.toLowerCase().includes(lowerSearch)
    )
  }, [assistants, searchText])

  // 切换选中状态
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  // 全选/取消全选
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredAssistants.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredAssistants.map((a) => a.id)))
    }
  }, [filteredAssistants, selectedIds.size])

  // 确认导入
  const handleOk = useCallback(() => {
    const selectedAssistants = assistants.filter((a) => selectedIds.has(a.id))
    onImport(selectedAssistants)
    setSelectedIds(new Set())
    setSearchText('')
  }, [assistants, selectedIds, onImport])

  // 取消
  const handleCancel = useCallback(() => {
    setSelectedIds(new Set())
    setSearchText('')
    onCancel()
  }, [onCancel])

  return (
    <Modal
      title={t('experts.import.title')}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText={t('experts.import.confirm', { count: selectedIds.size })}
      okButtonProps={{ disabled: selectedIds.size === 0 }}
      width={600}
      destroyOnClose>
      <ModalContent>
        <SearchBar>
          <Input.Search
            placeholder={t('experts.import.search')}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <SelectAllButton onClick={toggleSelectAll}>
            {selectedIds.size === filteredAssistants.length && filteredAssistants.length > 0
              ? t('experts.import.deselect_all')
              : t('experts.import.select_all')}
          </SelectAllButton>
        </SearchBar>

        {filteredAssistants.length === 0 ? (
          <EmptyState>
            {assistants.length === 0 ? t('experts.import.no_assistants') : t('experts.import.no_results')}
          </EmptyState>
        ) : (
          <AssistantList
            dataSource={filteredAssistants}
            renderItem={(assistant) => (
              <AssistantItem key={assistant.id} onClick={() => toggleSelect(assistant.id)}>
                <Checkbox checked={selectedIds.has(assistant.id)} />
                <AssistantInfo>
                  <HStack alignItems="center" gap={8}>
                    <AssistantEmoji>{assistant.emoji || '🤖'}</AssistantEmoji>
                    <AssistantName>{assistant.name}</AssistantName>
                  </HStack>
                  {assistant.description && <AssistantDesc>{assistant.description}</AssistantDesc>}
                </AssistantInfo>
              </AssistantItem>
            )}
          />
        )}
      </ModalContent>
    </Modal>
  )
}

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 60vh;
`

const SearchBar = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;

  .ant-input-search {
    flex: 1;
  }
`

const SelectAllButton = styled.span`
  color: var(--color-primary);
  cursor: pointer;
  white-space: nowrap;
  font-size: 13px;

  &:hover {
    text-decoration: underline;
  }
`

const AssistantList = styled(List<Assistant>)`
  overflow-y: auto;
  max-height: 400px;
  border: 1px solid var(--color-border);
  border-radius: 8px;

  .ant-list-item {
    padding: 0;
  }
`

const AssistantItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--color-background-soft);
  }

  .ant-checkbox-wrapper {
    margin-top: 2px;
  }
`

const AssistantInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const AssistantEmoji = styled.span`
  font-size: 18px;
`

const AssistantName = styled.span`
  font-weight: 500;
  color: var(--color-text);
`

const AssistantDesc = styled.div`
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--color-text-secondary);
  font-size: 14px;
`

export default ImportExpertModal
