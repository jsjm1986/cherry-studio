import EmojiPicker from '@renderer/components/EmojiPicker'
import { HStack } from '@renderer/components/Layout'
import AssistantKnowledgeBaseSettings from '@renderer/pages/settings/AssistantSettings/AssistantKnowledgeBaseSettings'
import AssistantMCPSettings from '@renderer/pages/settings/AssistantSettings/AssistantMCPSettings'
import type { Assistant, AssistantSettings, Expert, ExpertPromptSettings } from '@renderer/types'
import { Button, Divider, Input, Modal, Popover, Select, Switch, Tabs } from 'antd'
import type { FC } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface Props {
  open: boolean
  expert: Expert | null
  onSave: (expert: Expert) => void
  onCancel: () => void
}

const ExpertSettingsPopup: FC<Props> = ({ open, expert, onSave, onCancel }) => {
  const { t } = useTranslation()
  const [localExpert, setLocalExpert] = useState<Expert | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const initialExpertRef = useRef<Expert | null>(null)

  // 当弹窗打开或专家变化时，初始化本地状态
  useEffect(() => {
    if (open && expert) {
      const expertCopy = JSON.parse(JSON.stringify(expert)) as Expert
      setLocalExpert(expertCopy)
      initialExpertRef.current = expertCopy
      setHasChanges(false)
    }
  }, [open, expert])

  // 更新专家基本信息（只更新本地状态）
  const updateBasicInfo = useCallback((field: keyof Expert, value: any) => {
    setLocalExpert((prev) => {
      if (!prev) return prev
      return { ...prev, [field]: value }
    })
    setHasChanges(true)
  }, [])

  // 更新专家（作为 Assistant 使用）- 只更新本地状态
  const updateExpertAsAssistant = useCallback((updatedAssistant: Assistant) => {
    setLocalExpert((prev) => {
      if (!prev) return prev
      // 保留 Expert 特有的字段，只更新 Assistant 共有的字段
      return {
        ...prev,
        ...updatedAssistant,
        type: prev.type,
        hostId: prev.hostId
      } as Expert
    })
    setHasChanges(true)
  }, [])

  // 更新专家设置 - 只更新本地状态
  const updateExpertSettings = useCallback((settings: Partial<AssistantSettings>) => {
    setLocalExpert((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        settings: { ...prev.settings, ...settings }
      }
    })
    setHasChanges(true)
  }, [])

  // 更新专家提示词设置
  const updatePromptSettings = useCallback((promptSettings: Partial<ExpertPromptSettings>) => {
    setLocalExpert((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        promptSettings: { ...prev.promptSettings, ...promptSettings }
      }
    })
    setHasChanges(true)
  }, [])

  // 保存设置
  const handleSave = useCallback(() => {
    if (localExpert) {
      onSave(localExpert)
      setHasChanges(false)
      window.toast?.success?.(t('common.saved', { defaultValue: '保存成功' }))
    }
  }, [localExpert, onSave, t])

  // 取消并关闭
  const handleCancel = useCallback(() => {
    if (hasChanges) {
      Modal.confirm({
        title: t('common.unsaved_changes', { defaultValue: '未保存的更改' }),
        content: t('common.unsaved_changes_confirm', { defaultValue: '你有未保存的更改，确定要放弃吗？' }),
        okText: t('common.discard', { defaultValue: '放弃' }),
        cancelText: t('common.cancel'),
        okButtonProps: { danger: true },
        onOk: () => {
          setHasChanges(false)
          onCancel()
        }
      })
    } else {
      onCancel()
    }
  }, [hasChanges, onCancel, t])

  if (!localExpert) {
    return null
  }

  const tabItems = [
    {
      key: 'basic',
      label: t('experts.settings.basic'),
      children: (
        <TabContent>
          <FormSection>
            {/* 头像和名称行 - 更紧凑的布局 */}
            <AvatarNameRow>
              <Popover
                content={<EmojiPicker onEmojiClick={(emoji) => updateBasicInfo('emoji', emoji)} />}
                trigger="click"
                placement="bottomLeft">
                <AvatarButton>{localExpert.emoji || '👤'}</AvatarButton>
              </Popover>
              <NameInputWrapper>
                <Input
                  value={localExpert.name}
                  onChange={(e) => updateBasicInfo('name', e.target.value)}
                  placeholder={t('experts.name')}
                  size="large"
                  style={{ fontSize: 16, fontWeight: 500 }}
                />
              </NameInputWrapper>
            </AvatarNameRow>

            {/* 提及名称 */}
            <FormItem>
              <Label>{t('experts.handle')}</Label>
              <Input
                value={localExpert.handle}
                onChange={(e) => updateBasicInfo('handle', e.target.value)}
                placeholder="@name"
              />
              <HintText>{t('experts.handleHint', { defaultValue: '用于在聊天中 @ 提及此专家' })}</HintText>
            </FormItem>

            {/* 描述 */}
            <FormItem>
              <Label>{t('experts.description')}</Label>
              <Input
                value={localExpert.description}
                onChange={(e) => updateBasicInfo('description', e.target.value)}
                placeholder={t('experts.description')}
              />
            </FormItem>

            {/* 触发关键词 */}
            <FormItem>
              <Label>{t('experts.triggerKeywords')}</Label>
              <Input
                value={localExpert.triggerKeywords?.join(', ') || ''}
                onChange={(e) =>
                  updateBasicInfo(
                    'triggerKeywords',
                    e.target.value
                      .split(',')
                      .map((k) => k.trim())
                      .filter(Boolean)
                  )
                }
                placeholder={t('experts.triggerKeywordsHint')}
              />
              <HintText>{t('experts.triggerKeywordsDesc', { defaultValue: '多个关键词用逗号分隔' })}</HintText>
            </FormItem>

            {/* 风格提示词 */}
            <FormItem>
              <Label>{t('experts.stylePrompt')}</Label>
              <StyledTextArea
                value={localExpert.prompt}
                onChange={(e) => updateBasicInfo('prompt', e.target.value)}
                placeholder={t('experts.stylePromptHint', { defaultValue: '定义专家的回复风格和专业领域...' })}
                rows={6}
              />
            </FormItem>

            <Divider style={{ margin: '12px 0' }} />

            {/* 提示词增强设置 */}
            <FormItem>
              <HStack justifyContent="space-between" alignItems="center">
                <Label>{t('experts.promptSettings.enhancedMode', { defaultValue: '提示词增强模式' })}</Label>
                <Switch
                  checked={localExpert.promptSettings?.enableEnhancedMode ?? true}
                  onChange={(checked) => updatePromptSettings({ enableEnhancedMode: checked })}
                />
              </HStack>
              <HintText>
                {t('experts.promptSettings.enhancedModeHint', {
                  defaultValue: '启用后会自动添加身份强化指令，确保专家始终保持设定的风格'
                })}
              </HintText>
            </FormItem>

            {/* 主机提示词处理方式 */}
            <FormItem>
              <Label>{t('experts.promptSettings.hostPromptMode', { defaultValue: '主机提示词' })}</Label>
              <Select
                value={localExpert.promptSettings?.hostPromptMode ?? 'append'}
                onChange={(value) => updatePromptSettings({ hostPromptMode: value })}
                style={{ width: '100%' }}
                options={[
                  {
                    value: 'append',
                    label: t('experts.promptSettings.hostPromptAppend', { defaultValue: '附加到专家提示词后' })
                  },
                  {
                    value: 'ignore',
                    label: t('experts.promptSettings.hostPromptIgnore', { defaultValue: '忽略主机提示词' })
                  }
                ]}
              />
              <HintText>
                {t('experts.promptSettings.hostPromptModeHint', {
                  defaultValue: '选择如何处理主机的提示词'
                })}
              </HintText>
            </FormItem>
          </FormSection>
        </TabContent>
      )
    },
    {
      key: 'knowledge',
      label: t('assistants.settings.knowledge_base.label'),
      children: (
        <TabContent>
          <AssistantKnowledgeBaseSettings
            assistant={localExpert}
            updateAssistant={updateExpertAsAssistant}
            updateAssistantSettings={updateExpertSettings}
          />
        </TabContent>
      )
    },
    {
      key: 'mcp',
      label: 'MCP',
      children: (
        <TabContent>
          <AssistantMCPSettings
            assistant={localExpert}
            updateAssistant={updateExpertAsAssistant}
            updateAssistantSettings={updateExpertSettings}
          />
        </TabContent>
      )
    }
  ]

  return (
    <Modal
      title={
        <HStack alignItems="center" gap={8}>
          <span style={{ fontSize: 18 }}>{localExpert.emoji || '👤'}</span>
          <span>{localExpert.name || t('experts.settings.title')}</span>
          {hasChanges && <UnsavedBadge>*</UnsavedBadge>}
        </HStack>
      }
      open={open}
      onCancel={handleCancel}
      footer={
        <FooterContainer>
          <Button onClick={handleCancel}>{t('common.cancel')}</Button>
          <Button type="primary" onClick={handleSave} disabled={!hasChanges}>
            {t('common.save')}
          </Button>
        </FooterContainer>
      }
      width={600}
      destroyOnClose
      styles={{
        body: { padding: 0 }
      }}>
      <ModalContent>
        <Tabs items={tabItems} defaultActiveKey="basic" style={{ height: '100%' }} />
      </ModalContent>
    </Modal>
  )
}

const ModalContent = styled.div`
  height: 60vh;
  max-height: 500px;
  overflow: hidden;

  .ant-tabs {
    height: 100%;
  }

  .ant-tabs-nav {
    margin-bottom: 0;
    padding: 0 16px;
  }

  .ant-tabs-content {
    height: calc(100% - 46px);
  }

  .ant-tabs-tabpane {
    height: 100%;
    overflow-y: auto;
  }
`

const TabContent = styled.div`
  padding: 20px;
  height: 100%;
  overflow-y: auto;
`

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const AvatarNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 4px;
`

const AvatarButton = styled.button`
  width: 56px;
  height: 56px;
  border-radius: 14px;
  border: 2px dashed var(--color-border);
  background: var(--color-background-soft);
  font-size: 28px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    border-color: var(--color-primary);
    background: var(--color-primary-soft);
  }
`

const NameInputWrapper = styled.div`
  flex: 1;

  .ant-input {
    border: none;
    background: transparent;
    padding-left: 0;

    &:focus {
      box-shadow: none;
    }
  }
`

const FormItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const Label = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
`

const HintText = styled.span`
  font-size: 12px;
  color: var(--color-text-tertiary);
`

const StyledTextArea = styled(Input.TextArea)`
  resize: none;

  &.ant-input {
    min-height: 120px;
  }
`

const FooterContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 0;
`

const UnsavedBadge = styled.span`
  color: var(--color-warning);
  font-size: 16px;
  font-weight: bold;
`

export default ExpertSettingsPopup
