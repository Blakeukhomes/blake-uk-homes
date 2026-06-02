import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_PATHS = ['/', '/login', '/signup', '/about', '/portal', '/api/portal', '/api/health']

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)
  const { pathname } = request.nextUrl

  // Tenant portal & landing pages stay open
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return response
  }

  // Everything else under /dashboard, /properties etc. requires auth.
  // Auth check happens in layouts via Supabase; middleware just refreshes cookies.
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
