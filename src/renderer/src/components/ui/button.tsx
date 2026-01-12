import { Slot } from '@radix-ui/react-slot'
import { cn } from '@renderer/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

/**
 * 墨韵设计系统 - Button 组件
 *
 * 特点：
 * - 主按钮使用蓝紫渐变，带有柔和光晕
 * - 悬停时有微妙的上浮效果
 * - 支持多种变体和尺寸
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-[var(--mo-accent-primary)] to-[var(--mo-accent-secondary)] text-white shadow-[0_2px_8px_var(--mo-accent-glow)] hover:shadow-[0_4px_16px_var(--mo-accent-glow)] hover:-translate-y-0.5',
        destructive:
          'bg-[var(--mo-error)] text-white shadow-sm hover:bg-[var(--mo-error)]/90',
        outline:
          'border border-[var(--mo-border-emphasis)] bg-transparent text-[var(--mo-text-primary)] hover:bg-[var(--mo-bg-hover)] hover:border-[var(--mo-accent-primary)]',
        secondary:
          'bg-[var(--mo-bg-hover)] text-[var(--mo-text-primary)] shadow-sm hover:bg-[var(--mo-bg-active)]',
        ghost:
          'text-[var(--mo-text-secondary)] hover:bg-[var(--mo-bg-hover)] hover:text-[var(--mo-text-primary)]',
        link: 'text-[var(--mo-accent-primary)] underline-offset-4 hover:underline'
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-lg px-6',
        xl: 'h-12 rounded-xl px-8 text-base',
        icon: 'h-9 w-9'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = ({ ref, className, variant, size, asChild = false, ...props }: ButtonProps & { ref?: React.RefObject<HTMLButtonElement | null> }) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  }
Button.displayName = 'Button'

export { Button, buttonVariants }
