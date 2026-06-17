import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Stat } from '@/components/ui/stat'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { COMPLIANCE_META, complianceState, courtReadinessScore, daysUntilExpiry } from '@/lib/compliance'
import { arrearsTotal, formatGBP } from '@/lib/rent'
import type { ComplianceCertificate, Property, RentPayment, Tenant } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PropertyPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: property } = await supabase.from('properties').select('*').eq('id', params.id).single()
  if (!property) notFound()
  const p = property as Property

  const [{ data: certs = [] }, { data: payments = [] }, { data: tenants = [] }, { data: docs = [] }] =
    await Promise.all([
      supabase.from('compliance_certificates').select('*').eq('property_id', p.id),
      supabase.from('rent_payments').select('*').eq('property_id', p.id).order('period_start', { ascending: false }).limit(6),
      supabase.from('tenants').select('*').eq('property_id', p.id).eq('is_active', true),
      supabase.from('documents').select('id, kind, title, created_at').eq('property_id', p.id).limit(5),
    ])

  const score   = courtReadinessScore((certs ?? []) as ComplianceCertificate[], (p as any).is_all_electric ?? false)
  const arrears = arrearsTotal((payments ?? []) as RentPayment[])
  const tenant  = (tenants as Tenant[])[0]

  return (
    <>
      <PageHeader
        title={p.nickname}
        subtitle={`${p.address_line_1}, ${p.city} ${p.postcode}`}
        actions={
          <>
            <Link href={`/properties/${p.id}/edit`}><Button variant="secondary">Edit</Button></Link>
            <Link href={`/properties/${p.id}/mortgage`}><Button variant="secondary">Mortgage</Button></Link>
            <Link href={`/properties/${p.id}/rent`}><Button variant="secondary">Rent ledger</Button></Link>
            <Link href={`/properties/${p.id}/compliance`}><Button variant="secondary">Compliance</Button></Link>
            <Link href={`/properties/${p.id}/faults`}><Button variant="secondary">Faults</Button></Link>
            <Link href={`/properties/${p.id}/documents`}><Button variant="secondary">Documents</Button></Link>
          </>
        }
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Status" value={
            p.status === 'tenanted' ? 'Tenanted' :
            p.status === 'legal_proceedings' ? 'Legal' : 'Vacant'
          } />
          <Stat label="Court-readiness" value={`${score}/100`} tone={score >= 80 ? 'success' : score >= 50 ? 'warning' : 'danger'} />
          <Stat label="Monthly rent" value={formatGBP(p.monthly_rent ?? 0)} />
          <Stat label="Arrears" value={formatGBP(arrears)} tone={arrears > 0 ? 'warning' : 'success'} />
        </div>

        {/* Required compliance */}
        <Card>
          <CardHeader>
            <CardTitle>Required compliance</CardTitle>
            <CardDescription>Legally required to keep this property lettable. These drive the court-readiness score.</CardDescription>
          </CardHeader>
          <CardBody className="grid gap-4 md:grid-cols-3">
            {((p as any).is_all_electric
              ? (['eicr', 'epc'] as const)
              : (['gas_safety', 'eicr', 'epc'] as const)
            ).map((t) => {
              const cert = (certs as ComplianceCertificate[])
                .filter((c) => c.type === t)
                .sort((a, b) => (a.expires_on > b.expires_on ? -1 : 1))[0]
              const state = complianceState(cert)
              return (
                <div key={t} className="rounded-xl border hairline border-ink-100 p-4">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium text-ink-900">{COMPLIANCE_META[t].shortLabel}</p>
                    <ComplianceBadge state={state} />
                  </div>
                  {cert ? (
                    <p className="mt-2 text-xs text-ink-500">
                      Expires {new Date(cert.expires_on).toLocaleDateString('en-GB')} ({daysUntilExpiry(cert)} days)
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-ink-500">No certificate on file.</p>
                  )}
                </div>
              )
            })}
          </CardBody>
        </Card>

        {/* To-do / recommended compliance */}
        <Card>
          <CardHeader>
            <CardTitle>To-do</CardTitle>
            <CardDescription>Recommended — best practice but not legally required to let. Tick off when you've got them.</CardDescription>
          </CardHeader>
          <CardBody className="grid gap-4 md:grid-cols-3">
            {(['buildings_insurance', 'legionella', 'ico_registration'] as const).map((t) => {
              const cert = (certs as ComplianceCertificate[])
                .filter((c) => c.type === t)
                .sort((a, b) => (a.expires_on > b.expires_on ? -1 : 1))[0]
              const state = complianceState(cert)
              return (
                <div key={t} className="rounded-xl border hairline border-ink-100 p-4">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium text-ink-900">{COMPLIANCE_META[t].shortLabel}</p>
                    {state === 'missing'
                      ? <Badge tone="neutral">To do</Badge>
                      : <ComplianceBadge state={state} />}
                  </div>
                  {cert ? (
                    <p className="mt-2 text-xs text-ink-500">
                      Expires {new Date(cert.expires_on).toLocaleDateString('en-GB')} ({daysUntilExpiry(cert)} days)
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-ink-500">Not set up yet. Add when ready.</p>
                  )}
                </div>
              )
            })}
          </CardBody>
        </Card>

        {/* Tenant + recent docs */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Tenant</CardTitle>
              <CardDescription>Active tenancy and portal link.</CardDescription>
            </CardHeader>
            <CardBody>
              {tenant ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-ink-900">{tenant.full_name}</p>
                      <p className="text-sm text-ink-500">{tenant.email ?? '-'} · {tenant.phone ?? '-'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/properties/${p.id}/tenants/${tenant.id}/edit`} className="text-xs font-semibold text-accent-700 underline">Edit</Link>
                      <Badge tone="success">Active</Badge>
                    </div>
                  </div>
                  <div className="rounded-lg bg-ink-50 p-3 text-xs">
                    <p className="font-medium text-ink-700">Tenant portal link</p>
                    <code className="break-all text-ink-600">/portal/{tenant.portal_token}</code>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-ink-500">No active tenant, <Link className="underline" href={`/properties/${p.id}/tenants/new`}>add one</Link>.</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent documents</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2">
              {(docs ?? []).length === 0 && <p className="text-sm text-ink-500">Nothing uploaded yet.</p>}
              {(docs as any[]).map((d) => (
                <div key={d.id} className="flex items-center justify-between text-sm">
                  <span className="text-ink-700">{d.title}</span>
                  <span className="text-xs text-ink-400">{new Date(d.created_at).toLocaleDateString('en-GB')}</span>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}

function ComplianceBadge({ state }: { state: 'valid'|'due_soon'|'expired'|'missing' }) {
  if (state === 'valid') return <Badge tone="success">Valid</Badge>
  if (state === 'due_soon') return <Badge tone="warning">Due soon</Badge>
  if (state === 'expired') return <Badge tone="danger">Expired</Badge>
  return <Badge tone="neutral">Missing</Badge>
}
