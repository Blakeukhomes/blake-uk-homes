import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Section13Form } from '@/components/section13-form'

export const dynamic = 'force-dynamic'

export default async function NoticesPage() {
  const supabase = createClient()
  const { data: properties = [] } = await supabase.from('properties').select('id, nickname, address_line_1, city, postcode, monthly_rent')
  const { data: tenants = [] } = await supabase.from('tenants').select('id, full_name, property_id').eq('is_active', true)
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user!.id).single()

  return (
    <>
      <PageHeader title="Notices" subtitle="Generate Section 13 rent increase notices." />
      <div className="p-6 space-y-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Section 13, rent increase notice</CardTitle>
            <CardDescription>
              Effective date defaults to today + 2 months, the legal minimum under the Renters Rights Act 2025.
              Output is a print-ready PDF.
            </CardDescription>
          </CardHeader>
          <CardBody>
            <Section13Form
              properties={(properties ?? []) as any}
              tenants={(tenants ?? []) as any}
              landlordName={profile?.full_name ?? user!.email ?? ''}
            />
          </CardBody>
        </Card>
      </div>
    </>
  )
}
