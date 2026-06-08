// Illustrative house components — geometry copied from the developer brief prototypes
// with the street sign updated: black background, wider, name fits inside.
import { cn } from '@/lib/cn'

export type HouseStatus = 'tenanted' | 'vacant' | 'legal_proceedings'

/** Single small street-view house with traffic light. Matches mockup houseSVG() exactly. */
export function House({
  status = 'vacant',
  hasAlert = false,
  className,
}: {
  status?: HouseStatus
  hasAlert?: boolean
  className?: string
}) {
  const isLegal  = status === 'legal_proceedings'
  const greenLit = status === 'tenanted' && !hasAlert
  const amberLit = hasAlert && !isLegal
  const redLit   = isLegal

  return (
    <svg width="82" height="88" viewBox="0 0 82 88" xmlns="http://www.w3.org/2000/svg" className={cn('block', className)} aria-hidden>
      {/* chimney */}
      <rect x="54" y="6" width="8" height="16" rx="1" fill="#7a5c3e" opacity="0.8" />
      {/* roof */}
      <polygon points="41,2 80,30 2,30" fill="#7a5c3e" />
      {/* walls */}
      <rect x="6" y="29" width="70" height="52" rx="2" fill="#c4a882" />
      {/* brick lines */}
      <line x1="6" y1="40" x2="76" y2="40" stroke="#a08060" strokeWidth="0.6" opacity="0.4" />
      <line x1="6" y1="51" x2="76" y2="51" stroke="#a08060" strokeWidth="0.6" opacity="0.4" />
      <line x1="6" y1="62" x2="76" y2="62" stroke="#a08060" strokeWidth="0.6" opacity="0.4" />
      <line x1="6" y1="73" x2="76" y2="73" stroke="#a08060" strokeWidth="0.6" opacity="0.4" />
      {/* door */}
      <rect x="30" y="42" width="22" height="39" rx="2" fill="#5a3e2b" />
      <circle cx="49" cy="63" r="2" fill="#c4a882" opacity="0.8" />
      {/* left window */}
      <rect x="11" y="34" width="15" height="12" rx="2" fill="white" opacity="0.7" />
      <line x1="18.5" y1="34" x2="18.5" y2="46" stroke="#c4a882" strokeWidth="1" opacity="0.5" />
      <line x1="11" y1="40" x2="26" y2="40" stroke="#c4a882" strokeWidth="1" opacity="0.5" />
      {/* right window */}
      <rect x="56" y="34" width="15" height="12" rx="2" fill="white" opacity="0.7" />
      <line x1="63.5" y1="34" x2="63.5" y2="46" stroke="#c4a882" strokeWidth="1" opacity="0.5" />
      <line x1="56" y1="40" x2="71" y2="40" stroke="#c4a882" strokeWidth="1" opacity="0.5" />
      {/* traffic light pole + box */}
      <rect x="0" y="29" width="3" height="34" rx="1" fill="#6b7280" />
      <rect x="-5" y="27" width="13" height="38" rx="2" fill="#1e293b" />
      <circle cx="2" cy="35" r="4" fill={redLit   ? '#ef4444' : '#333'} />
      <circle cx="2" cy="46" r="4" fill={amberLit ? '#f59e0b' : '#333'} />
      <circle cx="2" cy="57" r="4" fill={greenLit ? '#22c55e' : '#333'} />
    </svg>
  )
}

// Helper: pick a font size based on string length so the name always fits the sign
function signFontSize(name: string): number {
  const len = name.length
  if (len <= 8)  return 10
  if (len <= 12) return 8
  if (len <= 16) return 7
  return 6
}
function signLabel(name: string): string {
  return (name ?? 'Street').slice(0, 18).toUpperCase()
}

/** Large welcome-screen house (230x185, viewBox extended left for the sign). */
export function WelcomeHouse({ streetName, className }: { streetName?: string; className?: string }) {
  const label = signLabel(streetName ?? 'Street')
  const fontSize = signFontSize(label)
  return (
    <svg viewBox="-30 0 230 185" xmlns="http://www.w3.org/2000/svg" className={cn('block', className)} aria-hidden>
      {/* chimney with smoke puffs */}
      <rect x="118" y="14" width="16" height="32" rx="2" fill="#7a5c3e" opacity="0.9" />
      <rect x="116" y="12" width="20" height="6" rx="1" fill="#6b4f33" />
      <circle cx="126" cy="8" r="5" fill="#e2e8f0" opacity="0.5" />
      <circle cx="122" cy="2" r="3" fill="#e2e8f0" opacity="0.3" />
      {/* roof */}
      <polygon points="100,6 190,62 10,62" fill="#7a5c3e" />
      <line x1="10" y1="62" x2="190" y2="62" stroke="#5a3e2b" strokeWidth="2" opacity="0.4" />
      {/* walls */}
      <rect x="14" y="61" width="172" height="120" rx="3" fill="#c4a882" />
      {/* brick lines */}
      <line x1="14" y1="80"  x2="186" y2="80"  stroke="#a08060" strokeWidth="0.8" opacity="0.35" />
      <line x1="14" y1="99"  x2="186" y2="99"  stroke="#a08060" strokeWidth="0.8" opacity="0.35" />
      <line x1="14" y1="118" x2="186" y2="118" stroke="#a08060" strokeWidth="0.8" opacity="0.35" />
      <line x1="14" y1="137" x2="186" y2="137" stroke="#a08060" strokeWidth="0.8" opacity="0.35" />
      <line x1="14" y1="156" x2="186" y2="156" stroke="#a08060" strokeWidth="0.8" opacity="0.35" />
      {/* door (cool blue glass panel) */}
      <rect x="78" y="100" width="44" height="81" rx="3" fill="#5a3e2b" />
      <circle cx="117" cy="141" r="4" fill="#c4a882" opacity="0.8" />
      <rect x="78" y="107" width="44" height="20" rx="2" fill="#dbeafe" opacity="0.7" />
      {/* left window */}
      <rect x="22" y="72" width="40" height="28" rx="3" fill="#dbeafe" opacity="0.8" />
      <line x1="42" y1="72" x2="42" y2="100" stroke="#94a3b8" strokeWidth="1" opacity="0.5" />
      <line x1="22" y1="86" x2="62" y2="86" stroke="#94a3b8" strokeWidth="1" opacity="0.5" />
      {/* right window */}
      <rect x="138" y="72" width="40" height="28" rx="3" fill="#dbeafe" opacity="0.8" />
      <line x1="158" y1="72" x2="158" y2="100" stroke="#94a3b8" strokeWidth="1" opacity="0.5" />
      <line x1="138" y1="86" x2="178" y2="86" stroke="#94a3b8" strokeWidth="1" opacity="0.5" />
      {/* ground shadow strip */}
      <rect x="14" y="177" width="172" height="8" rx="3" fill="#92400e" opacity="0.3" />

      {/* sign post + street sign (UK-style black sign extending left of the house) */}
      <rect x="8" y="70" width="3" height="42" rx="1" fill="#6b7280" />
      <rect x="-28" y="58" width="68" height="18" rx="3" fill="#0f172a" />
      <rect x="-26" y="60" width="64" height="14" rx="2" fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="0.5" />
      <text x="6" y="71" textAnchor="middle" fontSize={fontSize} fontWeight="700" fill="#ffffff" letterSpacing="0.5">
        {label}
      </text>

      {/* traffic light (green) */}
      <rect x="188" y="62" width="3" height="50" rx="1" fill="#6b7280" />
      <rect x="182" y="58" width="18" height="56" rx="3" fill="#1e293b" />
      <circle cx="191" cy="69" r="6" fill="#333" />
      <circle cx="191" cy="81" r="6" fill="#333" />
      <circle cx="191" cy="93" r="6" fill="#22c55e" />
    </svg>
  )
}

/** Same look but with "lights on" — yellow window panes, bulb emojis, brown door, yellow doorbell. */
export function HomeHouse({ streetName, className }: { streetName?: string; className?: string }) {
  const label = signLabel(streetName ?? 'Street')
  const fontSize = signFontSize(label)
  return (
    <svg viewBox="-30 0 230 185" xmlns="http://www.w3.org/2000/svg" className={cn('block', className)} aria-hidden>
      <rect x="118" y="14" width="16" height="32" rx="2" fill="#7a5c3e" opacity="0.9" />
      <polygon points="100,6 190,62 10,62" fill="#7a5c3e" />
      <rect x="14" y="61" width="172" height="120" rx="3" fill="#c4a882" />
      <line x1="14" y1="80"  x2="186" y2="80"  stroke="#a08060" strokeWidth="0.8" opacity="0.35" />
      <line x1="14" y1="99"  x2="186" y2="99"  stroke="#a08060" strokeWidth="0.8" opacity="0.35" />
      <line x1="14" y1="118" x2="186" y2="118" stroke="#a08060" strokeWidth="0.8" opacity="0.35" />
      <line x1="14" y1="137" x2="186" y2="137" stroke="#a08060" strokeWidth="0.8" opacity="0.35" />
      {/* brown door + amber doorbell */}
      <rect x="78" y="100" width="44" height="81" rx="3" fill="#92400e" />
      <circle cx="117" cy="141" r="4" fill="#fbbf24" opacity="0.9" />
      {/* warm glow panel on door */}
      <rect x="78" y="107" width="44" height="20" rx="2" fill="#fef9c3" opacity="0.8" />
      {/* left window with light bulb */}
      <rect x="22" y="72" width="40" height="28" rx="3" fill="#fef9c3" opacity="0.85" />
      <line x1="42" y1="72" x2="42" y2="100" stroke="#94a3b8" strokeWidth="1" opacity="0.4" />
      <line x1="22" y1="86" x2="62" y2="86" stroke="#94a3b8" strokeWidth="1" opacity="0.4" />
      <text x="42" y="91" textAnchor="middle" fontSize="14">💡</text>
      {/* right window with light bulb */}
      <rect x="138" y="72" width="40" height="28" rx="3" fill="#fef9c3" opacity="0.85" />
      <line x1="158" y1="72" x2="158" y2="100" stroke="#94a3b8" strokeWidth="1" opacity="0.4" />
      <line x1="138" y1="86" x2="178" y2="86" stroke="#94a3b8" strokeWidth="1" opacity="0.4" />
      <text x="158" y="91" textAnchor="middle" fontSize="14">💡</text>

      {/* sign post + street sign */}
      <rect x="8" y="70" width="3" height="42" rx="1" fill="#6b7280" />
      <rect x="-28" y="58" width="68" height="18" rx="3" fill="#0f172a" />
      <rect x="-26" y="60" width="64" height="14" rx="2" fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="0.5" />
      <text x="6" y="71" textAnchor="middle" fontSize={fontSize} fontWeight="700" fill="#ffffff" letterSpacing="0.5">
        {label}
      </text>

      {/* traffic light (green) */}
      <rect x="188" y="62" width="3" height="50" rx="1" fill="#6b7280" />
      <rect x="182" y="58" width="18" height="56" rx="3" fill="#1e293b" />
      <circle cx="191" cy="69" r="6" fill="#333" />
      <circle cx="191" cy="81" r="6" fill="#333" />
      <circle cx="191" cy="93" r="6" fill="#22c55e" />
    </svg>
  )
}

/** Backwards-compatible alias used by the marketing landing copy. */
export const HeroHouse = WelcomeHouse

import Link from 'next/link'

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
              </div>
            )
            return hrefBuilder
              ? <Link key={p.id} href={hrefBuilder(p.id)} className="block">{content}</Link>
              : <div key={p.id}>{content}</div>
          })}
        </div>
      </div>
      <div className="relative -mx-2 mt-1 flex h-8 items-center gap-4 bg-ink-700 px-6">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="h-1 w-10 shrink-0 rounded-full bg-warning-500 opacity-80" />
        ))}
      </div>
    </div>
  )
}
