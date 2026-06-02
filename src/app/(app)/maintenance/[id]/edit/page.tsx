import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import type { MaintenanceTask, Contact, Property } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function EditTicketPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: ticket } = await supabase.from('maintenance_tasks').select('*').eq('id', params.id).maybeSingle()
  const { data: properties = [] } = await supabase.from('properties').select('id, nickname').order('nickname')
  const { data: contractors = [] } = await supabase
    .from('contacts').select('id, full_name, company, trade').eq('kind', 'contractor').eq('is_active', true)
  if (!ticket) notFound()
  const t = ticket as MaintenanceTask
  const props = (properties ?? []) as Pick<Property, 'id' | 'nickname'>[]

  async function update(formData: FormData) {
    'use server'
    const supabase = createClient()
    await supabase.from('maintenance_tasks').update({
      property_id: String(formData.get('property_id')),
      title: String(formData.get('title')),
      description: (formData.get('description') as string) || null,
      due_on: String(formData.get('due_on')),
      priority: String(formData.get('priority') ?? 'medium'),
      status: String(formData.get('status') ?? 'open'),
      contractor_id: (formData.get('contractor_id') as string) || null,
      notes: (formData.get('notes') as string) || null,
    }).eq('id', params.id)
    revalidatePath('/maintenance')
    revalidatePath(`/maintenance/${params.id}`)
    redirect(`/maintenance/${params.id}`)
  }

  async function remove() {
    'use server'
    const supabase = createClient()
    await supabase.from('maintenance_tasks').delete().eq('id', params.id)
    revalidatePath('/maintenance')
    redirect('/maintenance')
  }

  return (
    <>
      <PageHeader
        title={`Edit ticket: ${t.title}`}
        actions={<Link href={`/maintenance/${t.id}`}><Button variant="ghost"><ArrowLeft className="h-4 w-4" />Back</Button></Link>}
      />
      <div className="p-6">
        <Card className="max-w-2xl">
          <CardBody>
            <form action={update} className="grid gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required defaultValue={t.title} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="property_id">Property</Label>
                  <Select id="property_id" name="property_id" defaultValue={t.property_id}>
                    {props.map((p) => <option key={p.id} value={p.id}>{p.nickname}</option>)}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="due_on">Due date</Label>
                  <Input id="due_on" name="due_on" type="date" required defaultValue={t.due_on} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select id="priority" name="priority" defaultValue={t.priority ?? 'medium'}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select id="status" name="status" defaultValue={t.status ?? 'open'}>
                    <option value="open">Open</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="overdue">Overdue</option>
                    <option value="rejected">Rejected</option>
                    <option value="archived">Archived</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="contractor_id">Contractor (optional)</Label>
                <Select id="contractor_id" name="contractor_id" defaultValue={t.contractor_id ?? ''}>
                  <option value="">No contractor</option>
                  {(contractors ?? []).map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name}{c.trade ? ` · ${c.trade}` : ''}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={4} defaultValue={t.description ?? ''} />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={2} defaultValue={t.notes ?? ''} />
              </div>

              <div className="flex justify-between gap-2 pt-2">
                <Button type="submit" formAction={remove} variant="danger" size="sm">Delete ticket</Button>
                <div className="flex gap-2">
                  <Link href={`/maintenance/${t.id}`}><Button variant="secondary" type="button">Cancel</Button></Link>
                  <Button type="submit" size="lg">Save</Button>
                </div>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
