import { cn } from '@renderer/lib/utils'
import * as React from 'react'

/**
 * 墨韵设计系统 - Textarea 组件
 *
 * 特点：
 * - 与 Input 组件风格一致
 * - 聚焦时有柔和的蓝紫色光晕
 * - 支持自动调整高度
 */
const Textarea = ({ ref, className, ...props }: React.ComponentProps<'textarea'> & { ref?: React.RefObject<HTMLTextAreaElement | null> }) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-lg px-3 py-2',
          'bg-[var(--mo-bg-surface)] text-[var(--mo-text-primary)]',
          'border border-[var(--mo-border)]',
          'placeholder:text-[var(--mo-text-muted)]',
          'transition-all duration-150',
          'focus:border-[var(--mo-accent-primary)] focus:ring-2 focus:ring-[var(--mo-accent-subtle)]',
          'focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'resize-none',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
Textarea.displayName = 'Textarea'

export { Textarea }
