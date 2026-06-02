import Link from 'next/link'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { ArrowLeft, Send, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatGBP } from '@/lib/rent'
import type { Invoice, InvoiceLineItem, InvoiceStatus } from '@/lib/types'

export const dynamic = 'force-dynamic'

function statusTone(s: InvoiceStatus): 'neutral' | 'info' | 'warning' | 'danger' | 'success' {
  if (s === 'paid')    return 'success'
  if (s === 'partial') return 'warning'
  if (s === 'overdue') return 'danger'
  if (s === 'sent' || s === 'viewed') return 'info'
  return 'neutral'
}

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: invoice } = await supabase.from('invoices').select('*').eq('id', params.id).maybeSingle()
  const { data: items = [] } = await supabase.from('invoice_line_items').select('*').eq('invoice_id', params.id).order('sort_order')
  if (!invoice) notFound()
  const inv = invoice as Invoice

  async function markSent(_formData: FormData) {
    'use server'
    const supabase = createClient()
    await supabase.from('invoices').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', params.id)
    revalidatePath(`/invoices/${params.id}`)
    revalidatePath('/invoices')
  }
  async function markPaid(_formData: FormData) {
    'use server'
    const supabase = createClient()
    await supabase.from('invoices').update({ status: 'paid', paid_at: new Date().toISOString(), amount_paid: inv.total }).eq('id', params.id)
    revalidatePath(`/invoices/${params.id}`)
    revalidatePath('/invoices')
  }

  return (
    <>
      <PageHeader
        title={`Invoice ${inv.invoice_number}`}
        subtitle={`${inv.contact_name} · issued ${new Date(inv.issue_date).toLocaleDateString('en-GB')}`}
        actions={
          <>
            <Link href="/invoices"><Button variant="ghost"><ArrowLeft className="h-4 w-4" />Back</Button></Link>
            {inv.status === 'draft' && (
              <form action={markSent}><Button type="submit"><Send className="h-4 w-4" />Mark sent</Button></form>
            )}
            {inv.status !== 'paid' && inv.status !== 'void' && (
              <form action={markPaid}><Button type="submit"><CheckCircle2 className="h-4 w-4" />Mark paid</Button></form>
            )}
          </>
        }
      />

      <div className="p-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Items</CardTitle>
              <Badge tone={statusTone(inv.status)}>{inv.status}</Badge>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b hairline border-b-ink-100 bg-ink-50/60 text-left text-xs uppercase tracking-wider text-ink-500">
                  <th className="px-6 py-2 font-semibold">Description</th>
                  <th className="px-2 py-2 text-right font-semibold">Qty</th>
                  <th className="px-2 py-2 text-right font-semibold">Unit £</th>
                  <th className="px-2 py-2 text-right font-semibold">VAT</th>
                  <th className="px-6 py-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {(items as InvoiceLineItem[]).map((it) => (
                  <tr key={it.id} className="border-b hairline border-b-ink-100">
                    <td className="px-6 py-3 text-ink-700">{it.description}</td>
                    <td className="px-2 py-3 text-right">{it.quantity}</td>
                    <td className="px-2 py-3 text-right">{formatGBP(it.unit_price)}</td>
                    <td className="px-2 py-3 text-right">{it.vat_rate}%</td>
                    <td className="px-6 py-3 text-right font-medium">{formatGBP(it.line_total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td colSpan={4} className="px-6 py-2 text-right text-ink-500">Subtotal</td><td className="px-6 py-2 text-right">{formatGBP(inv.subtotal)}</td></tr>
                <tr><td colSpan={4} className="px-6 py-2 text-right text-ink-500">VAT</td><td className="px-6 py-2 text-right">{formatGBP(inv.vat_amount)}</td></tr>
                <tr className="bg-ink-50/60"><td colSpan={4} className="px-6 py-2 text-right font-bold">Total</td><td className="px-6 py-2 text-right font-bold">{formatGBP(inv.total)}</td></tr>
              </tfoot>
            </table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Bill to</CardTitle></CardHeader>
          <CardBody className="space-y-2 text-sm">
            <p className="font-semibold text-ink-900">{inv.contact_name}</p>
            {inv.contact_email && <p className="text-ink-600">{inv.contact_email}</p>}
            {inv.contact_address && <p className="text-ink-600">{inv.contact_address}</p>}
            <div className="border-t hairline border-t-ink-100 pt-3 text-xs text-ink-500">
              Issue: {new Date(inv.issue_date).toLocaleDateString('en-GB')}<br />
              Due: {new Date(inv.due_date).toLocaleDateString('en-GB')}<br />
              Terms: {inv.payment_terms ?? '—'}
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
