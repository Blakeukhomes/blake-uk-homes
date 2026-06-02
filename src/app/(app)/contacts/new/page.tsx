import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import type { Property } from '@/lib/types'

export default async function NewContactPage() {
  const supabase = createClient()
  const { data: properties = [] } = await supabase.from('properties').select('id, nickname').order('nickname')
  const props = (properties ?? []) as Pick<Property, 'id' | 'nickname'>[]

  async function create(formData: FormData) {
    'use server'
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { error } = await supabase.from('contacts').insert({
      owner_id: user.id,
      kind: String(formData.get('kind') ?? 'other'),
      full_name: String(formData.get('full_name') ?? ''),
      company: (formData.get('company') as string) || null,
      trade: (formData.get('trade') as string) || null,
      email: (formData.get('email') as string) || null,
      phone: (formData.get('phone') as string) || null,
      address: (formData.get('address') as string) || null,
      notes: (formData.get('notes') as string) || null,
      property_id: (formData.get('property_id') as string) || null,
      is_active: true,
    })
    if (error) throw new Error(error.message)
    revalidatePath('/contacts')
    redirect('/contacts')
  }

  return (
    <>
      <PageHeader title="New contact" subtitle="Tenant, contractor, supplier, agent, or other." />
      <div className="p-6">
        <Card className="max-w-2xl">
          <CardBody>
            <form action={create} className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="kind">Type</Label>
                <Select id="kind" name="kind" defaultValue="contractor">
                  <option value="tenant">Tenant</option>
                  <option value="contractor">Contractor</option>
                  <option value="supplier">Supplier</option>
                  <option value="agent">Agent</option>
                  <option value="other">Other</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="property_id">Property (optional)</Label>
                <Select id="property_id" name="property_id" defaultValue="">
                  <option value="">No link</option>
                  {props.map((p) => <option key={p.id} value={p.id}>{p.nickname}</option>)}
                </Select>
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="full_name">Full name</Label>
                <Input id="full_name" name="full_name" required />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input id="company" name="company" />
              </div>
              <div>
                <Label htmlFor="trade">Trade or role</Label>
                <Input id="trade" name="trade" placeholder="e.g. Plumber, Electrician" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" type="tel" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={3} />
              </div>

              <div className="sm:col-span-2 flex justify-end gap-2">
                <Button type="submit" size="lg">Create contact</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
