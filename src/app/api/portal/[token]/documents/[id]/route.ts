// Serve a tenant-portal document.
// Validates the portal token, confirms the document belongs to the tenant's property
// and is flagged visible_to_tenant, then 302-redirects to a short-lived Supabase signed URL.
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: { token: string; id: string } },
) {
  const sb = createServiceClient()

  // Token must match an active tenant
  const { data: tenant } = await sb
    .from('tenants')
    .select('id, property_id, is_active')
    .eq('portal_token', params.token)
    .maybeSingle()
  if (!tenant || !(tenant as any).is_active) {
    return new NextResponse('Tenant portal link not found or inactive', { status: 404 })
  }

  // Document must belong to that tenant's property AND be flagged visible_to_tenant
  const { data: doc } = await sb
    .from('documents')
    .select('id, property_id, storage_path, visible_to_tenant, mime_type, title')
    .eq('id', params.id)
    .maybeSingle()
  if (!doc) return new NextResponse('Document not found', { status: 404 })
  if ((doc as any).property_id !== (tenant as any).property_id) {
    return new NextResponse('Document not part of this tenancy', { status: 403 })
  }
  if (!(doc as any).visible_to_tenant) {
    return new NextResponse('Document is not shared with you', { status: 403 })
  }

  // 5-minute signed URL from the private bucket
  const { data: signed, error: signErr } = await sb.storage
    .from('property-documents')
    .createSignedUrl((doc as any).storage_path, 60 * 5)
  if (signErr || !signed?.signedUrl) {
    return new NextResponse(signErr?.message ?? 'Could not generate signed URL', { status: 500 })
  }

  return NextResponse.redirect(signed.signedUrl, { status: 302 })
}
