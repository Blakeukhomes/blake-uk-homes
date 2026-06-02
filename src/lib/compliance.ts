// Compliance helpers, warning windows and renewal cadence per UK regs.
import { addYears, differenceInCalendarDays, parseISO } from 'date-fns'
import type { ComplianceType, ComplianceCertificate } from './types'

export const COMPLIANCE_META: Record<
  ComplianceType,
  { label: string; renewYears: number; warnDays: number; shortLabel: string }
> = {
  gas_safety: { label: 'Gas Safety Certificate', shortLabel: 'Gas Safety', renewYears: 1, warnDays: 60 },
  eicr: { label: 'Electrical Installation Condition Report (EICR)', shortLabel: 'EICR', renewYears: 5, warnDays: 60 },
  epc: { label: 'Energy Performance Certificate (EPC)', shortLabel: 'EPC', renewYears: 10, warnDays: 90 },
  buildings_insurance: { label: 'Buildings Insurance', shortLabel: 'Insurance', renewYears: 1, warnDays: 60 },
}

export type ComplianceState = 'valid' | 'due_soon' | 'expired' | 'missing'

export function expiryFromCompletion(type: ComplianceType, completedOn: string | Date) {
  const d = typeof completedOn === 'string' ? parseISO(completedOn) : completedOn
  return addYears(d, COMPLIANCE_META[type].renewYears)
}

export function complianceState(cert: ComplianceCertificate | undefined): ComplianceState {
  if (!cert) return 'missing'
  const days = differenceInCalendarDays(parseISO(cert.expires_on), new Date())
  if (days < 0) return 'expired'
  if (days <= COMPLIANCE_META[cert.type].warnDays) return 'due_soon'
  return 'valid'
}

export function daysUntilExpiry(cert: ComplianceCertificate) {
  return differenceInCalendarDays(parseISO(cert.expires_on), new Date())
}

// Court-readiness score: 0-100. Each compliance item contributes 25; capped.
export function courtReadinessScore(certs: ComplianceCertificate[]): number {
  const types: ComplianceType[] = ['gas_safety', 'eicr', 'epc', 'buildings_insurance']
  let score = 0
  for (const t of types) {
    const latest = certs.filter((c) => c.type === t).sort((a, b) => (a.expires_on > b.expires_on ? -1 : 1))[0]
    const state = complianceState(latest)
    if (state === 'valid') score += 25
    else if (state === 'due_soon') score += 15
    else if (state === 'expired') score += 5
  }
  return Math.min(100, score)
}
