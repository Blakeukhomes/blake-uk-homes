import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FaultMediaGallery } from '@/components/fault-media-gallery'
import type { FaultReport, FaultEvent, ContractorBooking, FaultState } from '@/lib/types'

export const dynamic = 'force-dynamic'

const STATES: FaultState[] = ['reported','acknowledged','contractor_booked','in_progress','resolved','closed']

export default async function FaultDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: fault } = await supabase.from('fault_reports').select('*, properties(nickname, address_line_1, city, postcode), tenants(full_name, email, phone)').eq('id', params.id).single()
  const { data: events = [] } = await supabase.from('fault_events').select('*').eq('fault_id', params.id).order('occurred_at')
  const { data: bookings = [] } = await supabase.from('contractor_bookings').select('*').eq('fault_id', params.id).order('scheduled_for')
  if (!fault) return null
  const f = fault as any as FaultReport & { properties: any; tenants: any }

  async function logEvent(formData: FormData) {
    'use server'
    const supabase = createClient()
    const state = String(formData.get('state')) as FaultState
    const note  = (formData.get('note') as string) || null
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user!.id).single()

    await supabase.from('fault_events').insert({
      fault_id: params.id, state, note,
      actor_role: profile?.role ?? 'owner',
      actor_name: profile?.full_name ?? user!.email!,
    })
    await supabase.from('fault_reports').update({
      current_state: state,
      resolved_at: state === 'resolved' || state === 'closed' ? new Date().toISOString() : null,
    }).eq('id', params.id)
    revalidatePath(`/faults/${params.id}`)
    revalidatePath('/faults')
  }

  async function bookContractor(formData: FormData) {
    'use server'
    const supabase = createClient()
    const { data: row } = await supabase.from('contractor_bookings').insert({
      fault_id: params.id,
      property_id: f.property_id,
      contractor_name: String(formData.get('contractor_name')),
      trade: (formData.get('trade') as string) || null,
      phone: (formData.get('phone') as string) || null,
      scheduled_for: String(formData.get('scheduled_for')),
      notes: (formData.get('notes') as string) || null,
    }).select('id, contractor_name, scheduled_for').single()

    await supabase.from('fault_reports').update({ current_state: 'contractor_booked' }).eq('id', params.id)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user!.id).single()
    await supabase.from('fault_events').insert({
      fault_id: params.id, state: 'contractor_booked',
      actor_role: profile?.role ?? 'owner',
      actor_name: profile?.full_name ?? user!.email!,
      note: `Booked ${row!.contractor_name} for ${new Date(row!.scheduled_for).toLocaleString('en-GB')}`,
    })
    revalidatePath(`/faults/${params.id}`)
  }

  return (
    <>
      <PageHeader
        title={`${f.category}, ${f.properties?.nickname}`}
        subtitle={`Ref ${f.reference} · reported ${new Date(f.reported_at).toLocaleString('en-GB')}`}
        actions={
          <Link href={`/api/pdf/fault/${f.id}`} target="_blank">
            <Button>Print court-ready PDF</Button>
          </Link>
        }
      />
      <div className="p-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" id="attachments">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Photos and videos</CardTitle>
              <CardDescription>Submitted by the tenant when this fault was reported.</CardDescription>
            </div>
            <Link href={`/api/faults/${f.id}/attachments.zip`}>
              <Button variant="secondary" size="sm"><Download className="h-4 w-4" />Download all (zip)</Button>
            </Link>
          </CardHeader>
          <CardBody>
            <FaultMediaGallery faultId={f.id} />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Transcript</CardTitle>
            <CardDescription>Every action timestamped at submission. Append-only.</CardDescription>
          </CardHeader>
          <CardBody className="p-0">
            <ol className="divide-y hairline divide-ink-100">
              {(events as FaultEvent[]).map((e) => (
                <li key={e.id} className="px-6 py-3">
                  <p className="text-xs text-ink-500">{new Date(e.occurred_at).toLocaleString('en-GB')}</p>
                  <p className="text-sm">
                    <strong>{e.state.replace('_', ' ')}</strong>, {e.actor_name} <span className="text-ink-500">({e.actor_role})</span>
                  </p>
                  {e.note && <p className="text-sm text-ink-700">{e.note}</p>}
                </li>
              ))}
            </ol>
            <form action={logEvent} className="grid gap-3 border-t hairline border-t-ink-100 px-6 py-4 sm:grid-cols-[200px_1fr_auto]">
              <Select name="state" defaultValue="in_progress" required>
                {STATES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </Select>
              <Input name="note" placeholder="Note for the transcript" />
              <Button type="submit" size="sm">Log entry</Button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Book contractor</CardTitle><CardDescription>Tenant sees this booking in their portal.</CardDescription></CardHeader>
          <CardBody>
            <form action={bookContractor} className="grid gap-3">
              <div><Label htmlFor="contractor_name">Contractor</Label><Input id="contractor_name" name="contractor_name" required /></div>
              <div><Label htmlFor="trade">Trade</Label><Input id="trade" name="trade" placeholder="Plumber, electrician…" /></div>
              <div><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" /></div>
              <div><Label htmlFor="scheduled_for">When</Label><Input id="scheduled_for" name="scheduled_for" type="datetime-local" required /></div>
              <div><Label htmlFor="notes">Notes</Label><Textarea id="notes" name="notes" rows={2} /></div>
              <Button type="submit">Book</Button>
            </form>

            {(bookings ?? []).length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs uppercase tracking-wide text-ink-500">Booked</p>
                {(bookings as ContractorBooking[]).map((b) => (
                  <div key={b.id} className="rounded-lg bg-ink-50 p-3 text-sm">
                    <p className="font-medium text-ink-900">{b.contractor_name}{b.trade ? ` · ${b.trade}` : ''}</p>
                    <p className="text-xs text-ink-500">{new Date(b.scheduled_for).toLocaleString('en-GB')}</p>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  )
}
