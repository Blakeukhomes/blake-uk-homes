import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Wrench, FolderOpen, CalendarDays } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/server'
import { Logo } from '@/components/logo'
import { HeroHouse } from '@/components/house'
import { JOURNEY_STEPS, JourneyTrack } from '@/components/journey-track'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function TenantPortalHome({ params }: { params: { token: string } }) {
  const sb = createServiceClient()
  const { data: tenant } = await sb.from('tenants')
    .select('id, full_name, portal_token, property_id, properties(nickname, address_line_1, city, postcode)')
    .eq('portal_token', params.token).maybeSingle()

  if (!tenant) notFound()

  const { data: faults = [] } = await sb.from('fault_reports')
    .select('id, reference, description, category, current_state')
    .eq('tenant_id', tenant.id).order('reported_at', { ascending: false }).limit(3)

  const { data: bookings = [] } = await sb.from('contractor_bookings')
    .select('id, contractor_name, trade, scheduled_for')
    .eq('property_id', tenant.property_id).gte('scheduled_for', new Date().toISOString())
    .order('scheduled_for').limit(2)

  const { data: docs = [] } = await sb.from('documents')
    .select('id, kind, title, created_at, visible_to_tenant')
    .eq('property_id', tenant.property_id).eq('visible_to_tenant', true).limit(10)

  const { data: journey = [] } = await sb.from('tenancy_journey')
    .select('step, completed_on, landlord_sign, tenant_sign')
    .eq('property_id', tenant.property_id).eq('tenant_id', tenant.id)

  const t = tenant as any
  const activeRepair = (faults as any[]).find((f) => !['resolved', 'closed'].includes(f.current_state))
  const nextBooking = (bookings as any[])[0]
  const firstName = (t.full_name ?? '').split(' ')[0]

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="bg-ink-900 text-white">
        <div className="mx-auto max-w-2xl px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <Logo />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">Tenant portal</span>
          </div>
          <p className="mt-6 text-lg font-semibold">Hello, {firstName}</p>
          <p className="text-xs text-ink-400">
            {t.properties?.address_line_1}, {t.properties?.city}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 pb-20">
        {/* House illustration */}
        <div className="-mt-2 flex justify-center pt-6">
          <HeroHouse className="h-44 w-44" />
        </div>

        {/* Active repair banner */}
        {activeRepair && (
          <div className="mt-4 rounded-xl border border-warning-500/30 bg-warning-50 p-4">
            <p className="text-xs font-bold text-warning-700">Active repair</p>
            <p className="mt-1 text-sm font-semibold text-ink-900">
              {activeRepair.category}, {activeRepair.description.slice(0, 60)}{activeRepair.description.length > 60 ? '...' : ''}
            </p>
            {nextBooking && (
              <p className="mt-2 text-xs text-warning-700">
                <CalendarDays className="inline h-3.5 w-3.5 mr-1" />
                {nextBooking.contractor_name}, {new Date(nextBooking.scheduled_for).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            )}
            <Link href={`/portal/${params.token}/report`} className="mt-3 inline-block text-xs font-bold text-accent-600">
              View details and updates
            </Link>
          </div>
        )}

        {/* Action cards */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link href={`/portal/${params.token}/documents`} className="rounded-xl border-2 border-ink-200 bg-white p-5 text-center transition-colors hover:border-accent-500">
            <FolderOpen className="mx-auto h-7 w-7 text-accent-500" />
            <p className="mt-2 text-sm font-bold text-ink-900">My documents</p>
            <p className="text-xs text-ink-500">{docs.length} document{docs.length !== 1 ? 's' : ''}</p>
          </Link>
          <Link href={`/portal/${params.token}/report`} className="rounded-xl border-2 border-ink-200 bg-white p-5 text-center transition-colors hover:border-accent-500">
            <Wrench className="mx-auto h-7 w-7 text-accent-500" />
            <p className="mt-2 text-sm font-bold text-ink-900">Report fault</p>
            <p className="text-xs text-ink-500">
              {activeRepair ? '1 active' : 'New report'}
            </p>
          </Link>
        </div>

        <div className="mt-4 rounded-xl border border-accent-200 bg-accent-50 p-4 text-center text-xs text-accent-700">
          Need help? Report faults through the app. Everything is recorded and timestamped.
        </div>

        {/* Tenancy journey */}
        <div className="mt-8 rounded-xl bg-white p-6 ring-1 ring-ink-100 shadow-card">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-500">Your tenancy journey</p>
          <p className="text-xs text-ink-500">You and your landlord see the same view.</p>
          <div className="mt-4">
            <JourneyTrack steps={JOURNEY_STEPS.map((s) => {
              const row = (journey as any[]).find((j) => j.step === s.id)
              return { ...s, done: !!row?.completed_on, signedByLandlord: !!row?.landlord_sign, signedByTenant: !!row?.tenant_sign }
            })} />
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-ink-400">
          All actions in this portal are timestamped.
        </p>
      </main>
    </div>
  )
}
