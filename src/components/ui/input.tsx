import * as React from 'react'
import { cn } from '@/lib/cn'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm',
        'ring-1 ring-inset ring-ink-200 placeholder:text-ink-400',
        'focus:ring-2 focus:ring-inset focus:ring-ink-900',
        'disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-500',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm',
        'ring-1 ring-inset ring-ink-200 placeholder:text-ink-400',
        'focus:ring-2 focus:ring-inset focus:ring-ink-900',
        className
      )}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm',
        'ring-1 ring-inset ring-ink-200',
        'focus:ring-2 focus:ring-inset focus:ring-ink-900',
        className
      )}
      {...props}
    />
  )
)
Select.displayName = 'Select'

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('mb-1.5 block text-sm font-medium text-ink-800', className)} {...props} />
}
