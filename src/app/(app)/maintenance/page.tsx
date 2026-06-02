import Link from 'next/link'
import { Activity, Clock, CheckCircle2, Plus, Search, Wrench } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Stat } from '@/components/ui/stat'
import { TicketTabs } from '@/components/ticket-tabs'
import type { MaintenanceTask, Property, TicketPriority, TicketStatus } from '@/lib/types'
import { differenceInCalendarDays, parseISO } from 'date-fns'

export const dynamic = 'force-dynamic'

const TABS: { value: string; label: string }[] = [
  { value: 'all',         label: 'All tickets' },
  { value: 'open',        label: 'Open' },
  { value: 'scheduled',   label: 'Scheduled' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved',    label: 'Resolved' },
  { value: 'overdue',     label: 'Overdue' },
  { value: 'rejected',    label: 'Rejected' },
  { value: 'archived',    label: 'Archived' },
  { value: 'cancelled',   label: 'Cancelled' },
]

function priorityTone(p?: TicketPriority): 'neutral' | 'info' | 'warning' | 'danger' {
  if (p === 'urgent') return 'danger'
  if (p === 'high')   return 'warning'
  if (p === 'medium') return 'info'
  return 'neutral'
}

function statusTone(s?: TicketStatus): 'neutral' | 'info' | 'warning' | 'danger' | 'success' {
  if (s === 'resolved')    return 'success'
  if (s === 'in_progress') return 'info'
  if (s === 'scheduled')   return 'info'
  if (s === 'overdue')     return 'danger'
  if (s === 'rejected' || s === 'archived' || s === 'cancelled') return 'neutral'
  return 'warning' // open
}

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string }
}) {
  const supabase = createClient()
  const { data: tickets = [] } = await supabase
    .from('maintenance_tasks').select('*').order('due_on')
  const { data: properties = [] } = await supabase.from('properties').select('id, nickname')

  const allTickets = (tickets ?? []) as MaintenanceTask[]
  const props = (properties ?? []) as Pick<Property, 'id' | 'nickname'>[]

  // Derive status if not set (existing rows without status)
  const today = new Date()
  function derivedStatus(t: MaintenanceTask): TicketStatus {
    if (t.status) return t.status
    if (t.completed_on) return 'resolved'
    const days = differenceInCalendarDays(parseISO(t.due_on), today)
    if (days < 0) return 'overdue'
    return 'open'
  }

  const enriched = allTickets.map((t) => ({ ...t, _status: derivedStatus(t) }))

  // KPIs
  const started   = enriched.filter((t) => t._status === 'open').length
  const inProgress = enriched.filter((t) => t._status === 'in_progress' || t._status === 'scheduled').length
  const completed = enriched.filter((t) => t._status === 'resolved').length

  const statusFilter = searchParams.status ?? 'all'
  const query = (searchParams.q ?? '').toLowerCase()
  let rows = enriched
  if (statusFilter !== 'all') rows = rows.filter((t) => t._status === statusFilter)
  if (query) rows = rows.filter((t) =>
    t.title.toLowerCase().includes(query) ||
    (t.description ?? '').toLowerCase().includes(query)
  )

  return (
    <>
      <PageHeader
        title="Maintenance tickets"
        subtitle="Track all property repairs and maintenance requests."
        actions={<Link href="/maintenance/new"><Button><Plus className="h-4 w-4" />New ticket</Button></Link>}
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Stat label="Started" value={started} hint="New tickets awaiting action" tone={started > 0 ? 'warning' : 'neutral' as any} icon={<Activity className="h-4 w-4" />} />
          <Stat label="In progress" value={inProgress} hint="Currently being worked on" tone="neutral" icon={<Clock className="h-4 w-4" />} />
          <Stat label="Completed" value={completed} hint="Resolved this period" tone="success" icon={<CheckCircle2 className="h-4 w-4" />} />
        </div>

        <Card>
          <CardBody>
            <TicketTabs tabs={TABS} selected={statusFilter} q={query} />
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-0">
            {rows.length === 0 ? (
              <div className="py-16 text-center">
                <Wrench className="mx-auto h-10 w-10 text-ink-300" />
                <p className="mt-3 text-sm font-semibold text-ink-900">No tickets found</p>
                <p className="text-sm text-ink-500">Create a new ticket to get started.</p>
                <Link href="/maintenance/new" className="mt-4 inline-block"><Button>New ticket</Button></Link>
              </div>
            ) : (
              <ul className="divide-y hairline divide-ink-100">
                {rows.map((t) => {
                  const prop = props.find((p) => p.id === t.property_id)
                  return (
                    <li key={t.id}>
                      <Link href={`/maintenance/${t.id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-ink-50/50">
                        <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-lg bg-accent-100 text-accent-700">
                          <Wrench className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink-900">{t.title}</p>
                          <p className="text-xs text-ink-500">
                            {prop?.nickname} · due {new Date(t.due_on).toLocaleDateString('en-GB')}
                          </p>
                        </div>
                        <Badge tone={priorityTone(t.priority)}>{t.priority ?? 'medium'}</Badge>
                        <Badge tone={statusTone(t._status)}>{t._status.replace('_', ' ')}</Badge>
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
