import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mtdQuarterPdf } from '@/lib/pdf'
import {
  type MtdTransaction, quarterById, quarterFor, summariseQuarter,
  EXPENSE_META, INCOME_META, GROUP_LABEL,
  type MtdGroupKey, type MtdExpenseCategory,
} from '@/lib/mtd'
import { format } from 'date-fns'

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

export async function GET(req: Request) {
  const url = new URL(req.url)
  const propertyId = url.searchParams.get('property')
  const qid = url.searchParams.get('q')
  if (!propertyId) return new NextResponse('property required', { status: 400 })

  const supabase = createClient()
  const { data: property } = await supabase.from('properties').select('*').eq('id', propertyId).single()
  if (!property) return new NextResponse('Property not found', { status: 404 })

  const quarter = (qid ? quarterById(qid) : null) ?? quarterFor(new Date())

  const { data: txs = [] } = await supabase
    .from('mtd_transactions').select('*')
    .eq('property_id', propertyId)
    .gte('transaction_date', format(quarter.start, 'yyyy-MM-dd'))
    .lte('transaction_date', format(quarter.end, 'yyyy-MM-dd'))

  const s = summariseQuarter(propertyId, (txs ?? []) as MtdTransaction[], quarter)

  const groups = GROUP_ORDER.map((g) => {
    const meta = GROUP_LABEL[g.key]
    const rows = g.cats.map((cat) => {
      const m = EXPENSE_META[cat]
      const found = s.expensesDeductible.find((r) => r.category === cat)
      return { label: m.label, hmrcLabel: m.hmrcLabel, sa105Box: m.sa105Box, total: found?.total ?? 0 }
    }).filter((r) => r.total > 0)
    const subtotal = rows.reduce((sum, r) => sum + r.total, 0)
    return { title: meta.title, box: meta.box, rows, subtotal }
  }).filter((g) => g.rows.length > 0)

  const section24 = {
    rows: (['btl_mortgage_interest','other_finance_costs'] as MtdExpenseCategory[]).map((cat) => {
      const m = EXPENSE_META[cat]
      const found = s.section24.find((r) => r.category === cat)
      return { label: m.label, sa105Box: m.sa105Box, total: found?.total ?? 0 }
    }).filter((r) => r.total > 0),
    subtotal: s.totalSection24,
    taxCredit: s.totalSection24 * 0.20,
  }

  const income = s.income.map((r) => {
    const m = INCOME_META[r.category]
    return { label: m.label, sa105Box: m.sa105Box, total: r.total }
  })

  const pdf = mtdQuarterPdf({
    property: {
      nickname: property.nickname,
      address: `${property.address_line_1}, ${property.city} ${property.postcode}`,
      property_income_allowance: !!property.property_income_allowance,
    },
    quarter: {
      label: quarter.label,
      start: format(quarter.start, 'yyyy-MM-dd'),
      end:   format(quarter.end, 'yyyy-MM-dd'),
    },
    income,
    groups,
    section24,
    totalIncome: s.totalIncome,
    totalDeductibleExpenses: s.totalDeductibleExpenses,
    net: s.net,
  })

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="mtd-${quarter.id}-${property.nickname.replace(/\s+/g, '-')}.pdf"`,
    },
  })
}
