'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Select } from '@/components/ui/input'
import type { MtdQuarter } from '@/lib/mtd'

export function MtdQuarterPicker({
  quarters,
  selected,
}: {
  quarters: MtdQuarter[]
  selected: string
}) {
  const router = useRouter()
  const sp = useSearchParams()
  return (
    <Select
      value={selected}
      onChange={(e) => {
        const params = new URLSearchParams(sp?.toString())
        params.set('q', e.target.value)
        router.push(`?${params.toString()}`)
      }}
      className="h-10 w-auto"
      aria-label="Quarter"
    >
      {quarters.map((q) => (
        <option key={q.id} value={q.id}>{q.label}</option>
      ))}
    </Select>
  )
}
