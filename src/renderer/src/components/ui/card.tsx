import { cn } from '@renderer/lib/utils'
import * as React from 'react'

/**
 * 墨韵设计系统 - Card 组件
 *
 * 特点：
 * - 柔和的背景色，无硬边框
 * - 悬停时有微妙的阴影变化
 * - 圆润的圆角，呼吸感设计
 */
const Card = ({ ref, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.RefObject<HTMLDivElement | null> }) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl bg-[var(--mo-bg-surface)] text-[var(--mo-text-primary)]',
        'border border-transparent shadow-[var(--mo-shadow-sm)]',
        'transition-all duration-200',
        'hover:border-[var(--mo-border)] hover:shadow-[var(--mo-shadow-md)]',
        className
      )}
      {...props}
    />
  )
Card.displayName = 'Card'

const CardHeader = ({ ref, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.RefObject<HTMLDivElement | null> }) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
CardHeader.displayName = 'CardHeader'

const CardTitle = ({ ref, className, ...props }: React.HTMLAttributes<HTMLHeadingElement> & { ref?: React.RefObject<HTMLParagraphElement | null> }) => (
    <h3
      ref={ref}
      className={cn('font-semibold leading-none tracking-tight text-[var(--mo-text-primary)]', className)}
      {...props}
    />
  )
CardTitle.displayName = 'CardTitle'

const CardDescription = ({ ref, className, ...props }: React.HTMLAttributes<HTMLParagraphElement> & { ref?: React.RefObject<HTMLParagraphElement | null> }) => (
    <p ref={ref} className={cn('text-sm text-[var(--mo-text-secondary)]', className)} {...props} />
  )
CardDescription.displayName = 'CardDescription'

const CardContent = ({ ref, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.RefObject<HTMLDivElement | null> }) => <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
CardContent.displayName = 'CardContent'

const CardFooter = ({ ref, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.RefObject<HTMLDivElement | null> }) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
CardFooter.displayName = 'CardFooter'

export { Card, CardContent,CardDescription, CardFooter, CardHeader, CardTitle }
