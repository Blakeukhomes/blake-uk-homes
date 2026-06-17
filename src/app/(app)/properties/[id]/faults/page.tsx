import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DeleteRowButton } from '@/components/delete-row-button'
import type { FaultReport } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PropertyFaultsPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: property } = await supabase
    .from('properties').select('id, nickname, address_line_1, city, postcode')
    .eq('id', params.id).maybeSingle()
  const { data: faults = [] } = await supabase
    .from('fault_reports').select('*')
    .eq('property_id', params.id)
    .order('reported_at', { ascending: false })
  if (!property) return null

  const list = (faults ?? []) as FaultReport[]
  const open = list.filter((f) => f.current_state !== 'resolved' && f.current_state !== 'closed')
  const closed = list.filter((f) => f.current_state === 'resolved' || f.current_state === 'closed')

  return (
    <>
      <PageHeader
        title={`Faults at ${property.nickname}`}
        subtitle="Every fault submitted by the tenant for this property."
        actions={<Link href={`/properties/${params.id}`}><Button variant="ghost"><ArrowLeft className="h-4 w-4" />Back to property</Button></Link>}
      />
      <div className="p-6 space-y-6">
        <FaultListCard
          title="Open faults"
          description={open.length === 0 ? 'No outstanding faults. Nice.' : `${open.length} fault${open.length === 1 ? '' : 's'} need attention.`}
          rows={open}
        />
        <FaultListCard
          title="Resolved / closed"
          description={closed.length === 0 ? 'Nothing in the history.' : `${closed.length} historical fault${closed.length === 1 ? '' : 's'}.`}
          rows={closed}
        />
      </div>
    </>
  )
}

function FaultListCard({ title, description, rows }: { title: string; description: string; rows: FaultReport[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardBody className="p-0">
        {rows.length === 0 ? (
          <p className="px-6 py-6 text-sm text-ink-500">{description}</p>
        ) : (
          <ul className="divide-y hairline divide-ink-100">
            {rows.map((f) => (
              <li key={f.id} className="relative px-6 py-3">
                {(f.current_state === 'resolved' || f.current_state === 'closed') && (
                  <div className="absolute right-3 top-1/2 z-10 -translate-y-1/2">
                    <DeleteRowButton entity="faults" id={f.id} label={`fault ${f.reference}`} hint="All photos, videos and transcript will be removed." />
                  </div>
                )}
                <Link href={`/faults/${f.id}`} className="block pr-10">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-ink-900 truncate">{f.category}</p>
                      <p className="text-xs text-ink-500">{f.reference} · reported {new Date(f.reported_at).toLocaleString('en-GB')}</p>
                      {f.description && <p className="mt-1 line-clamp-1 text-xs text-ink-700">{f.description}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {f.severity === 'emergency' && <Badge tone="danger">Emergency</Badge>}
                      {f.severity === 'urgent' && <Badge tone="warning">Urgent</Badge>}
                      <Badge tone={f.current_state === 'resolved' || f.current_state === 'closed' ? 'success' : 'neutral'}>
                        {f.current_state.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}
