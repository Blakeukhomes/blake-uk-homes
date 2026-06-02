import Link from 'next/link'
import { Building2, ShieldCheck, Banknote, AlertTriangle, ArrowRight, Receipt } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Stat } from '@/components/ui/stat'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StreetRow } from '@/components/house'
import { complianceState, courtReadinessScore, COMPLIANCE_META } from '@/lib/compliance'
import { arrearsTotal, formatGBP } from '@/lib/rent'
import type { ComplianceCertificate, Property, RentPayment } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: properties = [] } = await supabase
    .from('properties').select('*').order('nickname')
  const { data: certs = [] } = await supabase
    .from('compliance_certificates').select('*')
  const { data: payments = [] } = await supabase
    .from('rent_payments').select('*')
  const { data: faults = [] } = await supabase
    .from('fault_reports').select('id, current_state, severity, property_id')

  const props = (properties ?? []) as Property[]
  const allCerts = (certs ?? []) as ComplianceCertificate[]
  const allPayments = (payments ?? []) as RentPayment[]

  const totalArrears = arrearsTotal(allPayments)
  const tenanted = props.filter((p) => p.status === 'tenanted').length
  const vacant   = props.filter((p) => p.status === 'vacant').length
  const legal    = props.filter((p) => p.status === 'legal_proceedings').length

  const expiringSoon = allCerts.filter((c) => complianceState(c) === 'due_soon').length
  const expired      = allCerts.filter((c) => complianceState(c) === 'expired').length
  const openFaults   = (faults ?? []).filter((f: any) => !['resolved', 'closed'].includes(f.current_state)).length

  // Alert counts per property for the street view
  const alertsByProperty = new Map<string, number>()
  for (const c of allCerts) {
    const s = complianceState(c)
    if (s === 'expired' || s === 'due_soon') {
      alertsByProperty.set(c.property_id, (alertsByProperty.get(c.property_id) ?? 0) + 1)
    }
  }

  return (
    <>
      <PageHeader
        title="Portfolio overview"
        subtitle="A live snapshot of compliance, rent, and tenant activity across your properties."
        actions={
          <Link href="/properties/new">
            <Button>Add property</Button>
          </Link>
        }
      />

      <div className="p-6 space-y-6">
        {/* Street view */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your street</CardTitle>
                <CardDescription>Scroll to see every property. Traffic lights show what needs you.</CardDescription>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-xs text-ink-500">
                <Legend dot="bg-success-500" label="Tenanted, clear" />
                <Legend dot="bg-warning-500" label="Needs attention" />
                <Legend dot="bg-danger-500"  label="Legal" />
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-4">
            <StreetRow
              properties={props.map((p) => ({
                id: p.id,
                nickname: p.nickname,
                status: p.status,
                alertCount: alertsByProperty.get(p.id) ?? 0,
              }))}
              hrefBuilder={(id) => `/properties/${id}`}
              emptyState={
                <span>
                  No properties yet.{' '}
                  <Link href="/properties/new" className="font-medium underline">Add your first property</Link>
                </span>
              }
            />
          </CardBody>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Properties" value={props.length} icon={<Building2 className="h-4 w-4" />} />
          <Stat label="Tenanted" value={tenanted} hint={`${vacant} vacant · ${legal} legal`} />
          <Stat
            label="Compliance alerts"
            value={expiringSoon + expired}
            hint={`${expired} expired · ${expiringSoon} due soon`}
            tone={expired > 0 ? 'danger' : expiringSoon > 0 ? 'warning' : 'success'}
            icon={<ShieldCheck className="h-4 w-4" />}
          />
          <Stat
            label="Total arrears"
            value={formatGBP(totalArrears)}
            tone={totalArrears > 0 ? 'warning' : 'success'}
            icon={<Banknote className="h-4 w-4" />}
          />
        </div>

        {/* Property cards */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Properties</CardTitle>
                <CardDescription>Status, court-readiness, rent, and compliance per property.</CardDescription>
              </div>
              <Link href="/properties" className="text-sm font-medium text-ink-700 underline">
                See all
              </Link>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {props.length === 0 ? (
              <EmptyState />
            ) : (
              <ul className="divide-y hairline divide-ink-100">
                {props.map((p) => {
                  const pCerts = allCerts.filter((c) => c.property_id === p.id)
                  const score = courtReadinessScore(pCerts)
                  const pArrears = arrearsTotal(allPayments.filter((x) => x.property_id === p.id))
                  return (
                    <li key={p.id} className="flex items-center gap-4 px-6 py-4 hover:bg-ink-50/50">
                      <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-lg bg-ink-100 text-ink-700">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Link href={`/properties/${p.id}`} className="font-medium text-ink-900 hover:underline">
                            {p.nickname}
                          </Link>
                          <PropertyStatusBadge status={p.status} />
                        </div>
                        <p className="truncate text-sm text-ink-500">
                          {p.address_line_1}, {p.city} {p.postcode}
                        </p>
                      </div>
                      <div className="hidden md:flex flex-col items-end text-right">
                        <span className="text-xs uppercase tracking-wide text-ink-500">Court score</span>
                        <span className="font-semibold text-ink-900">{score}</span>
                      </div>
                      <div className="hidden md:flex flex-col items-end text-right">
                        <span className="text-xs uppercase tracking-wide text-ink-500">Arrears</span>
                        <span className={`font-semibold ${pArrears > 0 ? 'text-danger-700' : 'text-ink-900'}`}>
                          {formatGBP(pArrears)}
                        </span>
                      </div>
                      <Link href={`/properties/${p.id}`} className="text-ink-400 hover:text-ink-900">
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Alerts row */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Compliance alerts</CardTitle>
              <CardDescription>Items in the warning window or already expired.</CardDescription>
            </CardHeader>
            <CardBody className="p-0">
              {allCerts.filter((c) => complianceState(c) !== 'valid').length === 0 ? (
                <p className="px-6 py-6 text-sm text-ink-500">Nothing to action right now.</p>
              ) : (
                <ul className="divide-y hairline divide-ink-100">
                  {allCerts
                    .filter((c) => complianceState(c) !== 'valid')
                    .map((c) => {
                      const meta = COMPLIANCE_META[c.type]
                      const state = complianceState(c)
                      const prop = props.find((p) => p.id === c.property_id)
                      return (
                        <li key={c.id} className="flex items-center gap-3 px-6 py-3">
                          <AlertTriangle className={`h-4 w-4 ${state === 'expired' ? 'text-danger-500' : 'text-warning-500'}`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-ink-900">{meta.shortLabel}</p>
                            <p className="truncate text-xs text-ink-500">
                              {prop?.nickname} · expires {new Date(c.expires_on).toLocaleDateString('en-GB')}
                            </p>
                          </div>
                          <Badge tone={state === 'expired' ? 'danger' : 'warning'}>
                            {state === 'expired' ? 'Expired' : 'Due soon'}
                          </Badge>
                        </li>
                      )
                    })}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Open faults</CardTitle>
              <CardDescription>Reports awaiting action.</CardDescription>
            </CardHeader>
            <CardBody>
              <p className="text-3xl font-semibold text-ink-900">{openFaults}</p>
              <p className="mt-1 text-sm text-ink-500">across all properties</p>
              <Link href="/faults" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-ink-900 underline">
                Open faults <ArrowRight className="h-4 w-4" />
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>MTD quarter</CardTitle>
              <CardDescription>Current UK tax quarter.</CardDescription>
            </CardHeader>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-500 text-white">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-900">Tax summary</p>
                  <p className="text-xs text-ink-500">Per-property quarterly view</p>
                </div>
              </div>
              <Link href="/mtd" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-ink-900 underline">
                Open MTD <ArrowRight className="h-4 w-4" />
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}

function PropertyStatusBadge({ status }: { status: Property['status'] }) {
  if (status === 'tenanted')         return <Badge tone="success">Tenanted</Badge>
  if (status === 'legal_proceedings') return <Badge tone="danger">Legal proceedings</Badge>
  return <Badge tone="neutral">Vacant</Badge>
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  )
}

function EmptyState() {
  return (
    <div className="px-6 py-12 text-center">
      <Building2 className="mx-auto h-10 w-10 text-ink-300" />
      <h3 className="mt-4 text-sm font-semibold text-ink-900">No properties yet</h3>
      <p className="mt-1 text-sm text-ink-500">Add your first property to begin tracking compliance and rent.</p>
      <Link href="/properties/new" className="mt-4 inline-block">
        <Button>Add property</Button>
      </Link>
    </div>
  )
}
