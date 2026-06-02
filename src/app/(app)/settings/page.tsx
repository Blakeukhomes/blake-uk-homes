import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  return (
    <>
      <PageHeader title="Settings" subtitle="Your profile and notification preferences." />
      <div className="p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Currently signed in as {profile?.email ?? user?.email}.</CardDescription>
          </CardHeader>
          <CardBody>
            <dl className="grid gap-3 text-sm">
              <Row label="Name" value={profile?.full_name ?? '-'} />
              <Row label="Role" value={profile?.role ?? 'owner'} />
              <Row label="Email" value={profile?.email ?? user?.email ?? ''} />
              <Row label="Phone" value={profile?.phone ?? '-'} />
            </dl>
          </CardBody>
        </Card>
      </div>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <dt className="text-ink-500">{label}</dt>
      <dd className="col-span-2 font-medium text-ink-900">{value}</dd>
    </div>
  )
}
