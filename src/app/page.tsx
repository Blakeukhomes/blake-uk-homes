import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isDemoMode } from '@/lib/demo/client'

// No marketing page. Per the brief, the first screen is the street-view dashboard.
// Signed-in users (or demo mode) -> /dashboard. Otherwise -> /login.
export default async function Root() {
  if (isDemoMode()) redirect('/dashboard')
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  redirect(user ? '/dashboard' : '/login')
}
