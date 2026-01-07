import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@renderer/lib/utils'

/**
 * 墨韵设计系统 - Badge 组件
 *
 * 特点：
 * - 柔和的背景色
 * - 多种语义变体
 * - 紧凑的视觉效果
 */
const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[var(--mo-accent-subtle)] text-[var(--mo-accent-primary)]',
        secondary: 'bg-[var(--mo-bg-hover)] text-[var(--mo-text-secondary)]',
        success: 'bg-[var(--mo-success-subtle)] text-[var(--mo-success)]',
        warning: 'bg-[var(--mo-warning-subtle)] text-[var(--mo-warning)]',
        destructive: 'bg-[var(--mo-error-subtle)] text-[var(--mo-error)]',
        info: 'bg-[var(--mo-info-subtle)] text-[var(--mo-info)]',
        outline: 'border border-[var(--mo-border-emphasis)] text-[var(--mo-text-secondary)]'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
