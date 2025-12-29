import EmojiPicker from '@renderer/components/EmojiPicker'
import type { Expert } from '@renderer/types'
import {
  compileCartridgeToPrompt,
  extractExpertInfoFromCartridge,
  parseCartridgeMarkdown
} from '@renderer/utils/cartridge'
import { Button, Input, Modal, Popover, Upload, message } from 'antd'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface Props {
  open: boolean
  expert?: Expert | null
  onOk: (data: {
    name: string
    emoji: string
    description: string
    handle: string
    triggerKeywords: string[]
    prompt: string
    cartridgeMarkdown?: string
  }) => void
  onCancel: () => void
}

const ExpertEditModal: FC<Props> = ({ open, expert, onOk, onCancel }) => {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('👤')
  const [description, setDescription] = useState('')
  const [handle, setHandle] = useState('')
  const [triggerKeywords, setTriggerKeywords] = useState('')
  const [prompt, setPrompt] = useState('')
  const [cartridgeMarkdown, setCartridgeMarkdown] = useState<string | undefined>()

  useEffect(() => {
    if (open) {
      if (expert) {
        setName(expert.name)
        setEmoji(expert.emoji || '👤')
        setDescription(expert.description || '')
        setHandle(expert.handle || `@${expert.name}`)
        setTriggerKeywords(expert.triggerKeywords?.join(', ') || '')
        setPrompt(expert.prompt || '')
        setCartridgeMarkdown(expert.cartridgeMarkdown)
      } else {
        setName('')
        setEmoji('👤')
        setDescription('')
        setHandle('')
        setTriggerKeywords('')
        setPrompt('')
        setCartridgeMarkdown(undefined)
      }
    }
  }, [open, expert])

  const handleOk = () => {
    if (!name.trim()) return
    onOk({
      name: name.trim(),
      emoji,
      description: description.trim(),
      handle: handle.trim() || `@${name.trim()}`,
      triggerKeywords: triggerKeywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean),
      prompt: prompt.trim(),
      cartridgeMarkdown
    })
  }

  const handleImportCartridge = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const markdown = e.target?.result as string
        const cartridgeData = parseCartridgeMarkdown(markdown)
        const compiledPrompt = compileCartridgeToPrompt(cartridgeData)
        const expertInfo = extractExpertInfoFromCartridge(cartridgeData)

        // 填充表单
        setName(expertInfo.name)
        setHandle(expertInfo.handle)
        setTriggerKeywords(expertInfo.triggerKeywords.join(', '))
        setPrompt(compiledPrompt)
        setCartridgeMarkdown(markdown)

        if (cartridgeData.identity.profession) {
          setDescription(cartridgeData.identity.profession)
        }

        message.success(t('experts.cartridge.importSuccess'))
      } catch {
        message.error(t('experts.cartridge.importError'))
      }
    }
    reader.readAsText(file, 'UTF-8')
    return false // 阻止自动上传
  }

  return (
    <Modal
      title={expert ? t('experts.edit') : t('experts.add')}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okButtonProps={{ disabled: !name.trim() }}
      destroyOnClose
      width={520}>
      <FormContainer>
        <FormRow>
          <FormItem style={{ flex: 0 }}>
            <Label>{t('hosts.emoji')}</Label>
            <Popover content={<EmojiPicker onEmojiClick={setEmoji} />} trigger="click">
              <Button style={{ fontSize: 20, padding: '4px 12px' }}>{emoji}</Button>
            </Popover>
          </FormItem>
          <FormItem style={{ flex: 1 }}>
            <Label>{t('experts.name')}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('experts.name')} autoFocus />
          </FormItem>
          <FormItem style={{ flex: 0 }}>
            <Label>{t('experts.cartridge.import')}</Label>
            <Upload accept=".md,.markdown" showUploadList={false} beforeUpload={handleImportCartridge}>
              <Button>{t('experts.cartridge.importBtn')}</Button>
            </Upload>
          </FormItem>
        </FormRow>
        <FormItem>
          <Label>{t('experts.handle')}</Label>
          <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@name" />
        </FormItem>
        <FormItem>
          <Label>{t('experts.description')}</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('experts.description')}
          />
        </FormItem>
        <FormItem>
          <Label>{t('experts.triggerKeywords')}</Label>
          <Input
            value={triggerKeywords}
            onChange={(e) => setTriggerKeywords(e.target.value)}
            placeholder={t('experts.triggerKeywordsHint')}
          />
        </FormItem>
        <FormItem>
          <LabelRow>
            <Label>{t('experts.stylePrompt')}</Label>
            {cartridgeMarkdown && <CartridgeBadge>{t('experts.cartridge.loaded')}</CartridgeBadge>}
          </LabelRow>
          <Input.TextArea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t('experts.stylePrompt')}
            rows={6}
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

const FormRow = styled.div`
  display: flex;
  gap: 16px;
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

const LabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const CartridgeBadge = styled.span`
  font-size: 11px;
  padding: 2px 6px;
  background: var(--color-primary);
  color: white;
  border-radius: 4px;
`

export default ExpertEditModal
