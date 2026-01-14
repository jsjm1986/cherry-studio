import EmojiPicker from '@renderer/components/EmojiPicker'
import { FormGroup, FormHint, FormInput, FormLabel, FormTextArea, StyledModal } from '@renderer/components/StyledModal'
import type { Host } from '@renderer/types'
import { Popover } from 'antd'
import { Folder, X } from 'lucide-react'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface Props {
  open: boolean
  host?: Host | null
  onOk: (data: {
    name: string
    emoji: string
    description: string
    prompt: string
    welcomeMessage: string
    projectFolderPath: string
  }) => void
  onCancel: () => void
}

const HostEditModal: FC<Props> = ({ open, host, onOk, onCancel }) => {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🏠')
  const [description, setDescription] = useState('')
  const [prompt, setPrompt] = useState('')
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [projectFolderPath, setProjectFolderPath] = useState('')

  useEffect(() => {
    if (open) {
      if (host) {
        setName(host.name)
        setEmoji(host.emoji || '🏠')
        setDescription(host.description || '')
        setPrompt(host.prompt || '')
        setWelcomeMessage(host.welcomeMessage || '')
        setProjectFolderPath(host.projectFolderPath || '')
      } else {
        setName('')
        setEmoji('🏠')
        setDescription('')
        setPrompt('')
        setWelcomeMessage('')
        setProjectFolderPath('')
      }
    }
  }, [open, host])

  const handleOk = () => {
    if (!name.trim()) return
    onOk({
      name: name.trim(),
      emoji,
      description: description.trim(),
      prompt: prompt.trim(),
      welcomeMessage: welcomeMessage.trim(),
      projectFolderPath: projectFolderPath.trim()
    })
  }

  const handleSelectFolder = async () => {
    const path = await window.api.file.selectFolder()
    if (path) {
      setProjectFolderPath(path)
    }
  }

  const handleClearFolder = () => {
    setProjectFolderPath('')
  }

  return (
    <StyledModal
      title={host ? t('hosts.edit') : t('hosts.add')}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okButtonProps={{ disabled: !name.trim() }}
      width={520}
      destroyOnHidden>
      <FormContainer>
        {/* 头像和名称 - 优雅的头部布局 */}
        <HeaderRow>
          <Popover content={<EmojiPicker onEmojiClick={setEmoji} />} trigger="click" placement="bottomLeft">
            <EmojiButton>{emoji}</EmojiButton>
          </Popover>
          <HeaderInfo>
            <FormInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('hosts.name')}
              autoFocus
              style={{ fontSize: 16, fontWeight: 500, height: 42 }}
            />
            <FormInput
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('hosts.description_placeholder')}
              maxLength={50}
              showCount
            />
          </HeaderInfo>
        </HeaderRow>

        <Divider />

        <FormGroup>
          <FormLabel>{t('hosts.project_folder')}</FormLabel>
          <FolderInputContainer>
            <FormInput
              value={projectFolderPath}
              onChange={(e) => setProjectFolderPath(e.target.value)}
              placeholder={t('hosts.project_folder_placeholder')}
              style={{ flex: 1 }}
              suffix={
                projectFolderPath && (
                  <ClearButton onClick={handleClearFolder}>
                    <X size={14} />
                  </ClearButton>
                )
              }
            />
            <SelectFolderButton onClick={handleSelectFolder}>
              <Folder size={16} />
              {t('hosts.select_folder')}
            </SelectFolderButton>
          </FolderInputContainer>
          <FormHint>{t('hosts.project_folder_help')}</FormHint>
        </FormGroup>

        <FormGroup>
          <FormLabel>{t('hosts.system_prompt')}</FormLabel>
          <FormTextArea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t('hosts.system_prompt_placeholder')}
            rows={4}
          />
          <FormHint>{t('hosts.system_prompt_help')}</FormHint>
        </FormGroup>

        <FormGroup>
          <FormLabel>{t('hosts.welcome_message')}</FormLabel>
          <FormTextArea
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            placeholder={t('hosts.welcome_message_placeholder')}
            rows={3}
          />
        </FormGroup>
      </FormContainer>
    </StyledModal>
  )
}

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 8px 0 16px;
`

const HeaderInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const EmojiButton = styled.button`
  width: 72px;
  height: 72px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-background-soft);
  font-size: 36px;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.08);
    transform: scale(1.02);
  }
`

const Divider = styled.div`
  height: 1px;
  background: var(--color-border);
  margin: 8px 0 16px;
`

const FolderInputContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`

const SelectFolderButton = styled.button`
  height: 38px;
  padding: 0 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background-soft);
  color: var(--color-text);
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
  white-space: nowrap;

  &:hover {
    border-color: #3b82f6;
    color: #3b82f6;
  }
`

const ClearButton = styled.span`
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
  transition: color 0.15s ease;

  &:hover {
    color: var(--color-text);
  }
`

export default HostEditModal
