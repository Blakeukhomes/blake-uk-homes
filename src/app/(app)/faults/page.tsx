import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DeleteRowButton } from '@/components/delete-row-button'
import type { FaultReport, Property } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function FaultsPage() {
  const supabase = createClient()
  const { data: faults = [] } = await supabase
    .from('fault_reports').select('*').order('reported_at', { ascending: false })
  const { data: properties = [] } = await supabase.from('properties').select('id, nickname')
  const props = (properties ?? []) as Pick<Property, 'id' | 'nickname'>[]

  return (
    <>
      <PageHeader title="Fault reports" subtitle="Every fault submitted via the tenant portal." />
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>All faults</CardTitle>
            <CardDescription>Click a fault to see the full timestamped transcript.</CardDescription>
          </CardHeader>
          <CardBody className="p-0">
            {(faults ?? []).length === 0 ? (
              <p className="px-6 py-6 text-sm text-ink-500">No faults reported.</p>
            ) : (
              <ul className="divide-y hairline divide-ink-100">
                {(faults as FaultReport[]).map((f) => {
                  const prop = props.find((p) => p.id === f.property_id)
                  return (
                    <li key={f.id} className="relative px-6 py-3">
                      {(f.current_state === 'resolved' || f.current_state === 'closed') && (
                        <div className="absolute right-3 top-1/2 z-10 -translate-y-1/2" onClick={(e) => e.stopPropagation()}>
                          <DeleteRowButton entity="faults" id={f.id} label={`fault ${f.reference}`} hint="All photos, videos and transcript will be removed." />
                        </div>
                      )}
                      <Link href={`/faults/${f.id}`} className="block pr-10">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-ink-900 truncate">{f.category}, {prop?.nickname}</p>
                            <p className="text-xs text-ink-500">{f.reference} · reported {new Date(f.reported_at).toLocaleString('en-GB')}</p>
                          </div>
                          <Badge tone={f.current_state === 'resolved' || f.current_state === 'closed' ? 'success' : f.severity === 'emergency' ? 'danger' : 'warning'}>
                            {f.current_state.replace('_', ' ')}
                          </Badge>
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  )
}
