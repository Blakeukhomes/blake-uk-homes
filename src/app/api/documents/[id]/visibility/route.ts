// Flip visible_to_tenant on a document. Auth-gated (landlord only).
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const visible = typeof body?.visible_to_tenant === 'boolean' ? body.visible_to_tenant : null
  if (visible === null) {
    return NextResponse.json({ error: 'visible_to_tenant boolean required' }, { status: 400 })
  }

  const sb = createServiceClient()
  const { data: doc, error } = await sb
    .from('documents')
    .update({ visible_to_tenant: visible })
    .eq('id', params.id)
    .select('property_id')
    .single()

  if (error || !doc) {
    return NextResponse.json({ error: error?.message ?? 'Update failed' }, { status: 500 })
  }

  revalidatePath(`/properties/${(doc as any).property_id}/documents`)
  return NextResponse.json({ ok: true, visible_to_tenant: visible })
}
