import * as React from 'react'
import { cn } from '@/lib/cn'

export function Stat({
  label,
  value,
  hint,
  icon,
  tone = 'neutral',
  className,
}: {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  icon?: React.ReactNode
  tone?: 'neutral' | 'success' | 'warning' | 'danger'
  className?: string
}) {
  const toneRing = {
    neutral: 'ring-ink-100',
    success: 'ring-success-500/30',
    warning: 'ring-warning-500/30',
    danger: 'ring-danger-500/30',
  }[tone]

  return (
    <div className={cn('rounded-xl2 bg-white p-5 shadow-card ring-1', toneRing, className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</p>
        {icon ? <div className="text-ink-400">{icon}</div> : null}
      </div>
      <p className="mt-2 text-3xl font-semibold text-ink-950">{value}</p>
      {hint ? <p className="mt-1 text-sm text-ink-500">{hint}</p> : null}
    </div>
  )
}
