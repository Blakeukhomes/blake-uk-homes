import Link from 'next/link'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/input'
import type { MaintenanceTask, TicketStatus } from '@/lib/types'

export const dynamic = 'force-dynamic'

const STATUSES: TicketStatus[] = ['open', 'scheduled', 'in_progress', 'resolved', 'overdue', 'rejected', 'archived', 'cancelled']

export default async function TicketPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: ticket } = await supabase
    .from('maintenance_tasks').select('*, properties(nickname), contacts(full_name, company, trade, phone)')
    .eq('id', params.id).maybeSingle()
  if (!ticket) notFound()
  const t = ticket as any as MaintenanceTask & { properties: any; contacts: any }

  async function setStatus(formData: FormData) {
    'use server'
    const supabase = createClient()
    const status = String(formData.get('status')) as TicketStatus
    await supabase.from('maintenance_tasks').update({
      status,
      completed_on: status === 'resolved' ? new Date().toISOString().slice(0, 10) : null,
    }).eq('id', params.id)
    revalidatePath(`/maintenance/${params.id}`)
    revalidatePath('/maintenance')
  }

  return (
    <>
      <PageHeader
        title={t.title}
        subtitle={`${t.properties?.nickname} · due ${new Date(t.due_on).toLocaleDateString('en-GB')}`}
        actions={<Link href="/maintenance"><Button variant="ghost"><ArrowLeft className="h-4 w-4" />Back</Button></Link>}
      />
      <div className="p-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Description</CardTitle>
            <div className="flex gap-2 pt-2">
              <Badge tone={t.priority === 'urgent' ? 'danger' : t.priority === 'high' ? 'warning' : t.priority === 'medium' ? 'info' : 'neutral'}>{t.priority ?? 'medium'} priority</Badge>
              <Badge tone={t.status === 'resolved' ? 'success' : t.status === 'in_progress' ? 'info' : t.status === 'overdue' ? 'danger' : 'warning'}>{t.status ?? 'open'}</Badge>
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-ink-700">{t.description || 'No description provided.'}</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Contractor</CardTitle></CardHeader>
          <CardBody className="text-sm">
            {t.contacts ? (
              <div className="space-y-1">
                <p className="font-semibold text-ink-900">{t.contacts.full_name}</p>
                {t.contacts.trade && <p className="text-xs text-ink-500">{t.contacts.trade}{t.contacts.company ? ` · ${t.contacts.company}` : ''}</p>}
                {t.contacts.phone && <p className="text-xs text-ink-500">{t.contacts.phone}</p>}
              </div>
            ) : <p className="text-ink-500">No contractor linked.</p>}
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>Update status</CardTitle><CardDescription>The dashboard KPIs update automatically.</CardDescription></CardHeader>
          <CardBody>
            <form action={setStatus} className="flex gap-3">
              <Select name="status" defaultValue={t.status ?? 'open'} className="max-w-xs">
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </Select>
              <Button type="submit">Save</Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
