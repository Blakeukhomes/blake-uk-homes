// Compliance helpers, warning windows and renewal cadence per UK regs.
import { addYears, differenceInCalendarDays, parseISO } from 'date-fns'
import type { ComplianceType, ComplianceCertificate } from './types'

export type ComplianceTier = 'required' | 'todo'

export const COMPLIANCE_META: Record<
  ComplianceType,
  { label: string; renewYears: number; warnDays: number; shortLabel: string; tier: ComplianceTier }
> = {
  gas_safety:          { label: 'Gas Safety Certificate',                          shortLabel: 'Gas Safety', renewYears: 1,  warnDays: 30, tier: 'required' },
  eicr:                { label: 'Electrical Installation Condition Report (EICR)', shortLabel: 'EICR',       renewYears: 5,  warnDays: 60, tier: 'required' },
  epc:                 { label: 'Energy Performance Certificate (EPC)',            shortLabel: 'EPC',        renewYears: 10, warnDays: 90, tier: 'required' },
  buildings_insurance: { label: 'Buildings Insurance',                             shortLabel: 'Insurance',  renewYears: 1,  warnDays: 30, tier: 'todo' },
  legionella:          { label: 'Legionella Risk Assessment',                      shortLabel: 'Legionella', renewYears: 2,  warnDays: 60, tier: 'todo' },
  ico_registration:    { label: 'ICO Registration (Data Protection)',              shortLabel: 'ICO',        renewYears: 1,  warnDays: 30, tier: 'todo' },
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

// Required compliance items (legally required to let a property). These drive
// the court-readiness score and loud alerts.
export const REQUIRED_COMPLIANCE: ComplianceType[] = ['gas_safety', 'eicr', 'epc']

// Recommended / "to-do" compliance items. Tracked but treated softer — they
// don't pull the score down, they don't alert when missing, only when an
// existing record is about to expire or has expired.
export const TODO_COMPLIANCE: ComplianceType[] = ['buildings_insurance', 'legionella', 'ico_registration']

// Court-readiness score: 0-100. Only required items count (Gas/EICR/EPC).
// When `allElectric` is true the property has no gas supply, so gas safety is
// excluded; the remaining required items absorb its weight.
export function courtReadinessScore(certs: ComplianceCertificate[], allElectric = false): number {
  const types = allElectric ? REQUIRED_COMPLIANCE.filter((t) => t !== 'gas_safety') : REQUIRED_COMPLIANCE
  const validWeight = 100 / types.length
  const dueSoonWeight = validWeight * 0.59
  const expiredWeight = validWeight * 0.18
  let score = 0

  for (const t of types) {
    const latest = certs.filter((c) => c.type === t).sort((a, b) => (a.expires_on > b.expires_on ? -1 : 1))[0]
    const state = complianceState(latest)
    if (state === 'valid') score += validWeight
    else if (state === 'due_soon') score += dueSoonWeight
    else if (state === 'expired') score += expiredWeight
  }
  return Math.min(100, Math.round(score))
}

// Returns the list of compliance types that apply to a given property.
export function applicableComplianceTypes(allElectric: boolean): ComplianceType[] {
  const all: ComplianceType[] = [...REQUIRED_COMPLIANCE, ...TODO_COMPLIANCE]
  return allElectric ? all.filter((t) => t !== 'gas_safety') : all
}

// Returns the list of REQUIRED compliance types for a property — used for
// driving loud alerts. Missing/expired/due_soon are all surfaced.
export function requiredTypesFor(allElectric: boolean): ComplianceType[] {
  return allElectric ? REQUIRED_COMPLIANCE.filter((t) => t !== 'gas_safety') : REQUIRED_COMPLIANCE
}
