import Link from 'next/link'
import { Building, Building2, Plus, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody } from '@/components/ui/card'
import { Stat } from '@/components/ui/stat'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TicketTabs } from '@/components/ticket-tabs'
import { DeleteRowButton } from '@/components/delete-row-button'
import { complianceState } from '@/lib/compliance'
import { arrearsTotal, formatGBP } from '@/lib/rent'
import { differenceInCalendarDays, parseISO, format, startOfMonth } from 'date-fns'
import type { ComplianceCertificate, Property, RentPayment } from '@/lib/types'

export const dynamic = 'force-dynamic'

const TABS = [
  { value: 'all',          label: 'All' },
  { value: 'paid',         label: 'Paid' },
  { value: 'overdue',      label: 'Rent overdue' },
  { value: 'due_soon',     label: 'Rent due soon' },
  { value: 'vacant',       label: 'Vacant' },
  { value: 'multi_unit',   label: 'Multi-unit' },
  { value: 'archived',     label: 'Archived' },
]

export default async function PropertiesPage({ searchParams }: { searchParams: { status?: string; q?: string } }) {
  const supabase = createClient()
  const { data: properties = [] } = await supabase.from('properties').select('*').order('nickname')
  const { data: payments = [] } = await supabase.from('rent_payments').select('*')
  const { data: tenants = [] } = await supabase.from('tenants').select('id, property_id, tenancy_start').eq('is_active', true)

  const props = (properties ?? []) as (Property & { listing_type?: string })[]
  const allPayments = (payments ?? []) as RentPayment[]

  const today = new Date()
  // Map property_id -> earliest active tenancy_start (so we can ignore pre-tenancy seeded rows)
  const tenancyStartByProp = new Map<string, string>()
  for (const t of ((tenants ?? []) as any[])) {
    if (!t.tenancy_start) continue
    const cur = tenancyStartByProp.get(t.property_id)
    if (!cur || t.tenancy_start < cur) tenancyStartByProp.set(t.property_id, t.tenancy_start)
  }

  function nextPayment(propId: string): RentPayment | null {
    const tenancyStart = tenancyStartByProp.get(propId)
    const future = allPayments
      .filter((p) => p.property_id === propId && p.status !== 'paid')
      // Ignore rows before the tenancy actually started
      .filter((p) => !tenancyStart || p.period_start >= tenancyStart)
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
    return future[0] ?? null
  }

  const thisMonthStart = format(startOfMonth(today), 'yyyy-MM-dd')
  function thisMonthStatus(propId: string): { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' } | null {
    const p = allPayments.find((x) => x.property_id === propId && x.period_start === thisMonthStart)
    if (!p) return null
    if (p.status === 'paid') return { label: 'Paid', tone: 'success' }
    if (p.status === 'partial') return { label: 'Pending', tone: 'warning' }
    if (p.status === 'late') return { label: 'Late', tone: 'warning' }
    return { label: 'Missing', tone: 'danger' }
  }

  function categoryFor(p: Property): 'paid' | 'overdue' | 'due_soon' | 'vacant' | 'multi_unit' {
    if (p.status === 'vacant') return 'vacant'
    const np = nextPayment(p.id)
    if (!np) return 'paid'
    const days = differenceInCalendarDays(parseISO(np.due_date), today)
    if (days < 0) return 'overdue'
    if (days <= 7) return 'due_soon'
    return 'paid'
  }

  // KPIs
  const portfolio = props.length
  const multiUnit = props.filter((p) => p.listing_type === 'multi_unit_hmo').length
  const tenantCount = (tenants ?? []).length
  const rentAttention = props.filter((p) => {
    const c = categoryFor(p)
    return c === 'overdue' || c === 'due_soon'
  }).length

  const statusFilter = searchParams.status ?? 'all'
  const query = (searchParams.q ?? '').toLowerCase()

  let rows = props
  if (statusFilter === 'multi_unit') rows = rows.filter((p) => p.listing_type === 'multi_unit_hmo')
  else if (statusFilter === 'vacant') rows = rows.filter((p) => p.status === 'vacant')
  else if (statusFilter === 'paid' || statusFilter === 'overdue' || statusFilter === 'due_soon') {
    rows = rows.filter((p) => categoryFor(p) === statusFilter)
  }
  if (query) rows = rows.filter((p) =>
    p.nickname.toLowerCase().includes(query) ||
    p.city.toLowerCase().includes(query) ||
    p.postcode.toLowerCase().includes(query)
  )

  return (
    <>
      <PageHeader
        title="Properties"
        subtitle="Manage every property, lease, and rent flow from one place."
        actions={<Link href="/properties/new"><Button><Plus className="h-4 w-4" />Add property</Button></Link>}
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Stat label="Portfolio" value={portfolio} hint={`${multiUnit} multi-unit`} icon={<Building2 className="h-4 w-4" />} />
          <Stat label="Tenants" value={tenantCount} hint="Active renters" />
          <Stat label="Rent attention" value={rentAttention} hint="Overdue or due soon" tone={rentAttention > 0 ? 'warning' : 'success'} icon={<AlertCircle className="h-4 w-4" />} />
        </div>

        <Card>
          <CardBody>
            <TicketTabs tabs={TABS} selected={statusFilter} q={query} />
          </CardBody>
        </Card>

        {rows.length === 0 ? (
          <Card>
            <CardBody className="py-16 text-center">
              <Building className="mx-auto h-10 w-10 text-ink-300" />
              <p className="mt-3 text-sm text-ink-600">No properties match the filter.</p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((p) => {
              const cat = categoryFor(p)
              const arrears = arrearsTotal(allPayments.filter((x) => x.property_id === p.id))
              const np = nextPayment(p.id)
              return (
                <div key={p.id} className="relative">
                  <div className="absolute right-2 top-2 z-10">
                    <DeleteRowButton entity="properties" id={p.id} label={p.nickname} hint="All tenants, rent payments, compliance certs and documents linked to this property will also be removed." />
                  </div>
                  <Link href={`/properties/${p.id}`}>
                  <Card className="h-full transition-shadow hover:shadow-elevated">
                    {p.hero_image_url ? (
                      <img src={p.hero_image_url} alt="" className="h-32 w-full object-cover" />
                    ) : (
                      <div className="h-2 bg-ink-200" />
                    )}
                    <CardBody>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-ink-900">{p.nickname}</h3>
                          <p className="truncate text-xs uppercase tracking-wider text-ink-500">{p.city} · {p.postcode}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {p.listing_type === 'multi_unit_hmo' && <Badge tone="accent">Multi-unit</Badge>}
                          {(() => {
                            const tms = thisMonthStatus(p.id)
                            return tms && p.status === 'tenanted'
                              ? <Badge tone={tms.tone}>{tms.label} this month</Badge>
                              : null
                          })()}
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Total payment due</p>
                          <p className="text-lg font-bold text-ink-900">
                            {p.monthly_rent ? `${formatGBP(p.monthly_rent)} /mo` : '£0.00 /mo'}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="font-bold uppercase tracking-wider text-ink-500">Next due</p>
                            <p className="text-ink-700">{np ? new Date(np.due_date).toLocaleDateString('en-GB') : '-'}</p>
                          </div>
                          <div>
                            <p className="font-bold uppercase tracking-wider text-ink-500">Status</p>
                            {cat === 'overdue' && <Badge tone="danger">Rent overdue</Badge>}
                            {cat === 'due_soon' && <Badge tone="warning">Due soon</Badge>}
                            {cat === 'paid' && p.status === 'tenanted' && <Badge tone="success">All paid</Badge>}
                            {cat === 'vacant' && <Badge tone="neutral">Vacant</Badge>}
                          </div>
                        </div>
                        {arrears > 0 && <p className="text-xs text-danger-700">Arrears {formatGBP(arrears)}</p>}
                      </div>
                    </CardBody>
                  </Card>
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
