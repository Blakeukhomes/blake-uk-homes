import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CopyPortalLinkRow } from '@/components/copy-portal-link-row'
import type { Property, Tenant } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function TenantsPage() {
  const supabase = createClient()
  const { data: tenants = [] } = await supabase
    .from('tenants').select('*').eq('is_active', true).order('created_at', { ascending: false })
  const { data: properties = [] } = await supabase.from('properties').select('id, nickname')

  const tenantRows = (tenants ?? []) as Tenant[]
  const props = (properties ?? []) as Pick<Property, 'id' | 'nickname'>[]

  return (
    <>
      <PageHeader title="Tenants" subtitle="Active tenants across your portfolio." />
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Active</CardTitle>
            <CardDescription>Click a tenant to copy their portal link to your clipboard.</CardDescription>
          </CardHeader>
          <CardBody className="p-0">
            {tenantRows.length === 0 ? (
              <p className="px-6 py-6 text-sm text-ink-500">No active tenants. Add one from a property page.</p>
            ) : (
              <ul className="divide-y hairline divide-ink-100">
                {tenantRows.map((t) => {
                  const prop = props.find((p) => p.id === t.property_id)
                  return (
                    <CopyPortalLinkRow
                      key={t.id}
                      fullName={t.full_name}
                      email={t.email}
                      propertyId={prop?.id}
                      propertyName={prop?.nickname}
                      portalToken={t.portal_token}
                    />
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
