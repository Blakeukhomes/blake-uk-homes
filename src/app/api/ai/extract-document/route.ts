// Structured field extraction from uploaded documents.
// Powered by Claude tool-use with a strict JSON schema per document kind.
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isDemoMode } from '@/lib/demo/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ---- Schemas per document kind ----
const SCHEMAS: Record<string, { name: string; description: string; input_schema: any }> = {
  gas_safety: {
    name: 'extract_gas_safety',
    description: 'Extract fields from a UK landlord Gas Safety Certificate (CP12).',
    input_schema: {
      type: 'object',
      properties: {
        property_address: { type: 'string' },
        engineer_name:    { type: 'string' },
        gas_safe_number:  { type: 'string' },
        inspection_date:  { type: 'string', description: 'ISO yyyy-mm-dd' },
        expiry_date:      { type: 'string', description: 'ISO yyyy-mm-dd, typically +12 months' },
        defects_found:    { type: 'string' },
        reference:        { type: 'string' },
      },
      required: ['property_address', 'engineer_name', 'inspection_date'],
    },
  },
  mortgage_statement: {
    name: 'extract_mortgage_statement',
    description: 'Extract fields from a UK BTL mortgage statement.',
    input_schema: {
      type: 'object',
      properties: {
        lender:              { type: 'string' },
        account_number:      { type: 'string' },
        mortgage_type:       { type: 'string', enum: ['repayment', 'interest_only', 'part_and_part'] },
        rate_kind:           { type: 'string', enum: ['fixed', 'variable', 'tracker', 'discount'] },
        interest_rate:       { type: 'number', description: 'Percentage, e.g. 5.25' },
        monthly_payment:     { type: 'number' },
        monthly_interest:    { type: 'number' },
        outstanding_balance: { type: 'number' },
        fix_end_date:        { type: 'string', description: 'ISO yyyy-mm-dd' },
        statement_date:      { type: 'string', description: 'ISO yyyy-mm-dd' },
      },
      required: ['lender'],
    },
  },
  receipt: {
    name: 'extract_receipt',
    description: 'Extract fields from a receipt or invoice paid by the landlord.',
    input_schema: {
      type: 'object',
      properties: {
        supplier:         { type: 'string' },
        date:             { type: 'string', description: 'ISO yyyy-mm-dd' },
        amount_total:     { type: 'number' },
        amount_vat:       { type: 'number' },
        description:      { type: 'string' },
        suggested_mtd_category: {
          type: 'string',
          enum: ['council_tax','light_and_heat','water_rates','white_goods','insurance',
                 'window_cleaning','general_cleaning','oven_cleaning','gardening',
                 'premise_running_costs','telephone','professional_fees','legal_fees',
                 'redecorating','ground_rent','service_charges','repairs_and_maintenance',
                 'btl_mortgage_interest','other_finance_costs','accountancy_fees',
                 'bank_charges','travel_costs','other'],
          description: 'Best HMRC ITSA category for this receipt',
        },
      },
      required: ['supplier', 'date', 'amount_total'],
    },
  },
  inventory: {
    name: 'extract_inventory',
    description: 'Extract fields from a third-party inventory clerk report or invoice.',
    input_schema: {
      type: 'object',
      properties: {
        company_name: { type: 'string' },
        clerk_name:   { type: 'string' },
        tenant_name:  { type: 'string' },
        property_address: { type: 'string' },
        report_date:  { type: 'string', description: 'ISO yyyy-mm-dd' },
        invoice_amount: { type: 'number' },
        report_type:  { type: 'string', enum: ['move_in', 'move_out', 'invoice'] },
      },
      required: ['company_name', 'report_date'],
    },
  },
}

export async function POST(req: Request) {
  try {
    const { document_id, kind } = await req.json() as { document_id: string; kind: keyof typeof SCHEMAS }
    if (!document_id || !kind || !SCHEMAS[kind]) {
      return NextResponse.json({ error: 'document_id and a valid kind are required' }, { status: 400 })
    }

    // In demo mode, return mocked structured data so the UI behaviour can be demonstrated
    if (isDemoMode()) {
      return NextResponse.json({ fields: demoFields(kind) })
    }

    const supabase = createClient()
    const { data: doc } = await supabase.from('documents').select('*').eq('id', document_id).single()
    if (!doc) return NextResponse.json({ error: 'document not found' }, { status: 404 })

    const sb = createServiceClient()
    const { data: blob, error: dlErr } = await sb.storage.from('property-documents').download(doc.storage_path)
    if (dlErr || !blob) return NextResponse.json({ error: dlErr?.message ?? 'download failed' }, { status: 500 })
    const bytes = Buffer.from(await blob.arrayBuffer())

    // Extract document text (best effort)
    let text = ''
    if (doc.mime_type === 'application/pdf' || doc.storage_path.toLowerCase().endsWith('.pdf')) {
      try {
        const pdfParse = (await import('pdf-parse')).default
        const parsed = await pdfParse(bytes)
        text = (parsed.text || '').trim()
      } catch { text = '' }
    } else if (doc.mime_type?.startsWith('text/')) {
      text = bytes.toString('utf8')
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
    const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'

    const schema = SCHEMAS[kind]
    const userContent: any[] = []
    if (text) {
      userContent.push({ type: 'text', text: `Document text:\n\n${text.slice(0, 60_000)}` })
    } else if (doc.mime_type?.startsWith('image/')) {
      userContent.push({ type: 'image', source: { type: 'base64', media_type: doc.mime_type, data: bytes.toString('base64') } })
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 })
    }
    userContent.push({ type: 'text', text: `Use the ${schema.name} tool to return the extracted fields. If a field is unknown, omit it.` })

    const resp = await anthropic.messages.create({
      model,
      max_tokens: 800,
      tools: [schema as any],
      tool_choice: { type: 'tool', name: schema.name } as any,
      messages: [{ role: 'user', content: userContent }],
    })

    // Find the tool_use block in the response
    const toolUse = resp.content.find((c: any) => c.type === 'tool_use')
    const fields = toolUse ? (toolUse as any).input : {}
    return NextResponse.json({ fields })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Server error' }, { status: 500 })
  }
}

function demoFields(kind: string) {
  if (kind === 'gas_safety') return {
    property_address: 'William Street, Luton LU2 7RE',
    engineer_name: 'Mark Reeve',
    gas_safe_number: '401-321',
    inspection_date: '2026-03-14',
    expiry_date: '2027-03-14',
    defects_found: 'None',
    reference: 'NG-2025-8810',
  }
  if (kind === 'mortgage_statement') return {
    lender: 'Barclays',
    account_number: 'BCL-99012',
    mortgage_type: 'interest_only',
    rate_kind: 'fixed',
    interest_rate: 5.25,
    monthly_payment: 1500,
    monthly_interest: 1500,
    outstanding_balance: 342500,
    fix_end_date: '2026-10-19',
    statement_date: '2026-05-30',
  }
  if (kind === 'receipt') return {
    supplier: 'British Gas',
    date: '2026-05-12',
    amount_total: 150,
    amount_vat: 7.50,
    description: 'Gas and electricity void period',
    suggested_mtd_category: 'light_and_heat',
  }
  if (kind === 'inventory') return {
    company_name: 'Luton Inventory Clerks Ltd',
    clerk_name: 'Sarah Johnson',
    tenant_name: 'Kamran Shah',
    property_address: 'William Street, Luton LU2 7RE',
    report_date: '2024-11-01',
    invoice_amount: 165,
    report_type: 'move_in',
  }
  return {}
}
