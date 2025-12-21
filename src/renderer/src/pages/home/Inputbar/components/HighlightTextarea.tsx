import TextArea from 'antd/es/input/TextArea'
import type { CSSProperties, FC } from 'react'
import React, { useCallback, useEffect, useRef } from 'react'
import styled from 'styled-components'

interface HighlightPattern {
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

/** 默认的 @ 高亮模式 */
const DEFAULT_HIGHLIGHT_PATTERNS: HighlightPattern[] = [
  {
    // 匹配 @xxx 格式（@后跟非空白字符，直到空格或结束）
    pattern: /@[^\s@]+/g,
    color: 'var(--color-primary)'
  }
]

/**
 * 带文本高亮功能的 Textarea
 * 使用覆盖层方案：底层显示高亮文本，上层透明 textarea 处理输入
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

  // 渲染带高亮的文本
  const renderHighlightedText = useCallback(
    (text: string): React.ReactNode[] => {
      if (!text || highlightPatterns.length === 0) {
        // 保留空白符和换行，添加一个零宽字符确保空行也有高度
        return [text || '\u200B']
      }

      const result: React.ReactNode[] = []
      let lastIndex = 0
      const matches: Array<{ start: number; end: number; text: string; color: string }> = []

      // 收集所有匹配
      for (const { pattern, color } of highlightPatterns) {
        const regex = new RegExp(pattern.source, pattern.flags)
        let match: RegExpExecArray | null
        while ((match = regex.exec(text)) !== null) {
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
            text: match[0],
            color
          })
        }
      }

      // 按位置排序
      matches.sort((a, b) => a.start - b.start)

      // 构建结果
      for (const match of matches) {
        // 跳过重叠的匹配
        if (match.start < lastIndex) continue

        // 添加普通文本
        if (match.start > lastIndex) {
          result.push(text.slice(lastIndex, match.start))
        }

        // 添加高亮文本
        result.push(
          <HighlightSpan key={`${match.start}-${match.text}`} style={{ color: match.color }}>
            {match.text}
          </HighlightSpan>
        )

        lastIndex = match.end
      }

      // 添加剩余文本
      if (lastIndex < text.length) {
        result.push(text.slice(lastIndex))
      }

      // 添加零宽字符确保最后的换行符能正确显示
      result.push('\u200B')

      return result
    },
    [highlightPatterns]
  )

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

  // 检查是否需要高亮（性能优化：如果没有 @ 符号就不渲染高亮层）
  const needsHighlight = highlightPatterns.some(({ pattern }) => {
    const regex = new RegExp(pattern.source, pattern.flags)
    return regex.test(value)
  })

  // 外层容器样式
  const containerStyle: CSSProperties = {
    ...style,
    fontSize,
    height: height,
    minHeight: '30px'
  }

  // 内部 textarea 样式 - 需要通过 styles.textarea 传递才能生效
  const textareaInnerStyle: CSSProperties = {
    ...styles?.textarea,
    // 当需要高亮时，文字透明，光标保持可见
    ...(needsHighlight && {
      color: 'transparent',
      caretColor: 'var(--color-text)',
      WebkitTextFillColor: 'transparent' // 兼容 webkit 浏览器
    })
  }

  return (
    <TextareaContainer ref={containerRef}>
      {/* 高亮层 - 只在需要时渲染 */}
      {needsHighlight && (
        <HighlightLayer
          ref={highlightRef}
          style={{
            fontSize,
            height: height,
            minHeight: '30px',
            ...styles?.textarea
          }}>
          {renderHighlightedText(value)}
        </HighlightLayer>
      )}

      {/* 实际的 textarea */}
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
        styles={{ textarea: textareaInnerStyle }}
        style={containerStyle}
        disabled={disabled}
        $needsHighlight={needsHighlight}
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
  color: var(--color-text);
  line-height: 1.4;
  font-family: inherit;
  z-index: 0;
`

const HighlightSpan = styled.span`
  /* 颜色通过 style prop 设置 */
`

const StyledTextArea = styled(TextArea)<{ $needsHighlight?: boolean }>`
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
  textarea {
    background: transparent !important;
  }

  /* 当需要高亮时，强制文字透明 */
  ${({ $needsHighlight }) =>
    $needsHighlight &&
    `
    textarea {
      color: transparent !important;
      -webkit-text-fill-color: transparent !important;
      caret-color: var(--color-text) !important;
    }
  `}
`

export default HighlightTextarea
