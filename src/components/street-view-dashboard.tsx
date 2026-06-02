'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { House, type HouseStatus } from '@/components/house'

export interface StreetProperty {
  id: string
  short_name: string             // shown on street sign
  full_address: string           // shown in detail panel
  status: HouseStatus
  monthly_rent: number
  tenant_label: string           // "Tenant A", "Vacant", "Legal proceedings"
  alerts: string[]
  ownership: 'Company' | 'Personal'
}

type Filter = 'all' | 'tenanted' | 'vacant' | 'legal_proceedings' | 'alert'

const STATUS = {
  tenanted:          { label: 'Tenanted', text: '#14532d', bg: '#f0fdf4' },
  vacant:            { label: 'Vacant',   text: '#78350f', bg: '#fffbeb' },
  legal_proceedings: { label: 'Legal',    text: '#7f1d1d', bg: '#fef2f2' },
} as const

export function StreetViewDashboard({
  user,
  properties,
}: {
  user: { initials: string }
  properties: StreetProperty[]
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const visible = filter === 'all'
    ? properties
    : filter === 'alert'
      ? properties.filter((p) => p.alerts.length > 0)
      : properties.filter((p) => p.status === filter)

  const counts = {
    all: properties.length,
    tenanted: properties.filter((p) => p.status === 'tenanted').length,
    alerts: properties.filter((p) => p.alerts.length > 0).length,
    monthly: properties.filter((p) => p.status === 'tenanted').reduce((s, p) => s + p.monthly_rent, 0),
  }

  const selected = selectedId ? properties.find((p) => p.id === selectedId) ?? null : null

  return (
    <div className="min-h-screen" style={{ background: '#f5f5f0' }}>
      {/* Header */}
      <header className="bg-ink-900 px-5 pt-6 pb-5">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.1em] text-ink-600">BLAKE UK HOMES</p>
              <p className="text-[22px] font-bold leading-tight tracking-tight text-white">
                My <span className="text-accent-500">Portfolio</span>
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-500 text-[13px] font-bold text-white">
              {user.initials}
            </div>
          </div>

          {/* 4-stat grid */}
          <div className="mb-4 grid grid-cols-4 gap-2">
            <div className="rounded-[10px] bg-ink-800 px-2 py-2.5 text-center">
              <p className="text-lg font-bold text-accent-500">{counts.all}</p>
              <p className="mt-0.5 text-[9px] text-ink-600">Properties</p>
            </div>
            <div className="rounded-[10px] bg-ink-800 px-2 py-2.5 text-center">
              <p className="text-lg font-bold text-success-500">{counts.tenanted}</p>
              <p className="mt-0.5 text-[9px] text-ink-600">Tenanted</p>
            </div>
            <div className="rounded-[10px] bg-ink-800 px-2 py-2.5 text-center">
              <p className="text-lg font-bold text-danger-500">{counts.alerts}</p>
              <p className="mt-0.5 text-[9px] text-ink-600">Alerts</p>
            </div>
            <div className="rounded-[10px] bg-ink-800 px-2 py-2.5 text-center">
              <p className="text-lg font-bold text-warning-500">£{counts.monthly.toLocaleString()}</p>
              <p className="mt-0.5 text-[9px] text-ink-600">Monthly</p>
            </div>
          </div>

          {/* Pill filters */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            <FilterPill active={filter === 'all'}               onClick={() => setFilter('all')}>All ({counts.all})</FilterPill>
            <FilterPill active={filter === 'tenanted'}          onClick={() => setFilter('tenanted')}>Tenanted</FilterPill>
            <FilterPill active={filter === 'vacant'}            onClick={() => setFilter('vacant')}>Vacant</FilterPill>
            <FilterPill active={filter === 'legal_proceedings'} onClick={() => setFilter('legal_proceedings')}>Legal</FilterPill>
            <FilterPill active={filter === 'alert'}             onClick={() => setFilter('alert')}>Alerts</FilterPill>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-3xl p-4">
        <p className="mb-2 text-[11px] text-ink-400">← Scroll to see all properties</p>

        {/* Street row */}
        <div className="overflow-x-auto pt-2">
          <div className="flex min-w-max items-end gap-3 px-1 pb-2">
            {visible.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id === selectedId ? null : p.id)}
                className={cn(
                  'flex w-[90px] cursor-pointer flex-col items-center transition-transform',
                  selectedId === p.id ? '-translate-y-1' : 'hover:-translate-y-0.5',
                )}
              >
                <span
                  className="block max-w-[88px] truncate rounded-[3px] px-1.5 py-0.5 text-[9px] font-bold text-white"
                  style={{ background: '#1e40af' }}
                >
                  {p.short_name}
                </span>
                <span className="block h-4 w-0.5" style={{ background: '#94a3b8' }} />
                <House status={p.status} hasAlert={p.alerts.length > 0} />
                <p className="mt-1 text-[9px] font-semibold" style={{ color: STATUS[p.status].text }}>
                  {STATUS[p.status].label}
                </p>
              </button>
            ))}
            {/* Add property plot */}
            <Link href="/properties/new" className="flex w-[90px] flex-col items-center opacity-50 hover:opacity-80">
              <div className="flex h-[82px] w-[82px] items-center justify-center rounded-[10px] border-2 border-dashed border-ink-300 bg-white text-[28px] text-ink-400">
                +
              </div>
              <p className="mt-1.5 text-[9px] text-ink-400">Add Property</p>
            </Link>
          </div>
        </div>

        {/* Road */}
        <div className="-mx-4 flex h-8 items-center gap-4 bg-ink-700 px-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-1 w-10 rounded-full bg-warning-500 opacity-70" />
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <DetailPanel property={selected} onClose={() => setSelectedId(null)} />
        )}

        {/* Demo note */}
        <div className="mt-4 rounded-[10px] border px-3.5 py-2.5 text-center text-[11px]"
             style={{ background: '#fffbeb', borderColor: '#fde68a', color: '#92400e' }}>
          Tap any house to see property details.
        </div>
      </div>
    </div>
  )
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors',
        active
          ? 'bg-accent-500 text-white'
          : 'border border-ink-700 bg-transparent text-ink-400 hover:text-white',
      )}
    >
      {children}
    </button>
  )
}

function DetailPanel({ property: p, onClose }: { property: StreetProperty; onClose: () => void }) {
  const s = STATUS[p.status]
  const isLegal = p.status === 'legal_proceedings'
  const tlText  = isLegal ? '🔴 Legal' : p.alerts.length > 0 ? '🟡 Attention' : '🟢 All Clear'
  const tlColor = isLegal ? '#dc2626' : p.alerts.length > 0 ? '#d97706' : '#15803d'

  return (
    <div className="mt-4 rounded-2xl border border-ink-200 bg-white p-4 animate-in slide-in-from-bottom-2 fade-in duration-200">
      <div className="mb-3.5 flex items-start justify-between">
        <div>
          <p className="text-[15px] font-bold text-ink-900">{p.full_address}</p>
          <p className="mt-0.5 text-xs text-ink-500">{p.tenant_label}</p>
          <p className="mt-0.5 text-[11px] text-ink-400">{p.ownership}</p>
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-[10px] font-bold"
          style={{ background: s.bg, color: s.text }}
        >
          {s.label}
        </span>
      </div>

      {/* 3 stats */}
      <div className="mb-3.5 grid grid-cols-3 gap-2">
        <Stat label="Status">
          <span style={{ color: tlColor }} className="text-[15px] font-bold">{tlText}</span>
        </Stat>
        <Stat label="Monthly rent">
          <span className="text-[15px] font-bold text-ink-900">{p.monthly_rent ? `£${p.monthly_rent.toLocaleString()}` : '-'}</span>
        </Stat>
        <Stat label="Alerts">
          <span
            className="text-[15px] font-bold"
            style={{ color: p.alerts.length > 0 ? '#dc2626' : '#15803d' }}
          >
            {p.alerts.length > 0 ? `${p.alerts.length} alert${p.alerts.length > 1 ? 's' : ''}` : 'Clear'}
          </span>
        </Stat>
      </div>

      {/* Tabs (visual only — link to deep pages) */}
      <div className="mb-3.5 flex gap-0 border-b border-ink-200">
        <Tab href={`/properties/${p.id}`}              active>Overview</Tab>
        <Tab href={`/properties/${p.id}/compliance`}>Compliance</Tab>
        <Tab href={`/properties/${p.id}/rent`}>Rent</Tab>
        <Tab href={`/properties/${p.id}/maintenance`}>Maintenance</Tab>
      </div>

      {p.alerts.length > 0 ? (
        <div className="mb-2.5">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-ink-400">REQUIRES ACTION</p>
          {p.alerts.map((a, i) => (
            <div key={i} className="flex items-center gap-2 border-b border-ink-50 py-2 text-xs text-ink-700">
              <span className="h-2 w-2 rounded-full bg-danger-500" />
              {a}
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-2.5 rounded-[10px] bg-success-50 px-3 py-3 text-center text-[13px] font-bold text-success-700">
          ✓ All clear
        </div>
      )}

      <div className="mb-3 grid grid-cols-2 gap-2">
        <Link href={`/properties/${p.id}`} className="rounded-[10px] bg-accent-500 px-3 py-2.5 text-center text-xs font-semibold text-white">
          View Property
        </Link>
        <Link href={`/mtd/new?property=${p.id}`} className="rounded-[10px] border border-ink-200 bg-transparent px-3 py-2.5 text-center text-xs font-semibold text-ink-700">
          Log Expense
        </Link>
      </div>

      <button
        onClick={onClose}
        className="block w-full rounded-[10px] border border-ink-200 bg-transparent px-3 py-2.5 text-xs font-semibold text-ink-500"
      >
        Close
      </button>
    </div>
  )
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[10px] bg-ink-50 px-2 py-2.5 text-center">
      {children}
      <p className="mt-1 text-[10px] text-ink-500">{label}</p>
    </div>
  )
}

function Tab({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        'border-b-2 px-3 py-2 text-[11px] font-semibold',
        active
          ? 'border-accent-500 text-accent-500'
          : 'border-transparent text-ink-400 hover:text-ink-700'
      )}
    >
      {children}
    </Link>
  )
}
