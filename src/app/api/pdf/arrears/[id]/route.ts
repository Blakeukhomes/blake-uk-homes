import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { arrearsPdf } from '@/lib/pdf'
import { arrearsTotal } from '@/lib/rent'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: property } = await supabase.from('properties').select('*').eq('id', params.id).single()
  if (!property) return new NextResponse('Not found', { status: 404 })
  const { data: tenants = [] } = await supabase.from('tenants').select('*').eq('property_id', params.id).eq('is_active', true)
  const { data: payments = [] } = await supabase
    .from('rent_payments').select('*').eq('property_id', params.id).order('period_start')

  const pdf = arrearsPdf({
    property: {
      nickname: property.nickname,
      address: `${property.address_line_1}, ${property.city} ${property.postcode}`,
      monthly_rent: Number(property.monthly_rent ?? 0),
    },
    tenant: (tenants as any[])[0] ? { name: (tenants as any[])[0].full_name } : null,
    payments: (payments ?? []) as any,
    arrearsTotal: arrearsTotal((payments ?? []) as any),
  })

  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="arrears-${property.nickname.replace(/\s+/g, '-')}.pdf"`,
    },
  })
}
