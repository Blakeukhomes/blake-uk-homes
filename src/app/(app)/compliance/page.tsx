import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { COMPLIANCE_META, complianceState, daysUntilExpiry } from '@/lib/compliance'
import type { ComplianceCertificate, Property } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function CompliancePage() {
  const supabase = createClient()
  const { data: certs = [] } = await supabase.from('compliance_certificates').select('*').order('expires_on')
  const { data: properties = [] } = await supabase.from('properties').select('*')

  const props = (properties ?? []) as Property[]
  const all = (certs ?? []) as ComplianceCertificate[]

  const groups = {
    expired:  all.filter((c) => complianceState(c) === 'expired'),
    due_soon: all.filter((c) => complianceState(c) === 'due_soon'),
    valid:    all.filter((c) => complianceState(c) === 'valid'),
  }

  return (
    <>
      <PageHeader title="Compliance" subtitle="Gas Safety, EICR, EPC and Buildings Insurance across your portfolio." />
      <div className="p-6 space-y-6">
        {(['expired', 'due_soon', 'valid'] as const).map((g) => (
          <Card key={g}>
            <CardHeader>
              <CardTitle>
                {g === 'expired' ? 'Expired' : g === 'due_soon' ? 'Due soon' : 'Valid'}
              </CardTitle>
              <CardDescription>
                {g === 'expired'
                  ? 'These items put the property out of compliance. Action immediately.'
                  : g === 'due_soon'
                  ? 'Within the warning window, schedule renewal now.'
                  : 'In date and on file.'}
              </CardDescription>
            </CardHeader>
            <CardBody className="p-0">
              {groups[g].length === 0 ? (
                <p className="px-6 py-6 text-sm text-ink-500">None.</p>
              ) : (
                <ul className="divide-y hairline divide-ink-100">
                  {groups[g].map((c) => {
                    const meta = COMPLIANCE_META[c.type]
                    const prop = props.find((p) => p.id === c.property_id)
                    return (
                      <li key={c.id} className="flex items-center gap-4 px-6 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink-900">{meta.shortLabel}</p>
                          <p className="truncate text-xs text-ink-500">
                            <Link href={`/properties/${prop?.id}`} className="underline">{prop?.nickname ?? '-'}</Link>
                            {' · '}expires {new Date(c.expires_on).toLocaleDateString('en-GB')}
                          </p>
                        </div>
                        <div className="text-right text-xs">
                          <div className="text-ink-500">{daysUntilExpiry(c)} days</div>
                          <StateBadge state={g} />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
    </>
  )
}

function StateBadge({ state }: { state: 'expired'|'due_soon'|'valid' }) {
  if (state === 'expired') return <Badge tone="danger">Expired</Badge>
  if (state === 'due_soon') return <Badge tone="warning">Due soon</Badge>
  return <Badge tone="success">Valid</Badge>
}
