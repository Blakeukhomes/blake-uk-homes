import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'

export default function NewTenantPage({ params }: { params: { id: string } }) {
  async function addTenant(formData: FormData) {
    'use server'
    const supabase = createClient()
    const { error } = await supabase.from('tenants').insert({
      property_id: params.id,
      full_name: String(formData.get('full_name')),
      email: (formData.get('email') as string) || null,
      phone: (formData.get('phone') as string) || null,
      tenancy_start: (formData.get('tenancy_start') as string) || null,
      tenancy_end: (formData.get('tenancy_end') as string) || null,
      deposit_amount: Number(formData.get('deposit_amount') || 0) || null,
      deposit_scheme: (formData.get('deposit_scheme') as string) || null,
    })
    if (error) throw new Error(error.message)
    // Property status -> tenanted
    await supabase.from('properties').update({ status: 'tenanted' }).eq('id', params.id)
    revalidatePath(`/properties/${params.id}`)
    revalidatePath('/tenants')
    revalidatePath('/dashboard')
    redirect(`/properties/${params.id}`)
  }

  return (
    <>
      <PageHeader title="Add tenant" subtitle="Generates a unique portal link." />
      <div className="p-6">
        <Card className="max-w-2xl">
          <CardBody>
            <form action={addTenant} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label htmlFor="full_name">Full name</Label><Input id="full_name" name="full_name" required /></div>
              <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" /></div>
              <div><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" type="tel" /></div>
              <div><Label htmlFor="tenancy_start">Tenancy start</Label><Input id="tenancy_start" name="tenancy_start" type="date" /></div>
              <div><Label htmlFor="tenancy_end">Tenancy end</Label><Input id="tenancy_end" name="tenancy_end" type="date" /></div>
              <div><Label htmlFor="deposit_amount">Deposit (£)</Label><Input id="deposit_amount" name="deposit_amount" type="number" step="0.01" /></div>
              <div><Label htmlFor="deposit_scheme">Deposit scheme</Label><Input id="deposit_scheme" name="deposit_scheme" placeholder="DPS / mydeposits / TDS" /></div>
              <div className="sm:col-span-2 flex justify-end"><Button type="submit">Add tenant</Button></div>
            </form>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
