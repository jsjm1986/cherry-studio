import RichEditor from '@renderer/components/RichEditor'
import type { RichEditorRef } from '@renderer/components/RichEditor/types'
import { message,Modal } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { TopView } from '../TopView'

interface ShowParams {
  filePath: string
  fileName: string
}

interface Props extends ShowParams {
  resolve: (saved: boolean) => void
}

const PopupContainer: React.FC<Props> = ({ filePath, fileName, resolve }) => {
  const [open, setOpen] = useState(true)
  const { t } = useTranslation()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const editorRef = useRef<RichEditorRef>(null)
  const isMounted = useRef(true)

  // 加载文件内容
  useEffect(() => {
    const loadFile = async () => {
      try {
        const fileContent = await window.api.file.readExternal(filePath)
        if (isMounted.current) {
          setContent(fileContent || '')
          setLoading(false)
        }
      } catch (err) {
        console.error('[ProjectFileEditPopup] Failed to load file:', err)
        if (isMounted.current) {
          setContent('')
          setLoading(false)
        }
      }
    }
    loadFile()

    return () => {
      isMounted.current = false
    }
  }, [filePath])

  const onSave = async () => {
    const finalContent = editorRef.current?.getMarkdown() || content
    setSaving(true)
    try {
      await window.api.file.write(filePath, finalContent)
      message.success(t('common.save_success'))
      resolve(true)
      setOpen(false)
    } catch (err) {
      console.error('[ProjectFileEditPopup] Failed to save file:', err)
      message.error(t('common.save_failed'))
    } finally {
      setSaving(false)
    }
  }

  const onCancel = () => {
    resolve(false)
    setOpen(false)
  }

  const onClose = () => {
    resolve(false)
  }

  const handleAfterOpenChange = (visible: boolean) => {
    if (visible && editorRef.current && !loading) {
      setTimeout(() => {
        editorRef.current?.focus()
      }, 100)
    }
  }

  ProjectFileEditPopup.hide = onCancel

  return (
    <Modal
      title={<TitleContainer>{fileName}</TitleContainer>}
      width="70vw"
      style={{ maxHeight: '80vh' }}
      transitionName="animation-move-down"
      okText={t('common.save')}
      cancelText={t('common.cancel')}
      open={open}
      onOk={onSave}
      onCancel={onCancel}
      afterClose={onClose}
      afterOpenChange={handleAfterOpenChange}
      confirmLoading={saving}
      maskClosable={false}
      keyboard={false}
      centered>
      <EditorContainer>
        {loading ? (
          <LoadingContainer>{t('common.loading')}</LoadingContainer>
        ) : (
          <RichEditor
            ref={editorRef}
            initialContent={content}
            placeholder={t('richEditor.placeholder')}
            onContentChange={setContent}
            onCommandsReady={(api) => {
              api.unregisterCommand('image')
              api.unregisterCommand('inlineMath')
            }}
            minHeight={window.innerHeight * 0.6}
            isFullWidth={true}
            className="project-file-editor"
          />
        )}
      </EditorContainer>
    </Modal>
  )
}

const TopViewKey = 'ProjectFileEditPopup'

const TitleContainer = styled.div`
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 60vw;
`

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--color-text-secondary);
`

const EditorContainer = styled.div`
  position: relative;

  .project-file-editor {
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-background);

    &:focus-within {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px var(--color-primary-alpha);
    }
  }
`

export default class ProjectFileEditPopup {
  static hide() {
    TopView.hide(TopViewKey)
  }

  static show(props: ShowParams): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      TopView.show(
        <PopupContainer
          {...props}
          resolve={(saved) => {
            resolve(saved)
            TopView.hide(TopViewKey)
          }}
        />,
        TopViewKey
      )
    })
  }
}
