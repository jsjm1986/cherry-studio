import TextArea from 'antd/es/input/TextArea'
import type { CSSProperties, FC } from 'react'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import styled from 'styled-components'

export interface HighlightPattern {
  /** 匹配正则 */
  pattern: RegExp
  /** 高亮颜色 */
  color: string
}

interface HighlightTextareaProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onPaste?: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void
  onFocus?: () => void
  onBlur?: () => void
  onClick?: () => void
  placeholder?: string
  autoFocus?: boolean
  spellCheck?: boolean
  rows?: number
  autoSize?: boolean | { minRows?: number; maxRows?: number }
  disabled?: boolean
  style?: CSSProperties
  styles?: { textarea?: CSSProperties }
  textareaRef?: React.RefObject<any>
  fontSize?: number
  height?: number
  /** 高亮模式列表 */
  highlightPatterns?: HighlightPattern[]
}

/** 默认的高亮模式：空数组，不自动高亮任何内容 */
const DEFAULT_HIGHLIGHT_PATTERNS: HighlightPattern[] = []

/**
 * 将文本分割成高亮和非高亮的部分
 */
function splitTextByHighlight(
  text: string,
  patterns: HighlightPattern[]
): Array<{ text: string; color: string | null }> {
  if (!text || patterns.length === 0) {
    return [{ text, color: null }]
  }

  const matches: Array<{ start: number; end: number; color: string }> = []

  for (const { pattern, color } of patterns) {
    const regex = new RegExp(pattern.source, pattern.flags)
    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        color
      })
      if (match[0].length === 0) break
    }
  }

  if (matches.length === 0) {
    return [{ text, color: null }]
  }

  matches.sort((a, b) => a.start - b.start)

  const result: Array<{ text: string; color: string | null }> = []
  let lastIndex = 0

  for (const match of matches) {
    if (match.start < lastIndex) continue

    if (match.start > lastIndex) {
      result.push({ text: text.slice(lastIndex, match.start), color: null })
    }

    result.push({ text: text.slice(match.start, match.end), color: match.color })
    lastIndex = match.end
  }

  if (lastIndex < text.length) {
    result.push({ text: text.slice(lastIndex), color: null })
  }

  return result
}

/**
 * 带文本高亮功能的 Textarea
 *
 * 新方案：高亮层只显示高亮部分的彩色文字，非高亮部分完全透明
 * textarea 正常显示所有文字，高亮部分的文字会被高亮层的彩色文字覆盖
 */
export const HighlightTextarea: FC<HighlightTextareaProps> = ({
  value,
  onChange,
  onKeyDown,
  onPaste,
  onFocus,
  onBlur,
  onClick,
  placeholder,
  autoFocus,
  spellCheck,
  rows,
  autoSize,
  disabled,
  style,
  styles,
  textareaRef,
  fontSize = 14,
  height,
  highlightPatterns = DEFAULT_HIGHLIGHT_PATTERNS
}) => {
  const highlightRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 检查是否需要高亮（有 patterns 且文本匹配）
  const needsHighlight = useMemo(() => {
    if (highlightPatterns.length === 0) return false
    return highlightPatterns.some(({ pattern }) => {
      const regex = new RegExp(pattern.source, pattern.flags)
      return regex.test(value)
    })
  }, [highlightPatterns, value])

  // 分割文本为高亮和非高亮部分
  const textParts = useMemo(() => {
    if (!needsHighlight) return []
    return splitTextByHighlight(value, highlightPatterns)
  }, [value, highlightPatterns, needsHighlight])

  // 同步滚动位置
  const syncScroll = useCallback(() => {
    const textarea = textareaRef?.current?.resizableTextArea?.textArea
    const highlight = highlightRef.current
    if (textarea && highlight) {
      highlight.scrollTop = textarea.scrollTop
      highlight.scrollLeft = textarea.scrollLeft
    }
  }, [textareaRef])

  // 监听 textarea 滚动
  useEffect(() => {
    const textarea = textareaRef?.current?.resizableTextArea?.textArea
    if (textarea) {
      textarea.addEventListener('scroll', syncScroll)
      return () => textarea.removeEventListener('scroll', syncScroll)
    }
    return undefined
  }, [textareaRef, syncScroll])

  // 外层容器样式
  const containerStyle: CSSProperties = {
    ...style,
    fontSize,
    height: height,
    minHeight: '30px'
  }

  return (
    <TextareaContainer ref={containerRef}>
      {/* 高亮层 - 只显示高亮部分的彩色文字，非高亮部分透明 */}
      {needsHighlight && (
        <HighlightLayer
          ref={highlightRef}
          style={{
            fontSize,
            height: height,
            minHeight: '30px'
          }}>
          {textParts.map((part, idx) =>
            part.color ? (
              // 高亮部分：显示彩色文字，带背景遮挡 textarea 的文字
              <HighlightSpan key={idx} $color={part.color}>
                {part.text}
              </HighlightSpan>
            ) : (
              // 非高亮部分：完全透明，让 textarea 的文字显示
              <span key={idx} style={{ visibility: 'hidden' }}>
                {part.text}
              </span>
            )
          )}
        </HighlightLayer>
      )}

      {/* 实际的 textarea - 正常显示所有文字 */}
      <StyledTextArea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onFocus={onFocus}
        onBlur={onBlur}
        onClick={onClick}
        placeholder={placeholder}
        autoFocus={autoFocus}
        variant="borderless"
        spellCheck={spellCheck}
        rows={rows}
        autoSize={autoSize}
        styles={{
          textarea: {
            ...styles?.textarea,
            padding: '6px 15px 0px'
          }
        }}
        style={containerStyle}
        disabled={disabled}
      />
    </TextareaContainer>
  )
}

const TextareaContainer = styled.div`
  position: relative;
  width: 100%;
`

const HighlightLayer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 6px 15px 0px;
  pointer-events: none;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow: hidden;
  line-height: 1.4;
  font-family: var(--font-family);
  font-size: inherit;
  font-weight: 400;
  z-index: 2;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
`

const HighlightSpan = styled.span<{ $color: string }>`
  color: ${({ $color }) => $color};
  background-color: var(--color-background-soft);
  font-weight: 400;
`

const StyledTextArea = styled(TextArea)`
  position: relative;
  z-index: 1;
  padding: 0;
  border-radius: 0;
  display: flex;
  resize: none !important;
  overflow: auto;
  width: 100%;
  box-sizing: border-box;
  transition: none !important;
  background: transparent !important;

  &.ant-input {
    line-height: 1.4;
  }

  &::-webkit-scrollbar {
    width: 3px;
  }

  /* 确保 textarea 背景透明 */
  && textarea,
  && .ant-input,
  && textarea.ant-input {
    background: transparent !important;
  }
`

export default HighlightTextarea
