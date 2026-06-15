// Compliance helpers, warning windows and renewal cadence per UK regs.
import { addYears, differenceInCalendarDays, parseISO } from 'date-fns'
import type { ComplianceType, ComplianceCertificate } from './types'

export const COMPLIANCE_META: Record<
  ComplianceType,
  { label: string; renewYears: number; warnDays: number; shortLabel: string }
> = {
  gas_safety:          { label: 'Gas Safety Certificate',                          shortLabel: 'Gas Safety', renewYears: 1,  warnDays: 30 },
  eicr:                { label: 'Electrical Installation Condition Report (EICR)', shortLabel: 'EICR',       renewYears: 5,  warnDays: 60 },
  epc:                 { label: 'Energy Performance Certificate (EPC)',            shortLabel: 'EPC',        renewYears: 10, warnDays: 90 },
  buildings_insurance: { label: 'Buildings Insurance',                             shortLabel: 'Insurance',  renewYears: 1,  warnDays: 30 },
  legionella:          { label: 'Legionella Risk Assessment',                      shortLabel: 'Legionella', renewYears: 2,  warnDays: 60 },
  ico_registration:    { label: 'ICO Registration (Data Protection)',                shortLabel: 'ICO',        renewYears: 1,  warnDays: 30 },
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

// Court-readiness score: 0-100. Six compliance items, weight ~16.67 each.
// When `allElectric` is true the property has no gas supply, so gas safety is
// excluded from the calculation and the remaining items absorb its weight.
export function courtReadinessScore(certs: ComplianceCertificate[], allElectric = false): number {
  const allTypes: ComplianceType[] = ['gas_safety', 'eicr', 'epc', 'buildings_insurance', 'legionella', 'ico_registration']
  const types = allElectric ? allTypes.filter((t) => t !== 'gas_safety') : allTypes
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
  const all: ComplianceType[] = ['gas_safety', 'eicr', 'epc', 'buildings_insurance', 'legionella', 'ico_registration']
  return allElectric ? all.filter((t) => t !== 'gas_safety') : all
}
