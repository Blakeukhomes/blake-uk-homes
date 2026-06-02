'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Input } from '@/components/ui/input'

export function TicketTabs({
  tabs,
  selected,
  q,
}: {
  tabs: { value: string; label: string }[]
  selected: string
  q: string
}) {
  const router = useRouter()
  const sp = useSearchParams()

  function update(key: string, value: string) {
    const params = new URLSearchParams(sp?.toString())
    if (!value || value === 'all') params.delete(key)
    else params.set(key, value)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => update('status', t.value)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
              selected === t.value
                ? 'bg-accent-100 text-accent-700 ring-1 ring-inset ring-accent-500/30'
                : 'text-ink-600 hover:bg-ink-100'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-ink-400" />
        <Input
          defaultValue={q}
          placeholder="Search tickets"
          className="pl-9"
          onKeyDown={(e) => { if (e.key === 'Enter') update('q', (e.target as HTMLInputElement).value) }}
        />
      </div>
    </div>
  )
}
