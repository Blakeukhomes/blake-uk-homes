import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import type { Contact, Property } from '@/lib/types'
import { format, addDays } from 'date-fns'

export default async function NewTicketPage() {
  const supabase = createClient()
  const { data: properties = [] } = await supabase.from('properties').select('id, nickname').order('nickname')
  const { data: contractors = [] } = await supabase
    .from('contacts').select('id, full_name, company, trade').eq('kind', 'contractor').eq('is_active', true)
  const props = (properties ?? []) as Pick<Property, 'id' | 'nickname'>[]

  async function create(formData: FormData) {
    'use server'
    const supabase = createClient()

    const { error } = await supabase.from('maintenance_tasks').insert({
      property_id: String(formData.get('property_id')),
      kind: 'task',
      title: String(formData.get('title')),
      description: (formData.get('description') as string) || null,
      due_on: String(formData.get('due_on')),
      priority: String(formData.get('priority') ?? 'medium'),
      status: 'open',
      contractor_id: (formData.get('contractor_id') as string) || null,
      recur_days: null,
    })
    if (error) throw new Error(error.message)
    revalidatePath('/maintenance')
    redirect('/maintenance')
  }

  return (
    <>
      <PageHeader title="New maintenance ticket" subtitle="Report an issue." />
      <div className="p-6">
        <Card className="max-w-2xl">
          <CardBody>
            <form action={create} className="grid gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required placeholder="e.g. Leaking tap in bathroom" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="property_id">Property</Label>
                  <Select id="property_id" name="property_id" required>
                    {props.map((p) => <option key={p.id} value={p.id}>{p.nickname}</option>)}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="due_on">Due date</Label>
                  <Input id="due_on" name="due_on" type="date" required defaultValue={format(addDays(new Date(), 7), 'yyyy-MM-dd')} />
                </div>
              </div>

              <div>
                <Label>Priority</Label>
                <div className="grid grid-cols-4 gap-2">
                  {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
                    <label key={p} className="cursor-pointer rounded-lg border border-ink-200 bg-white px-3 py-2 text-center text-sm capitalize has-[input:checked]:border-accent-500 has-[input:checked]:bg-accent-50 has-[input:checked]:text-accent-700">
                      <input type="radio" name="priority" value={p} defaultChecked={p === 'medium'} className="sr-only" />
                      {p}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="contractor_id">Contractor (optional)</Label>
                <Select id="contractor_id" name="contractor_id" defaultValue="">
                  <option value="">Link contractor</option>
                  {(contractors ?? []).map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name}{c.trade ? ` · ${c.trade}` : ''}{c.company ? ` (${c.company})` : ''}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={4} placeholder="Describe the issue in detail..." />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="submit" size="lg">Create ticket</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
