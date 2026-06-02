import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/app-shell'
import { DemoBanner } from '@/components/demo-banner'
import { isDemoMode, DEMO_USER } from '@/lib/demo/client'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const demo = isDemoMode()

  if (demo) {
    return (
      <>
        <DemoBanner />
        <AppShell user={{ email: DEMO_USER.email, full_name: DEMO_USER.full_name }}>
          {children}
        </AppShell>
      </>
    )
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', user.id)
    .single()

  return (
    <AppShell user={profile ?? { email: user.email!, full_name: null }}>
      {children}
    </AppShell>
  )
}
