import { useTheme } from '@renderer/context/ThemeProvider'
import { Popover } from 'antd'
import { Copy, FolderPlus } from 'lucide-react'
import type { FC } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

// 预设颜色
const HIGHLIGHT_COLORS = ['#f5c518', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#a29bfe', '#fd79a8', '#00b894']

interface Props {
  containerRef: React.RefObject<HTMLElement | null>
  onCopy?: (selectedText: string) => void
  onSaveToLibrary?: (selectedText: string) => void
  showSaveToLibrary?: boolean
  onSaveToNotebook?: (selectedText: string, color: string) => void
  showSaveToNotebook?: boolean
}

interface ToolbarPosition {
  top: number
  left: number
  visible: boolean
}

const TextSelectionToolbar: FC<Props> = ({
  containerRef,
  onCopy,
  onSaveToLibrary,
  showSaveToLibrary = false,
  onSaveToNotebook,
  showSaveToNotebook = false
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<ToolbarPosition>({ top: 0, left: 0, visible: false })
  const [selectedText, setSelectedText] = useState('')
  const [highlightColor, setHighlightColor] = useState(HIGHLIGHT_COLORS[0])
  const [colorPickerOpen, setColorPickerOpen] = useState(false)

  // 获取主题颜色
  const colors = useMemo(() => {
    const isDark = theme === 'dark'
    return {
      background: isDark ? '#3a3a3a' : '#ffffff',
      border: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e5e5',
      boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.12)',
      text: isDark ? '#e0e0e0' : '#333333',
      textSecondary: isDark ? '#999999' : '#666666'
    }
  }, [theme])

  // 计算工具栏宽度
  const toolbarWidth = useMemo(() => {
    let width = 60 // 复制按钮 + 基础 padding
    if (showSaveToNotebook) width += 70 // Aa按钮 + 颜色选择器
    if (showSaveToLibrary) width += 45 // 保存资料库按钮
    return width
  }, [showSaveToLibrary, showSaveToNotebook])

  // 计算工具栏位置
  const calculatePosition = useCallback(
    (selection: Selection): ToolbarPosition | null => {
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()

      if (rect.width === 0 || rect.height === 0) {
        return null
      }

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
    },
    [toolbarWidth]
  )

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
    const handleMouseUp = (e: MouseEvent) => {
      // 如果点击在 Popover 上，不重新检查选中（避免关闭 toolbar）
      const target = e.target as HTMLElement
      if (target.closest('.ant-popover')) {
        return
      }
      // 延迟执行以确保选中已完成
      setTimeout(handleSelectionChange, 10)
    }

    const handleMouseDown = (e: MouseEvent) => {
      // 如果点击在工具栏上，不隐藏
      if (toolbarRef.current?.contains(e.target as Node)) {
        return
      }
      // 如果点击在 Popover 内容上（颜色选择器），不隐藏
      const target = e.target as HTMLElement
      if (target.closest('.ant-popover')) {
        return
      }
      // 点击其他地方时隐藏工具栏
      setPosition((prev) => ({ ...prev, visible: false }))
      setColorPickerOpen(false)
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

  // 点击 Aa 按钮保存到 Notebook
  const handleAaClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (selectedText && onSaveToNotebook) {
        onSaveToNotebook(selectedText, highlightColor)
      }
      setPosition((prev) => ({ ...prev, visible: false }))
    },
    [selectedText, highlightColor, onSaveToNotebook]
  )

  // 选择颜色
  const handleColorSelect = useCallback((color: string) => {
    setHighlightColor(color)
    setColorPickerOpen(false)
  }, [])

  const handleSaveToLibraryClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onSaveToLibrary?.(selectedText)
      // 点击后隐藏工具栏
      setPosition((prev) => ({ ...prev, visible: false }))
    },
    [onSaveToLibrary, selectedText]
  )

  // 颜色选择器内容
  const colorPickerContent = (
    <ColorPickerContainer>
      {HIGHLIGHT_COLORS.map((color) => (
        <ColorOption
          key={color}
          $color={color}
          $isActive={highlightColor === color}
          onClick={() => handleColorSelect(color)}
        />
      ))}
    </ColorPickerContainer>
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

      {/* Notebook 功能区：Aa 按钮 + 颜色选择器 */}
      {showSaveToNotebook && (
        <>
          <Divider />
          <IconButton onClick={handleAaClick} title={t('selection.save_to_notebook', { defaultValue: '保存到笔记本' })}>
            <AaTextWithUnderline $color={highlightColor}>Aa</AaTextWithUnderline>
          </IconButton>
          <Popover
            content={colorPickerContent}
            trigger="click"
            open={colorPickerOpen}
            onOpenChange={setColorPickerOpen}
            placement="bottom"
            arrow={false}
            overlayInnerStyle={{ padding: 6, overflow: 'hidden' }}>
            <IconButton title={t('selection.highlight_color', { defaultValue: '选择颜色' })}>
              <HighlightDot $color={highlightColor} />
            </IconButton>
          </Popover>
        </>
      )}

      {/* 保存到资料库按钮 */}
      {showSaveToLibrary && (
        <>
          <Divider />
          <IconButton
            onClick={handleSaveToLibraryClick}
            title={t('selection.save_to_library', { defaultValue: '保存到资料库' })}>
            <FolderPlus size={14} strokeWidth={1.5} />
          </IconButton>
        </>
      )}
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

const AaTextWithUnderline = styled.span<{ $color: string }>`
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  border-bottom: 2px solid ${(props) => props.$color};
  padding-bottom: 1px;
`

const Divider = styled.div`
  width: 1px;
  height: 14px;
  background: var(--color-border);
  margin: 0 4px;
`

const HighlightDot = styled.div<{ $color: string }>`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: ${(props) => props.$color};
  border: 1px solid rgba(0, 0, 0, 0.1);
  cursor: pointer;
`

const ColorPickerContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  padding: 2px;
`

const ColorOption = styled.div<{ $color: string; $isActive: boolean }>`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: ${(props) => props.$color};
  border: 2px solid ${(props) => (props.$isActive ? 'var(--color-primary)' : 'transparent')};
  cursor: pointer;
  transition: border-color 0.15s ease;

  &:hover {
    border-color: ${(props) => (props.$isActive ? 'var(--color-primary)' : 'rgba(0, 0, 0, 0.2)')};
  }
`

export default TextSelectionToolbar
