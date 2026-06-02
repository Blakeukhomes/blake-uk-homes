import { cn } from '@/lib/cn'

export function Logo({ className, withWordmark = true }: { className?: string; withWordmark?: boolean }) {
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <svg viewBox="0 0 36 36" className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <rect width="36" height="36" rx="8" fill="#0f172a" />
        {/* roof */}
        <polygon points="18,7 30,17 6,17" fill="#6366f1" />
        {/* wall */}
        <rect x="9" y="17" width="18" height="13" rx="1" fill="#c4a882" />
        {/* door */}
        <rect x="15" y="21" width="6" height="9" rx="0.5" fill="#5a3e2b" />
        {/* window */}
        <rect x="11" y="19.5" width="3" height="3" rx="0.5" fill="#e0e7ff" />
        <rect x="22" y="19.5" width="3" height="3" rx="0.5" fill="#e0e7ff" />
      </svg>
      {withWordmark && (
        <span className="text-lg font-semibold tracking-tight text-ink-900">
          Blake UK <span className="text-accent-500">Homes</span>
        </span>
      )}
    </div>
  )
}
