import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { Logo } from '@/components/logo'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FaultReportForm } from '@/components/fault-report-form'

export const dynamic = 'force-dynamic'

export default async function ReportFaultPage({ params }: { params: { token: string } }) {
  const sb = createServiceClient()
  const { data: tenant } = await sb.from('tenants')
    .select('id, full_name, phone, email, portal_token, property_id, properties(nickname)')
    .eq('portal_token', params.token).maybeSingle()
  if (!tenant) notFound()

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="border-b hairline border-b-ink-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Logo />
          <span className="text-xs text-ink-500">Report a fault</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Report a fault, {(tenant as any).properties?.nickname}</CardTitle>
            <CardDescription>Photos and a short video are required. Helps us resolve faster.</CardDescription>
          </CardHeader>
          <CardBody>
            <FaultReportForm
              token={params.token}
              tenantId={(tenant as any).id}
              defaults={{
                name: (tenant as any).full_name ?? '',
                phone: (tenant as any).phone ?? '',
                email: (tenant as any).email ?? '',
              }}
            />
          </CardBody>
        </Card>
      </main>
    </div>
  )
}
