import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { TenantPortal } from '@/components/tenant-portal'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function TenantPortalRoute({ params }: { params: { token: string } }) {
  const sb = createServiceClient()
  const { data: tenant } = await sb.from('tenants')
    .select('id, full_name, portal_token, property_id, properties(nickname, address_line_1, city, postcode)')
    .eq('portal_token', params.token).maybeSingle()
  if (!tenant) notFound()
  const t = tenant as any

  const [{ data: docs = [] }, { data: faults = [] }, { data: bookings = [] }] = await Promise.all([
    sb.from('documents')
      .select('id, kind, title, created_at, visible_to_tenant')
      .eq('property_id', t.property_id)
      .eq('visible_to_tenant', true)
      .order('created_at', { ascending: false }),
    sb.from('fault_reports')
      .select('id, reference, category, description, current_state, reported_at')
      .eq('tenant_id', t.id)
      .order('reported_at', { ascending: false }),
    sb.from('contractor_bookings')
      .select('contractor_name, scheduled_for')
      .eq('property_id', t.property_id)
      .gte('scheduled_for', new Date().toISOString())
      .order('scheduled_for')
      .limit(1),
  ])

  const activeFaultRaw = (faults as any[]).find((f) => !['resolved', 'closed'].includes(f.current_state))
  const nextBooking = (bookings as any[])[0]
  const activeFault = activeFaultRaw
    ? {
        category: activeFaultRaw.category,
        description: activeFaultRaw.description,
        status: activeFaultRaw.current_state,
        scheduled: nextBooking
          ? {
              contractor: nextBooking.contractor_name,
              when: new Date(nextBooking.scheduled_for).toLocaleString('en-GB', { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' }),
            }
          : null,
        reported_at: activeFaultRaw.reported_at,
      }
    : null

  const firstName = (t.full_name ?? '').split(' ')[0] || 'there'
  const streetName = t.properties?.nickname ?? ''
  const fullAddress = `${t.properties?.address_line_1 ?? ''}, ${t.properties?.city ?? ''}`

  return (
    <TenantPortal
      firstName={firstName}
      streetName={streetName}
      fullAddress={fullAddress}
      documents={(docs ?? []) as any}
      activeFault={activeFault}
    />
  )
}
