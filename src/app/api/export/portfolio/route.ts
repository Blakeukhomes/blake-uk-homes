// Portfolio-wide MTD export — aggregates ALL properties of a chosen ownership type
// for a single quarter, mirroring how SA105 is filed (one return covers every
// personally-owned property combined). Limited-company portfolios get one
// aggregated report per company.
import { NextResponse } from 'next/server'
import { format } from 'date-fns'
import JSZip from 'jszip'
import ExcelJS from 'exceljs'
import { createClient } from '@/lib/supabase/server'
import {
  quarterById, quarterFor, summariseQuarter,
  EXPENSE_META, INCOME_META, GROUP_LABEL,
  type MtdGroupKey, type MtdExpenseCategory, type MtdTransaction,
} from '@/lib/mtd'
import { mtdQuarterPdf } from '@/lib/pdf'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const GROUP_ORDER: { key: MtdGroupKey; cats: MtdExpenseCategory[] }[] = [
  { key: 'group1_repairs', cats: [
    'repairs_and_maintenance','redecorating','white_goods','window_cleaning',
    'general_cleaning','oven_cleaning','gardening','insurance','ground_rent','service_charges',
  ] },
  { key: 'group2_services', cats: ['council_tax','light_and_heat','water_rates','premise_running_costs','telephone'] },
  { key: 'group4_professional', cats: ['professional_fees','legal_fees','accountancy_fees','bank_charges'] },
  { key: 'group5_other', cats: ['travel_costs','rent_a_room_expense','other'] },
  { key: 'private_use', cats: ['private_use_adjustment'] },
]

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
  const ownership = (url.searchParams.get('ownership') ?? 'personal') as 'personal' | 'limited_company'
  const companyName = url.searchParams.get('company') // optional sub-filter for Ltd Co
  const qid = url.searchParams.get('q')

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const quarter = (qid ? quarterById(qid) : null) ?? quarterFor(new Date())

  // Pull all properties of the chosen ownership type
  let propQuery = supabase
    .from('properties')
    .select('*')
    .eq('owner_id', user.id)
    .eq('ownership_type', ownership)
  if (ownership === 'limited_company' && companyName) {
    propQuery = propQuery.eq('company_name', companyName)
  }
  const { data: properties = [] } = await propQuery
  const props = (properties ?? []) as any[]
  if (props.length === 0) {
    return new NextResponse(`No ${ownership === 'limited_company' ? 'Limited Company' : 'personal'} properties found.`, { status: 404 })
  }

  // Pull all transactions in the quarter for those properties
  const propIds = props.map((p) => p.id)
  const { data: txs = [] } = await supabase
    .from('mtd_transactions')
    .select('*')
    .in('property_id', propIds)
    .gte('transaction_date', format(quarter.start, 'yyyy-MM-dd'))
    .lte('transaction_date', format(quarter.end, 'yyyy-MM-dd'))

  const allTx = (txs ?? []) as MtdTransaction[]

  // Aggregate using a pseudo property_id of the whole portfolio
  const aggregated = allTx.map((t) => ({ ...t, property_id: 'PORTFOLIO' }))
  const portfolioSummary = summariseQuarter('PORTFOLIO', aggregated, quarter, ownership)

  // Per-property summaries for the appendix
  const perPropertySummaries = props.map((p) => ({
    property: p,
    summary: summariseQuarter(p.id, allTx, quarter, ownership),
  }))

  // ---------- Build the portfolio PDF ----------
  const groups = GROUP_ORDER.map((g) => {
    const meta = GROUP_LABEL[g.key]
    const rows = g.cats.map((cat) => {
      const m = EXPENSE_META[cat]
      const found = portfolioSummary.expensesDeductible.find((r) => r.category === cat)
      return { label: m.label, hmrcLabel: m.hmrcLabel, sa105Box: m.sa105Box, total: found?.total ?? 0 }
    }).filter((r) => r.total > 0)
    const subtotal = rows.reduce((sum, r) => sum + r.total, 0)
    return { title: meta.title, box: meta.box, rows, subtotal }
  }).filter((g) => g.rows.length > 0)

  const section24 = {
    rows: (['btl_mortgage_interest','other_finance_costs'] as MtdExpenseCategory[]).map((cat) => {
      const m = EXPENSE_META[cat]
      const found = portfolioSummary.section24.find((r) => r.category === cat)
      return { label: m.label, sa105Box: m.sa105Box, total: found?.total ?? 0 }
    }).filter((r) => r.total > 0),
    subtotal: portfolioSummary.totalSection24,
    taxCredit: portfolioSummary.totalSection24 * 0.20,
  }

  const income = portfolioSummary.income.map((r) => {
    const m = INCOME_META[r.category]
    return { label: m.label, sa105Box: m.sa105Box, total: r.total }
  })

  const portfolioLabel = ownership === 'limited_company'
    ? (companyName ?? props[0]?.company_name ?? 'Limited Company')
    : `Personal Portfolio (${props.length} propert${props.length === 1 ? 'y' : 'ies'})`

  const pdf = mtdQuarterPdf({
    property: {
      nickname: portfolioLabel,
      address: props.map((p) => p.nickname).join(', '),
      ownership_type: ownership,
      company_name: companyName ?? null,
    },
    quarter: {
      label: quarter.label,
      start: format(quarter.start, 'yyyy-MM-dd'),
      end:   format(quarter.end, 'yyyy-MM-dd'),
    },
    income, groups, section24,
    totalIncome: portfolioSummary.totalIncome,
    totalDeductibleExpenses: portfolioSummary.totalDeductibleExpenses,
    net: portfolioSummary.net,
  })

  // ---------- Build the portfolio XLSX (aggregated sheet + per-property sheet) ----------
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Blake UK Homes'
  wb.created = new Date()

  // Sheet 1: Portfolio summary
  const ws = wb.addWorksheet('Portfolio Summary')
  ws.columns = [{ width: 32 }, { width: 18 }, { width: 14 }]
  ws.getCell('A1').value = `${ownership === 'limited_company' ? 'Limited Company' : 'Personal'} Portfolio MTD Summary`
  ws.getCell('A1').font = { bold: true, size: 14 }
  ws.getCell('A2').value = `${quarter.label} — ${props.length} property${props.length === 1 ? '' : 's'}`
  ws.getCell('A2').font = { italic: true, color: { argb: 'FF6B7280' } }

  let row = 4
  ws.getCell(`A${row}`).value = 'Total income'
  ws.getCell(`A${row}`).font = { bold: true }
  ws.getCell(`C${row}`).value = portfolioSummary.totalIncome
  ws.getCell(`C${row}`).numFmt = '#,##0.00'
  row++
  ws.getCell(`A${row}`).value = 'Total deductible expenses'
  ws.getCell(`A${row}`).font = { bold: true }
  ws.getCell(`C${row}`).value = portfolioSummary.totalDeductibleExpenses
  ws.getCell(`C${row}`).numFmt = '#,##0.00'
  row++
  ws.getCell(`A${row}`).value = portfolioSummary.net >= 0 ? 'Taxable profit' : 'Taxable loss'
  ws.getCell(`A${row}`).font = { bold: true }
  ws.getCell(`C${row}`).value = portfolioSummary.net
  ws.getCell(`C${row}`).numFmt = '#,##0.00;-#,##0.00'
  ws.getCell(`C${row}`).font = { bold: true, color: { argb: portfolioSummary.net >= 0 ? 'FF15803D' : 'FFB91C1C' } }
  if (ownership === 'personal') {
    row += 2
    ws.getCell(`A${row}`).value = 'Section 24 mortgage interest (Box 44)'
    ws.getCell(`A${row}`).font = { bold: true, color: { argb: 'FFB91C1C' } }
    ws.getCell(`C${row}`).value = portfolioSummary.totalSection24
    ws.getCell(`C${row}`).numFmt = '#,##0.00'
    row++
    ws.getCell(`A${row}`).value = '20% tax credit'
    ws.getCell(`A${row}`).font = { italic: true, color: { argb: 'FFB91C1C' } }
    ws.getCell(`C${row}`).value = portfolioSummary.totalSection24 * 0.20
    ws.getCell(`C${row}`).numFmt = '#,##0.00'
  }

  // Sheet 2: Per-property breakdown
  const ws2 = wb.addWorksheet('Per Property')
  ws2.columns = [
    { header: 'Property',              width: 32 },
    { header: 'Total Income (£)',      width: 18 },
    { header: 'Deductible Exp (£)',    width: 18 },
    { header: 'Taxable Profit (£)',    width: 18 },
    { header: 'Section 24 (£)',        width: 16 },
    { header: '20% Credit (£)',        width: 16 },
  ]
  ws2.getRow(1).font = { bold: true }
  ws2.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } }
  for (const { property, summary } of perPropertySummaries) {
    ws2.addRow([
      property.nickname,
      summary.totalIncome,
      summary.totalDeductibleExpenses,
      summary.net,
      summary.totalSection24,
      summary.totalSection24 * 0.20,
    ])
  }
  ws2.getColumn(2).numFmt = '#,##0.00'
  ws2.getColumn(3).numFmt = '#,##0.00'
  ws2.getColumn(4).numFmt = '#,##0.00;-#,##0.00'
  ws2.getColumn(5).numFmt = '#,##0.00'
  ws2.getColumn(6).numFmt = '#,##0.00'

  const xlsxBuf = Buffer.from(await wb.xlsx.writeBuffer() as ArrayBuffer)

  // ---------- Categorised CSV (every line tagged with property, category, box) ----------
  const categorisedCsv = toCsv(allTx.map((t) => {
    const prop = props.find((p) => p.id === t.property_id)
    const incomeMeta = t.income_category ? (INCOME_META as any)[t.income_category] : null
    const expenseMeta = t.expense_category ? (EXPENSE_META as any)[t.expense_category] : null
    const meta = incomeMeta ?? expenseMeta
    return {
      transaction_date: t.transaction_date,
      property: prop?.nickname ?? t.property_id,
      kind: t.kind,
      category: meta?.label ?? '',
      hmrc_label: meta?.hmrcLabel ?? '',
      sa105_box: meta?.sa105Box ?? '',
      section24: expenseMeta?.section24 && ownership === 'personal' ? 'YES' : '',
      amount: Number(t.amount),
      supplier_or_payer: t.supplier_or_payer ?? '',
      description: t.description ?? '',
    }
  }))

  // ---------- Bundle into a zip ----------
  const zip = new JSZip()
  const ownershipLabel = ownership === 'limited_company' ? (companyName ?? 'company').replace(/[^a-z0-9-]/gi, '_') : 'personal'
  const root = `portfolio-${ownershipLabel}-${quarter.id}`
  const folder = zip.folder(root)!
  folder.file(`${root}.pdf`, pdf)
  folder.file(`${root}.xlsx`, xlsxBuf)
  folder.file(`${root}-transactions.csv`, categorisedCsv)
  folder.file('README.txt',
`Blake UK Homes — Portfolio quarterly export
Ownership: ${ownership === 'limited_company' ? `Limited Company (${companyName ?? props[0]?.company_name ?? '-'})` : 'Personal'}
Properties: ${props.length} (${props.map((p) => p.nickname).join(', ')})
Quarter: ${quarter.label}
Period: ${format(quarter.start, 'd MMM yyyy')} to ${format(quarter.end, 'd MMM yyyy')}
Generated: ${new Date().toLocaleString('en-GB')}

Contents:
- *.pdf        Combined SA105 summary across the whole portfolio
- *.xlsx       Sheet 1 portfolio totals, Sheet 2 per-property breakdown
- *.csv        Every transaction tagged with property + SA105 box for accountant import
`)

  const buffer = await zip.generateAsync({ type: 'nodebuffer' })
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${root}.zip"`,
    },
  })
}
