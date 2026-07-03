// Landlord-side document viewer. Redirects to a fresh signed URL for the file
// in Supabase Storage. Auth-gated: only a logged-in owner/manager can hit this.
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const sb = createServiceClient()
  const { data: doc, error } = await sb
    .from('documents')
    .select('id, storage_path')
    .eq('id', params.id)
    .maybeSingle()
  if (error || !doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: signed, error: signErr } = await sb.storage
    .from('property-documents')
    .createSignedUrl((doc as any).storage_path, 60 * 10) // 10 min link

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json({ error: signErr?.message ?? 'Sign failed' }, { status: 500 })
  }
  return NextResponse.redirect(signed.signedUrl, { status: 302 })
}
