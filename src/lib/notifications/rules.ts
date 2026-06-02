// Notification rules, the cadences specified in the product brief.
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { COMPLIANCE_META, complianceState } from '@/lib/compliance'
import type { ComplianceCertificate, RentPayment, MaintenanceTask, FaultReport } from '@/lib/types'

export interface NotificationEvent {
  channel: 'email' | 'push'
  property_id: string
  subject: string
  body: string
  url?: string
  tag?: string
}

export function complianceEvents(certs: ComplianceCertificate[]): NotificationEvent[] {
  return certs.flatMap((c) => {
    const state = complianceState(c)
    if (state === 'valid') return []
    const meta = COMPLIANCE_META[c.type]
    const days = differenceInCalendarDays(parseISO(c.expires_on), new Date())
    return [
      {
        channel: 'email',
        property_id: c.property_id,
        subject: `${meta.shortLabel} ${state === 'expired' ? 'EXPIRED' : `due in ${days} days`}`,
        body: `Your ${meta.label} expires on ${c.expires_on}. Action required.`,
        url: `/properties/${c.property_id}/compliance`,
        tag: `compliance:${c.type}:${c.property_id}`,
      },
      { channel: 'push', property_id: c.property_id,
        subject: `${meta.shortLabel} ${state === 'expired' ? 'expired' : `due in ${days} days`}`,
        body: `Renew ${meta.shortLabel} for this property.`,
        url: `/properties/${c.property_id}/compliance`,
        tag: `compliance:${c.type}:${c.property_id}` },
    ]
  })
}

export function rentEvents(payments: RentPayment[]): NotificationEvent[] {
  const today = new Date()
  return payments
    .filter((p) => p.status !== 'paid' && differenceInCalendarDays(today, parseISO(p.due_date)) >= 1)
    .map((p) => ({
      channel: 'email' as const,
      property_id: p.property_id,
      subject: 'Rent overdue',
      body: `Rent for period ${p.period_start} is overdue. Amount due £${p.amount_due}, paid £${p.amount_paid}.`,
      url: `/properties/${p.property_id}/rent`,
      tag: `rent:${p.property_id}:${p.period_start}`,
    }))
}

export function inspectionEvents(tasks: MaintenanceTask[]): NotificationEvent[] {
  const today = new Date()
  return tasks
    .filter((t) => !t.completed_on && differenceInCalendarDays(parseISO(t.due_on), today) <= 120 && t.kind === 'inspection')
    .map((t) => ({
      channel: 'email' as const,
      property_id: t.property_id,
      subject: `Inspection due, ${t.title}`,
      body: `Quarterly inspection due ${t.due_on}.`,
      url: `/properties/${t.property_id}/maintenance`,
      tag: `inspection:${t.id}`,
    }))
}

export function faultEvents(faults: FaultReport[]): NotificationEvent[] {
  const today = new Date()
  return faults.flatMap((f) => {
    const events: NotificationEvent[] = []
    if (f.current_state === 'reported') {
      events.push({
        channel: 'push',
        property_id: f.property_id,
        subject: 'Fault reported',
        body: `${f.category}, ${f.reference}`,
        url: `/faults/${f.id}`,
        tag: `fault:${f.id}:reported`,
      })
    }
    const daysSince = differenceInCalendarDays(today, parseISO(f.reported_at))
    if (daysSince >= 7 && !['resolved', 'closed'].includes(f.current_state)) {
      events.push({
        channel: 'email',
        property_id: f.property_id,
        subject: 'Fault unresolved after 7 days',
        body: `${f.category} (${f.reference}) reported ${daysSince} days ago is still ${f.current_state}.`,
        url: `/faults/${f.id}`,
        tag: `fault:${f.id}:stale`,
      })
    }
    return events
  })
}
