import { NextResponse } from 'next/server'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { quarterById, quarterFor, type MtdTransaction } from '@/lib/mtd'
import { buildMtdXlsx } from '@/lib/xlsx'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const propertyId = url.searchParams.get('property')
  const qid = url.searchParams.get('q')
  if (!propertyId) return new NextResponse('property required', { status: 400 })

  const supabase = createClient()
  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single()
  if (!property) return new NextResponse('Property not found', { status: 404 })

  const quarter = (qid ? quarterById(qid) : null) ?? quarterFor(new Date())

  const { data: txs = [] } = await supabase
    .from('mtd_transactions')
    .select('*')
    .eq('property_id', propertyId)
    .gte('transaction_date', format(quarter.start, 'yyyy-MM-dd'))
    .lte('transaction_date', format(quarter.end, 'yyyy-MM-dd'))

  const safeName = String(property.nickname).replace(/\s+/g, '-')
  const filename = 'mtd-' + quarter.id + '-' + safeName + '.xlsx'
  const address = property.address_line_1 + ', ' + property.city + ' ' + property.postcode

  const xlsx = await buildMtdXlsx({
    property: {
      nickname: property.nickname,
      address,
      furnished: true,
      ownership_type: (property.ownership_type ?? 'personal') as 'personal' | 'limited_company',
      company_name: property.company_name ?? null,
    },
    quarter,
    transactions: (txs ?? []) as MtdTransaction[],
  })

  return new NextResponse(new Uint8Array(xlsx), {
    headers: {
      'Content-Type': XLSX_MIME,
      'Content-Disposition': 'attachment; filename="' + filename + '"',
    },
  })
}
