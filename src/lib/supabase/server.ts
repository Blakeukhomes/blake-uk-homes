// Server-side Supabase client (RSC, route handlers, server actions)
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient as _createSupabaseClient } from '@supabase/supabase-js'
import { createDemoClient, isDemoMode } from '@/lib/demo/client'

export function createClient() {
  if (isDemoMode()) return createDemoClient()

  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // RSC may not allow setting, ignore
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {}
        },
      },
    }
  )
}

// Service-role client (bypasses RLS). Server-only. Never expose to browser.
export function createServiceClient() {
  if (isDemoMode()) return createDemoClient()
  return _createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
