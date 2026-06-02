'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { addDays, format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { formatGBP } from '@/lib/rent'
import type { Contact, Property } from '@/lib/types'

interface LineItem {
  description: string
  quantity: number
  unit_price: number
  vat_rate: number
}

const VAT_RATES = [0, 5, 20]

export function NewInvoiceForm({
  contacts,
  properties,
}: {
  contacts: Contact[]
  properties: Pick<Property, 'id' | 'nickname'>[]
}) {
  const router = useRouter()
  const supabase = createClient()

  const [contactId, setContactId] = useState('')
  const [items, setItems] = useState<LineItem[]>([{ description: '', quantity: 1, unit_price: 0, vat_rate: 0 }])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selected = contacts.find((c) => c.id === contactId)

  const totals = useMemo(() => {
    let subtotal = 0
    let vat = 0
    for (const li of items) {
      const line = li.quantity * li.unit_price
      subtotal += line
      vat += line * (li.vat_rate / 100)
    }
    return { subtotal, vat, total: subtotal + vat }
  }, [items])

  function updateItem(i: number, patch: Partial<LineItem>) {
    setItems((arr) => arr.map((li, idx) => (idx === i ? { ...li, ...patch } : li)))
  }

  async function submit(action: 'draft' | 'send') {
    setBusy(true); setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in'); setBusy(false); return }

    const formEl = document.getElementById('invoice-form') as HTMLFormElement
    const fd = new FormData(formEl)

    const { data: invoice, error: invErr } = await supabase.from('invoices').insert({
      owner_id: user.id,
      contact_id: contactId || null,
      property_id: (fd.get('property_id') as string) || null,
      type: String(fd.get('type') ?? 'ad_hoc'),
      status: action === 'send' ? 'sent' : 'draft',
      contact_name: String(fd.get('contact_name') ?? selected?.full_name ?? ''),
      contact_email: (fd.get('contact_email') as string) || selected?.email || null,
      contact_address: (fd.get('contact_address') as string) || selected?.address || null,
      issue_date: String(fd.get('issue_date')),
      due_date: String(fd.get('due_date')),
      payment_terms: (fd.get('payment_terms') as string) || 'Net 30',
      subtotal: totals.subtotal,
      vat_amount: totals.vat,
      total: totals.total,
      amount_paid: 0,
      notes: (fd.get('notes') as string) || null,
      sent_at: action === 'send' ? new Date().toISOString() : null,
    }).select('id').single()

    if (invErr) { setError(invErr.message); setBusy(false); return }

    // Insert line items
    const lineRows = items.map((li, idx) => ({
      invoice_id: invoice!.id,
      description: li.description,
      quantity: li.quantity,
      unit_price: li.unit_price,
      vat_rate: li.vat_rate,
      line_total: li.quantity * li.unit_price * (1 + li.vat_rate / 100),
      sort_order: idx,
    }))
    if (lineRows.length > 0) {
      await supabase.from('invoice_line_items').insert(lineRows)
    }

    setBusy(false)
    router.push('/invoices')
    router.refresh()
  }

  return (
    <form id="invoice-form" onSubmit={(e) => e.preventDefault()} className="space-y-6">
      {/* Contact */}
      <section>
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-500">Contact</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="contact_picker">Select a contact</Label>
            <Select id="contact_picker" value={contactId} onChange={(e) => setContactId(e.target.value)}>
              <option value="">No linked contact (manual entry)</option>
              {contacts.map((c) => <option key={c.id} value={c.id}>{c.full_name}{c.company ? ` (${c.company})` : ''}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="contact_name">Name</Label>
            <Input id="contact_name" name="contact_name" defaultValue={selected?.full_name ?? ''} required key={selected?.id ?? 'manual'} />
          </div>
          <div>
            <Label htmlFor="contact_email">Email</Label>
            <Input id="contact_email" name="contact_email" type="email" defaultValue={selected?.email ?? ''} key={(selected?.id ?? 'manual') + 'e'} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="contact_address">Address</Label>
            <Input id="contact_address" name="contact_address" defaultValue={selected?.address ?? ''} key={(selected?.id ?? 'manual') + 'a'} placeholder="Billing address" />
          </div>
        </div>
      </section>

      {/* Invoice details */}
      <section>
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-500">Invoice details</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="type">Type</Label>
            <Select id="type" name="type" defaultValue="ad_hoc">
              <option value="ad_hoc">Ad hoc</option>
              <option value="recurring">Recurring</option>
              <option value="rent">Rent</option>
              <option value="deposit">Deposit</option>
              <option value="other">Other</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="issue_date">Issue date</Label>
            <Input id="issue_date" name="issue_date" type="date" required defaultValue={format(new Date(), 'yyyy-MM-dd')} />
          </div>
          <div>
            <Label htmlFor="due_date">Due date</Label>
            <Input id="due_date" name="due_date" type="date" required defaultValue={format(addDays(new Date(), 30), 'yyyy-MM-dd')} />
          </div>
          <div>
            <Label htmlFor="property_id">Property (optional)</Label>
            <Select id="property_id" name="property_id" defaultValue="">
              <option value="">No link</option>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.nickname}</option>)}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="payment_terms">Payment terms</Label>
            <Input id="payment_terms" name="payment_terms" defaultValue="Net 30" />
          </div>
        </div>
      </section>

      {/* Line items */}
      <section>
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-500">Line items</p>
        <div className="space-y-3">
          {items.map((li, i) => (
            <div key={i} className="rounded-lg border hairline border-ink-200 bg-ink-50/40 p-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_80px_120px_90px_120px_auto]">
                <Input
                  placeholder="Description"
                  value={li.description}
                  onChange={(e) => updateItem(i, { description: e.target.value })}
                  required
                />
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={li.quantity}
                  onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
                  placeholder="Qty"
                />
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={li.unit_price}
                  onChange={(e) => updateItem(i, { unit_price: Number(e.target.value) })}
                  placeholder="Unit £"
                />
                <Select
                  value={String(li.vat_rate)}
                  onChange={(e) => updateItem(i, { vat_rate: Number(e.target.value) })}
                >
                  {VAT_RATES.map((r) => <option key={r} value={r}>{r}% VAT</option>)}
                </Select>
                <div className="flex items-center justify-end px-2 text-sm font-medium text-ink-900">
                  {formatGBP(li.quantity * li.unit_price * (1 + li.vat_rate / 100))}
                </div>
                <button
                  type="button"
                  onClick={() => setItems((arr) => arr.filter((_, idx) => idx !== i))}
                  className="rounded-lg p-2 text-ink-400 hover:bg-danger-100 hover:text-danger-700"
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setItems((arr) => [...arr, { description: '', quantity: 1, unit_price: 0, vat_rate: 0 }])}
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent-700 hover:underline"
        >
          <Plus className="h-4 w-4" /> Add line item
        </button>

        <div className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between text-ink-600"><span>Subtotal</span><span>{formatGBP(totals.subtotal)}</span></div>
          <div className="flex justify-between text-ink-600"><span>VAT</span><span>{formatGBP(totals.vat)}</span></div>
          <div className="flex justify-between border-t hairline border-t-ink-200 pt-1 font-semibold text-ink-900"><span>Total</span><span>{formatGBP(totals.total)}</span></div>
        </div>
      </section>

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" name="notes" rows={3} />
      </div>

      {error && <p className="rounded bg-danger-100 px-3 py-2 text-sm text-danger-700">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" disabled={busy} onClick={() => submit('draft')}>Save draft</Button>
        <Button type="button" disabled={busy} onClick={() => submit('send')}>Send invoice</Button>
      </div>
    </form>
  )
}
