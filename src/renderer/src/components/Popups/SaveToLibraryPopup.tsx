import { TopView } from '@renderer/components/TopView'
import { useInfoLibrary } from '@renderer/pages/hosts/hooks/useInfoLibrary'
import { Button, Form, Input, Modal, Select, Typography } from 'antd'
import { FolderPlus, Plus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'

const { Text, Paragraph } = Typography

interface ShowParams {
  hostId: string
  content: string
  sourceMessageId?: string
  sourceTopicId?: string
}

interface SaveResult {
  success: boolean
  folderId?: string
}

interface Props extends ShowParams {
  resolve: (result: SaveResult | null) => void
}

const PopupContainer: React.FC<Props> = ({ hostId, content, sourceMessageId, sourceTopicId, resolve }) => {
  const [open, setOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const [selectedFolderId, setSelectedFolderId] = useState<string>()
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const { folders, createFolder, saveItem } = useInfoLibrary(hostId)

  const hasFolders = folders.length > 0

  // 自动选择第一个文件夹
  useEffect(() => {
    if (folders.length > 0 && !selectedFolderId) {
      setSelectedFolderId(folders[0].id)
    }
  }, [folders.length])

  // 如果没有文件夹，自动进入创建模式
  useEffect(() => {
    if (!hasFolders) {
      setIsCreatingFolder(true)
    }
  }, [hasFolders])

  const handleCreateFolder = useCallback(() => {
    if (!newFolderName.trim()) return
    const folder = createFolder({ name: newFolderName.trim() })
    setSelectedFolderId(folder.id)
    setIsCreatingFolder(false)
    setNewFolderName('')
  }, [createFolder, newFolderName])

  const handleSave = useCallback(() => {
    if (!selectedFolderId) return
    setLoading(true)

    try {
      saveItem(selectedFolderId, {
        content,
        sourceMessageId,
        sourceTopicId
      })
      window.toast?.success?.('已保存到资料库')
      setOpen(false)
      resolve({ success: true, folderId: selectedFolderId })
    } catch {
      window.toast?.error?.('保存失败')
      setLoading(false)
      setOpen(false)
      resolve(null)
    }
  }, [selectedFolderId, content, sourceMessageId, sourceTopicId, saveItem, resolve])

  const onCancel = () => {
    setOpen(false)
    resolve(null)
  }

  const folderOptions = useMemo(
    () =>
      folders.map((f) => ({
        label: `${f.emoji || '📁'} ${f.name}`,
        value: f.id
      })),
    [folders]
  )

  return (
    <Modal
      title="保存到资料库"
      open={open}
      onOk={handleSave}
      onCancel={onCancel}
      destroyOnHidden
      centered
      width={480}
      okText="保存"
      cancelText="取消"
      okButtonProps={{ loading, disabled: !selectedFolderId }}>
      {/* 没有文件夹或正在创建 */}
      {isCreatingFolder ? (
        <CreateFolderSection>
          <SectionTitle>
            <FolderPlus size={16} />
            <span>{hasFolders ? '新建文件夹' : '请先创建一个文件夹'}</span>
          </SectionTitle>
          <Form layout="vertical">
            <Form.Item label="文件夹名称">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="输入文件夹名称"
                onPressEnter={handleCreateFolder}
                autoFocus
              />
            </Form.Item>
          </Form>
          <ButtonGroup>
            {hasFolders && (
              <Button onClick={() => setIsCreatingFolder(false)} style={{ marginRight: 8 }}>
                取消
              </Button>
            )}
            <Button type="primary" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              创建
            </Button>
          </ButtonGroup>
        </CreateFolderSection>
      ) : (
        <>
          {/* 选择文件夹 */}
          <Form layout="vertical">
            <Form.Item label="选择文件夹">
              <SelectWrapper>
                <Select
                  value={selectedFolderId}
                  onChange={setSelectedFolderId}
                  options={folderOptions}
                  placeholder="选择保存位置"
                  style={{ flex: 1 }}
                />
                <Button icon={<Plus size={14} />} onClick={() => setIsCreatingFolder(true)} title="新建文件夹" />
              </SelectWrapper>
            </Form.Item>
          </Form>

          {/* 内容预览 */}
          <ContentPreview>
            <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
              将保存以下内容:
            </Text>
            <PreviewBox>
              <Paragraph ellipsis={{ rows: 4 }} style={{ margin: 0, fontSize: 13 }}>
                {content}
              </Paragraph>
            </PreviewBox>
          </ContentPreview>
        </>
      )}
    </Modal>
  )
}

const TopViewKey = 'SaveToLibraryPopup'

export default class SaveToLibraryPopup {
  static hide() {
    TopView.hide(TopViewKey)
  }

  static show(params: ShowParams): Promise<SaveResult | null> {
    return new Promise<SaveResult | null>((resolve) => {
      TopView.show(
        <PopupContainer
          {...params}
          resolve={(result) => {
            resolve(result)
            this.hide()
          }}
        />,
        TopViewKey
      )
    })
  }
}

const CreateFolderSection = styled.div`
  padding: 8px 0;
`

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-weight: 500;
  color: var(--color-text);
`

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
`

const SelectWrapper = styled.div`
  display: flex;
  gap: 8px;
`

const ContentPreview = styled.div`
  margin-top: 16px;
`

const PreviewBox = styled.div`
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 12px;
  max-height: 150px;
  overflow-y: auto;
`
