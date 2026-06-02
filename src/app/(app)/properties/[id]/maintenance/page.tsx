import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { MaintenanceTask } from '@/lib/types'
import { addDays, format, parseISO, differenceInCalendarDays } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function PropertyMaintenancePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: property } = await supabase.from('properties').select('id, nickname').eq('id', params.id).single()
  const { data: tasks = [] } = await supabase
    .from('maintenance_tasks').select('*').eq('property_id', params.id).order('due_on')
  if (!property) return null

  async function addTask(formData: FormData) {
    'use server'
    const supabase = createClient()
    const kind = String(formData.get('kind')) as 'inspection' | 'task'
    const recur_days = kind === 'inspection' ? 120 : null
    const { error } = await supabase.from('maintenance_tasks').insert({
      property_id: params.id,
      kind,
      title: String(formData.get('title')),
      description: (formData.get('description') as string) || null,
      due_on: String(formData.get('due_on')),
      recur_days,
    })
    if (error) throw new Error(error.message)
    revalidatePath(`/properties/${params.id}/maintenance`)
    revalidatePath('/maintenance')
  }

  async function completeTask(formData: FormData) {
    'use server'
    const supabase = createClient()
    const id = String(formData.get('task_id'))
    const completed_on = String(formData.get('completed_on') || format(new Date(), 'yyyy-MM-dd'))
    const notes = (formData.get('notes') as string) || null

    const { data: t } = await supabase.from('maintenance_tasks').select('*').eq('id', id).single()
    if (!t) return
    await supabase.from('maintenance_tasks').update({ completed_on, notes }).eq('id', id)

    // Auto-schedule next occurrence if recurring
    if (t.recur_days) {
      await supabase.from('maintenance_tasks').insert({
        property_id: t.property_id,
        kind: t.kind,
        title: t.title,
        description: t.description,
        due_on: format(addDays(parseISO(completed_on), t.recur_days), 'yyyy-MM-dd'),
        recur_days: t.recur_days,
      })
    }
    revalidatePath(`/properties/${params.id}/maintenance`)
    revalidatePath('/maintenance')
  }

  const open      = (tasks as MaintenanceTask[]).filter((t) => !t.completed_on)
  const completed = (tasks as MaintenanceTask[]).filter((t) =>  t.completed_on)

  return (
    <>
      <PageHeader title={`${property.nickname}, Maintenance`} subtitle="Inspections every 120 days. Custom tasks supported." />
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Add task</CardTitle>
            <CardDescription>Pick "Inspection" to auto-recur every 120 days.</CardDescription>
          </CardHeader>
          <CardBody>
            <form action={addTask} className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="kind">Kind</Label>
                <Select id="kind" name="kind" defaultValue="task">
                  <option value="inspection">Inspection (recurs every 120 days)</option>
                  <option value="task">One-off task</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="due_on">Due on</Label>
                <Input id="due_on" name="due_on" type="date" required defaultValue={format(new Date(), 'yyyy-MM-dd')} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required placeholder="e.g. Quarterly inspection" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={3} />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <Button type="submit">Add task</Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Open</CardTitle></CardHeader>
          <CardBody className="p-0">
            {open.length === 0 ? <p className="px-6 py-6 text-sm text-ink-500">Nothing open.</p> : (
              <ul className="divide-y hairline divide-ink-100">
                {open.map((t) => {
                  const days = differenceInCalendarDays(parseISO(t.due_on), new Date())
                  return (
                    <li key={t.id} className="px-6 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-ink-900">{t.title}{' '}
                            {t.kind === 'inspection' && <Badge tone="info" className="ml-1">Inspection · 120-day cycle</Badge>}
                          </p>
                          <p className="text-xs text-ink-500">Due {new Date(t.due_on).toLocaleDateString('en-GB')}</p>
                        </div>
                        <Badge tone={days < 0 ? 'danger' : days < 14 ? 'warning' : 'neutral'}>
                          {days < 0 ? `${Math.abs(days)} days overdue` : `${days} days`}
                        </Badge>
                      </div>
                      <form action={completeTask} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                        <input type="hidden" name="task_id" value={t.id} />
                        <Input name="completed_on" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} />
                        <Input name="notes" placeholder="Notes (visit findings, photos location, etc.)" />
                        <Button type="submit" size="sm" variant="secondary">Mark complete</Button>
                      </form>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardBody>
        </Card>

        {completed.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Completed</CardTitle></CardHeader>
            <CardBody className="p-0">
              <ul className="divide-y hairline divide-ink-100">
                {completed.slice(0, 10).map((t) => (
                  <li key={t.id} className="px-6 py-3">
                    <p className="text-sm font-medium text-ink-900">{t.title}</p>
                    <p className="text-xs text-ink-500">Completed {new Date(t.completed_on!).toLocaleDateString('en-GB')} · {t.notes ?? '-'}</p>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )}
      </div>
    </>
  )
}
