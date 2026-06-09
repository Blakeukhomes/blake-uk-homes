import { NextResponse } from 'next/server'
import { format } from 'date-fns'
import JSZip from 'jszip'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isDemoMode } from '@/lib/demo/client'
import { quarterById, quarterFor, type MtdTransaction } from '@/lib/mtd'
import { buildMtdXlsx, buildMtdTransactionsXlsx } from '@/lib/xlsx'
import { INCOME_META, EXPENSE_META } from '@/lib/mtd'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function toCsv(rows: any[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const escape = (v: any) => {
    if (v == null) return ''
    const s = String(v)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }
  const out = [headers.join(',')]
  for (const r of rows) out.push(headers.map((h) => escape(r[h])).join(','))
  return out.join('\n')
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const propertyId = url.searchParams.get('property')
  const qid = url.searchParams.get('q')
  if (!propertyId) return new NextResponse('property required', { status: 400 })

  const supabase = createClient()
  const { data: property } = await supabase.from('properties').select('*').eq('id', propertyId).single()
  if (!property) return new NextResponse('Property not found', { status: 404 })

  const quarter = (qid ? quarterById(qid) : null) ?? quarterFor(new Date())

  // Pull all child data in parallel
  const [
    { data: tenants = [] },
    { data: rent = [] },
    { data: certs = [] },
    { data: tickets = [] },
    { data: faults = [] },
    { data: faultEvents = [] },
    { data: bookings = [] },
    { data: docs = [] },
    { data: mtd = [] },
    { data: mortgages = [] },
  ] = await Promise.all([
    supabase.from('tenants').select('*').eq('property_id', propertyId),
    supabase.from('rent_payments').select('*').eq('property_id', propertyId),
    supabase.from('compliance_certificates').select('*').eq('property_id', propertyId),
    supabase.from('maintenance_tasks').select('*').eq('property_id', propertyId),
    supabase.from('fault_reports').select('*').eq('property_id', propertyId),
    supabase.from('fault_events').select('*'),
    supabase.from('contractor_bookings').select('*').eq('property_id', propertyId),
    supabase.from('documents').select('*').eq('property_id', propertyId),
    supabase.from('mtd_transactions').select('*')
      .eq('property_id', propertyId)
      .gte('transaction_date', format(quarter.start, 'yyyy-MM-dd'))
      .lte('transaction_date', format(quarter.end, 'yyyy-MM-dd')),
    supabase.from('mortgages').select('*').eq('property_id', propertyId),
  ])

  // Filter fault events to only those belonging to this property's faults
  const propertyFaultIds = new Set((faults ?? []).map((f: any) => f.id))
  const propertyFaultEvents = (faultEvents ?? []).filter((e: any) => propertyFaultIds.has(e.fault_id))

  const zip = new JSZip()
  const root = `${property.nickname.replace(/[^a-z0-9-]/gi, '_')}-${quarter.id}`
  const folder = zip.folder(root)!

  // CSVs
  folder.file('property.csv',              toCsv([property]))
  folder.file('tenants.csv',               toCsv(tenants ?? []))
  folder.file('rent_payments.csv',         toCsv(rent ?? []))
  folder.file('compliance_certificates.csv', toCsv(certs ?? []))
  folder.file('maintenance_tickets.csv',   toCsv(tickets ?? []))
  folder.file('fault_reports.csv',         toCsv(faults ?? []))
  folder.file('fault_events.csv',          toCsv(propertyFaultEvents))
  folder.file('contractor_bookings.csv',   toCsv(bookings ?? []))
  folder.file('documents_index.csv',       toCsv((docs ?? []).map((d: any) => ({
    id: d.id, kind: d.kind, title: d.title, mime_type: d.mime_type,
    file_size: d.file_size, ai_summary: d.ai_summary, created_at: d.created_at,
    storage_path: d.storage_path,
  }))))
  folder.file('mtd_transactions.csv',      toCsv(mtd ?? []))
  folder.file('mtd_transactions_categorised.csv', toCsv(((mtd ?? []) as any[]).map((t) => {
    const incomeMeta = t.income_category ? (INCOME_META as any)[t.income_category] : null
    const expenseMeta = t.expense_category ? (EXPENSE_META as any)[t.expense_category] : null
    const meta = incomeMeta ?? expenseMeta
    return {
      transaction_date: t.transaction_date,
      kind: t.kind,
      category: meta?.label ?? '',
      hmrc_label: meta?.hmrcLabel ?? '',
      sa105_box: meta?.sa105Box ?? '',
      section24: expenseMeta?.section24 ? 'YES' : '',
      amount: Number(t.amount),
      supplier_or_payer: t.supplier_or_payer ?? '',
      description: t.description ?? '',
    }
  })))
  folder.file('mortgages.csv',             toCsv(mortgages ?? []))

  // MTD xlsx (accountant template)
  const xlsx = await buildMtdXlsx({
    property: {
      nickname: property.nickname,
      address: `${property.address_line_1}, ${property.city} ${property.postcode}`,
      furnished: true,
      property_income_allowance: !!property.property_income_allowance,
    },
    quarter,
    transactions: (mtd ?? []) as MtdTransaction[],
  })
  folder.file(`MTD-${quarter.id}-${property.nickname.replace(/\s+/g, '-')}.xlsx`, xlsx)

  const txDetail = await buildMtdTransactionsXlsx({
    property: { nickname: property.nickname },
    transactions: (mtd ?? []) as MtdTransaction[],
  })
  folder.file(`MTD-${quarter.id}-${property.nickname.replace(/\s+/g, '-')}-transactions.xlsx`, txDetail)

  // Document binaries (skip in demo mode)
  if (!isDemoMode()) {
    const svc = createServiceClient()
    const docFolder = folder.folder('documents')!
    for (const d of (docs ?? []) as any[]) {
      try {
        const { data: blob } = await svc.storage.from('property-documents').download(d.storage_path)
        if (blob) {
          const arr = await blob.arrayBuffer()
          const safeName = `${d.kind}-${d.title.replace(/[^a-z0-9. -]/gi, '_')}`
          docFolder.file(safeName, Buffer.from(arr))
        }
      } catch {
        // skip files that fail
      }
    }
  } else {
    folder.file('documents/README.txt', 'Document binaries are only included when connected to a live Supabase storage bucket. CSVs above contain the document index.')
  }

  // Readme
  folder.file('README.txt',
`Blake UK Homes — Quarterly export
Property: ${property.nickname}
Address: ${property.address_line_1}, ${property.city} ${property.postcode}
Quarter: ${quarter.label}
Period: ${format(quarter.start, 'd MMM yyyy')} to ${format(quarter.end, 'd MMM yyyy')}
Generated: ${new Date().toLocaleString('en-GB')}

Contents:
- *.csv          structured records exported from the database
- MTD-*.xlsx     HMRC ITSA format spreadsheet matching the accountant template
- documents/    original PDFs, photos, videos linked to this property
`)

  const buffer = await zip.generateAsync({ type: 'nodebuffer' })

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${root}.zip"`,
    },
  })
}
