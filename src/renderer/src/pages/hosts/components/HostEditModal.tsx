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
  onOk: (data: { name: string; emoji: string; description: string; welcomeMessage: string }) => void
  onCancel: () => void
}

const HostEditModal: FC<Props> = ({ open, host, onOk, onCancel }) => {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🏠')
  const [description, setDescription] = useState('')
  const [welcomeMessage, setWelcomeMessage] = useState('')

  useEffect(() => {
    if (open) {
      if (host) {
        setName(host.name)
        setEmoji(host.emoji || '🏠')
        setDescription(host.description || host.prompt || '')
        setWelcomeMessage(host.welcomeMessage || '')
      } else {
        setName('')
        setEmoji('🏠')
        setDescription('')
        setWelcomeMessage('')
      }
    }
  }, [open, host])

  const handleOk = () => {
    if (!name.trim()) return
    onOk({ name: name.trim(), emoji, description: description.trim(), welcomeMessage: welcomeMessage.trim() })
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
          <Input.TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('hosts.description')}
            rows={3}
          />
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

export default HostEditModal
