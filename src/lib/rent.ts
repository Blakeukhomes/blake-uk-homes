// Rent helpers, arrears, period generation, rolling history.
import {
  addMonths,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfMonth,
  subMonths,
} from 'date-fns'
import type { Property, RentPayment, RentStatus } from './types'

export function rentPeriodsForLast(months: number, today = new Date()) {
  const out: { period_start: string; label: string }[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = startOfMonth(subMonths(today, i))
    out.push({ period_start: format(d, 'yyyy-MM-dd'), label: format(d, 'MMM yyyy') })
  }
  return out
}

export function buildExpectedPayments(property: Property, monthsBack = 6, today = new Date()) {
  const periods = rentPeriodsForLast(monthsBack, today)
  return periods.map((p) => {
    const period = parseISO(p.period_start)
    const due = new Date(period)
    due.setDate(Math.min(property.rent_due_day || 1, 28))
    return {
      period_start: p.period_start,
      label: p.label,
      due_date: format(due, 'yyyy-MM-dd'),
      amount_due: Number(property.monthly_rent ?? 0),
    }
  })
}

export function arrearsTotal(payments: RentPayment[]) {
  return payments.reduce((sum, p) => sum + Math.max(0, Number(p.amount_due) - Number(p.amount_paid)), 0)
}

export function statusFromPayment(p: RentPayment): RentStatus {
  if (Number(p.amount_paid) >= Number(p.amount_due)) return 'paid'
  if (Number(p.amount_paid) > 0) return 'partial'
  const overdueDays = differenceInCalendarDays(new Date(), parseISO(p.due_date))
  if (overdueDays > 14) return 'missing'
  if (overdueDays > 0) return 'late'
  return 'missing'
}

export function formatGBP(n: number | null | undefined): string {
  if (n == null) return '-'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(n))
}
