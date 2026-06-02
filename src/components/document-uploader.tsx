'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Label, Select } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import type { DocumentKind } from '@/lib/types'
import { EXPENSE_CATEGORIES } from '@/lib/mtd'

const KIND_OPTIONS: { value: DocumentKind; label: string }[] = [
  { value: 'tenancy_agreement', label: 'Tenancy Agreement' },
  { value: 'deposit_certificate', label: 'Deposit Certificate' },
  { value: 'how_to_rent', label: 'How to Rent guide' },
  { value: 'inventory_move_in', label: 'Move-in Inventory' },
  { value: 'inventory_move_out', label: 'Move-out Inventory' },
  { value: 'gas_safety', label: 'Gas Safety' },
  { value: 'eicr', label: 'EICR' },
  { value: 'epc', label: 'EPC' },
  { value: 'buildings_insurance', label: 'Buildings Insurance' },
  { value: 'invoice', label: 'Invoice (MTD tagged)' },
  { value: 'other', label: 'Other' },
]

export function DocumentUploader({ propertyId }: { propertyId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [kind, setKind] = useState<DocumentKind>('tenancy_agreement')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null); setBusy(true); setProgress('Uploading...')
    const form = e.currentTarget
    const fd = new FormData(form)
    const file = fd.get('file') as File
    const title = String(fd.get('title') || file.name)
    const docKind = String(fd.get('kind') || 'other') as DocumentKind
    const visible_to_tenant = fd.get('visible_to_tenant') === 'on'
    const run_ai = fd.get('run_ai') === 'on'

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in.'); setBusy(false); return }

    const path = `${propertyId}/${crypto.randomUUID()}-${file.name}`
    const { error: upErr } = await supabase.storage.from('property-documents').upload(path, file, {
      contentType: file.type, upsert: false,
    })
    if (upErr) { setError(upErr.message); setBusy(false); return }

    const { data: docRow, error: insErr } = await supabase.from('documents').insert({
      property_id: propertyId,
      uploaded_by: user.id,
      kind: docKind, title, storage_path: path,
      mime_type: file.type, file_size: file.size,
      visible_to_tenant,
    }).select('id').single()
    if (insErr) { setError(insErr.message); setBusy(false); return }

    // If this is an invoice, also log an MTD transaction
    if (docKind === 'invoice') {
      const amount = Number(fd.get('mtd_amount') || 0)
      const expense_category = String(fd.get('mtd_category') || 'other')
      const transaction_date = String(fd.get('mtd_date') || new Date().toISOString().slice(0, 10))
      const supplier_or_payer = (fd.get('mtd_supplier') as string) || null

      if (amount > 0) {
        setProgress('Linking to MTD...')
        await supabase.from('mtd_transactions').insert({
          property_id: propertyId,
          document_id: docRow!.id,
          kind: 'expense',
          expense_category,
          transaction_date,
          amount,
          description: title,
          supplier_or_payer,
          created_by: user.id,
        })
      }
    }

    if (run_ai) {
      setProgress('Summarising with Claude...')
      try {
        const res = await fetch('/api/ai/summarise-document', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ document_id: docRow!.id }),
        })
        if (!res.ok) throw new Error(await res.text())
      } catch (err: any) {
        setError(`Upload OK, but summary failed: ${err.message}`)
      }
    }

    setBusy(false); setProgress(null); form.reset()
    router.refresh()
  }

  const isInvoice = kind === 'invoice'

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor="file">File</Label>
        <Input id="file" name="file" type="file" required accept="application/pdf,image/*,.doc,.docx" />
      </div>
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" placeholder="e.g. AST 2026 Patel" />
      </div>
      <div>
        <Label htmlFor="kind">Type</Label>
        <Select id="kind" name="kind" value={kind} onChange={(e) => setKind(e.target.value as DocumentKind)}>
          {KIND_OPTIONS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
        </Select>
      </div>

      {isInvoice && (
        <div className="sm:col-span-2 rounded-lg border border-accent-200 bg-accent-50 p-4">
          <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent-700">
            <Receipt className="h-3.5 w-3.5" /> MTD details (will create a linked expense transaction)
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="mtd_category">Expense category</Label>
              <Select id="mtd_category" name="mtd_category" defaultValue="repairs_and_maintenance">
                {EXPENSE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="mtd_amount">Amount (£)</Label>
              <Input id="mtd_amount" name="mtd_amount" type="number" step="0.01" min={0} placeholder="0.00" />
            </div>
            <div>
              <Label htmlFor="mtd_date">Invoice date</Label>
              <Input id="mtd_date" name="mtd_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
            </div>
            <div>
              <Label htmlFor="mtd_supplier">Supplier</Label>
              <Input id="mtd_supplier" name="mtd_supplier" placeholder="e.g. British Gas" />
            </div>
          </div>
        </div>
      )}

      <label className="sm:col-span-2 inline-flex items-center gap-2 text-sm text-ink-700">
        <input type="checkbox" name="visible_to_tenant" className="rounded border-ink-300" />
        Visible to tenant in their portal
      </label>
      <label className="sm:col-span-2 inline-flex items-center gap-2 text-sm text-ink-700">
        <input type="checkbox" name="run_ai" defaultChecked className="rounded border-ink-300" />
        <Sparkles className="h-4 w-4 text-accent-500" /> Generate Claude summary
      </label>
      {error && <p className="sm:col-span-2 rounded bg-danger-100 px-3 py-2 text-sm text-danger-700">{error}</p>}
      <div className="sm:col-span-2 flex justify-end gap-2">
        {progress && <span className="self-center text-sm text-ink-500">{progress}</span>}
        <Button type="submit" disabled={busy}>Upload</Button>
      </div>
    </form>
  )
}
