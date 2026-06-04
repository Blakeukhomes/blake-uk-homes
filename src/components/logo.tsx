import { cn } from '@/lib/cn'

export function Logo({ className, withWordmark = true }: { className?: string; withWordmark?: boolean }) {
  return (
    <div className={cn('inline-flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 40 40" className="h-9 w-9" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <rect width="40" height="40" rx="8" fill="#0f172a" />
        {/* subtle inner border */}
        <rect x="1.5" y="1.5" width="37" height="37" rx="6.5" fill="none" stroke="#6366f1" strokeOpacity="0.35" strokeWidth="0.5" />
        {/* house silhouette (top half) */}
        <g transform="translate(20, 11)">
          <path d="M -8 3 L 0 -4.5 L 8 3 L 6 3 L 6 9 L -6 9 L -6 3 Z" fill="#6366f1" />
          {/* door cutout */}
          <rect x="-1.5" y="5" width="3" height="4" rx="0.3" fill="#0f172a" />
        </g>
        {/* BUH monogram */}
        <text
          x="20" y="29.5"
          textAnchor="middle"
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight="800" fontSize="8.5" fill="#ffffff"
          letterSpacing="-0.3"
        >BUH</text>
      </svg>
      {withWordmark && (
        <span className="text-lg font-semibold tracking-tight text-ink-900">
          Blake UK <span className="text-accent-500">Homes</span>
        </span>
      )}
    </div>
  )
}
