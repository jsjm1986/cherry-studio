import EmojiPicker from '@renderer/components/EmojiPicker'
import { HStack } from '@renderer/components/Layout'
import { FormGroup, FormHint, FormInput, FormLabel, FormTextArea, StyledModal } from '@renderer/components/StyledModal'
import AssistantKnowledgeBaseSettings from '@renderer/pages/settings/AssistantSettings/AssistantKnowledgeBaseSettings'
import AssistantMCPSettings from '@renderer/pages/settings/AssistantSettings/AssistantMCPSettings'
import type { Assistant, AssistantSettings, Expert, ExpertPromptSettings } from '@renderer/types'
import { Divider, Modal, Popover, Select, Switch, Tabs } from 'antd'
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
            {/* 头像和名称行 - 优雅的头部布局 */}
            <AvatarNameRow>
              <Popover
                content={<EmojiPicker onEmojiClick={(emoji) => updateBasicInfo('emoji', emoji)} />}
                trigger="click"
                placement="bottomLeft">
                <AvatarButton>{localExpert.emoji || '👤'}</AvatarButton>
              </Popover>
              <HeaderInfo>
                <FormInput
                  value={localExpert.name}
                  onChange={(e) => updateBasicInfo('name', e.target.value)}
                  placeholder={t('experts.name')}
                  style={{ fontSize: 16, fontWeight: 500, height: 42 }}
                />
                <FormInput
                  value={localExpert.description}
                  onChange={(e) => updateBasicInfo('description', e.target.value)}
                  placeholder={t('experts.description')}
                />
              </HeaderInfo>
            </AvatarNameRow>

            {/* 提及名称和触发关键词 */}
            <FormGroup>
              <FormLabel>{t('experts.handle')}</FormLabel>
              <FormInput
                value={localExpert.handle}
                onChange={(e) => updateBasicInfo('handle', e.target.value)}
                placeholder="@name"
              />
              <FormHint>{t('experts.handleHint', { defaultValue: '用于在聊天中 @ 提及此专家' })}</FormHint>
            </FormGroup>

            {/* 触发关键词 */}
            <FormGroup>
              <FormLabel>{t('experts.triggerKeywords')}</FormLabel>
              <FormInput
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
              <FormHint>{t('experts.triggerKeywordsDesc', { defaultValue: '多个关键词用逗号分隔' })}</FormHint>
            </FormGroup>

            {/* 风格提示词 */}
            <FormGroup>
              <FormLabel>{t('experts.stylePrompt')}</FormLabel>
              <FormTextArea
                value={localExpert.prompt}
                onChange={(e) => updateBasicInfo('prompt', e.target.value)}
                placeholder={t('experts.stylePromptHint', { defaultValue: '定义专家的回复风格和专业领域...' })}
                rows={6}
              />
            </FormGroup>

            <Divider style={{ margin: '12px 0' }} />

            {/* 提示词增强设置 */}
            <FormGroup>
              <HStack justifyContent="space-between" alignItems="center">
                <FormLabel style={{ marginBottom: 0 }}>
                  {t('experts.promptSettings.enhancedMode', { defaultValue: '提示词增强模式' })}
                </FormLabel>
                <Switch
                  checked={localExpert.promptSettings?.enableEnhancedMode ?? true}
                  onChange={(checked) => updatePromptSettings({ enableEnhancedMode: checked })}
                />
              </HStack>
              <FormHint>
                {t('experts.promptSettings.enhancedModeHint', {
                  defaultValue: '启用后会自动添加身份强化指令，确保专家始终保持设定的风格'
                })}
              </FormHint>
            </FormGroup>

            {/* 主机提示词处理方式 */}
            <FormGroup>
              <FormLabel>{t('experts.promptSettings.hostPromptMode', { defaultValue: '主机提示词' })}</FormLabel>
              <StyledSelect
                value={localExpert.promptSettings?.hostPromptMode ?? 'append'}
                onChange={(value) => updatePromptSettings({ hostPromptMode: value as 'append' | 'ignore' })}
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
              <FormHint>
                {t('experts.promptSettings.hostPromptModeHint', {
                  defaultValue: '选择如何处理主机的提示词'
                })}
              </FormHint>
            </FormGroup>
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
    <StyledModal
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
          <CancelButton onClick={handleCancel}>{t('common.cancel')}</CancelButton>
          <SaveButton onClick={handleSave} disabled={!hasChanges}>
            {t('common.save')}
          </SaveButton>
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
    </StyledModal>
  )
}

const ModalContent = styled.div`
  height: 60vh;
  max-height: 500px;
  overflow: hidden;

  /* 统一蓝色主题 */
  .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
    color: #3b82f6;
  }

  .ant-tabs-ink-bar {
    background: #3b82f6;
  }

  .ant-tabs-tab:hover {
    color: #3b82f6;
  }

  .ant-switch.ant-switch-checked {
    background: #3b82f6;
  }

  .ant-switch.ant-switch-checked:hover:not(.ant-switch-disabled) {
    background: #2563eb;
  }

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
  gap: 4px;
`

const AvatarNameRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 8px 0 16px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 12px;
`

const AvatarButton = styled.button`
  width: 72px;
  height: 72px;
  border-radius: 16px;
  border: 1px solid var(--color-border);
  background: var(--color-background-soft);
  font-size: 36px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  flex-shrink: 0;

  &:hover {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.08);
    transform: scale(1.02);
  }
`

const HeaderInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const StyledSelect = styled(Select)`
  .ant-select-selector {
    border-radius: 8px !important;
    height: 38px !important;
  }

  &.ant-select-focused .ant-select-selector {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
  }

  &:hover .ant-select-selector {
    border-color: #3b82f6 !important;
  }
`

const FooterContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`

const CancelButton = styled.button`
  height: 36px;
  padding: 0 20px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: #3b82f6;
    color: #3b82f6;
  }
`

const SaveButton = styled.button`
  height: 36px;
  padding: 0 20px;
  border-radius: 8px;
  border: none;
  background: #3b82f6;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: #2563eb;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const UnsavedBadge = styled.span`
  color: #f59e0b;
  font-size: 16px;
  font-weight: bold;
`

export default ExpertSettingsPopup
