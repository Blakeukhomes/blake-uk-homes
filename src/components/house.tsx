'use client'
// Illustrative house components for Blake UK Homes.
// Two large variants are realistic cross-section dollhouses with a black UK
// street sign mounted on the upper-left roof slope:
//   - WelcomeHouse: cool daylight palette (auth pages, portal welcome)
//   - HomeHouse:    warmer "lights on" palette (tenant portal home screen)
// House is still the small street-view tile used in the dashboard street row.
import { useId } from 'react'
import { cn } from '@/lib/cn'

export type HouseStatus = 'tenanted' | 'vacant' | 'legal_proceedings'

/** Single small street-view house with traffic light. Used in the dashboard street row. */
export function House({
  status = 'vacant',
  hasAlert = false,
  streetName,
  className,
}: {
  status?: HouseStatus
  hasAlert?: boolean
  streetName?: string
  className?: string
}) {
  const rawId = useId()
  const uid = `tile_${rawId.replace(/[^a-zA-Z0-9]/g, '_')}`

  const isLegal  = status === 'legal_proceedings'
  const greenLit = status === 'tenanted' && !hasAlert
  const amberLit = hasAlert && !isLegal
  const redLit   = isLegal

  // Unused, but kept available if the host wants to colour-code a status border later
  void redLit; void amberLit; void greenLit
  return (
    <div className={cn('relative inline-block', className)} style={{ width: 96, height: 96 }}>
      <Dollhouse
        uniqueId={uid}
        lit={status === 'tenanted'}
        streetName={streetName}
        className="absolute left-0 top-0 h-full w-full"
      />
    </div>
  )
}

// === Legacy small House SVG kept as a fallback / for direct testing ===
function _LegacyHouse({
  redLit, amberLit, greenLit, className,
}: { redLit: boolean; amberLit: boolean; greenLit: boolean; className?: string }) {
  return (
    <svg width="82" height="88" viewBox="0 0 82 88" xmlns="http://www.w3.org/2000/svg" className={cn('block', className)} aria-hidden>
      {/* Chimney — navy slate to match the new dollhouse roof */}
      <rect x="54" y="6" width="8" height="16" rx="1" fill="#0f172a" />
      {/* Roof — dark navy with subtle shading line */}
      <polygon points="41,2 80,30 2,30" fill="#0f172a" />
      <line x1="2" y1="30" x2="80" y2="30" stroke="#1e293b" strokeWidth="0.6" />
      {/* Walls — warm cream gradient feel */}
      <rect x="6" y="29" width="70" height="52" rx="2" fill="#fef3c7" />
      <rect x="6" y="29" width="70" height="52" rx="2" fill="none" stroke="#0f172a" strokeWidth="1" />
      {/* Floor divider — wooden band */}
      <rect x="6" y="55" width="70" height="3" fill="#a16207" />
      {/* Door — indigo accent */}
      <rect x="30" y="58" width="22" height="23" rx="1.5" fill="#6366f1" />
      <circle cx="48" cy="70" r="1.4" fill="#fbbf24" />
      {/* Left window */}
      <rect x="11" y="34" width="15" height="12" rx="1.5" fill="#dbeafe" stroke="#0f172a" strokeWidth="0.8" />
      <line x1="18.5" y1="34" x2="18.5" y2="46" stroke="#0f172a" strokeWidth="0.6" />
      <line x1="11" y1="40" x2="26" y2="40" stroke="#0f172a" strokeWidth="0.6" />
      {/* Right window */}
      <rect x="56" y="34" width="15" height="12" rx="1.5" fill="#dbeafe" stroke="#0f172a" strokeWidth="0.8" />
      <line x1="63.5" y1="34" x2="63.5" y2="46" stroke="#0f172a" strokeWidth="0.6" />
      <line x1="56" y1="40" x2="71" y2="40" stroke="#0f172a" strokeWidth="0.6" />
      {/* Bottom-floor mini windows */}
      <rect x="11" y="63" width="13" height="10" rx="1.5" fill="#dbeafe" stroke="#0f172a" strokeWidth="0.8" />
      <rect x="58" y="63" width="13" height="10" rx="1.5" fill="#dbeafe" stroke="#0f172a" strokeWidth="0.8" />
      {/* Traffic light pole + box (status indicator, unchanged) */}
      <rect x="0" y="29" width="3" height="34" rx="1" fill="#6b7280" />
      <rect x="-5" y="27" width="13" height="38" rx="2" fill="#1e293b" />
      <circle cx="2" cy="35" r="4" fill={redLit   ? '#ef4444' : '#333'} />
      <circle cx="2" cy="46" r="4" fill={amberLit ? '#f59e0b' : '#333'} />
      <circle cx="2" cy="57" r="4" fill={greenLit ? '#22c55e' : '#333'} />
    </svg>
  )
}
// _LegacyHouse close above

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

// Realistic cross-section dollhouse with roof-mounted street sign.
// `lit` switches to a warmer "lights on" palette for the HomeHouse variant.
function Dollhouse({
  streetName,
  lit,
  uniqueId,
  className,
}: { streetName?: string; lit: boolean; uniqueId: string; className?: string }) {
  const label = signLabel(streetName ?? 'Street')
  const fontSize = signFontSize(label)

  // Palette switches between cool (welcome) and warm (lit)
  const wallTop    = lit ? '#fef3c7' : '#fef3c7'
  const wallBot    = lit ? '#fde68a' : '#fde68a'
  const lampColor  = lit ? '#fde047' : '#fbbf24'
  const lampGlow   = lit ? '#fde047' : 'transparent'
  const kitchenWin = lit ? '#fde047' : '#dbeafe'
  const tvScreen   = lit ? '#fbbf24' : '#6366f1'
  const wallpaperOpacity = lit ? 0.7 : 0.5

  const wallGradId = `${uniqueId}_wallGrad`
  const roofGradId = `${uniqueId}_roofGrad`
  const floorWoodId = `${uniqueId}_floorWood`
  const bathTileId = `${uniqueId}_bathTile`
  const roofClipId = `${uniqueId}_roofClip`

  return (
    <svg viewBox="-40 -20 320 310" xmlns="http://www.w3.org/2000/svg" className={cn('block', className)} aria-hidden>
      <defs>
        <linearGradient id={wallGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={wallTop} />
          <stop offset="100%" stopColor={wallBot} />
        </linearGradient>
        <linearGradient id={roofGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <pattern id={floorWoodId} x="0" y="0" width="20" height="6" patternUnits="userSpaceOnUse">
          <rect width="20" height="6" fill="#a16207" />
          <line x1="0" y1="0" x2="20" y2="0" stroke="#78350f" strokeWidth="0.4" />
          <line x1="10" y1="0" x2="10" y2="6" stroke="#78350f" strokeWidth="0.3" opacity="0.5" />
        </pattern>
        <pattern id={bathTileId} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="#e0e7ff" />
          <line x1="0" y1="0" x2="8" y2="0" stroke="#c7d2fe" strokeWidth="0.4" />
          <line x1="0" y1="0" x2="0" y2="8" stroke="#c7d2fe" strokeWidth="0.4" />
        </pattern>
        <clipPath id={roofClipId}>
          <polygon points="100,12 220,72 -20,72" />
        </clipPath>
      </defs>

      <g transform="translate(15 -8) scale(0.83 1.28)">
        {/* Chimney embedded in roof slope */}
        <rect x="160" y="20" width="14" height="58" fill={`url(#${roofGradId})`} />
        <rect x="156" y="18" width="22" height="6" fill="#334155" />
        <rect x="162" y="14" width="10" height="6" fill="#475569" />

        {/* Roof base */}
        <polygon points="100,12 220,72 -20,72" fill={`url(#${roofGradId})`} />

        {/* Roof shading + tile lines (clipped) */}
        <g clipPath={`url(#${roofClipId})`}>
          <polygon points="100,18 215,72 -20,72 100,22 210,76" fill="#000000" opacity="0.25" />
          <line x1="-15" y1="68" x2="218" y2="68" stroke="#475569" strokeWidth="0.6" opacity="0.5" />
          <line x1="-10" y1="60" x2="213" y2="60" stroke="#475569" strokeWidth="0.4" opacity="0.4" />
          <line x1="-5"  y1="52" x2="208" y2="52" stroke="#475569" strokeWidth="0.4" opacity="0.3" />
          <line x1="0"   y1="44" x2="203" y2="44" stroke="#475569" strokeWidth="0.4" opacity="0.3" />
          <line x1="5"   y1="36" x2="198" y2="36" stroke="#475569" strokeWidth="0.4" opacity="0.3" />
        </g>
        <line x1="-20" y1="72" x2="220" y2="72" stroke="#1e293b" strokeWidth="2" />

        {/* House body */}
        <rect x="-20" y="72" width="240" height="138" fill={`url(#${wallGradId})`} />
        <rect x="-20" y="72" width="240" height="138" fill="none" stroke="#0f172a" strokeWidth="3" />

        {/* Wood floors */}
        <rect x="-20" y="133" width="240" height="8" fill={`url(#${floorWoodId})`} />
        <rect x="-20" y="201" width="240" height="9" fill={`url(#${floorWoodId})`} />
        <line x1="-20" y1="133" x2="220" y2="133" stroke="#0f172a" strokeWidth="1.2" />
        <line x1="-20" y1="141" x2="220" y2="141" stroke="#6366f1" strokeWidth="0.8" />

        {/* Room dividers */}
        <line x1="100" y1="72"  x2="100" y2="133" stroke="#fbbf24" strokeWidth="3" />
        <line x1="110" y1="141" x2="110" y2="201" stroke="#fbbf24" strokeWidth="3" />

        {/* BEDROOM (top left) */}
        <circle cx="35"  cy="84" r="1.3" fill="#a78bfa" opacity={wallpaperOpacity} />
        <circle cx="55"  cy="92" r="1.3" fill="#a78bfa" opacity={wallpaperOpacity} />
        <circle cx="75"  cy="84" r="1.3" fill="#a78bfa" opacity={wallpaperOpacity} />
        <circle cx="45"  cy="100" r="1.3" fill="#a78bfa" opacity={wallpaperOpacity} />
        <circle cx="65"  cy="100" r="1.3" fill="#a78bfa" opacity={wallpaperOpacity} />
        <rect x="58" y="86" width="22" height="18" fill="#ffffff" stroke="#0f172a" strokeWidth="1" />
        <rect x="60" y="88" width="18" height="14" fill="#6366f1" />
        <polygon points="60,102 67,93 74,98 78,90 78,102" fill="#a5b4fc" />
        <circle cx="73" cy="92" r="2" fill="#fde047" />
        {lit && <circle cx="20" cy="98" r="10" fill={lampGlow} opacity="0.35" />}
        <line x1="20" y1="73" x2="20" y2="86" stroke="#94a3b8" strokeWidth="0.8" />
        <path d="M 14 86 L 26 86 L 24 94 L 16 94 Z" fill={lampColor} />
        <circle cx="20" cy="98" r="2" fill="#fef9c3" opacity="0.8" />
        <rect x="-10" y="118" width="60" height="14" rx="1" fill="#92400e" />
        <rect x="-10" y="115" width="60" height="6" rx="1" fill="#fffbeb" />
        <rect x="-12" y="108" width="18" height="10" rx="2" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.6" />
        <rect x="-10" y="121" width="60" height="8" fill="#6366f1" />
        <rect x="-10" y="121" width="60" height="2" fill="#4f46e5" />
        <line x1="-7" y1="129" x2="-7" y2="132" stroke="#92400e" strokeWidth="2" />
        <line x1="47" y1="129" x2="47" y2="132" stroke="#92400e" strokeWidth="2" />
        <rect x="52" y="118" width="14" height="14" fill="#92400e" />
        <rect x="52" y="118" width="14" height="2" fill="#78350f" />
        <rect x="56" y="124" width="6" height="3" fill="#fbbf24" />
        <rect x="58" y="108" width="2" height="10" fill="#475569" />
        <path d="M 53 102 L 65 102 L 63 108 L 55 108 Z" fill={lit ? '#fef08a' : '#fef08a'} />
        <rect x="-8" y="130" width="55" height="3" fill="#c4b5fd" rx="1" />

        {/* BATHROOM (top right) */}
        <rect x="111" y="125" width="108" height="8" fill={`url(#${bathTileId})`} />
        <rect x="118" y="115" width="58" height="18" rx="6" fill="#f0f9ff" stroke="#0f172a" strokeWidth="1.2" />
        <rect x="118" y="115" width="58" height="4" fill="#bae6fd" />
        <ellipse cx="138" cy="121" rx="3" ry="1.2" fill="#bae6fd" />
        <rect x="120" y="131" width="2" height="3" fill="#475569" />
        <rect x="172" y="131" width="2" height="3" fill="#475569" />
        <rect x="173" y="111" width="2" height="5" fill="#94a3b8" />
        <path d="M 173 111 Q 169 109 165 113" stroke="#94a3b8" strokeWidth="1.2" fill="none" />
        <rect x="125" y="82" width="32" height="22" fill="#dbeafe" stroke="#0f172a" strokeWidth="1" />
        <line x1="141" y1="82" x2="141" y2="104" stroke="#0f172a" strokeWidth="0.8" />
        <line x1="125" y1="93" x2="157" y2="93" stroke="#0f172a" strokeWidth="0.8" />
        <rect x="121" y="80" width="6" height="26" fill="#fca5a5" />
        <rect x="155" y="80" width="6" height="26" fill="#fca5a5" />
        <rect x="184" y="84" width="22" height="20" rx="1" fill="#e0e7ff" stroke="#94a3b8" strokeWidth="1" />
        <ellipse cx="195" cy="92" rx="4" ry="3" fill="#ffffff" opacity="0.6" />
        <rect x="184" y="117" width="22" height="14" rx="2" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
        <rect x="194" y="113" width="2" height="4" fill="#94a3b8" />
        <circle cx="195" cy="113" r="1.5" fill="#475569" />
        <rect x="208" y="117" width="10" height="6" rx="1" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.8" />
        <rect x="210" y="110" width="6" height="8" rx="1" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.8" />
        <rect x="118" y="92" width="4" height="3" fill="#f87171" rx="0.5" />
        <rect x="118" y="96" width="4" height="3" fill="#fb923c" rx="0.5" />

        {/* LIVING ROOM (bottom left) */}
        <line x1="-20" y1="156" x2="110" y2="156" stroke="#fbbf24" strokeWidth="0.5" opacity="0.6" />
        <line x1="-20" y1="170" x2="110" y2="170" stroke="#fbbf24" strokeWidth="0.5" opacity="0.6" />
        <rect x="-8" y="148" width="16" height="14" fill="#ffffff" stroke="#0f172a" strokeWidth="1" />
        <rect x="-6" y="150" width="12" height="10" fill="#fbbf24" />
        <circle cx="0" cy="155" r="2" fill="#92400e" />
        <rect x="14" y="148" width="16" height="14" fill="#ffffff" stroke="#0f172a" strokeWidth="1" />
        <rect x="16" y="150" width="12" height="10" fill="#a78bfa" />
        <rect x="36" y="148" width="16" height="14" fill="#ffffff" stroke="#0f172a" strokeWidth="1" />
        <rect x="38" y="150" width="12" height="10" fill="#6ee7b7" />
        <rect x="58" y="148" width="42" height="22" rx="1.5" fill="#0f172a" />
        <rect x="60" y="150" width="38" height="16" rx="0.8" fill={tvScreen} />
        <rect x="62" y="152" width="14" height="10" fill="#fbbf24" opacity="0.7" />
        <rect x="76" y="166" width="6" height="4" fill="#0f172a" />
        <rect x="-12" y="180" width="76" height="18" rx="3" fill="#1e293b" />
        <rect x="-12" y="172" width="76" height="10" rx="3" fill="#334155" />
        <rect x="-12" y="172" width="14" height="26" rx="3" fill="#0f172a" />
        <rect x="50" y="172" width="14" height="26" rx="3" fill="#0f172a" />
        <rect x="2"  y="174" width="14" height="10" rx="2" fill="#fbbf24" />
        <rect x="20" y="174" width="14" height="10" rx="2" fill="#6366f1" />
        <rect x="38" y="174" width="14" height="10" rx="2" fill="#a78bfa" />
        <rect x="14" y="194" width="38" height="3" fill="#92400e" />
        <rect x="14" y="197" width="3" height="4" fill="#92400e" />
        <rect x="49" y="197" width="3" height="4" fill="#92400e" />
        <rect x="22" y="190" width="6" height="4" fill="#0f172a" />
        <rect x="32" y="190" width="14" height="4" fill="#ffffff" />
        <ellipse cx="40" cy="190" rx="2" ry="1.5" fill="#fef9c3" />
        <rect x="78" y="148" width="22" height="50" fill="#92400e" />
        <rect x="78" y="148" width="22" height="50" fill="none" stroke="#78350f" strokeWidth="1" />
        <line x1="78" y1="160" x2="100" y2="160" stroke="#78350f" strokeWidth="0.8" />
        <line x1="78" y1="172" x2="100" y2="172" stroke="#78350f" strokeWidth="0.8" />
        <line x1="78" y1="184" x2="100" y2="184" stroke="#78350f" strokeWidth="0.8" />
        <rect x="80" y="150" width="2" height="9" fill="#dc2626" />
        <rect x="83" y="150" width="2" height="9" fill="#16a34a" />
        <rect x="86" y="152" width="2" height="7" fill="#f59e0b" />
        <rect x="89" y="150" width="2" height="9" fill="#0ea5e9" />
        <rect x="92" y="151" width="2" height="8" fill="#7c3aed" />
        <rect x="80" y="162" width="2" height="9" fill="#f97316" />
        <rect x="83" y="163" width="2" height="8" fill="#06b6d4" />
        <rect x="86" y="162" width="2" height="9" fill="#84cc16" />
        <rect x="89" y="163" width="2" height="8" fill="#ec4899" />
        <rect x="80" y="174" width="20" height="9" fill="#fbbf24" />
        <ellipse cx="90" cy="190" rx="6" ry="4" fill="#16a34a" />
        <rect x="86" y="192" width="8" height="6" fill="#92400e" />

        {/* KITCHEN (bottom right) */}
        <rect x="111" y="155" width="108" height="20" fill="#dbeafe" opacity="0.6" />
        <line x1="111" y1="165" x2="219" y2="165" stroke="#93c5fd" strokeWidth="0.4" />
        <rect x="111" y="148" width="22" height="14" fill="#fbbf24" />
        <rect x="111" y="148" width="22" height="14" fill="none" stroke="#0f172a" strokeWidth="1" />
        <line x1="122" y1="148" x2="122" y2="162" stroke="#0f172a" strokeWidth="0.8" />
        <circle cx="120" cy="155" r="0.8" fill="#0f172a" />
        <circle cx="124" cy="155" r="0.8" fill="#0f172a" />
        <rect x="135" y="148" width="22" height="14" fill="#fbbf24" />
        <rect x="135" y="148" width="22" height="14" fill="none" stroke="#0f172a" strokeWidth="1" />
        <line x1="146" y1="148" x2="146" y2="162" stroke="#0f172a" strokeWidth="0.8" />
        <circle cx="144" cy="155" r="0.8" fill="#0f172a" />
        <circle cx="148" cy="155" r="0.8" fill="#0f172a" />
        <rect x="164" y="148" width="26" height="10" rx="1" fill="#94a3b8" />
        <rect x="167" y="158" width="20" height="3" fill="#64748b" />
        <rect x="192" y="148" width="22" height="50" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.2" />
        <line x1="192" y1="166" x2="214" y2="166" stroke="#cbd5e1" strokeWidth="1" />
        <rect x="208" y="158" width="2" height="6" fill="#94a3b8" />
        <rect x="208" y="172" width="2" height="10" fill="#94a3b8" />
        <rect x="111" y="178" width="80" height="14" fill="#0f172a" />
        <rect x="111" y="178" width="80" height="3" fill="#6366f1" />
        <rect x="115" y="183" width="20" height="8" rx="1" fill="#cbd5e1" />
        <rect x="118" y="184" width="14" height="6" rx="0.5" fill="#94a3b8" />
        <rect x="124" y="178" width="2" height="3" fill="#475569" />
        <path d="M 124 178 Q 124 174 128 174 L 128 178" stroke="#475569" strokeWidth="1.5" fill="none" />
        <rect x="164" y="178" width="22" height="14" fill="#1e293b" />
        <circle cx="170" cy="183" r="1.5" fill="#dc2626" />
        <circle cx="180" cy="183" r="1.5" fill="#dc2626" />
        <circle cx="170" cy="188" r="1.5" fill="#0f172a" stroke="#94a3b8" strokeWidth="0.4" />
        <circle cx="180" cy="188" r="1.5" fill="#0f172a" strokeWidth="0.4" />
        <rect x="166" y="174" width="8" height="4" rx="0.5" fill="#94a3b8" />
        <ellipse cx="170" cy="174" rx="5" ry="1.5" fill="#cbd5e1" />
        <rect x="135" y="184" width="29" height="14" fill="#fbbf24" />
        <rect x="135" y="184" width="29" height="14" fill="none" stroke="#0f172a" strokeWidth="1" />
        <line x1="149.5" y1="184" x2="149.5" y2="198" stroke="#0f172a" strokeWidth="0.8" />
        <circle cx="148" cy="191" r="0.6" fill="#0f172a" />
        <circle cx="151" cy="191" r="0.6" fill="#0f172a" />
        <ellipse cx="148" cy="178" rx="6" ry="2" fill="#92400e" />
        <circle cx="145" cy="176" r="2.2" fill="#ef4444" />
        <circle cx="149" cy="175" r="2" fill="#f97316" />
        <circle cx="153" cy="176" r="2.2" fill="#fbbf24" />
        <rect x="115" y="118" width="22" height="14" fill={kitchenWin} stroke="#0f172a" strokeWidth="1" />
        <rect x="113" y="116" width="26" height="4" fill="#16a34a" />
      </g>

      {/* Roof-mounted street sign (outside scale transform so it stays crisp) */}
      <rect x="-30" y="40" width="78" height="22" rx="2" fill="#0f172a" />
      <rect x="-28" y="42" width="74" height="18" rx="1.5" fill="none" stroke="#6366f1" strokeOpacity="0.40" strokeWidth="0.6" />
      <rect x="7" y="62" width="3" height="34" fill="#475569" />
      <text x="9" y="55" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize={fontSize} fontWeight="700" fill="#ffffff" letterSpacing="0.8">
        {label}
      </text>
    </svg>
  )
}

export function WelcomeHouse({ streetName, className }: { streetName?: string; className?: string }) {
  return <Dollhouse streetName={streetName} lit={false} uniqueId="welcomehouse" className={className} />
}

export function HomeHouse({ streetName, className }: { streetName?: string; className?: string }) {
  return <Dollhouse streetName={streetName} lit={true} uniqueId="homehouse" className={className} />
}

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
                <House status={p.status} hasAlert={(p.alertCount ?? 0) > 0} streetName={p.nickname} />
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
