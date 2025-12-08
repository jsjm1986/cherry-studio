import { useTheme } from '@renderer/context/ThemeProvider'
import { Copy } from 'lucide-react'
import type { FC } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface Props {
  containerRef: React.RefObject<HTMLElement | null>
  onCopy?: (selectedText: string) => void
  onAskHer?: (selectedText: string) => void
  onFormat?: (selectedText: string) => void
  onHighlight?: (selectedText: string) => void
}

interface ToolbarPosition {
  top: number
  left: number
  visible: boolean
}

const TextSelectionToolbar: FC<Props> = ({ containerRef, onCopy, onAskHer, onFormat, onHighlight }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<ToolbarPosition>({ top: 0, left: 0, visible: false })
  const [selectedText, setSelectedText] = useState('')

  // 获取主题颜色
  const colors = useMemo(() => {
    const isDark = theme === 'dark'
    return {
      background: isDark ? '#3a3a3a' : '#ffffff',
      border: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e5e5',
      boxShadow: isDark
        ? '0 2px 8px rgba(0, 0, 0, 0.3)'
        : '0 2px 8px rgba(0, 0, 0, 0.12)',
      text: isDark ? '#e0e0e0' : '#333333',
      textSecondary: isDark ? '#999999' : '#666666'
    }
  }, [theme])

  // 计算工具栏位置
  const calculatePosition = useCallback((selection: Selection): ToolbarPosition | null => {
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    if (rect.width === 0 || rect.height === 0) {
      return null
    }

    // 工具栏宽度估算
    const toolbarWidth = 180
    const toolbarHeight = 32

    // 计算位置：在选中文字上方居中
    let left = rect.left + rect.width / 2 - toolbarWidth / 2
    let top = rect.top - toolbarHeight - 8

    // 确保不超出视口左边界
    if (left < 10) {
      left = 10
    }

    // 确保不超出视口右边界
    if (left + toolbarWidth > window.innerWidth - 10) {
      left = window.innerWidth - toolbarWidth - 10
    }

    // 如果上方空间不足，显示在下方
    if (top < 10) {
      top = rect.bottom + 8
    }

    return { top, left, visible: true }
  }, [])

  // 检查选中是否在容器内
  const isSelectionInContainer = useCallback(
    (selection: Selection): boolean => {
      if (!containerRef.current || selection.rangeCount === 0) {
        return false
      }

      const range = selection.getRangeAt(0)
      const container = containerRef.current

      // 检查选中的起始和结束节点是否在容器内
      return container.contains(range.startContainer) && container.contains(range.endContainer)
    },
    [containerRef]
  )

  // 处理选中变化
  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection()

    if (!selection || selection.isCollapsed || selection.toString().trim() === '') {
      setPosition((prev) => ({ ...prev, visible: false }))
      setSelectedText('')
      return
    }

    // 检查选中是否在指定容器内
    if (!isSelectionInContainer(selection)) {
      setPosition((prev) => ({ ...prev, visible: false }))
      setSelectedText('')
      return
    }

    const text = selection.toString().trim()
    setSelectedText(text)

    const newPosition = calculatePosition(selection)
    if (newPosition) {
      setPosition(newPosition)
    }
  }, [calculatePosition, isSelectionInContainer])

  // 监听 mouseup 事件来检测选中
  useEffect(() => {
    const handleMouseUp = () => {
      // 延迟执行以确保选中已完成
      setTimeout(handleSelectionChange, 10)
    }

    const handleMouseDown = (e: MouseEvent) => {
      // 如果点击在工具栏上，不隐藏
      if (toolbarRef.current?.contains(e.target as Node)) {
        return
      }
      // 点击其他地方时隐藏工具栏
      setPosition((prev) => ({ ...prev, visible: false }))
    }

    // 监听键盘选择（Shift + 方向键）
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.shiftKey) {
        setTimeout(handleSelectionChange, 10)
      }
    }

    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleSelectionChange])

  // 处理复制点击
  const handleCopyClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (selectedText) {
        navigator.clipboard.writeText(selectedText)
        onCopy?.(selectedText)
      }
      setPosition((prev) => ({ ...prev, visible: false }))
    },
    [onCopy, selectedText]
  )

  // 处理按钮点击
  const handleFormatClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onFormat?.(selectedText)
    },
    [onFormat, selectedText]
  )

  const handleHighlightClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onHighlight?.(selectedText)
    },
    [onHighlight, selectedText]
  )

  const handleAskHerClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onAskHer?.(selectedText)
      // 点击后隐藏工具栏
      setPosition((prev) => ({ ...prev, visible: false }))
    },
    [onAskHer, selectedText]
  )

  if (!position.visible) {
    return null
  }

  return (
    <ToolbarContainer
      ref={toolbarRef}
      style={{
        top: position.top,
        left: position.left,
        background: colors.background,
        border: `1px solid ${colors.border}`,
        boxShadow: colors.boxShadow
      }}>
      {/* 复制按钮 */}
      <IconButton onClick={handleCopyClick} title={t('common.copy', { defaultValue: '复制' })}>
        <Copy size={14} strokeWidth={1.5} />
      </IconButton>

      <Divider />

      {/* Aa 格式按钮 */}
      <IconButton onClick={handleFormatClick} title={t('selection.format', { defaultValue: '格式' })}>
        <AaText>Aa</AaText>
      </IconButton>

      {/* 高亮圆点 */}
      <IconButton onClick={handleHighlightClick} title={t('selection.highlight', { defaultValue: '高亮' })}>
        <HighlightDot />
      </IconButton>

      <Divider />

      {/* 问 Her 按钮 */}
      <AskHerButton onClick={handleAskHerClick} title={t('selection.ask_her', { defaultValue: '问 Her' })}>
        <AskHerBracket>[</AskHerBracket>
        <AskHerNumber>?</AskHerNumber>
        <AskHerBracket>]</AskHerBracket>
        <AskHerText>{t('selection.ask_her_label', { defaultValue: '问 Her' })}</AskHerText>
      </AskHerButton>
    </ToolbarContainer>
  )
}

const ToolbarContainer = styled.div`
  position: fixed;
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: 0;
  padding: 4px 8px;
  border-radius: 6px;
  animation: fadeIn 0.12s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.12s ease;

  &:hover {
    background: var(--color-background-mute);
    color: var(--color-text);
  }

  &:active {
    transform: scale(0.95);
  }
`

const AaText = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
`

const Divider = styled.div`
  width: 1px;
  height: 14px;
  background: var(--color-border);
  margin: 0 4px;
`

const HighlightDot = styled.div`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #f5c518;
  border: 1px solid rgba(0, 0, 0, 0.1);
`

const AskHerButton = styled.button`
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 8px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.12s ease;

  &:hover {
    background: var(--color-background-mute);
  }

  &:active {
    transform: scale(0.95);
  }
`

const AskHerBracket = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: var(--color-primary);
`

const AskHerNumber = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: var(--color-primary);
`

const AskHerText = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text);
  margin-left: 4px;
`

export default TextSelectionToolbar
