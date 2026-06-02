import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { isDemoMode } from '@/lib/demo/client'
import { arrearsTotal, formatGBP } from '@/lib/rent'
import { complianceState, COMPLIANCE_META } from '@/lib/compliance'
import type { ComplianceCertificate, Invoice, Property, RentPayment } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const SYSTEM = `You are Matt, the AI assistant for Blake UK Homes, a private UK landlord property management app.
You help the owner stay on top of compliance, rent, tenant communication, maintenance, and MTD quarterly tax.
Be concise (under 200 words), specific, and reference the portfolio data provided in the SYSTEM CONTEXT.
If you don't know something, say so plainly. Don't use em-dashes.
For money, use £ and en-GB formatting.`

async function buildContext() {
  const supabase = createClient()
  const [{ data: properties = [] }, { data: payments = [] }, { data: certs = [] }, { data: invoices = [] }] = await Promise.all([
    supabase.from('properties').select('*'),
    supabase.from('rent_payments').select('*'),
    supabase.from('compliance_certificates').select('*'),
    supabase.from('invoices').select('status, total'),
  ])

  const props = (properties ?? []) as Property[]
  const ps = (payments ?? []) as RentPayment[]
  const cs = (certs ?? []) as ComplianceCertificate[]
  const invs = (invoices ?? []) as Invoice[]

  const summary = {
    properties: props.length,
    tenanted: props.filter((p) => p.status === 'tenanted').length,
    vacant:   props.filter((p) => p.status === 'vacant').length,
    legal:    props.filter((p) => p.status === 'legal_proceedings').length,
    total_arrears: formatGBP(arrearsTotal(ps)),
    compliance: {
      expired:  cs.filter((c) => complianceState(c) === 'expired').length,
      due_soon: cs.filter((c) => complianceState(c) === 'due_soon').length,
      valid:    cs.filter((c) => complianceState(c) === 'valid').length,
    },
    invoices: {
      total: invs.length,
      overdue: invs.filter((i) => i.status === 'overdue').length,
      paid: invs.filter((i) => i.status === 'paid').length,
      total_outstanding: formatGBP(invs.filter((i) => i.status !== 'paid' && i.status !== 'void').reduce((s, i) => s + Number(i.total), 0)),
    },
  }

  const propertyLines = props.map((p) => {
    const pCerts = cs.filter((c) => c.property_id === p.id)
    const alerts = pCerts.filter((c) => complianceState(c) !== 'valid')
    const arrears = arrearsTotal(ps.filter((x) => x.property_id === p.id))
    const alertText = alerts.length === 0
      ? 'compliance ok'
      : alerts.map((a) => `${COMPLIANCE_META[a.type].shortLabel} ${complianceState(a)}`).join(', ')
    return `- ${p.nickname} (${p.city}): ${p.status}, rent ${formatGBP(p.monthly_rent ?? 0)}/mo, arrears ${formatGBP(arrears)}; ${alertText}`
  }).join('\n')

  return `SYSTEM CONTEXT (portfolio snapshot):
${JSON.stringify(summary, null, 2)}

Properties:
${propertyLines || 'none'}
`
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const userMessages = (body.messages ?? []) as { role: 'user' | 'assistant'; content: string }[]

    const context = await buildContext()

    // In demo mode without an API key, return a context-aware canned reply.
    if (isDemoMode() || !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes('placeholder')) {
      const lastUser = userMessages.filter((m) => m.role === 'user').slice(-1)[0]?.content?.toLowerCase() ?? ''
      const reply = demoReply(lastUser, context)
      return NextResponse.json({ reply })
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'

    const resp = await anthropic.messages.create({
      model,
      max_tokens: 600,
      system: `${SYSTEM}\n\n${context}`,
      messages: userMessages.map((m) => ({ role: m.role, content: m.content })),
    })
    const reply = resp.content
      .filter((c) => c.type === 'text')
      .map((c) => (c as any).text)
      .join('\n')
      .trim()
    return NextResponse.json({ reply })
  } catch (e: any) {
    return NextResponse.json({ reply: `Sorry, I hit an error: ${e?.message ?? 'unknown'}` }, { status: 200 })
  }
}

function demoReply(input: string, context: string): string {
  // Lightweight pattern-based demo reply that uses real demo data
  const summary = (context.match(/\{[\s\S]*?\}/)?.[0] ?? '{}')
  if (input.includes('overdue rent') || input.includes('rent overdue')) {
    return 'Saxon Court is showing rent overdue this month. The Walsh tenancy is on the 15th, and the May payment is unpaid. Want me to draft a reminder?'
  }
  if (input.includes('portfolio') || input.includes('overview')) {
    return `Portfolio snapshot:\n${summary}\n\nTwo properties are tenanted, one vacant (Marlow Studio). Saxon Court has expired Gas Safety, action needed.`
  }
  if (input.includes('reminder')) {
    return 'You have one expired Gas Safety (Saxon Court, 35 days), Hollow Lane Gas Safety due in 55 days, and an overdue Saxon Court inspection.'
  }
  if (input.includes('active leases') || input.includes('leases')) {
    return 'Two active tenancies. Jasmin Patel at Hollow Lane Flat (£1,450/mo, ends in ~5 months). Tom and Aleksandra Walsh at Saxon Court (£1,875/mo, currently rolling).'
  }
  if (input.includes('mtd') || input.includes('tax')) {
    return 'For the current quarter, Hollow Lane shows £7,200 income and £11,210 in expenses across all 24 HMRC categories. Net loss £4,010. PDF export is on the MTD page.'
  }
  return "I'm running in demo mode without a live Claude key, but here is what I can see about your portfolio:\n\n" + summary
}
