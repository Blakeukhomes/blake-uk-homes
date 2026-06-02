import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { Property, Tenant } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function TenantsPage() {
  const supabase = createClient()
  const { data: tenants = [] } = await supabase.from('tenants').select('*').eq('is_active', true).order('created_at', { ascending: false })
  const { data: properties = [] } = await supabase.from('properties').select('id, nickname')

  return (
    <>
      <PageHeader title="Tenants" subtitle="Active tenants across your portfolio." />
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Active</CardTitle>
            <CardDescription>Click a tenant to copy their portal link.</CardDescription>
          </CardHeader>
          <CardBody className="p-0">
            {(tenants ?? []).length === 0 ? (
              <p className="px-6 py-6 text-sm text-ink-500">No active tenants. Add one from a property page.</p>
            ) : (
              <ul className="divide-y hairline divide-ink-100">
                {(tenants as Tenant[]).map((t) => {
                  const prop = (properties as Pick<Property, 'id'|'nickname'>[]).find((p) => p.id === t.property_id)
                  return (
                    <li key={t.id} className="px-6 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-ink-900">{t.full_name}</p>
                          <p className="text-xs text-ink-500">
                            <Link className="underline" href={`/properties/${prop?.id}`}>{prop?.nickname}</Link>
                            {' · '}{t.email ?? '-'}
                          </p>
                        </div>
                        <code className="rounded bg-ink-50 px-2 py-1 text-xs text-ink-700">
                          /portal/{t.portal_token.slice(0, 12)}…
                        </code>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  )
}
