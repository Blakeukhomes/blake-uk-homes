import * as React from 'react'
import { cn } from '@/lib/cn'

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent'

const tones: Record<Tone, string> = {
  neutral: 'bg-ink-100 text-ink-700 ring-ink-200',
  success: 'bg-success-100 text-success-700 ring-success-500/30',
  warning: 'bg-warning-100 text-warning-700 ring-warning-500/30',
  danger:  'bg-danger-100  text-danger-700  ring-danger-500/30',
  info:    'bg-blue-100    text-blue-700    ring-blue-500/30',
  accent:  'bg-accent-100  text-accent-700  ring-accent-500/30',
}

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        tones[tone],
        className
      )}
      {...props}
    />
  )
}
