import { createClient } from '@/lib/supabase/server'
import { StreetViewDashboard, type StreetProperty } from '@/components/street-view-dashboard'
import { COMPLIANCE_META, complianceState } from '@/lib/compliance'
import type { ComplianceCertificate, Property, Tenant } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: properties = [] } = await supabase.from('properties').select('*').order('nickname')
  const { data: certs = [] } = await supabase.from('compliance_certificates').select('*')
  const { data: tenants = [] } = await supabase.from('tenants').select('*').eq('is_active', true)
  const { data: faults = [] } = await supabase
    .from('fault_reports')
    .select('id, property_id, category, severity, description, reference, current_state, reported_at')
    .not('current_state', 'in', '(resolved,closed)')
    .order('reported_at', { ascending: false })
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user ? await supabase.from('profiles').select('full_name, email').eq('id', user.id).maybeSingle() : { data: null }

  const props = (properties ?? []) as Property[]
  const allCerts = (certs ?? []) as ComplianceCertificate[]
  const tens = (tenants ?? []) as Tenant[]

  // Build the StreetProperty array for the client component
  const streetProperties: StreetProperty[] = props.map((p) => {
    const pCerts = allCerts.filter((c) => c.property_id === p.id)
    const alerts: string[] = []

    // Compliance alerts
    for (const t of ['gas_safety', 'eicr', 'epc', 'buildings_insurance', 'legionella', 'ico_registration'] as const) {
      const latest = pCerts.filter((c) => c.type === t).sort((a, b) => (a.expires_on > b.expires_on ? -1 : 1))[0]
      const state = complianceState(latest)
      if (state === 'missing') alerts.push(`${COMPLIANCE_META[t].shortLabel} missing`)
      else if (state === 'expired') alerts.push(`${COMPLIANCE_META[t].shortLabel} expired`)
      else if (state === 'due_soon') {
        const days = Math.max(1, Math.round((new Date(latest!.expires_on).getTime() - Date.now()) / 86_400_000))
        alerts.push(`${COMPLIANCE_META[t].shortLabel} due in ${days} days`)
      }
    }

    // Legal hearing alert
    if (p.status === 'legal_proceedings') alerts.push('Legal hearing scheduled')

    // Open fault alerts (tenant-reported)
    const pFaults = (faults as any[]).filter((f) => f.property_id === p.id)
    for (const f of pFaults) {
      const tag = f.severity === 'emergency' ? 'EMERGENCY' : f.severity === 'urgent' ? 'URGENT' : ''
      const summary = (f.description || '').slice(0, 40)
      alerts.push(`${tag ? tag + ' ' : ''}Fault: ${f.category}${summary ? ' - ' + summary : ''}`)
    }

    const tenant = tens.find((t) => t.property_id === p.id)
    const tenant_label = p.status === 'tenanted'
      ? (tenant?.full_name ?? 'Tenant')
      : p.status === 'legal_proceedings' ? 'Legal proceedings' : 'Vacant'

    return {
      id: p.id,
      short_name: p.nickname,
      full_address: `${p.address_line_1}, ${p.city} ${p.postcode}`,
      status: p.status,
      monthly_rent: Number(p.monthly_rent ?? 0),
      tenant_label,
      alerts,
      ownership: (p.notes ?? '').toLowerCase().includes('limited company') || (p.notes ?? '').toLowerCase().includes('company')
        ? 'Company' : 'Personal',
    }
  })

  const fullName = profile?.full_name ?? user?.email ?? 'You'
  const initials = (fullName ?? 'YOU').split(/\s+/).map((s: string) => s[0]).join('').slice(0, 2).toUpperCase()

  return <StreetViewDashboard user={{ initials }} properties={streetProperties} />
}
