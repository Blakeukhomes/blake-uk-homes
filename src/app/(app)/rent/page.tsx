import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { arrearsTotal, formatGBP } from '@/lib/rent'
import type { Property, RentPayment } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function RentPage() {
  const supabase = createClient()
  const { data: properties = [] } = await supabase.from('properties').select('*').order('nickname')
  const { data: payments = [] } = await supabase.from('rent_payments').select('*').order('period_start', { ascending: false })

  return (
    <>
      <PageHeader title="Rent" subtitle="Arrears and recent payments across your portfolio." />
      <div className="p-6 space-y-6">
        {(properties as Property[]).map((p) => {
          const pPayments = (payments as RentPayment[]).filter((x) => x.property_id === p.id).slice(0, 6)
          const arrears = arrearsTotal(pPayments)
          return (
            <Card key={p.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      <Link href={`/properties/${p.id}/rent`} className="hover:underline">{p.nickname}</Link>
                    </CardTitle>
                    <CardDescription>{formatGBP(p.monthly_rent ?? 0)} / month · due day {p.rent_due_day}</CardDescription>
                  </div>
                  <Badge tone={arrears > 0 ? 'warning' : 'success'}>{arrears > 0 ? `Arrears ${formatGBP(arrears)}` : 'Up to date'}</Badge>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                {pPayments.length === 0 ? (
                  <p className="px-6 py-6 text-sm text-ink-500">No rent periods recorded yet.</p>
                ) : (
                  <ul className="divide-y hairline divide-ink-100">
                    {pPayments.map((pay) => (
                      <li key={pay.id} className="flex items-center justify-between gap-4 px-6 py-3 text-sm">
                        <span className="font-medium text-ink-900">{new Date(pay.period_start).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
                        <span className="text-ink-500">Due {new Date(pay.due_date).toLocaleDateString('en-GB')}</span>
                        <span className="text-ink-700">{formatGBP(pay.amount_paid)} / {formatGBP(pay.amount_due)}</span>
                        <RentStatusBadge status={pay.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          )
        })}
      </div>
    </>
  )
}

function RentStatusBadge({ status }: { status: RentPayment['status'] }) {
  if (status === 'paid')    return <Badge tone="success">Paid</Badge>
  if (status === 'partial') return <Badge tone="warning">Partial</Badge>
  if (status === 'late')    return <Badge tone="warning">Late</Badge>
  return <Badge tone="danger">Missing</Badge>
}
