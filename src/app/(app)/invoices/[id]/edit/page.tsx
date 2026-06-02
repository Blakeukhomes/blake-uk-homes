import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import type { Invoice } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function EditInvoicePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: invoice } = await supabase.from('invoices').select('*').eq('id', params.id).maybeSingle()
  if (!invoice) notFound()
  const inv = invoice as Invoice

  async function update(formData: FormData) {
    'use server'
    const supabase = createClient()
    const total = Number(formData.get('total') ?? 0)
    const amount_paid = Number(formData.get('amount_paid') ?? 0)
    let status = String(formData.get('status'))
    // auto-adjust status if amount_paid passes total
    if (amount_paid >= total && total > 0) status = 'paid'
    else if (amount_paid > 0 && amount_paid < total) status = 'partial'

    await supabase.from('invoices').update({
      contact_name: String(formData.get('contact_name') ?? inv.contact_name),
      contact_email: (formData.get('contact_email') as string) || null,
      contact_address: (formData.get('contact_address') as string) || null,
      type: String(formData.get('type') ?? inv.type),
      status,
      issue_date: String(formData.get('issue_date')),
      due_date: String(formData.get('due_date')),
      payment_terms: (formData.get('payment_terms') as string) || null,
      total, amount_paid,
      notes: (formData.get('notes') as string) || null,
      paid_at: status === 'paid' ? new Date().toISOString() : null,
    }).eq('id', params.id)
    revalidatePath('/invoices')
    revalidatePath(`/invoices/${params.id}`)
    redirect(`/invoices/${params.id}`)
  }

  async function remove() {
    'use server'
    const supabase = createClient()
    await supabase.from('invoices').delete().eq('id', params.id)
    revalidatePath('/invoices')
    redirect('/invoices')
  }

  return (
    <>
      <PageHeader
        title={`Edit ${inv.invoice_number}`}
        actions={<Link href={`/invoices/${inv.id}`}><Button variant="ghost"><ArrowLeft className="h-4 w-4" />Back</Button></Link>}
      />
      <div className="p-6">
        <Card className="max-w-2xl">
          <CardBody>
            <form action={update} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label htmlFor="contact_name">Contact name</Label><Input id="contact_name" name="contact_name" required defaultValue={inv.contact_name} /></div>
              <div><Label htmlFor="contact_email">Email</Label><Input id="contact_email" name="contact_email" type="email" defaultValue={inv.contact_email ?? ''} /></div>
              <div><Label htmlFor="contact_address">Address</Label><Input id="contact_address" name="contact_address" defaultValue={inv.contact_address ?? ''} /></div>

              <div>
                <Label htmlFor="type">Type</Label>
                <Select id="type" name="type" defaultValue={inv.type}>
                  <option value="ad_hoc">Ad hoc</option>
                  <option value="recurring">Recurring</option>
                  <option value="rent">Rent</option>
                  <option value="deposit">Deposit</option>
                  <option value="other">Other</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select id="status" name="status" defaultValue={inv.status}>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="viewed">Viewed</option>
                  <option value="overdue">Overdue</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                  <option value="void">Void</option>
                </Select>
              </div>

              <div><Label htmlFor="issue_date">Issue date</Label><Input id="issue_date" name="issue_date" type="date" required defaultValue={inv.issue_date} /></div>
              <div><Label htmlFor="due_date">Due date</Label><Input id="due_date" name="due_date" type="date" required defaultValue={inv.due_date} /></div>
              <div className="sm:col-span-2"><Label htmlFor="payment_terms">Payment terms</Label><Input id="payment_terms" name="payment_terms" defaultValue={inv.payment_terms ?? 'Net 30'} /></div>

              <div><Label htmlFor="total">Total (£)</Label><Input id="total" name="total" type="number" step="0.01" required defaultValue={inv.total} /></div>
              <div><Label htmlFor="amount_paid">Amount paid (£)</Label><Input id="amount_paid" name="amount_paid" type="number" step="0.01" defaultValue={inv.amount_paid} /></div>

              <div className="sm:col-span-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" name="notes" rows={3} defaultValue={inv.notes ?? ''} /></div>

              <div className="sm:col-span-2 flex justify-between gap-2 pt-2">
                <Button type="submit" formAction={remove} variant="danger" size="sm">Delete invoice</Button>
                <div className="flex gap-2">
                  <Link href={`/invoices/${inv.id}`}><Button variant="secondary" type="button">Cancel</Button></Link>
                  <Button type="submit" size="lg">Save</Button>
                </div>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
