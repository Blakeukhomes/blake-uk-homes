import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { ArrowLeft, AlertCircle, Sparkles } from 'lucide-react'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatGBP } from '@/lib/rent'
import type { Mortgage } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PropertyMortgagePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: property } = await supabase.from('properties').select('id, nickname').eq('id', params.id).single()
  const { data: mortgage } = await supabase.from('mortgages').select('*').eq('property_id', params.id).maybeSingle()
  if (!property) return null
  const m = mortgage as Mortgage | null

  async function save(formData: FormData) {
    'use server'
    const supabase = createClient()
    const payload = {
      property_id: params.id,
      lender: String(formData.get('lender') ?? ''),
      account_number: (formData.get('account_number') as string) || null,
      mortgage_type: String(formData.get('mortgage_type') ?? 'interest_only'),
      rate_kind: String(formData.get('rate_kind') ?? 'fixed'),
      interest_rate: Number(formData.get('interest_rate') ?? 0) || null,
      monthly_payment: Number(formData.get('monthly_payment') ?? 0) || null,
      monthly_interest: Number(formData.get('monthly_interest') ?? 0) || null,
      outstanding_balance: Number(formData.get('outstanding_balance') ?? 0) || null,
      fix_end_date: (formData.get('fix_end_date') as string) || null,
      start_date: (formData.get('start_date') as string) || null,
      product_end_date: (formData.get('product_end_date') as string) || null,
      notes: (formData.get('notes') as string) || null,
    }

    if (m) {
      await supabase.from('mortgages').update(payload).eq('id', m.id)
    } else {
      await supabase.from('mortgages').insert(payload)
    }
    revalidatePath(`/properties/${params.id}/mortgage`)
    revalidatePath(`/properties/${params.id}`)
  }

  async function remove() {
    'use server'
    if (!m) return
    const supabase = createClient()
    await supabase.from('mortgages').delete().eq('id', m.id)
    revalidatePath(`/properties/${params.id}/mortgage`)
  }

  // Days until fix end
  const daysToFixEnd = m?.fix_end_date ? differenceInCalendarDays(parseISO(m.fix_end_date), new Date()) : null

  return (
    <>
      <PageHeader
        title={`${property.nickname}, Mortgage`}
        subtitle="Lender, rate, balance, and statements. Interest auto-feeds the MTD tracker."
        actions={<Link href={`/properties/${params.id}`}><Button variant="ghost"><ArrowLeft className="h-4 w-4" />Back</Button></Link>}
      />
      <div className="p-6 grid gap-6 lg:grid-cols-3">
        {m && (
          <>
            <Card>
              <CardHeader><CardTitle>Outstanding balance</CardTitle></CardHeader>
              <CardBody><p className="text-3xl font-bold text-ink-900">{formatGBP(m.outstanding_balance ?? 0)}</p></CardBody>
            </Card>
            <Card>
              <CardHeader><CardTitle>Monthly payment</CardTitle><CardDescription>{m.mortgage_type.replace('_', ' ')}, {m.rate_kind}</CardDescription></CardHeader>
              <CardBody>
                <p className="text-3xl font-bold text-ink-900">{formatGBP(m.monthly_payment ?? 0)}</p>
                <p className="mt-1 text-xs text-ink-500">Interest portion: {formatGBP(m.monthly_interest ?? 0)} (auto-MTD)</p>
              </CardBody>
            </Card>
            <Card>
              <CardHeader><CardTitle>Fix ends</CardTitle></CardHeader>
              <CardBody>
                {m.fix_end_date ? (
                  <>
                    <p className="text-2xl font-bold text-ink-900">{new Date(m.fix_end_date).toLocaleDateString('en-GB')}</p>
                    {daysToFixEnd !== null && (
                      <Badge tone={daysToFixEnd < 0 ? 'danger' : daysToFixEnd <= 180 ? 'warning' : 'success'}>
                        {daysToFixEnd < 0
                          ? `${Math.abs(daysToFixEnd)} days past`
                          : `${daysToFixEnd} days left`}
                      </Badge>
                    )}
                    {daysToFixEnd !== null && daysToFixEnd > 0 && daysToFixEnd <= 180 && (
                      <p className="mt-2 inline-flex items-center gap-1 text-xs text-warning-700"><AlertCircle className="h-3.5 w-3.5" />Remortgage window open</p>
                    )}
                  </>
                ) : <p className="text-ink-500">Not set</p>}
              </CardBody>
            </Card>
          </>
        )}

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>{m ? 'Edit mortgage' : 'Add mortgage'}</CardTitle>
            <CardDescription>
              <span className="inline-flex items-center gap-1 text-accent-700"><Sparkles className="h-3.5 w-3.5" />Upload a statement on the Documents page and Hudson AI will pre-fill these fields.</span>
            </CardDescription>
          </CardHeader>
          <CardBody>
            <form action={save} className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2"><Label htmlFor="lender">Lender</Label><Input id="lender" name="lender" required defaultValue={m?.lender ?? ''} placeholder="e.g. Barclays, NatWest" /></div>
              <div><Label htmlFor="account_number">Account number</Label><Input id="account_number" name="account_number" defaultValue={m?.account_number ?? ''} /></div>

              <div>
                <Label htmlFor="mortgage_type">Type</Label>
                <Select id="mortgage_type" name="mortgage_type" defaultValue={m?.mortgage_type ?? 'interest_only'}>
                  <option value="interest_only">Interest only</option>
                  <option value="repayment">Repayment</option>
                  <option value="part_and_part">Part &amp; part</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="rate_kind">Rate</Label>
                <Select id="rate_kind" name="rate_kind" defaultValue={m?.rate_kind ?? 'fixed'}>
                  <option value="fixed">Fixed</option>
                  <option value="variable">Variable</option>
                  <option value="tracker">Tracker</option>
                  <option value="discount">Discount</option>
                </Select>
              </div>
              <div><Label htmlFor="interest_rate">Interest rate (%)</Label><Input id="interest_rate" name="interest_rate" type="number" step="0.001" defaultValue={m?.interest_rate ?? ''} /></div>

              <div><Label htmlFor="monthly_payment">Monthly payment (£)</Label><Input id="monthly_payment" name="monthly_payment" type="number" step="0.01" defaultValue={m?.monthly_payment ?? ''} /></div>
              <div><Label htmlFor="monthly_interest">Monthly interest (£)</Label><Input id="monthly_interest" name="monthly_interest" type="number" step="0.01" defaultValue={m?.monthly_interest ?? ''} /></div>
              <div><Label htmlFor="outstanding_balance">Outstanding balance (£)</Label><Input id="outstanding_balance" name="outstanding_balance" type="number" step="0.01" defaultValue={m?.outstanding_balance ?? ''} /></div>

              <div><Label htmlFor="start_date">Start date</Label><Input id="start_date" name="start_date" type="date" defaultValue={m?.start_date ?? ''} /></div>
              <div><Label htmlFor="fix_end_date">Fix end date</Label><Input id="fix_end_date" name="fix_end_date" type="date" defaultValue={m?.fix_end_date ?? ''} /></div>
              <div><Label htmlFor="product_end_date">Product / ERC end</Label><Input id="product_end_date" name="product_end_date" type="date" defaultValue={m?.product_end_date ?? ''} /></div>

              <div className="sm:col-span-3"><Label htmlFor="notes">Notes</Label><Textarea id="notes" name="notes" rows={2} defaultValue={m?.notes ?? ''} /></div>

              <div className="sm:col-span-3 flex justify-between gap-2 pt-2">
                {m
                  ? <Button type="submit" formAction={remove} variant="danger" size="sm">Remove mortgage</Button>
                  : <div />}
                <Button type="submit" size="lg">{m ? 'Save changes' : 'Add mortgage'}</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
