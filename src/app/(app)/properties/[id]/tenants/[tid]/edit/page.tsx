import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import type { Tenant } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function EditTenantPage({ params }: { params: { id: string; tid: string } }) {
  const supabase = createClient()
  const { data: tenant } = await supabase.from('tenants').select('*').eq('id', params.tid).maybeSingle()
  if (!tenant) notFound()
  const t = tenant as Tenant

  async function update(formData: FormData) {
    'use server'
    const supabase = createClient()
    await supabase.from('tenants').update({
      full_name: String(formData.get('full_name')),
      email: (formData.get('email') as string) || null,
      phone: (formData.get('phone') as string) || null,
      tenancy_start: (formData.get('tenancy_start') as string) || null,
      tenancy_end: (formData.get('tenancy_end') as string) || null,
      deposit_amount: Number(formData.get('deposit_amount') || 0) || null,
      deposit_scheme: (formData.get('deposit_scheme') as string) || null,
      is_active: formData.get('is_active') === 'on',
    }).eq('id', params.tid)
    revalidatePath(`/properties/${params.id}`)
    revalidatePath('/tenants')
    redirect(`/properties/${params.id}`)
  }

  async function remove() {
    'use server'
    const supabase = createClient()
    await supabase.from('tenants').delete().eq('id', params.tid)
    revalidatePath(`/properties/${params.id}`)
    revalidatePath('/tenants')
    redirect(`/properties/${params.id}`)
  }

  return (
    <>
      <PageHeader
        title={`Edit tenant: ${t.full_name}`}
        actions={<Link href={`/properties/${params.id}`}><Button variant="ghost"><ArrowLeft className="h-4 w-4" />Back</Button></Link>}
      />
      <div className="p-6">
        <Card className="max-w-2xl">
          <CardBody>
            <form action={update} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="full_name">Full name</Label>
                <Input id="full_name" name="full_name" required defaultValue={t.full_name} />
              </div>
              <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" defaultValue={t.email ?? ''} /></div>
              <div><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" type="tel" defaultValue={t.phone ?? ''} /></div>
              <div><Label htmlFor="tenancy_start">Tenancy start</Label><Input id="tenancy_start" name="tenancy_start" type="date" defaultValue={t.tenancy_start ?? ''} /></div>
              <div><Label htmlFor="tenancy_end">Tenancy end</Label><Input id="tenancy_end" name="tenancy_end" type="date" defaultValue={t.tenancy_end ?? ''} /></div>
              <div><Label htmlFor="deposit_amount">Deposit (£)</Label><Input id="deposit_amount" name="deposit_amount" type="number" step="0.01" defaultValue={t.deposit_amount ?? ''} /></div>
              <div><Label htmlFor="deposit_scheme">Deposit scheme</Label><Input id="deposit_scheme" name="deposit_scheme" defaultValue={t.deposit_scheme ?? ''} /></div>
              <label className="sm:col-span-2 inline-flex items-center gap-2 text-sm">
                <input type="checkbox" name="is_active" defaultChecked={t.is_active} className="rounded border-ink-300" />
                Active tenancy
              </label>

              <div className="sm:col-span-2 flex justify-between gap-2 pt-2">
                <Button type="submit" formAction={remove} variant="danger" size="sm">Delete tenant</Button>
                <div className="flex gap-2">
                  <Link href={`/properties/${params.id}`}><Button variant="secondary" type="button">Cancel</Button></Link>
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
