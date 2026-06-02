import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import type { Contact, Property } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function EditContactPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: contact } = await supabase.from('contacts').select('*').eq('id', params.id).maybeSingle()
  const { data: properties = [] } = await supabase.from('properties').select('id, nickname').order('nickname')
  if (!contact) notFound()
  const c = contact as Contact
  const props = (properties ?? []) as Pick<Property, 'id' | 'nickname'>[]

  async function update(formData: FormData) {
    'use server'
    const supabase = createClient()
    await supabase.from('contacts').update({
      kind: String(formData.get('kind') ?? 'other'),
      full_name: String(formData.get('full_name') ?? ''),
      company: (formData.get('company') as string) || null,
      trade: (formData.get('trade') as string) || null,
      email: (formData.get('email') as string) || null,
      phone: (formData.get('phone') as string) || null,
      address: (formData.get('address') as string) || null,
      notes: (formData.get('notes') as string) || null,
      property_id: (formData.get('property_id') as string) || null,
      is_active: formData.get('is_active') === 'on',
    }).eq('id', params.id)
    revalidatePath('/contacts')
    revalidatePath(`/contacts/${params.id}`)
    redirect(`/contacts/${params.id}`)
  }

  async function remove() {
    'use server'
    const supabase = createClient()
    await supabase.from('contacts').delete().eq('id', params.id)
    revalidatePath('/contacts')
    redirect('/contacts')
  }

  return (
    <>
      <PageHeader
        title={`Edit ${c.full_name}`}
        subtitle="Update contact details, or delete."
        actions={<Link href={`/contacts/${c.id}`}><Button variant="ghost"><ArrowLeft className="h-4 w-4" />Back</Button></Link>}
      />
      <div className="p-6">
        <Card className="max-w-2xl">
          <CardBody>
            <form action={update} className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="kind">Type</Label>
                <Select id="kind" name="kind" defaultValue={c.kind}>
                  <option value="tenant">Tenant</option>
                  <option value="contractor">Contractor</option>
                  <option value="supplier">Supplier</option>
                  <option value="agent">Agent</option>
                  <option value="other">Other</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="property_id">Property (optional)</Label>
                <Select id="property_id" name="property_id" defaultValue={c.property_id ?? ''}>
                  <option value="">No link</option>
                  {props.map((p) => <option key={p.id} value={p.id}>{p.nickname}</option>)}
                </Select>
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="full_name">Full name</Label>
                <Input id="full_name" name="full_name" required defaultValue={c.full_name} />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input id="company" name="company" defaultValue={c.company ?? ''} />
              </div>
              <div>
                <Label htmlFor="trade">Trade or role</Label>
                <Input id="trade" name="trade" defaultValue={c.trade ?? ''} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={c.email ?? ''} />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" type="tel" defaultValue={c.phone ?? ''} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" defaultValue={c.address ?? ''} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={3} defaultValue={c.notes ?? ''} />
              </div>
              <label className="sm:col-span-2 inline-flex items-center gap-2 text-sm">
                <input type="checkbox" name="is_active" defaultChecked={c.is_active} className="rounded border-ink-300" />
                Active
              </label>

              <div className="sm:col-span-2 flex justify-between gap-2 pt-2">
                <Button type="submit" formAction={remove} variant="danger" size="sm">Delete</Button>
                <div className="flex gap-2">
                  <Link href={`/contacts/${c.id}`}><Button variant="secondary" type="button">Cancel</Button></Link>
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
