import { Check } from 'lucide-react'
import type { JourneyStep } from '@/lib/types'
import { cn } from '@/lib/cn'

export const JOURNEY_STEPS: { id: JourneyStep; label: string; description: string }[] = [
  { id: 'property_setup',     label: 'Property setup',     description: 'Property added to the system, compliance prepped.' },
  { id: 'tenant_onboarding',  label: 'Tenant onboarding',  description: 'References, Right to Rent checks, How to Rent guide.' },
  { id: 'tenancy_agreement',  label: 'Tenancy agreement',  description: 'Signed by both parties.' },
  { id: 'deposit',            label: 'Deposit',            description: 'Protected in an approved scheme; certificate issued.' },
  { id: 'move_in_inventory',  label: 'Move-in inventory',  description: 'Photographic inventory signed off by both.' },
  { id: 'keys_handed_over',   label: 'Keys handed over',   description: 'Tenant has access to the property.' },
  { id: 'active_tenancy',     label: 'Active tenancy',     description: 'Rent flowing, periodic inspections in place.' },
  { id: 'move_out_inspection',label: 'Move-out inspection',description: 'Comparison against move-in inventory.' },
  { id: 'deposit_resolution', label: 'Deposit resolution', description: 'Deposit returned in full or via scheme adjudication.' },
]

export function JourneyTrack({
  steps,
}: {
  steps: (typeof JOURNEY_STEPS[number] & {
    done: boolean
    signedByLandlord?: boolean
    signedByTenant?: boolean
  })[]
}) {
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => (
        <li key={s.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full ring-2',
              s.done ? 'bg-accent-500 text-ink-950 ring-accent-200' : 'bg-white text-ink-400 ring-ink-200'
            )}>
              {s.done ? <Check className="h-4 w-4" /> : <span className="text-xs">{i + 1}</span>}
            </div>
            {i < steps.length - 1 && (
              <div className={cn('w-px flex-1', s.done ? 'bg-accent-400' : 'bg-ink-200')} />
            )}
          </div>
          <div className="pb-4">
            <p className={cn('text-sm font-medium', s.done ? 'text-ink-950' : 'text-ink-600')}>{s.label}</p>
            <p className="text-xs text-ink-500">{s.description}</p>
            {(s.signedByLandlord || s.signedByTenant) && (
              <p className="mt-1 text-xs">
                {s.signedByLandlord && <span className="mr-2 text-accent-700">Signed: landlord</span>}
                {s.signedByTenant && <span className="text-accent-700">Signed: tenant</span>}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
