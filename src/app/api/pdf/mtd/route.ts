import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mtdQuarterPdf } from '@/lib/pdf'
import { type MtdTransaction, quarterById, quarterFor, summariseQuarter } from '@/lib/mtd'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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

  const summary = summariseQuarter(propertyId, (txs ?? []) as MtdTransaction[], quarter)

  const pdf = mtdQuarterPdf({
    property: {
      nickname: property.nickname,
      address: `${property.address_line_1}, ${property.city} ${property.postcode}`,
    },
    quarter: {
      label: quarter.label,
      start: format(quarter.start, 'yyyy-MM-dd'),
      end:   format(quarter.end, 'yyyy-MM-dd'),
    },
    income:   summary.income.map((r) => ({ label: r.label, total: r.total })),
    expenses: summary.expenses.map((r) => ({ label: r.label, total: r.total })),
    totalIncome:   summary.totalIncome,
    totalExpenses: summary.totalExpenses,
    net: summary.net,
  })

  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="mtd-${quarter.id}-${property.nickname.replace(/\s+/g, '-')}.pdf"`,
    },
  })
}
