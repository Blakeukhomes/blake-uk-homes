// Daily cron, called by Vercel Cron with Authorization: Bearer CRON_SECRET.
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/notifications/email'
import { complianceEvents, faultEvents, inspectionEvents, rentEvents } from '@/lib/notifications/rules'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type ProfileLite = { id: string; email: string; role: string }

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET
  if (expected) {
    const auth = req.headers.get('authorization')
    if (auth !== 'Bearer ' + expected) {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  const sb = createServiceClient()

  // ---- Auto-seed current month's rent row for every property ----
  // Idempotent: only inserts if a row for this property + this period doesn't exist.
  let rentRowsSeeded = 0
  try {
    const now = new Date()
    const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
      .toISOString().slice(0, 10) // yyyy-MM-dd

    const { data: allProps = [] } = await sb
      .from('properties')
      .select('id, monthly_rent, rent_due_day, status')

    const tenanted = ((allProps ?? []) as any[]).filter((p) => p.status !== 'vacant')

    if (tenanted.length > 0) {
      const { data: existing = [] } = await sb
        .from('rent_payments')
        .select('property_id')
        .eq('period_start', periodStart)
      const have = new Set(((existing ?? []) as any[]).map((r) => r.property_id))

      const toInsert = tenanted
        .filter((p) => !have.has(p.id))
        .map((p) => {
          const day = Math.min(Math.max(Number(p.rent_due_day) || 1, 1), 28)
          const dueDate = `${periodStart.slice(0, 8)}${String(day).padStart(2, '0')}`
          return {
            property_id: p.id,
            period_start: periodStart,
            due_date: dueDate,
            amount_due: Number(p.monthly_rent ?? 0),
            status: 'missing' as const,
          }
        })

      if (toInsert.length > 0) {
        const { error } = await sb.from('rent_payments').insert(toInsert)
        if (!error) rentRowsSeeded = toInsert.length
      }
    }
  } catch {
    // non-fatal — notifications still run
  }

  const [
    { data: certs = [] },
    { data: payments = [] },
    { data: tasks = [] },
    { data: faults = [] },
    { data: profiles = [] },
  ] = await Promise.all([
    sb.from('compliance_certificates').select('*'),
    sb.from('rent_payments').select('*').neq('status', 'paid'),
    sb.from('maintenance_tasks').select('*').is('completed_on', null),
    sb.from('fault_reports').select('*'),
    sb.from('profiles').select('id, email, role'),
  ])

  const events = [
    ...complianceEvents(certs as any),
    ...rentEvents(payments as any),
    ...inspectionEvents(tasks as any),
    ...faultEvents(faults as any),
  ]

  const { data: properties = [] } = await sb.from('properties').select('id, owner_id')
  const ownerByProperty = new Map<string, string>(
    (properties ?? []).map((p: any) => [p.id as string, p.owner_id as string])
  )
  const profileById = new Map<string, ProfileLite>(
    (profiles ?? []).map((p: any) => [p.id as string, p as ProfileLite])
  )

  let sent = 0
  for (const ev of events) {
    const ownerId = ownerByProperty.get(ev.property_id)
    const profile = ownerId ? profileById.get(ownerId) : null
    if (!profile || !profile.email) continue

    await sb.from('notifications').insert({
      user_id: ownerId,
      property_id: ev.property_id,
      channel: ev.channel,
      subject: ev.subject,
      body: ev.body,
    })

    if (ev.channel === 'email' && process.env.SENDGRID_API_KEY) {
      try {
        await sendEmail({ to: profile.email, subject: ev.subject, text: ev.body })
        sent++
      } catch {
        // non-fatal
      }
    }
  }

  return NextResponse.json({ events: events.length, emailsSent: sent, rentRowsSeeded })
}
