import * as React from 'react'

import { cn } from '@renderer/lib/utils'

/**
 * 墨韵设计系统 - Input 组件
 *
 * 特点：
 * - 柔和的边框，聚焦时有蓝紫色光晕
 * - 背景色与卡片一致，融入界面
 * - 占位符使用低对比度颜色
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg px-3 py-2',
          'bg-[var(--mo-bg-surface)] text-[var(--mo-text-primary)]',
          'border border-[var(--mo-border)]',
          'placeholder:text-[var(--mo-text-muted)]',
          'transition-all duration-150',
          'focus:border-[var(--mo-accent-primary)] focus:ring-2 focus:ring-[var(--mo-accent-subtle)]',
          'focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--mo-text-primary)]',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
