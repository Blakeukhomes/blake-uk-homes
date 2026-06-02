import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Label, Select } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { arrearsTotal, formatGBP } from '@/lib/rent'
import type { Property, RentPayment } from '@/lib/types'
import { addMonths, format, parseISO, startOfMonth, subMonths } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function PropertyRentPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: property } = await supabase.from('properties').select('*').eq('id', params.id).single()
  const { data: payments = [] } = await supabase
    .from('rent_payments').select('*').eq('property_id', params.id).order('period_start', { ascending: false }).limit(6)
  if (!property) return null
  const p = property as Property

  // Seed the next 6 months if missing
  const existingPeriods = new Set((payments as RentPayment[]).map((x) => x.period_start))
  const needSeed: { period_start: string; due_date: string; amount_due: number }[] = []
  for (let i = 0; i < 6; i++) {
    const periodDate = startOfMonth(subMonths(new Date(), i))
    const period_start = format(periodDate, 'yyyy-MM-dd')
    if (!existingPeriods.has(period_start)) {
      const dueDate = new Date(periodDate)
      dueDate.setDate(Math.min(p.rent_due_day || 1, 28))
      needSeed.push({
        period_start,
        due_date: format(dueDate, 'yyyy-MM-dd'),
        amount_due: Number(p.monthly_rent ?? 0),
      })
    }
  }
  if (needSeed.length > 0) {
    await supabase.from('rent_payments').insert(needSeed.map((x) => ({ ...x, property_id: p.id, status: 'missing' as const })))
  }
  const { data: paymentsFinal = [] } = await supabase
    .from('rent_payments').select('*').eq('property_id', params.id).order('period_start', { ascending: false }).limit(6)
  const list = (paymentsFinal ?? []) as RentPayment[]

  async function recordPayment(formData: FormData) {
    'use server'
    const supabase = createClient()
    const id = String(formData.get('payment_id'))
    const amount_paid = Number(formData.get('amount_paid') || 0)
    const received_on = (formData.get('received_on') as string) || null
    const notes = (formData.get('notes') as string) || null
    const status = String(formData.get('status'))

    const { error } = await supabase.from('rent_payments').update({
      amount_paid, received_on, notes, status,
    }).eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath(`/properties/${params.id}/rent`)
    revalidatePath('/rent')
    revalidatePath('/dashboard')
  }

  const arrears = arrearsTotal(list)

  return (
    <>
      <PageHeader
        title={`${p.nickname}, Rent ledger`}
        subtitle="Monthly view. Update payments as they arrive. Arrears computed automatically."
        actions={
          <>
            <Link href={`/api/pdf/arrears/${p.id}`} target="_blank">
              <Button variant="secondary">Print arrears PDF</Button>
            </Link>
            <Badge tone={arrears > 0 ? 'warning' : 'success'} className="text-sm">
              {arrears > 0 ? `Arrears ${formatGBP(arrears)}` : 'Up to date'}
            </Badge>
          </>
        }
      />

      <div className="p-6 space-y-4">
        {list.map((pay) => (
          <Card key={pay.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{new Date(pay.period_start).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</CardTitle>
                  <CardDescription>Due {new Date(pay.due_date).toLocaleDateString('en-GB')}</CardDescription>
                </div>
                <RentStatusBadge status={pay.status} />
              </div>
            </CardHeader>
            <CardBody>
              <form action={recordPayment} className="grid gap-3 sm:grid-cols-5">
                <input type="hidden" name="payment_id" value={pay.id} />
                <div>
                  <Label htmlFor={`amount_paid_${pay.id}`}>Amount paid</Label>
                  <Input id={`amount_paid_${pay.id}`} name="amount_paid" type="number" step="0.01" defaultValue={pay.amount_paid} />
                </div>
                <div>
                  <Label htmlFor={`received_on_${pay.id}`}>Received on</Label>
                  <Input id={`received_on_${pay.id}`} name="received_on" type="date" defaultValue={pay.received_on ?? ''} />
                </div>
                <div>
                  <Label htmlFor={`status_${pay.id}`}>Status</Label>
                  <Select id={`status_${pay.id}`} name="status" defaultValue={pay.status}>
                    <option value="paid">Paid</option>
                    <option value="partial">Partial</option>
                    <option value="late">Late</option>
                    <option value="missing">Missing</option>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor={`notes_${pay.id}`}>Notes</Label>
                  <Input id={`notes_${pay.id}`} name="notes" defaultValue={pay.notes ?? ''} />
                </div>
                <div className="sm:col-span-5 flex justify-end">
                  <Button type="submit" size="sm">Save</Button>
                </div>
              </form>
            </CardBody>
          </Card>
        ))}
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
