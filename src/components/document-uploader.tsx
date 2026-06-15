'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Receipt, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Label, Select } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import type { DocumentKind } from '@/lib/types'
import { EXPENSE_CATEGORIES } from '@/lib/mtd'

const KIND_OPTIONS: { value: DocumentKind; label: string }[] = [
  { value: 'gas_safety',          label: 'Gas Safety Certificate' },
  { value: 'eicr',                label: 'EICR (Electrical)' },
  { value: 'epc',                 label: 'EPC (Energy Performance)' },
  { value: 'legionella',          label: 'Legionella Risk Assessment' },
  { value: 'ico_registration',    label: 'ICO Registration (Data Protection)' },
  { value: 'buildings_insurance', label: 'Buildings Insurance' },
  { value: 'tenancy_agreement',   label: 'Tenancy Agreement' },
  { value: 'deposit_certificate', label: 'Deposit Certificate' },
  { value: 'how_to_rent',         label: 'How to Rent guide' },
  { value: 'inventory_move_in',   label: 'Move-in Inventory' },
  { value: 'inventory_move_out',  label: 'Move-out Inventory' },
  { value: 'invoice',             label: 'Invoice (MTD tagged)' },
  { value: 'other',               label: 'Other' },
]

// Which DocumentKinds map to which compliance type + extraction schema
const COMPLIANCE_FLOW: Partial<Record<DocumentKind, { schemaKind: string; complianceType: string; label: string }>> = {
  gas_safety:          { schemaKind: 'gas_safety',          complianceType: 'gas_safety',          label: 'Gas Safety' },
  eicr:                { schemaKind: 'eicr',                complianceType: 'eicr',                label: 'EICR' },
  epc:                 { schemaKind: 'epc',                 complianceType: 'epc',                 label: 'EPC' },
  legionella:          { schemaKind: 'legionella',          complianceType: 'legionella',          label: 'Legionella' },
  ico_registration:    { schemaKind: 'ico_registration',    complianceType: 'ico_registration',    label: 'ICO Registration' },
  buildings_insurance: { schemaKind: 'buildings_insurance', complianceType: 'buildings_insurance', label: 'Buildings Insurance' },
}

interface ExtractedSummary {
  label: string
  fields: Record<string, any>
}

export function DocumentUploader({ propertyId }: { propertyId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [kind, setKind] = useState<DocumentKind>('gas_safety')
  const [extracted, setExtracted] = useState<ExtractedSummary | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null); setExtracted(null); setBusy(true); setProgress('Uploading...')
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
    } as any).select('id').single()
    if (insErr) { setError(insErr.message); setBusy(false); return }

    // ---- Compliance certificates (Gas, EICR, EPC, Legionella, Insurance): auto-extract + create cert row ----
    const flow = COMPLIANCE_FLOW[docKind]
    if (flow) {
      setProgress(`Hudson is reading the ${flow.label.toLowerCase()}...`)
      try {
        const res = await fetch('/api/ai/extract-document', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ document_id: docRow!.id, kind: flow.schemaKind }),
        })
        if (res.ok) {
          const { fields } = await res.json() as { fields: Record<string, any> }
          const completedOn = fields.inspection_date ?? fields.assessment_date ?? fields.cover_start_date
          const expiresOn   = fields.expiry_date ?? fields.next_review_due ?? fields.cover_end_date
          if (completedOn && expiresOn) {
            const issuedBy =
              fields.engineer_name ?? fields.inspector_name ?? fields.assessor_name ?? fields.insurer ?? fields.organisation_name ?? null
            const reference =
              fields.gas_safe_number ?? fields.certificate_number ?? fields.reference_number ?? fields.policy_number ?? fields.reference ?? fields.registration_number ?? null
            const notes = fields.defects_found ?? fields.actions_required ?? null

            const { error: certErr } = await supabase.from('compliance_certificates').insert({
              property_id: propertyId,
              type: flow.complianceType,
              completed_on: completedOn,
              expires_on: expiresOn,
              document_id: docRow!.id,
              issued_by: issuedBy,
              reference: reference,
              notes: notes,
            } as any)
            if (!certErr) {
              setExtracted({ label: flow.label, fields: { ...fields, completed_on: completedOn, expires_on: expiresOn } })
            }
          } else {
            setExtracted({ label: flow.label, fields })
          }
        }
      } catch {
        // non-fatal — user can manually add the compliance record
      }
    }

    // ---- Inventory PDFs: extract + log invoice to MTD as Professional Fees ----
    if (docKind === 'inventory_move_in' || docKind === 'inventory_move_out') {
      setProgress('Hudson is reading the inventory...')
      try {
        const res = await fetch('/api/ai/extract-document', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ document_id: docRow!.id, kind: 'inventory' }),
        })
        if (res.ok) {
          const { fields } = await res.json()
          if (fields?.invoice_amount && fields.invoice_amount > 0) {
            await supabase.from('mtd_transactions').insert({
              property_id: propertyId,
              document_id: docRow!.id,
              kind: 'expense',
              expense_category: 'professional_fees',
              transaction_date: fields.report_date ?? new Date().toISOString().slice(0, 10),
              amount: fields.invoice_amount,
              description: `Inventory clerk: ${fields.company_name ?? title}`,
              supplier_or_payer: fields.company_name ?? null,
              created_by: user.id,
            } as any)
            setExtracted({ label: 'Inventory', fields })
          }
        }
      } catch {
        // non-fatal
      }
    }

    // ---- Manual invoice MTD line (existing flow, kept) ----
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
        } as any)
      }
    }

    // ---- Plain-language Hudson summary (optional, runs in background) ----
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
        <p className="mt-1 text-xs text-ink-500">
          On phones, also try{' '}
          <label className="cursor-pointer font-semibold text-accent-700 underline">
            take a photo with the camera
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const fileInput = document.getElementById('file') as HTMLInputElement
                const dt = new DataTransfer()
                dt.items.add(file)
                fileInput.files = dt.files
              }}
            />
          </label>
          {' '}for receipts and certificates.
        </p>
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

      {COMPLIANCE_FLOW[kind] && (
        <div className="sm:col-span-2 flex items-start gap-2 rounded-lg border border-accent-200 bg-accent-50 px-3 py-2 text-xs text-accent-800">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>Hudson will read this certificate, extract the expiry date and issuer, and create a compliance record automatically.</p>
        </div>
      )}

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
        <Sparkles className="h-4 w-4 text-accent-500" /> Generate Hudson summary
      </label>

      {error && <p className="sm:col-span-2 rounded bg-danger-100 px-3 py-2 text-sm text-danger-700">{error}</p>}

      {extracted && (
        <div className="sm:col-span-2 rounded-lg border border-success-500/30 bg-success-50 p-4 text-sm">
          <p className="mb-2 inline-flex items-center gap-2 font-semibold text-success-700">
            <CheckCircle2 className="h-4 w-4" /> Hudson logged this {extracted.label}
          </p>
          <ul className="grid gap-1 text-xs text-success-700 sm:grid-cols-2">
            {Object.entries(extracted.fields)
              .filter(([, v]) => v !== null && v !== undefined && v !== '')
              .map(([k, v]) => (
                <li key={k}><span className="font-medium">{k.replace(/_/g, ' ')}:</span> {String(v)}</li>
              ))}
          </ul>
        </div>
      )}

      <div className="sm:col-span-2 flex justify-end gap-2">
        {progress && <span className="self-center text-sm text-ink-500">{progress}</span>}
        <Button type="submit" disabled={busy}>Upload</Button>
      </div>
    </form>
  )
}
