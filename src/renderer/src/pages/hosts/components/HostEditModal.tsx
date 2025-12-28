import EmojiPicker from '@renderer/components/EmojiPicker'
import type { Host } from '@renderer/types'
import { Button, Input, Modal, Popover } from 'antd'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface Props {
  open: boolean
  host?: Host | null
  onOk: (data: { name: string; emoji: string; description: string; prompt: string; welcomeMessage: string }) => void
  onCancel: () => void
}

const HostEditModal: FC<Props> = ({ open, host, onOk, onCancel }) => {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🏠')
  const [description, setDescription] = useState('')
  const [prompt, setPrompt] = useState('')
  const [welcomeMessage, setWelcomeMessage] = useState('')

  useEffect(() => {
    if (open) {
      if (host) {
        setName(host.name)
        setEmoji(host.emoji || '🏠')
        setDescription(host.description || '')
        setPrompt(host.prompt || '')
        setWelcomeMessage(host.welcomeMessage || '')
      } else {
        setName('')
        setEmoji('🏠')
        setDescription('')
        setPrompt('')
        setWelcomeMessage('')
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
      welcomeMessage: welcomeMessage.trim()
    })
  }

  return (
    <Modal
      title={host ? t('hosts.edit') : t('hosts.add')}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okButtonProps={{ disabled: !name.trim() }}
      destroyOnClose>
      <FormContainer>
        <FormItem>
          <Label>{t('hosts.emoji')}</Label>
          <Popover content={<EmojiPicker onEmojiClick={setEmoji} />} trigger="click">
            <Button style={{ fontSize: 20, padding: '4px 12px' }}>{emoji}</Button>
          </Popover>
        </FormItem>
        <FormItem>
          <Label>{t('hosts.name')}</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('hosts.name')} autoFocus />
        </FormItem>
        <FormItem>
          <Label>{t('hosts.description')}</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('hosts.description_placeholder')}
            maxLength={50}
            showCount
          />
          <HelpText>{t('hosts.description_help')}</HelpText>
        </FormItem>
        <FormItem>
          <Label>{t('hosts.system_prompt')}</Label>
          <Input.TextArea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t('hosts.system_prompt_placeholder')}
            rows={4}
          />
          <HelpText>{t('hosts.system_prompt_help')}</HelpText>
        </FormItem>
        <FormItem>
          <Label>{t('hosts.welcome_message')}</Label>
          <Input.TextArea
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            placeholder={t('hosts.welcome_message_placeholder')}
            rows={3}
          />
        </FormItem>
      </FormContainer>
    </Modal>
  )
}

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 0;
`

const FormItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Label = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
`

const HelpText = styled.div`
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-top: 4px;
`

export default HostEditModal
