// Illustrative house components for Blake UK Homes.
// Pure SVG, no external assets, scales cleanly. Three exports:
//   <House />            small house (street view, status pills)
//   <HeroHouse />        large welcome / landing illustration
//   <StreetRow />        horizontally scrollable row of houses on a road
import Link from 'next/link'
import { cn } from '@/lib/cn'

export type HouseStatus = 'tenanted' | 'vacant' | 'legal_proceedings'

/** Single small house with optional traffic-light + street sign. */
export function House({
  status = 'vacant',
  hasAlert = false,
  label,
  withTrafficLight = true,
  className,
}: {
  status?: HouseStatus
  hasAlert?: boolean
  label?: string
  withTrafficLight?: boolean
  className?: string
}) {
  const isLegal = status === 'legal_proceedings'
  const greenLit = status === 'tenanted' && !hasAlert
  const amberLit = hasAlert && !isLegal
  const redLit = isLegal

  return (
    <svg viewBox="0 0 92 96" xmlns="http://www.w3.org/2000/svg" className={cn('block', className)} aria-hidden>
      {/* chimney */}
      <rect x="58" y="10" width="8" height="16" rx="1" fill="#7a5c3e" opacity="0.85" />
      {/* roof */}
      <polygon points="45,4 84,32 6,32" fill="#7a5c3e" />
      {/* walls */}
      <rect x="10" y="31" width="70" height="52" rx="2" fill="#c4a882" />
      {/* brick lines */}
      <line x1="10" y1="42" x2="80" y2="42" stroke="#a08060" strokeWidth="0.6" opacity="0.4" />
      <line x1="10" y1="53" x2="80" y2="53" stroke="#a08060" strokeWidth="0.6" opacity="0.4" />
      <line x1="10" y1="64" x2="80" y2="64" stroke="#a08060" strokeWidth="0.6" opacity="0.4" />
      <line x1="10" y1="75" x2="80" y2="75" stroke="#a08060" strokeWidth="0.6" opacity="0.4" />
      {/* door */}
      <rect x="34" y="44" width="22" height="39" rx="2" fill="#5a3e2b" />
      <circle cx="53" cy="65" r="1.8" fill="#c4a882" opacity="0.85" />
      {/* left window */}
      <rect x="15" y="36" width="15" height="12" rx="2" fill="#dbeafe" opacity="0.85" />
      <line x1="22.5" y1="36" x2="22.5" y2="48" stroke="#94a3b8" strokeWidth="0.8" opacity="0.5" />
      <line x1="15" y1="42" x2="30" y2="42" stroke="#94a3b8" strokeWidth="0.8" opacity="0.5" />
      {/* right window */}
      <rect x="60" y="36" width="15" height="12" rx="2" fill="#dbeafe" opacity="0.85" />
      <line x1="67.5" y1="36" x2="67.5" y2="48" stroke="#94a3b8" strokeWidth="0.8" opacity="0.5" />
      <line x1="60" y1="42" x2="75" y2="42" stroke="#94a3b8" strokeWidth="0.8" opacity="0.5" />
      {/* ground line */}
      <rect x="6" y="83" width="80" height="3" rx="1.5" fill="#92400e" opacity="0.25" />

      {withTrafficLight && (
        <g>
          <rect x="2" y="33" width="3" height="36" rx="1" fill="#94a3b8" />
          <rect x="-2" y="31" width="11" height="40" rx="2" fill="#1e293b" />
          <circle cx="3.5" cy="38" r="3" fill={redLit ? '#ef4444' : '#334155'} />
          <circle cx="3.5" cy="48" r="3" fill={amberLit ? '#f59e0b' : '#334155'} />
          <circle cx="3.5" cy="58" r="3" fill={greenLit ? '#22c55e' : '#334155'} />
        </g>
      )}

      {label && (
        <g>
          <rect x="68" y="33" width="3" height="20" rx="1" fill="#94a3b8" />
          <rect x="60" y="29" width="28" height="11" rx="2" fill="#1e40af" />
          <text x="74" y="36.5" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="white">
            {label.length > 8 ? label.slice(0, 8) + '...' : label}
          </text>
        </g>
      )}
    </svg>
  )
}

/** Large hero / welcome house illustration. */
export function HeroHouse({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 200" xmlns="http://www.w3.org/2000/svg" className={cn('block', className)} aria-hidden>
      {/* sky background gradient */}
      <defs>
        <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#e0e7ff" stopOpacity="0" />
          <stop offset="100%" stopColor="#e0e7ff" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <rect width="220" height="200" fill="url(#hero-sky)" />

      {/* chimney + smoke */}
      <rect x="130" y="20" width="16" height="32" rx="2" fill="#7a5c3e" opacity="0.9" />
      <rect x="128" y="18" width="20" height="6" rx="1" fill="#6b4f33" />
      <circle cx="138" cy="14" r="5" fill="#cbd5e1" opacity="0.6" />
      <circle cx="133" cy="7" r="3.5" fill="#cbd5e1" opacity="0.45" />

      {/* roof */}
      <polygon points="110,10 200,68 20,68" fill="#7a5c3e" />
      <line x1="20" y1="68" x2="200" y2="68" stroke="#5a3e2b" strokeWidth="2" opacity="0.4" />

      {/* walls */}
      <rect x="24" y="67" width="172" height="120" rx="3" fill="#c4a882" />
      <line x1="24" y1="86" x2="196" y2="86" stroke="#a08060" strokeWidth="0.8" opacity="0.35" />
      <line x1="24" y1="105" x2="196" y2="105" stroke="#a08060" strokeWidth="0.8" opacity="0.35" />
      <line x1="24" y1="124" x2="196" y2="124" stroke="#a08060" strokeWidth="0.8" opacity="0.35" />
      <line x1="24" y1="143" x2="196" y2="143" stroke="#a08060" strokeWidth="0.8" opacity="0.35" />
      <line x1="24" y1="162" x2="196" y2="162" stroke="#a08060" strokeWidth="0.8" opacity="0.35" />

      {/* door */}
      <rect x="88" y="106" width="44" height="81" rx="3" fill="#5a3e2b" />
      <rect x="88" y="113" width="44" height="20" rx="2" fill="#dbeafe" opacity="0.75" />
      <circle cx="127" cy="147" r="3" fill="#c4a882" opacity="0.9" />

      {/* left window */}
      <rect x="32" y="78" width="40" height="28" rx="3" fill="#dbeafe" opacity="0.85" />
      <line x1="52" y1="78" x2="52" y2="106" stroke="#94a3b8" strokeWidth="1" opacity="0.5" />
      <line x1="32" y1="92" x2="72" y2="92" stroke="#94a3b8" strokeWidth="1" opacity="0.5" />

      {/* right window */}
      <rect x="148" y="78" width="40" height="28" rx="3" fill="#dbeafe" opacity="0.85" />
      <line x1="168" y1="78" x2="168" y2="106" stroke="#94a3b8" strokeWidth="1" opacity="0.5" />
      <line x1="148" y1="92" x2="188" y2="92" stroke="#94a3b8" strokeWidth="1" opacity="0.5" />

      {/* ground */}
      <rect x="0" y="183" width="220" height="6" rx="2" fill="#92400e" opacity="0.3" />

      {/* sign post on left */}
      <rect x="14" y="68" width="3" height="50" rx="1" fill="#94a3b8" />
      <rect x="2" y="66" width="34" height="14" rx="3" fill="#4338ca" />
      <text x="19" y="76" textAnchor="middle" fontSize="8" fontWeight="700" fill="white">Blake UK</text>

      {/* traffic light on right (green = healthy) */}
      <rect x="198" y="68" width="3" height="50" rx="1" fill="#94a3b8" />
      <rect x="192" y="64" width="18" height="56" rx="3" fill="#1e293b" />
      <circle cx="201" cy="75" r="6" fill="#334155" />
      <circle cx="201" cy="87" r="6" fill="#334155" />
      <circle cx="201" cy="99" r="6" fill="#22c55e" />
    </svg>
  )
}

/** Horizontally scrollable street with houses + status traffic lights. */
export function StreetRow({
  properties,
  hrefBuilder,
  emptyState,
}: {
  properties: { id: string; nickname: string; status: HouseStatus; alertCount?: number }[]
  hrefBuilder?: (propertyId: string) => string
  emptyState?: React.ReactNode
}) {
  if (properties.length === 0) {
    return <div className="rounded-xl bg-ink-50 px-6 py-8 text-center text-sm text-ink-500">{emptyState ?? 'No properties yet.'}</div>
  }

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <div className="flex items-end gap-4 px-1 py-2 min-w-max">
          {properties.map((p) => {
            const content = (
              <div className="flex w-[110px] cursor-pointer flex-col items-center transition-transform hover:-translate-y-1">
                <House status={p.status} hasAlert={(p.alertCount ?? 0) > 0} />
                <p className="mt-2 max-w-[100px] truncate text-center text-xs font-semibold text-ink-800">{p.nickname}</p>
                <p className="text-[10px] text-ink-500">
                  {p.status === 'tenanted' ? 'Tenanted' : p.status === 'legal_proceedings' ? 'Legal' : 'Vacant'}
                  {(p.alertCount ?? 0) > 0 && <span className="ml-1 text-warning-700">· {p.alertCount} alert{p.alertCount! > 1 ? 's' : ''}</span>}
                </p>
              </div>
            )
            return hrefBuilder ? (
              <Link key={p.id} href={hrefBuilder(p.id)} className="block">{content}</Link>
            ) : (
              <div key={p.id}>{content}</div>
            )
          })}
        </div>
      </div>

      {/* road */}
      <div className="relative -mx-2 mt-1 flex h-8 items-center gap-4 bg-ink-700 px-6">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="h-1 w-10 shrink-0 rounded-full bg-warning-500 opacity-80" />
        ))}
      </div>
    </div>
  )
}
