'use client'
import { useRouter, useSearchParams } from 'next/navigation'

export function PropertyFilterSelect({
  properties,
  selected,
}: {
  properties: { id: string; nickname: string }[]
  selected: string
}) {
  const router = useRouter()
  const sp = useSearchParams()

  return (
    <select
      value={selected}
      className="rounded-lg border-0 bg-white px-3 py-1.5 text-sm shadow-sm ring-1 ring-inset ring-ink-200"
      onChange={(e) => {
        const params = new URLSearchParams(sp?.toString())
        if (e.target.value === 'all') params.delete('property')
        else params.set('property', e.target.value)
        router.push(`?${params.toString()}`)
      }}
    >
      <option value="all">All properties</option>
      {properties.map((p) => <option key={p.id} value={p.id}>{p.nickname}</option>)}
    </select>
  )
}
