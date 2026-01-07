import { TopView } from '@renderer/components/TopView'
import store from '@renderer/store'
import { selectMessagesForTopic } from '@renderer/store/newMessage'
import type { Host, Topic } from '@renderer/types'
import type { Message } from '@renderer/types/newMessage'
import { messageToMarkdown } from '@renderer/utils/export'
import { getMainTextContent } from '@renderer/utils/messageUtils/find'
import { Input, Modal, Spin } from 'antd'
import dayjs from 'dayjs'
import { FileText, FolderOpen, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface SaveResult {
  success: boolean
  filePath: string
}

type SaveMode = 'single' | 'full'

interface ShowParams {
  message: Message
  host: Host
  topic: Topic
  mode: SaveMode
}

interface Props extends ShowParams {
  resolve: (result: SaveResult | null) => void
}

const PopupContainer: React.FC<Props> = ({ message, host, topic, mode, resolve }) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const [filename, setFilename] = useState('')
  const [isGeneratingFilename, setIsGeneratingFilename] = useState(false)

  const projectFolderPath = host.projectFolderPath || ''

  // 获取内容
  const getContent = useCallback(() => {
    if (mode === 'single') {
      // 单条消息
      const mainText = getMainTextContent(message)
      const dateStr = dayjs(message.createdAt).format('YYYY-MM-DD HH:mm:ss')

      return `# ${topic.name || 'Untitled'}

> 来源: ${host.name} / ${topic.name || 'Untitled'}
> 保存时间: ${dateStr}

---

${mainText}`
    } else {
      // 完整对话上下文
      const state = store.getState()
      const messages = selectMessagesForTopic(state, topic.id)
      const dateStr = dayjs().format('YYYY-MM-DD HH:mm:ss')

      let content = `# ${topic.name || 'Untitled'} - 完整对话

> 来源: ${host.name} / ${topic.name || 'Untitled'}
> 保存时间: ${dateStr}

---

## 对话记录

`
      // 获取到当前消息为止的所有消息
      const messageIndex = messages.findIndex((m) => m.id === message.id)
      const relevantMessages = messageIndex >= 0 ? messages.slice(0, messageIndex + 1) : messages

      for (const msg of relevantMessages) {
        if (msg.role === 'user') {
          content += `### 用户\n${getMainTextContent(msg)}\n\n`
        } else if (msg.role === 'assistant') {
          const expertName = msg.expertName || msg.model?.name || 'AI'
          content += `### ${expertName}\n${getMainTextContent(msg)}\n\n`
        }
      }

      return content
    }
  }, [message, host, topic, mode])

  const content = getContent()

  // 生成默认文件名
  useEffect(() => {
    const datePrefix = dayjs().format('YYMMDD')
    const defaultName = mode === 'single' ? `${datePrefix}_消息` : `${datePrefix}_${topic.name || '对话'}`
    setFilename(defaultName)
  }, [mode, topic.name])

  // AI 生成文件名
  const handleGenerateFilename = useCallback(async () => {
    setIsGeneratingFilename(true)
    try {
      // 简单实现：从内容中提取关键词作为文件名
      const datePrefix = dayjs().format('YYMMDD')
      const mainText = getMainTextContent(message)
      // 取前50个字符作为简单摘要
      const summary = mainText
        .slice(0, 50)
        .replace(/[/\\:*?"<>|\n\r]/g, ' ')
        .trim()
      const shortSummary = summary.length > 20 ? summary.slice(0, 20) + '...' : summary
      setFilename(`${datePrefix}_${shortSummary || '消息'}`)
    } finally {
      setIsGeneratingFilename(false)
    }
  }, [message])

  // 保存文件
  const handleSave = async () => {
    if (!filename.trim() || !projectFolderPath) return

    setLoading(true)
    try {
      // 确保文件名以 .md 结尾
      const safeName = filename.endsWith('.md') ? filename : `${filename}.md`
      // 过滤非法字符
      const sanitizedName = safeName.replace(/[/\\:*?"<>|]/g, '_')
      const filePath = `${projectFolderPath}/${sanitizedName}`

      await window.api.file.save(filePath, content)

      window.toast?.success?.(t('hosts.project.save_success'))
      setOpen(false)
      resolve({ success: true, filePath })
    } catch (error) {
      console.error('Failed to save file:', error)
      window.toast?.error?.('保存失败')
      setLoading(false)
    }
  }

  const onCancel = () => setOpen(false)
  const onClose = () => resolve(null)

  // 截取预览内容
  const previewContent = content.length > 500 ? content.substring(0, 500) + '...' : content

  return (
    <Modal
      title={t('hosts.project.save_to_folder')}
      open={open}
      onOk={handleSave}
      onCancel={onCancel}
      afterClose={onClose}
      destroyOnHidden
      centered
      width={520}
      okText={t('common.save')}
      cancelText={t('common.cancel')}
      okButtonProps={{ loading, disabled: !filename.trim() || isGeneratingFilename || !projectFolderPath }}>
      <ModalContent>
        {!projectFolderPath ? (
          <EmptyState>
            <EmptyText>{t('hosts.project.folder_empty')}</EmptyText>
            <EmptyHint>请先在房间设置中配置项目文件夹</EmptyHint>
          </EmptyState>
        ) : (
          <>
            {/* 保存路径 */}
            <Section>
              <SectionLabel>
                <FolderOpen size={14} />
                {t('hosts.project.save_path')}
              </SectionLabel>
              <PathDisplay title={projectFolderPath}>{projectFolderPath}</PathDisplay>
            </Section>

            {/* 文件名 */}
            <Section>
              <SectionLabel>
                <FileText size={14} />
                {t('hosts.project.filename')}
              </SectionLabel>
              <FilenameInputWrapper>
                <Input
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder={t('hosts.project.filename_placeholder')}
                  suffix=".md"
                  disabled={isGeneratingFilename}
                />
                <GenerateButton
                  onClick={handleGenerateFilename}
                  disabled={isGeneratingFilename}
                  title={t('hosts.project.generate_filename')}>
                  {isGeneratingFilename ? <Spin size="small" /> : <Sparkles size={16} />}
                </GenerateButton>
              </FilenameInputWrapper>
              {isGeneratingFilename && <GeneratingHint>{t('hosts.project.generating_filename')}</GeneratingHint>}
            </Section>

            {/* 内容预览 */}
            <Section>
              <SectionLabel>{t('hosts.project.content_preview')}</SectionLabel>
              <ContentPreview>{previewContent}</ContentPreview>
            </Section>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 0;
`

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const SectionLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
`

const PathDisplay = styled.div`
  padding: 8px 12px;
  background: var(--color-bg-soft);
  border-radius: 6px;
  font-size: 12px;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const FilenameInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const GenerateButton = styled.button<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 32px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-soft);
  border-radius: 6px;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  color: ${({ disabled }) => (disabled ? 'var(--color-text-tertiary)' : 'var(--color-primary)')};
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: var(--color-primary-soft);
    border-color: var(--color-primary);
  }
`

const GeneratingHint = styled.div`
  font-size: 12px;
  color: var(--color-text-tertiary);
`

const ContentPreview = styled.div`
  padding: 12px;
  background: var(--color-bg-soft);
  border-radius: 6px;
  font-size: 12px;
  color: var(--color-text-secondary);
  max-height: 150px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.5;
`

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 8px;
`

const EmptyText = styled.div`
  font-size: 14px;
  color: var(--color-text);
`

const EmptyHint = styled.div`
  font-size: 12px;
  color: var(--color-text-tertiary);
`

const TopViewKey = 'SaveToProjectPopup'

export default class SaveToProjectPopup {
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

  static showForMessage(message: Message, host: Host, topic: Topic): Promise<SaveResult | null> {
    return this.show({ message, host, topic, mode: 'single' })
  }

  static showForFullContext(message: Message, host: Host, topic: Topic): Promise<SaveResult | null> {
    return this.show({ message, host, topic, mode: 'full' })
  }
}
