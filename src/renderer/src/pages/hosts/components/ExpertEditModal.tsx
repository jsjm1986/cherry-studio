import EmojiPicker from '@renderer/components/EmojiPicker'
import { FormGroup, FormInput, FormLabel, FormRow, FormTextArea, StyledModal } from '@renderer/components/StyledModal'
import type { Expert } from '@renderer/types'
import {
  compileCartridgeToPrompt,
  extractExpertInfoFromCartridge,
  parseCartridgeMarkdown
} from '@renderer/utils/cartridge'
import { message,Popover, Upload } from 'antd'
import { Upload as UploadIcon } from 'lucide-react'
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
    <StyledModal
      title={expert ? t('experts.edit') : t('experts.add')}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okButtonProps={{ disabled: !name.trim() }}
      destroyOnHidden
      width={520}>
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
              placeholder={t('experts.name')}
              autoFocus
              style={{ fontSize: 16, fontWeight: 500, height: 42 }}
            />
            <FormInput
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('experts.description')}
            />
          </HeaderInfo>
          <Upload accept=".md,.markdown" showUploadList={false} beforeUpload={handleImportCartridge}>
            <ImportButton>
              <UploadIcon size={16} />
              {t('experts.cartridge.importBtn')}
            </ImportButton>
          </Upload>
        </HeaderRow>

        <Divider />

        <FormRow>
          <FormGroup>
            <FormLabel>{t('experts.handle')}</FormLabel>
            <FormInput value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@name" />
          </FormGroup>
          <FormGroup>
            <FormLabel>{t('experts.triggerKeywords')}</FormLabel>
            <FormInput
              value={triggerKeywords}
              onChange={(e) => setTriggerKeywords(e.target.value)}
              placeholder={t('experts.triggerKeywordsHint')}
            />
          </FormGroup>
        </FormRow>

        <FormGroup>
          <LabelRow>
            <FormLabel style={{ marginBottom: 0 }}>{t('experts.stylePrompt')}</FormLabel>
            {cartridgeMarkdown && <CartridgeBadge>{t('experts.cartridge.loaded')}</CartridgeBadge>}
          </LabelRow>
          <FormTextArea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t('experts.stylePrompt')}
            rows={6}
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

const ImportButton = styled.button`
  height: 36px;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background-soft);
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    border-color: #3b82f6;
    color: #3b82f6;
  }
`

const Divider = styled.div`
  height: 1px;
  background: var(--color-border);
  margin: 8px 0 16px;
`

const LabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`

const CartridgeBadge = styled.span`
  font-size: 11px;
  padding: 2px 8px;
  background: #3b82f6;
  color: white;
  border-radius: 4px;
`

export default ExpertEditModal
