// Browser-side Supabase client. In demo mode returns the fake client.
import { createBrowserClient } from '@supabase/ssr'
import { createDemoClient, isDemoMode } from '@/lib/demo/client'

export function createClient() {
  if (isDemoMode()) return createDemoClient()
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
