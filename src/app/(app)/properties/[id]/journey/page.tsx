import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { JOURNEY_STEPS, JourneyTrack } from '@/components/journey-track'
import { Button } from '@/components/ui/button'
import type { JourneyStep, Tenant } from '@/lib/types'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function PropertyJourneyPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: property } = await supabase.from('properties').select('id, nickname').eq('id', params.id).single()
  const { data: tenants = [] } = await supabase.from('tenants').select('*').eq('property_id', params.id).eq('is_active', true)
  const tenant = (tenants as Tenant[])[0]

  const { data: journey = [] } = await supabase
    .from('tenancy_journey').select('*').eq('property_id', params.id).eq('tenant_id', tenant?.id ?? '')

  async function markStep(formData: FormData) {
    'use server'
    if (!tenant) return
    const supabase = createClient()
    const step = String(formData.get('step')) as JourneyStep
    const which = String(formData.get('which')) // 'landlord' | 'complete'

    const existing = (journey as any[]).find((j) => j.step === step)
    if (existing) {
      const update: any = {}
      if (which === 'complete') update.completed_on = new Date().toISOString()
      if (which === 'landlord') update.landlord_sign = true
      await supabase.from('tenancy_journey').update(update).eq('id', existing.id)
    } else {
      await supabase.from('tenancy_journey').insert({
        property_id: params.id,
        tenant_id: tenant.id,
        step,
        completed_on: which === 'complete' ? new Date().toISOString() : null,
        landlord_sign: which === 'landlord',
      })
    }
    revalidatePath(`/properties/${params.id}/journey`)
  }

  return (
    <>
      <PageHeader title={`${property?.nickname}, Tenancy journey`} subtitle="Both you and your tenant see this same view." />
      <div className="p-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Progress</CardTitle>
            <CardDescription>Tick steps as you complete them. Tenant sees the same track in their portal.</CardDescription>
          </CardHeader>
          <CardBody>
            {tenant ? (
              <JourneyTrack steps={JOURNEY_STEPS.map((s) => {
                const row = (journey as any[]).find((j) => j.step === s.id)
                return { ...s, done: !!row?.completed_on, signedByLandlord: !!row?.landlord_sign, signedByTenant: !!row?.tenant_sign }
              })} />
            ) : (
              <p className="text-sm text-ink-500">Add an active tenant first.</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Update step</CardTitle></CardHeader>
          <CardBody>
            {tenant ? (
              <form action={markStep} className="space-y-3">
                <label className="block text-sm font-medium text-ink-800">Step</label>
                <select name="step" className="block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-ink-200">
                  {JOURNEY_STEPS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <div className="flex gap-2">
                  <Button type="submit" name="which" value="landlord" variant="secondary" size="sm">Sign as landlord</Button>
                  <Button type="submit" name="which" value="complete" size="sm">Mark complete</Button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-ink-500">No tenant.</p>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  )
}
